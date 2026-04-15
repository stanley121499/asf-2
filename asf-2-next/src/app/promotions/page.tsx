"use client";

import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import { usePromotionContext, type Promotion } from "@/context/PromotionContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Badge, Button, Card } from "flowbite-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { HiPlus } from "react-icons/hi";

/**
 * Derives a display label for scheduling / activity state.
 */
function promotionStatusLabel(p: Promotion): string {
  if (!p.active) {
    return "Inactive";
  }
  const now = Date.now();
  if (p.start_date !== null && p.start_date.length > 0) {
    const start = new Date(p.start_date).getTime();
    if (Number.isFinite(start) && now < start) {
      return "Scheduled";
    }
  }
  if (p.end_date !== null && p.end_date.length > 0) {
    const end = new Date(p.end_date).getTime();
    if (Number.isFinite(end) && now > end) {
      return "Expired";
    }
  }
  return "Active";
}

function statusBadgeColor(
  label: string
): "success" | "failure" | "warning" | "info" | "gray" {
  switch (label) {
    case "Active":
      return "success";
    case "Expired":
      return "failure";
    case "Scheduled":
      return "warning";
    case "Inactive":
      return "gray";
    default:
      return "info";
  }
}

function formatDiscount(p: Promotion): string {
  if (p.discount_type === "percentage") {
    return `${p.discount_value}%`;
  }
  return `RM ${Number(p.discount_value).toFixed(2)}`;
}

function formatDateRange(p: Promotion): string {
  const s =
    p.start_date !== null && p.start_date.length > 0
      ? new Date(p.start_date).toLocaleString()
      : "—";
  const e =
    p.end_date !== null && p.end_date.length > 0
      ? new Date(p.end_date).toLocaleString()
      : "—";
  return `${s} → ${e}`;
}

const PromotionsListInner: React.FC = function () {
  const { promotions, loading } = usePromotionContext();

  const rows = useMemo(
    () =>
      [...promotions].sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return tb - ta;
      }),
    [promotions]
  );

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Promotions
          </h1>
          <Link href="/promotions/create">
            <Button color="blue">
              <HiPlus className="mr-2 h-5 w-5" />
              Create promotion
            </Button>
          </Link>
        </div>

        <Card>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No promotions yet. Create one to offer discounts.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Uses</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const label = promotionStatusLabel(p);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {p.code ?? "—"}
                        </td>
                        <td className="px-4 py-3">{formatDiscount(p)}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {formatDateRange(p)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={statusBadgeColor(label)}>{label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {p.max_uses !== null
                            ? `${p.uses_count} / ${p.max_uses}`
                            : `${p.uses_count}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/promotions/${p.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

const PromotionsListPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <PromotionsListInner />
    </FullAdminContextBundle>
  );
};

export default PromotionsListPage;
