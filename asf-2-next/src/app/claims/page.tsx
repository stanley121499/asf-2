"use client";

import { ClaimsContextBundle } from "@/context/RouteContextBundles";
import React, { useEffect, useMemo, useState } from "react";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import LoadingPage from "@/app/loading";
import Link from "next/link";
import { Badge, Button, Card, Select, TextInput } from "flowbite-react";
import { HiSearch, HiEye } from "react-icons/hi";
import { FiUser } from "react-icons/fi";
import { useClaimContext } from "@/context/ClaimContext";
import { useUserContext } from "@/context/UserContext";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useRouter } from "next/navigation";
import {
  claimPolicyConfig,
  getClaimStatusLabel,
  type ClaimStatus,
} from "@/modules/claims/claimPolicyConfig";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { applyClaimStatusChange } from "@/modules/claims/claimStatusTransition";
import { calculateCreditAmount } from "@/modules/warranty/calculateCreditAmount";
import { supabase } from "@/utils/supabaseClient";

type ClaimTab = ClaimStatus | "all";

const STATUS_TABS: readonly { key: ClaimTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "New" },
  { key: "in_review", label: "In Review" },
  { key: "needs_info", label: "Needs Info" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "resolved", label: "Resolved" },
];

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "submitted":
      return "info";
    case "in_review":
      return "warning";
    case "needs_info":
      return "purple";
    case "approved":
      return "success";
    case "rejected":
      return "failure";
    case "resolved":
      return "gray";
    default:
      return "gray";
  }
}

/**
 * Staff claims queue page.
 */
