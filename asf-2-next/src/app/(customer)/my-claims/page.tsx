"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import { HiOutlineArrowLeft, HiOutlineChevronRight } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useClaimContext } from "@/context/ClaimContext";
import { claimPolicyConfig, getClaimStatusLabel } from "@/modules/claims/claimPolicyConfig";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { supabase } from "@/utils/supabaseClient";
import type { Database } from "@/database.types";

type ProductRow = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "name">;

interface ClaimListItem {
  id: string;
  claim_type: string;
  status: string;
  created_at: string;
  productName: string | null;
}

/**
 * Customer claim list page (`/my-claims`).
 */
export default function CustomerClaimsListPage(): React.ReactElement {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { listByUserId } = useClaimContext();
  const [items, setItems] = useState<ClaimListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

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
      router.replace("/authentication/sign-in?next=/my-claims");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || user === null || !isEnabled("claims")) {
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function load(): Promise<void> {
      setListLoading(true);
      const claims = await listByUserId(userId);
      if (cancelled) {
        return;
      }

      const productIds = claims
        .map((c) => c.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      let productMap = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        const rows = (products ?? []) as ProductRow[];
        productMap = new Map(rows.map((p) => [p.id, p.name]));
      }

      setItems(
        claims.map((c) => ({
          id: c.id,
          claim_type: c.claim_type,
          status: c.status,
          created_at: c.created_at,
          productName: c.product_id !== null ? productMap.get(c.product_id) ?? null : null,
        }))
      );
      setListLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, listByUserId, isEnabled]);

  const typeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of claimPolicyConfig.claimTypes) {
      map.set(t.key, t.label);
    }
    return map;
  }, []);

  if (!isEnabled("claims")) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  if (authLoading || user === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center pb-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-panel)] pb-24 flex flex-col">
      <NavbarHome />

      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          返回
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-12">
          {claimPolicyConfig.moduleLabel}
        </h1>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full flex-1">
        {listLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-muted)]">
            <p className="mb-4">您还没有提交过申请。</p>
            <Link href="/order-details" className="btn-primary rounded-xl px-6 py-2 text-sm inline-block">
              查看我的订单
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/my-claims/${item.id}`}
                className="card-panel p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {item.productName ?? "商品申请"}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    {formatClaimLabel(item.id)} · {typeLabelMap.get(item.claim_type) ?? item.claim_type}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {new Date(item.created_at).toLocaleDateString()} · {getClaimStatusLabel(item.status)}
                  </p>
                </div>
                <HiOutlineChevronRight className="text-[var(--color-muted)] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
}
