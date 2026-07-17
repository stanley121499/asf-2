"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Label, Modal, TextInput } from "flowbite-react";

import { useAlertContext } from "@/context/AlertContext";
import type { ClaimItem } from "@/context/ClaimContext";
import { calculateCreditAmount } from "@/modules/warranty/calculateCreditAmount";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { supabase } from "@/utils/supabaseClient";

interface ClaimItemWithProduct extends ClaimItem {
  productName: string;
}

interface WarrantyCreditReviewPanelProps {
  claimId: string;
  claimStatus: string;
  claimType: string;
  staffNotes: string;
  onApproved: () => void;
  fetchClaimItems: (claimId: string) => Promise<ClaimItem[]>;
}

/**
 * Staff per-item warranty tier review and Approve & Issue Credits flow.
 */
export function WarrantyCreditReviewPanel({
  claimId,
  claimStatus,
  claimType,
  staffNotes,
  onApproved,
  fetchClaimItems,
}: WarrantyCreditReviewPanelProps): React.ReactElement | null {
  const { showAlert } = useAlertContext();
  const [items, setItems] = useState<ClaimItemWithProduct[]>([]);
  const [approvedPercents, setApprovedPercents] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async (): Promise<void> => {
    const rows = await fetchClaimItems(claimId);
    if (rows.length === 0) {
      setItems([]);
      return;
    }

    const productIds = rows
      .map((r) => r.product_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const nameByProductId = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);
      for (const p of products ?? []) {
        nameByProductId.set(p.id, p.name);
      }
    }

    const enriched: ClaimItemWithProduct[] = rows.map((row) => ({
      ...row,
      productName:
        row.product_id !== null ? (nameByProductId.get(row.product_id) ?? "Product") : "Product",
    }));
    setItems(enriched);

    const defaults: Record<string, number> = {};
    for (const row of enriched) {
      const recommended = Number(row.recommended_percent ?? 0);
      const approved = Number(row.approved_percent ?? recommended);
      defaults[row.id] = Number.isFinite(approved) ? approved : recommended;
    }
    setApprovedPercents(defaults);
  }, [claimId, fetchClaimItems]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const totalCreditPreview = useMemo(() => {
    return items.reduce((sum, item) => {
      const percent = approvedPercents[item.id] ?? 0;
      return sum + calculateCreditAmount(Number(item.line_item_price_myr), percent);
    }, 0);
  }, [items, approvedPercents]);

  const allItemsHavePercent = useMemo(() => {
    return items.every((item) => {
      const p = approvedPercents[item.id];
      return typeof p === "number" && Number.isFinite(p) && p >= 0 && p <= 100;
    });
  }, [items, approvedPercents]);

  const creditsAlreadyIssued = items.some((item) => item.warranty_credit_id !== null);
  const canApprove =
    items.length > 0 &&
    allItemsHavePercent &&
    !creditsAlreadyIssued &&
    claimStatus !== "approved" &&
    claimStatus !== "rejected" &&
    claimStatus !== "resolved";

  const handleApprove = useCallback(async (): Promise<void> => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/warranty/claims/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          items: items.map((item) => ({
            claimItemId: item.id,
            approvedPercent: approvedPercents[item.id] ?? 0,
          })),
          staffNotes: staffNotes.trim().length > 0 ? staffNotes.trim() : null,
        }),
      });
      const data = (await res.json()) as { credits?: unknown[]; error?: string };
      if (!res.ok) {
        showAlert(data.error ?? "Failed to issue credits", "error");
        return;
      }
      showAlert("Warranty credits issued successfully.", "success");
      setModalOpen(false);
      await loadItems();
      onApproved();
    } finally {
      setSubmitting(false);
    }
  }, [approvedPercents, claimId, items, loadItems, onApproved, showAlert, staffNotes]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Warranty credits</h2>
        <Badge color="warning">Recommended — not final</Badge>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Claim type: {claimType}. Adjust approved % per item, then issue fixed RM credits.
      </p>

      <div className="space-y-4">
        {items.map((item) => {
          const percent = approvedPercents[item.id] ?? 0;
          const creditPreview = calculateCreditAmount(Number(item.line_item_price_myr), percent);
          return (
            <div key={item.id} className="border rounded-lg p-3 text-sm">
              <p className="font-medium">{item.productName}</p>
              <p className="text-gray-500">
                Line price: RM {Number(item.line_item_price_myr).toFixed(2)}
                {item.days_since_delivery !== null
                  ? ` · ${String(item.days_since_delivery)} days since delivery`
                  : ""}
              </p>
              {item.recommended_percent !== null ? (
                <p className="mt-1">
                  <Badge color="info" className="mr-2">
                    Recommended
                  </Badge>
                  {Number(item.recommended_percent).toFixed(0)}%
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <div>
                  <Label htmlFor={`approved-${item.id}`}>Approved %</Label>
                  <TextInput
                    id={`approved-${item.id}`}
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="w-28"
                    disabled={creditsAlreadyIssued || claimStatus === "approved"}
                    value={percent}
                    onChange={(e) => {
                      const val = Number.parseFloat(e.target.value) || 0;
                      setApprovedPercents((prev) => ({ ...prev, [item.id]: val }));
                    }}
                  />
                </div>
                <p className="pb-2">
                  Credit: <strong>RM {creditPreview.toFixed(2)}</strong>
                </p>
                {item.warranty_credit_id !== null ? (
                  <Badge color="success">Credit issued</Badge>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Total credit preview: RM {totalCreditPreview.toFixed(2)}
        </p>
        {canApprove ? (
          <Button color="success" onClick={() => setModalOpen(true)}>
            Approve &amp; Issue Credits
          </Button>
        ) : null}
      </div>

      <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>Approve &amp; Issue Credits</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-600 mb-3">
            Confirm issuance for claim {formatClaimLabel(claimId)}. Credits are single-use and
            expire in 1 year.
          </p>
          <ul className="text-sm space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                {item.productName}: {String(approvedPercents[item.id] ?? 0)}% → RM{" "}
                {calculateCreditAmount(
                  Number(item.line_item_price_myr),
                  approvedPercents[item.id] ?? 0
                ).toFixed(2)}
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button color="success" disabled={submitting} onClick={() => void handleApprove()}>
            {submitting ? "Issuing…" : "Confirm & Issue"}
          </Button>
          <Button color="gray" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
