"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "flowbite-react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";
import { useAuthContext } from "@/context/AuthContext";
import { useAlertContext } from "@/context/AlertContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useClaimContext } from "@/context/ClaimContext";
import { useClaimStatusLogContext } from "@/context/ClaimStatusLogContext";
import {
  claimPolicyConfig,
  type ClaimResolution,
} from "@/modules/claims/claimPolicyConfig";
import { evaluateClaimEligibility } from "@/modules/claims/claimEligibility";
import { notifyClaimSubmitted } from "@/modules/claims/claimNotifications";
import { supabase } from "@/utils/supabaseClient";
import type { Database } from "@/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

interface OrderItemWithProduct extends OrderItemRow {
  product: { id: string; name: string } | null;
  color: { id: string; color: string } | null;
  size: { id: string; size: string } | null;
}

/**
 * Customer claim submission form (`/my-claims/new?orderId=&orderItemId=`).
 */
export default function NewClaimPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const orderItemId = searchParams.get("orderItemId") ?? "";

  const { user, loading: authLoading } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { isEnabled } = useFeatureFlags();
  const { createClaim } = useClaimContext();
  const { createLog } = useClaimStatusLogContext();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [orderItem, setOrderItem] = useState<OrderItemWithProduct | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [claimType, setClaimType] = useState(claimPolicyConfig.claimTypes[0]?.key ?? "");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [requestedResolution, setRequestedResolution] = useState<ClaimResolution>("replacement");
  const [evidenceUrls, setEvidenceUrls] = useState<string>("");

  useEffect(() => {
    if (!isEnabled("claims")) {
      router.replace("/");
    }
  }, [isEnabled, router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user === null) {
      router.replace(`/authentication/sign-in?next=${encodeURIComponent(`/my-claims/new?orderId=${orderId}&orderItemId=${orderItemId}`)}`);
    }
  }, [authLoading, user, router, orderId, orderItemId]);

  useEffect(() => {
    if (authLoading || user === null || orderId.length === 0 || orderItemId.length === 0) {
      setFetchLoading(false);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function load(): Promise<void> {
      setFetchLoading(true);
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (orderError !== null || orderData === null) {
        setFetchLoading(false);
        return;
      }

      const { data: itemData, error: itemError } = await supabase
        .from("order_items")
        .select(
          "*, product:products(id, name), color:product_colors(id, color), size:product_sizes(id, size)"
        )
        .eq("id", orderItemId)
        .eq("order_id", orderId)
        .is("deleted_at", null)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (itemError !== null || itemData === null) {
        setOrder(null);
        setOrderItem(null);
        setFetchLoading(false);
        return;
      }

      setOrder(orderData);
      setOrderItem(itemData as OrderItemWithProduct);
      setFetchLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, orderId, orderItemId]);

  const selectedTypeConfig = useMemo(
    () => claimPolicyConfig.claimTypes.find((t) => t.key === claimType),
    [claimType]
  );

  const eligibility = useMemo(() => {
    if (order === null) {
      return null;
    }
    return evaluateClaimEligibility(claimType, order.status, order.created_at);
  }, [order, claimType]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (user === null || order === null || orderItem === null || selectedTypeConfig === undefined) {
      return;
    }
    if (eligibility !== null && !eligibility.eligible) {
      showAlert(eligibility.reason, "warning");
      return;
    }

    const descTrimmed = description.trim();
    if (descTrimmed.length === 0) {
      showAlert("请填写问题描述。", "warning");
      return;
    }

    const urls = evidenceUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (selectedTypeConfig.requiresPhotos && urls.length === 0) {
      showAlert("请至少提供一张照片链接作为凭证。", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createClaim({
        user_id: user.id,
        order_id: order.id,
        order_item_id: orderItem.id,
        product_id: orderItem.product_id,
        claim_type: claimType,
        status: "submitted",
        reason: reason.trim().length > 0 ? reason.trim() : null,
        description: descTrimmed,
        evidence_urls: urls,
        requested_resolution: requestedResolution,
      });

      if (created === undefined) {
        return;
      }

      await createLog({
        claim_id: created.id,
        old_status: null,
        new_status: "submitted",
        changed_by: user.id,
        notes: "Customer submitted claim",
      });

      await notifyClaimSubmitted(supabase, { userId: user.id, claimId: created.id });

      showAlert("申请已提交，我们会尽快处理。", "success");
      router.push(`/my-claims/${created.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEnabled("claims")) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  if (authLoading || user === null || fetchLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center pb-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (order === null || orderItem === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] pb-24">
        <NavbarHome />
        <div className="p-8 text-center">
          <p className="text-[var(--color-muted)] mb-4">无法加载订单信息。</p>
          <button type="button" onClick={() => router.push("/order-details")} className="btn-primary px-6 py-2 rounded-xl text-sm">
            返回订单
          </button>
        </div>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <NavbarHome />

      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => router.push(`/order-details/${order.id}`)}
          className="text-sm font-medium flex items-center"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          订单详情
        </button>
        <h1 className="flex-1 text-center font-display text-lg pr-16">提交申请</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <div className="card-panel p-4 mb-4 text-sm">
          <p className="font-medium">{orderItem.product?.name ?? "商品"}</p>
          <p className="text-[var(--color-muted)] mt-1">
            {[orderItem.color?.color, orderItem.size?.size].filter(Boolean).join(" · ")}
          </p>
          {eligibility !== null ? (
            <p className={`mt-2 text-xs ${eligibility.eligible ? "text-green-600" : "text-red-500"}`}>
              {eligibility.reason}
            </p>
          ) : null}
        </div>

        <form onSubmit={(ev) => void handleSubmit(ev)} className="card-panel p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">问题类型</label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm"
              required
            >
              {claimPolicyConfig.claimTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">具体问题（选填）</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如：鞋底开胶"
              className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">详细描述</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述问题发生的情况..."
              className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm resize-none"
              required
            />
          </div>

          {selectedTypeConfig !== undefined ? (
            <div>
              <label className="block text-sm font-medium mb-2">期望处理方式</label>
              <select
                value={requestedResolution}
                onChange={(e) => setRequestedResolution(e.target.value as ClaimResolution)}
                className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm"
              >
                {selectedTypeConfig.allowedResolutions.map((r) => (
                  <option key={r} value={r}>
                    {r === "refund"
                      ? "退款"
                      : r === "replacement"
                        ? "换货"
                        : r === "repair"
                          ? "维修"
                          : r === "store_credit"
                            ? "店铺积分"
                            : "其他"}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium mb-2">
              照片链接{selectedTypeConfig?.requiresPhotos ? "（必填，每行一个）" : "（选填）"}
            </label>
            <textarea
              rows={3}
              value={evidenceUrls}
              onChange={(e) => setEvidenceUrls(e.target.value)}
              placeholder="粘贴图片 URL，每行一个"
              className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || (eligibility !== null && !eligibility.eligible)}
            className="w-full btn-primary rounded-xl py-3 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "提交中…" : "提交申请"}
          </button>
        </form>
      </div>

      <BottomNavbar />
    </div>
  );
}