const ClaimsQueuePage: React.FC = () => {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { claims, loading, updateClaim } = useClaimContext();
  const { users } = useUserContext();
  const { user: authUser } = useAuthContext();

  const [activeTab, setActiveTab] = useState<ClaimTab>("submitted");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [estimatedCreditByClaimId, setEstimatedCreditByClaimId] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (claims.length === 0) {
      setEstimatedCreditByClaimId({});
      return;
    }
    const claimIds = claims.map((c) => c.id);
    void supabase
      .from("claim_items")
      .select("claim_id, line_item_price_myr, recommended_percent, credit_amount_myr")
      .in("claim_id", claimIds)
      .then(({ data }) => {
        const totals: Record<string, number> = {};
        for (const row of data ?? []) {
          const issued = row.credit_amount_myr;
          const amount =
            issued !== null
              ? Number(issued)
              : calculateCreditAmount(
                  Number(row.line_item_price_myr),
                  Number(row.recommended_percent ?? 0)
                );
          totals[row.claim_id] = (totals[row.claim_id] ?? 0) + amount;
        }
        setEstimatedCreditByClaimId(totals);
      });
  }, [claims]);

  useEffect(() => {
    if (!isEnabled("claims")) {
      router.replace("/dashboard");
    }
  }, [isEnabled, router]);

  const typeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of claimPolicyConfig.claimTypes) {
      map.set(t.key, t.label);
    }
    return map;
  }, []);

  const enrichedClaims = useMemo(() => {
    return claims.map((c) => {
      const customer = users.find((u) => u.id === c.user_id);
      return {
        ...c,
        customerEmail: customer?.email ?? "Customer",
        typeLabel: typeLabelMap.get(c.claim_type) ?? c.claim_type,
        label: formatClaimLabel(c.id),
      };
    });
  }, [claims, users, typeLabelMap]);

  const filteredClaims = useMemo(() => {
    return enrichedClaims.filter((c) => {
      const matchesTab = activeTab === "all" || c.status === activeTab;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        c.label.toLowerCase().includes(q) ||
        c.customerEmail.toLowerCase().includes(q) ||
        c.typeLabel.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q);
      const matchesAssignee =
        !showAssignedToMe || (authUser !== null && c.assigned_agent_id === authUser.id);
      return matchesTab && matchesSearch && matchesAssignee;
    });
  }, [enrichedClaims, activeTab, searchQuery, showAssignedToMe, authUser]);

  const selectedClaim = enrichedClaims.find((c) => c.id === selectedClaimId) ?? null;

  const handleQuickStatus = async (
    claimId: string,
    userId: string,
    oldStatus: string,
    newStatus: ClaimStatus
  ): Promise<void> => {
    if (authUser === null) {
      return;
    }
    const ok = await applyClaimStatusChange({
      supabase,
      claimId,
      userId,
      oldStatus,
      newStatus,
      changedBy: authUser.id,
    });
    if (ok) {
      await updateClaim(claimId, { status: newStatus });
    }
  };

  if (!isEnabled("claims")) {
    return null;
  }

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="relative grid grid-cols-1 overflow-y-hidden xl:h-[calc(100vh)] xl:grid-cols-4 xl:gap-6 p-4">
        <div className="xl:col-span-1 border-r dark:border-gray-700 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Claims</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {claimPolicyConfig.moduleLabel}
            </p>
          </div>

          <div className="p-3 flex flex-wrap gap-1 border-b dark:border-gray-700">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-2 py-1 text-xs rounded-md border ${
                  activeTab === tab.key
                    ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 flex flex-col gap-2 border-b dark:border-gray-700">
            <div className="relative">
              <HiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <TextInput
                type="search"
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showAssignedToMe}
                onChange={(e) => setShowAssignedToMe(e.target.checked)}
              />
              Assigned to me
            </label>
          </div>

          <div className="overflow-y-auto flex-1 divide-y dark:divide-gray-700">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                    selectedClaimId === claim.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                      <FiUser className="text-gray-600 dark:text-gray-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{claim.customerEmail}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {claim.label} · {claim.typeLabel}
                        {(estimatedCreditByClaimId[claim.id] ?? 0) > 0
                          ? ` · Est. RM ${(estimatedCreditByClaimId[claim.id] ?? 0).toFixed(2)}`
                          : ""}
                      </p>
                      <Badge color={getStatusBadgeColor(claim.status)} size="xs" className="mt-1 w-fit">
                        {getClaimStatusLabel(claim.status)}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="p-8 text-center text-gray-500 text-sm">No claims match your filters.</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 overflow-y-auto">
          {selectedClaim !== null ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedClaim.label}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">{selectedClaim.customerEmail}</p>
                </div>
                <Link href={`/claims/${selectedClaim.id}`}>
                  <Button color="blue" size="sm">
                    <HiEye className="mr-1 h-4 w-4" />
                    Full Detail
                  </Button>
                </Link>
              </div>

              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span> {selectedClaim.typeLabel}
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>{" "}
                    <Badge color={getStatusBadgeColor(selectedClaim.status)}>
                      {getClaimStatusLabel(selectedClaim.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>{" "}
                    {new Date(selectedClaim.created_at).toLocaleString()}
                  </div>
                  {selectedClaim.order_id !== null ? (
                    <div>
                      <span className="text-gray-500">Order:</span>{" "}
                      <Link href={`/orders/${selectedClaim.order_id}`} className="text-blue-600 underline">
                        #{selectedClaim.order_id.slice(0, 8).toUpperCase()}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {selectedClaim.description !== null ? (
                  <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedClaim.description}
                  </p>
                ) : null}
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button
                  color="yellow"
                  size="sm"
                  onClick={() => void handleQuickStatus(selectedClaim.id, selectedClaim.user_id, selectedClaim.status, "in_review")}
                >
                  Mark In Review
                </Button>
                <Button
                  color="purple"
                  size="sm"
                  onClick={() => void handleQuickStatus(selectedClaim.id, selectedClaim.user_id, selectedClaim.status, "needs_info")}
                >
                  Request Info
                </Button>
                <Button
                  color="success"
                  size="sm"
                  onClick={() => void handleQuickStatus(selectedClaim.id, selectedClaim.user_id, selectedClaim.status, "approved")}
                >
                  Approve
                </Button>
                <Button
                  color="failure"
                  size="sm"
                  onClick={() => void handleQuickStatus(selectedClaim.id, selectedClaim.user_id, selectedClaim.status, "rejected")}
                >
                  Reject
                </Button>
                <Button
                  color="gray"
                  size="sm"
                  onClick={() => void handleQuickStatus(selectedClaim.id, selectedClaim.user_id, selectedClaim.status, "resolved")}
                >
                  Resolve
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assign to</label>
                <Select
                  value={selectedClaim.assigned_agent_id ?? ""}
                  onChange={(e) => {
                    const agentId = e.target.value.length > 0 ? e.target.value : null;
                    void updateClaim(selectedClaim.id, { assigned_agent_id: agentId });
                  }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
              <p>Select a claim from the list to review</p>
            </div>
          )}
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default function WrappedClaimsQueuePage(): React.ReactElement {
  return (
    <ClaimsContextBundle>
      <ClaimsQueuePage />
    </ClaimsContextBundle>
  );
}
