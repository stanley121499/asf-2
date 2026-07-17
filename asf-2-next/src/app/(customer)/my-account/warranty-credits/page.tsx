"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useWarrantyCreditContext } from "@/context/WarrantyCreditContext";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";

type CreditTab = "active" | "used" | "expired";

/**
 * Customer warranty credits account page.
 */
export default function WarrantyCreditsPage(): React.ReactElement {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { credits, loading } = useWarrantyCreditContext();
  const [tab, setTab] = React.useState<CreditTab>("active");

  React.useEffect(() => {
    if (!isEnabled("claims")) {
      router.replace("/");
    }
  }, [isEnabled, router]);

  React.useEffect(() => {
    if (!authLoading && user === null) {
      router.replace("/authentication/sign-in?next=/my-account/warranty-credits");
    }
  }, [authLoading, user, router]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return credits.filter((c) => {
      const expires = new Date(c.expiresAt).getTime();
      const isExpired = c.status === "expired" || (Number.isFinite(expires) && expires < now);
      if (tab === "used") {
        return c.status === "used";
      }
      if (tab === "expired") {
        return isExpired || c.status === "revoked";
      }
      return c.status === "active" && !isExpired;
    });
  }, [credits, tab]);

  if (!isEnabled("claims")) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  if (authLoading || user === null || loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center pb-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <NavbarHome />

      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="text-sm font-medium flex items-center"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          账户
        </button>
        <h1 className="flex-1 text-center font-display text-lg pr-16">保固抵扣</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <div className="flex gap-2 mb-4">
          {(["active", "used", "expired"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                tab === key ? "bg-black text-white border-black" : "border-[var(--color-border)]"
              }`}
            >
              {key === "active" ? "可用" : key === "used" ? "已使用" : "已过期"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-12">暂无抵扣记录</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((credit) => (
              <div key={credit.id} className="card-panel p-4 text-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold text-lg">RM {credit.amountMyr.toFixed(2)}</p>
                    <p className="text-[var(--color-muted)] mt-1">{credit.productName}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-2">
                      {credit.claimId !== null
                        ? `来源申请 ${formatClaimLabel(credit.claimId)}`
                        : "来源保修登记"}
                    </p>
                  </div>
                  <span className="text-xs uppercase text-[var(--color-muted)]">{credit.status}</span>
                </div>
                <p className="text-xs mt-3 text-[var(--color-muted)]">
                  {credit.status === "used" && credit.usedAt !== null
                    ? `已于 ${new Date(credit.usedAt).toLocaleDateString()} 使用`
                    : `有效期至 ${new Date(credit.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
}
