"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStoreLocationContext, type StoreLocation } from "@/context/StoreLocationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import LandingLayout from "@/layouts/LandingLayout";
import BottomNavbar from "@/components/home/bottom-nav";

/**
 * Formats address lines for display on a store card.
 */
function formatAddress(row: StoreLocation): string {
  const parts = [
    row.address_line_1,
    row.address_line_2,
    row.city,
    row.state,
    row.postcode,
    row.country,
  ].filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.join(", ");
}

/**
 * Customer-facing store locator list.
 */
export default function StoreLocationsClient(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { storeLocations, loading } = useStoreLocationContext();

  useEffect(() => {
    if (!isEnabled("store_locations")) {
      router.replace("/");
    }
  }, [isEnabled, router]);

  const activeLocations = useMemo(() => {
    return storeLocations
      .filter((row) => row.active)
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
  }, [storeLocations]);

  if (!isEnabled("store_locations")) {
    return <></>;
  }

  return (
    <LandingLayout>
      <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
        <h1 className="font-serif text-2xl text-[var(--color-text)] mb-2">门店地址</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          查找我们位于马来西亚各大商场的实体店。
        </p>

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">加载中…</p>
        ) : activeLocations.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">暂无门店信息。</p>
        ) : (
          <div className="space-y-4">
            {activeLocations.map((row) => (
              <article
                key={row.id}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-medium text-[var(--color-text)]">{row.name}</h2>
                <p className="text-sm text-[var(--color-accent)] mt-1">{row.mall_name}</p>
                <p className="text-sm text-[var(--color-muted)] mt-3 leading-relaxed">
                  {formatAddress(row)}
                </p>
                {row.phone !== null && row.phone.length > 0 && (
                  <p className="text-sm text-[var(--color-text)] mt-2">
                    电话：{" "}
                    <a href={`tel:${row.phone}`} className="underline">
                      {row.phone}
                    </a>
                  </p>
                )}
                {row.opening_hours !== null && row.opening_hours.length > 0 && (
                  <p className="text-sm text-[var(--color-muted)] mt-2">
                    营业时间：{row.opening_hours}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-4">
                  {row.google_maps_url !== null && row.google_maps_url.length > 0 && (
                    <a
                      href={row.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--color-text)] underline"
                    >
                      Google Maps
                    </a>
                  )}
                  {row.waze_url !== null && row.waze_url.length > 0 && (
                    <a
                      href={row.waze_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--color-text)] underline"
                    >
                      Waze
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <BottomNavbar />
    </LandingLayout>
  );
}
