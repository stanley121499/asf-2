"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useClaimContext, type ClaimItem } from "@/context/ClaimContext";
import { useClaimStatusLogContext } from "@/context/ClaimStatusLogContext";
import {
  claimPolicyConfig,
  getClaimResolutionLabel,
  getClaimStatusLabel,
} from "@/modules/claims/claimPolicyConfig";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { supabase } from "@/utils/supabaseClient";
import type { Tables } from "@/database.types";

/**
 * Resolves dynamic route param `claimId`.
 */
function useClaimIdParam(): string {
  const params = useParams();
  return useMemo(() => {
    const raw = params.claimId;
    if (typeof raw === "string") {
      return raw;
    }
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      return raw[0];
    }
    return "";
  }, [params.claimId]);
}

/**
 * Customer claim detail page.
 */
export default function CustomerClaimDetailPage(): React.ReactElement {
  const claimId = useClaimIdParam();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { claims, fetchClaimItems } = useClaimContext();
  const { listByClaimId } = useClaimStatusLogContext();
  const [statusLogs, setStatusLogs] = useState<Tables<"claim_status_change_logs">[]>([]);
  const [productName, setProductName] = useState<string | null>(null);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
  const [itemProductNames, setItemProductNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEnabled("claims")) {
      router.replace("/");
    }
  }, [isEnabled, router]);

  useEffect(() => {
    if (authLoading || user === null) {
      return;
    }
    if (claimId.length === 0) {
      router.push("/my-claims");
    }
  }, [authLoading, user, claimId, router]);

  const claim = useMemo(
    () => claims.find((c) => c.id === claimId && c.user_id === user?.id) ?? null,
    [claims, claimId, user?.id]
  );

  useEffect(() => {
    if (claimId.length === 0) {
      return;
    }
    void listByClaimId(claimId).then(setStatusLogs);
  }, [claimId, listByClaimId]);

  useEffect(() => {
    if (claim?.product_id === null || claim?.product_id === undefined) {
      setProductName(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("products")
      .select("name")
      .eq("id", claim.product_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data !== null) {
          setProductName(data.name);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [claim?.product_id]);

  useEffect(() => {
    if (claimId.length === 0) {
      return;
    }
    void fetchClaimItems(claimId).then(async (items) => {
      setClaimItems(items);
      const productIds = items
        .map((i) => i.product_id)
        .filter((id): id is string => typeof id === "string");
      if (productIds.length === 0) {
        setItemProductNames({});
        return;
      }
      const { data } = await supabase.from("products").select("id, name").in("id", productIds);
      const map: Record<string, string> = {};
      for (const p of data ?? []) {
        map[p.id] = p.name;
      }
      setItemProductNames(map);
    });
  }, [claimId, fetchClaimItems]);

  const typeLabel = useMemo(() => {
    if (claim === null) {
      return "";
    }
    return (
      claimPolicyConfig.claimTypes.find((t) => t.key === claim.claim_type)?.label ??
      claim.claim_type
    );
  }, [claim]);

  if (!isEnabled("claims") || authLoading || user === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center pb-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (claim === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] pb-24">
        <NavbarHome />
        <div className="p-8 text-center text-[var(--color-muted)]">
          <p className="mb-4">找不到该申请。</p>
          <button type="button" onClick={() => router.push("/my-claims")} className="btn-primary px-6 py-2 rounded-xl text-sm">
            返回列表
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
        <button type="button" onClick={() => router.push("/my-claims")} className="text-sm font-medium flex items-center">
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          我的申请
        </button>
        <h1 className="flex-1 text-center font-display text-lg pr-16">{formatClaimLabel(claim.id)}</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="card-panel p-5">
          <p className="text-sm text-[var(--color-muted)]">状态</p>
          <p className="text-lg font-medium text-[var(--color-text)] mt-1">
            {getClaimStatusLabel(claim.status)}
          </p>
        </div>

        {claimItems.length > 0 ? (
          <div className="card-panel p-5 space-y-3 text-sm">
            <p className="font-medium text-[var(--color-text)]">申请商品</p>
            {claimItems.map((item) => (
              <div key={item.id} className="border-b border-[var(--color-border)] pb-3 last:border-0">
                <p className="font-medium">
                  {item.product_id !== null
                    ? (itemProductNames[item.product_id] ?? "商品")
                    : "商品"}
                </p>
                {item.recommended_percent !== null && claim.status !== "approved" ? (
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    预估抵扣（若审核通过）：RM{" "}
                    {(
                      (Number(item.line_item_price_myr) * Number(item.recommended_percent)) /
                      100
                    ).toFixed(2)}{" "}
                    （{Number(item.recommended_percent).toFixed(0)}%）
                  </p>
                ) : null}
                {item.credit_amount_myr !== null && claim.status === "approved" ? (
                  <p className="text-xs text-green-700 mt-1">
                    已发放保固抵扣：RM {Number(item.credit_amount_myr).toFixed(2)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="card-panel p-5 space-y-3 text-sm">
          <div>
            <span className="text-[var(--color-muted)]">商品：</span>
            <span className="text-[var(--color-text)]">{productName ?? "—"}</span>
          </div>
          <div>
            <span className="text-[var(--color-muted)]">类型：</span>
            <span className="text-[var(--color-text)]">{typeLabel}</span>
          </div>
          {claim.reason !== null && claim.reason.length > 0 ? (
            <div>
              <span className="text-[var(--color-muted)]">问题：</span>
              <span className="text-[var(--color-text)]">{claim.reason}</span>
            </div>
          ) : null}
          {claim.description !== null && claim.description.length > 0 ? (
            <div>
              <p className="text-[var(--color-muted)] mb-1">描述</p>
              <p className="text-[var(--color-text)] whitespace-pre-line">{claim.description}</p>
            </div>
          ) : null}
          {claim.requested_resolution !== null ? (
            <div>
              <span className="text-[var(--color-muted)]">期望处理：</span>
              <span>{getClaimResolutionLabel(claim.requested_resolution)}</span>
            </div>
          ) : null}
          {claim.approved_resolution !== null ? (
            <div>
              <span className="text-[var(--color-muted)]">处理结果：</span>
              <span className="text-green-700">{getClaimResolutionLabel(claim.approved_resolution)}</span>
            </div>
          ) : null}
          {claim.rejection_reason !== null && claim.rejection_reason.length > 0 ? (
            <div>
              <p className="text-[var(--color-muted)] mb-1">拒绝原因</p>
              <p className="text-red-600">{claim.rejection_reason}</p>
            </div>
          ) : null}
        </div>

        {claim.evidence_urls.length > 0 ? (
          <div className="card-panel p-5">
            <h2 className="text-sm font-semibold mb-3">上传的照片</h2>
            <div className="grid grid-cols-2 gap-2">
              {claim.evidence_urls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Evidence" className="w-full h-32 object-cover rounded-lg border" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {statusLogs.length > 0 ? (
          <div className="card-panel p-5">
            <h2 className="text-sm font-semibold mb-3">进度记录</h2>
            <ul className="space-y-2 text-sm">
              {statusLogs.map((log) => (
                <li key={log.id} className="border-b border-[var(--color-border)] pb-2 last:border-0">
                  <span className="text-[var(--color-muted)]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span className="mx-2">→</span>
                  <span>{getClaimStatusLabel(log.new_status)}</span>
                  {log.notes !== null && log.notes.length > 0 ? (
                    <p className="text-[var(--color-muted)] mt-1">{log.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <BottomNavbar />
    </div>
  );
}
