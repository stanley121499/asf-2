"use client";

import { ClaimsWithSupportContextBundle } from "@/context/RouteContextBundles";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import LoadingPage from "@/app/loading";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  Label,
  Modal,
  Select,
  Textarea,
  TextInput,
} from "flowbite-react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useClaimContext } from "@/context/ClaimContext";
import { useClaimStatusLogContext } from "@/context/ClaimStatusLogContext";
import { useUserContext } from "@/context/UserContext";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useConversationContext } from "@/context/ConversationContext";
import {
  claimPolicyConfig,
  getClaimResolutionLabel,
  getClaimStatusLabel,
  type ClaimResolution,
  type ClaimStatus,
} from "@/modules/claims/claimPolicyConfig";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { applyClaimStatusChange } from "@/modules/claims/claimStatusTransition";
import { supabase } from "@/utils/supabaseClient";
import type { Tables } from "@/database.types";

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
 * Staff claim detail and resolution page.
 */
const ClaimDetailPage: React.FC = () => {
  const claimId = useClaimIdParam();
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { claims, loading, updateClaim } = useClaimContext();
  const { listByClaimId } = useClaimStatusLogContext();
  const { users } = useUserContext();
  const { user: authUser } = useAuthContext();
  const { createConversation, addParticipant, createMessage } = useConversationContext();

  const [statusLogs, setStatusLogs] = useState<Tables<"claim_status_change_logs">[]>([]);
  const [productName, setProductName] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [approvedResolution, setApprovedResolution] = useState<ClaimResolution>("replacement");
  const [rejectionReason, setRejectionReason] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const claim = useMemo(() => claims.find((c) => c.id === claimId) ?? null, [claims, claimId]);

  const customer = useMemo(
    () => (claim !== null ? users.find((u) => u.id === claim.user_id) : undefined),
    [users, claim]
  );

  const typeLabel = useMemo(() => {
    if (claim === null) {
      return "";
    }
    return (
      claimPolicyConfig.claimTypes.find((t) => t.key === claim.claim_type)?.label ??
      claim.claim_type
    );
  }, [claim]);

  useEffect(() => {
    if (!isEnabled("claims")) {
      router.replace("/dashboard");
    }
  }, [isEnabled, router]);

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
    void supabase
      .from("products")
      .select("name")
      .eq("id", claim.product_id)
      .maybeSingle()
      .then(({ data }) => setProductName(data?.name ?? null));
  }, [claim?.product_id]);

  useEffect(() => {
    if (claim?.order_id === null || claim?.order_id === undefined) {
      setPaymentId(null);
      return;
    }
    void supabase
      .from("payments")
      .select("id")
      .eq("order_id", claim.order_id)
      .maybeSingle()
      .then(({ data }) => setPaymentId(data?.id ?? null));
  }, [claim?.order_id]);

  useEffect(() => {
    if (claim !== null) {
      setStaffNotes(claim.staff_notes ?? "");
      if (claim.approved_resolution !== null) {
        setApprovedResolution(claim.approved_resolution as ClaimResolution);
      }
      setRejectionReason(claim.rejection_reason ?? "");
    }
  }, [claim]);

  const transitionStatus = useCallback(
    async (newStatus: ClaimStatus, extra?: { approved_resolution?: string; rejection_reason?: string }): Promise<void> => {
      if (claim === null || authUser === null) {
        return;
      }
      setUpdating(true);
      try {
        const oldStatus = claim.status;
        const ok = await applyClaimStatusChange({
          supabase,
          claimId: claim.id,
          userId: claim.user_id,
          oldStatus,
          newStatus,
          changedBy: authUser.id,
          updatePayload: {
            staff_notes: staffNotes.trim().length > 0 ? staffNotes.trim() : null,
            ...extra,
          },
          notes: staffNotes.trim().length > 0 ? staffNotes.trim() : null,
          notifyExtraBody: extra?.rejection_reason ?? undefined,
        });
        if (!ok) {
          return;
        }
        await updateClaim(claim.id, {
          status: newStatus,
          staff_notes: staffNotes.trim().length > 0 ? staffNotes.trim() : null,
          ...extra,
          ...(newStatus === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
        });
        const logs = await listByClaimId(claim.id);
        setStatusLogs(logs);
      } finally {
        setUpdating(false);
      }
    },
    [claim, authUser, updateClaim, staffNotes, listByClaimId]
  );

  const handleStartConversation = useCallback(async (): Promise<void> => {
    if (claim === null || authUser === null || customer === undefined) {
      return;
    }
    if (claim.conversation_id !== null) {
      return;
    }
    const conversation = await createConversation({
      type: "support",
      active: true,
      created_at: new Date().toISOString(),
    });
    if (conversation === undefined) {
      return;
    }
    await addParticipant({ conversation_id: conversation.id, user_id: claim.user_id });
    await addParticipant({ conversation_id: conversation.id, user_id: authUser.id });
    await createMessage({
      conversation_id: conversation.id,
      content: `Claim ${formatClaimLabel(claim.id)} — staff follow-up started.`,
      created_at: new Date().toISOString(),
      user_id: authUser.id,
      type: "text",
      media_url: null,
    });
    await updateClaim(claim.id, { conversation_id: conversation.id });
  }, [claim, authUser, customer, createConversation, addParticipant, createMessage, updateClaim]);

  if (!isEnabled("claims")) {
    return null;
  }

  if (loading || claimId.length === 0) {
    return <LoadingPage />;
  }

  if (claim === null) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">Claim not found.</p>
          <Button onClick={() => router.push("/claims")}>Back to queue</Button>
        </div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push("/claims")}
          className="text-sm font-medium flex items-center text-gray-600"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          Claims queue
        </button>

        <div className="flex flex-wrap justify-between gap-4 items-start">
          <div>
            <h1 className="text-2xl font-bold">{formatClaimLabel(claim.id)}</h1>
            <p className="text-sm text-gray-500 mt-1">{customer?.email ?? "Customer"}</p>
          </div>
          <Badge color="info" size="lg">
            {getClaimStatusLabel(claim.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h2 className="font-semibold mb-3">Claim details</h2>
            <dl className="text-sm space-y-2">
              <div><dt className="text-gray-500 inline">Type: </dt><dd className="inline">{typeLabel}</dd></div>
              <div><dt className="text-gray-500 inline">Product: </dt><dd className="inline">{productName ?? "—"}</dd></div>
              {claim.order_id !== null ? (
                <div>
                  <dt className="text-gray-500 inline">Order: </dt>
                  <dd className="inline">
                    <Link href={`/orders/${claim.order_id}`} className="text-blue-600 underline">
                      #{claim.order_id.slice(0, 8).toUpperCase()}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {claim.requested_resolution !== null ? (
                <div>
                  <dt className="text-gray-500 inline">Requested: </dt>
                  <dd className="inline">{getClaimResolutionLabel(claim.requested_resolution)}</dd>
                </div>
              ) : null}
            </dl>
            {claim.description !== null ? (
              <p className="mt-4 text-sm whitespace-pre-line">{claim.description}</p>
            ) : null}
            {claim.evidence_urls.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {claim.evidence_urls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Evidence" className="w-full h-24 object-cover rounded border" />
                  </a>
                ))}
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Staff actions</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="staff_notes">Staff notes</Label>
                <Textarea
                  id="staff_notes"
                  rows={3}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="assign_agent">Assigned agent</Label>
                <Select
                  id="assign_agent"
                  value={claim.assigned_agent_id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value.length > 0 ? e.target.value : null;
                    void updateClaim(claim.id, { assigned_agent_id: id });
                  }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" color="yellow" disabled={updating} onClick={() => void transitionStatus("in_review")}>
                  In Review
                </Button>
                <Button size="sm" color="purple" disabled={updating} onClick={() => void transitionStatus("needs_info")}>
                  Needs Info
                </Button>
                <Button size="sm" color="success" disabled={updating} onClick={() => setResolveModalOpen(true)}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  color="failure"
                  disabled={updating}
                  onClick={() => void transitionStatus("rejected", { rejection_reason: rejectionReason || "Not covered under policy" })}
                >
                  Reject
                </Button>
                <Button size="sm" color="gray" disabled={updating} onClick={() => void transitionStatus("resolved")}>
                  Mark Resolved
                </Button>
              </div>

              {paymentId !== null && claim.requested_resolution === "refund" ? (
                <Link href={`/payments/${paymentId}`}>
                  <Button color="blue" size="sm" className="w-full">
                    Open payment / process refund
                  </Button>
                </Link>
              ) : null}

              {claim.conversation_id === null ? (
                <Button color="light" size="sm" onClick={() => void handleStartConversation()}>
                  Start customer conversation
                </Button>
              ) : (
                <p className="text-xs text-gray-500">Conversation linked: {claim.conversation_id}</p>
              )}
            </div>
          </Card>
        </div>

        {statusLogs.length > 0 ? (
          <Card>
            <h2 className="font-semibold mb-3">Status history</h2>
            <ul className="text-sm space-y-2">
              {statusLogs.map((log) => (
                <li key={log.id} className="border-b pb-2 last:border-0">
                  {new Date(log.created_at).toLocaleString()} — {getClaimStatusLabel(log.new_status)}
                  {log.notes !== null ? <span className="text-gray-500"> ({log.notes})</span> : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <Modal show={resolveModalOpen} onClose={() => setResolveModalOpen(false)}>
        <Modal.Header>Approve claim</Modal.Header>
        <Modal.Body>
          <Label htmlFor="approved_resolution">Resolution</Label>
          <Select
            id="approved_resolution"
            value={approvedResolution}
            onChange={(e) => setApprovedResolution(e.target.value as ClaimResolution)}
            className="mt-2"
          >
            <option value="replacement">Replacement</option>
            <option value="refund">Refund</option>
            <option value="repair">Repair</option>
            <option value="store_credit">Store credit</option>
          </Select>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="success"
            disabled={updating}
            onClick={() => {
              setResolveModalOpen(false);
              void transitionStatus("approved", { approved_resolution: approvedResolution });
            }}
          >
            Confirm approval
          </Button>
          <Button color="gray" onClick={() => setResolveModalOpen(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <div className="hidden">
        <Label htmlFor="rejection_reason">Rejection reason</Label>
        <TextInput id="rejection_reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
      </div>
    </NavbarSidebarLayout>
  );
};

export default function WrappedClaimDetailPage(): React.ReactElement {
  return (
    <ClaimsWithSupportContextBundle>
      <ClaimDetailPage />
    </ClaimsWithSupportContextBundle>
  );
}
