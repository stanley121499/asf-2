"use client";

import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import {
  useWarrantyPolicyContext,
  type EditableWarrantyTier,
} from "@/context/WarrantyPolicyContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Label, TextInput } from "flowbite-react";
import React, { useCallback, useMemo, useState } from "react";
import { HiPlus, HiTrash } from "react-icons/hi";

/**
 * Client-side tier overlap validation.
 */
function validateTiersClient(tiers: EditableWarrantyTier[]): string | null {
  for (const tier of tiers) {
    if (tier.days_from > tier.days_to) {
      return "Each tier must have days_from ≤ days_to";
    }
    if (tier.discount_percent < 0 || tier.discount_percent > 100) {
      return "Discount percent must be between 0 and 100";
    }
  }
  const sorted = [...tiers].sort((a, b) => a.days_from - b.days_from);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev !== undefined && curr !== undefined && curr.days_from <= prev.days_to) {
      return "Tier day ranges must not overlap";
    }
  }
  return null;
}

const WarrantySettingsInner: React.FC = function () {
  const { policy, tiers, loading, updatePolicy, previewPercentForDay } =
    useWarrantyPolicyContext();
  const [editableTiers, setEditableTiers] = useState<EditableWarrantyTier[]>([]);
  const [maxWarrantyDays, setMaxWarrantyDays] = useState(365);
  const [creditExpiryDays, setCreditExpiryDays] = useState(365);
  const [previewDay, setPreviewDay] = useState(15);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (policy !== null) {
      setMaxWarrantyDays(policy.max_warranty_days);
      setCreditExpiryDays(policy.credit_expiry_days);
    }
    setEditableTiers(
      tiers.map((t) => ({
        id: t.id,
        days_from: t.days_from,
        days_to: t.days_to,
        discount_percent: Number(t.discount_percent),
        sort_order: t.sort_order,
      }))
    );
  }, [policy, tiers]);

  const previewPercent = useMemo(
    () => previewPercentForDay(previewDay),
    [previewDay, previewPercentForDay]
  );

  const handleAddTier = useCallback((): void => {
    setEditableTiers((prev) => [
      ...prev,
      {
        days_from: 0,
        days_to: 30,
        discount_percent: 10,
        sort_order: prev.length + 1,
      },
    ]);
  }, []);

  const handleRemoveTier = useCallback((index: number): void => {
    setEditableTiers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    setMessage(null);
    const tierError = validateTiersClient(editableTiers);
    if (tierError !== null) {
      setMessage(tierError);
      return;
    }
    setSaving(true);
    try {
      const ok = await updatePolicy({
        max_warranty_days: maxWarrantyDays,
        credit_expiry_days: creditExpiryDays,
        tiers: editableTiers.map((t, index) => ({
          ...t,
          sort_order: index + 1,
        })),
      });
      setMessage(ok ? "Warranty policy saved." : "Failed to save policy.");
    } finally {
      setSaving(false);
    }
  }, [creditExpiryDays, editableTiers, maxWarrantyDays, updatePolicy]);

  if (loading || policy === null) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8">Loading warranty settings…</div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Warranty Settings
        </h1>

        <Card>
          <h2 className="text-lg font-semibold mb-4">{policy.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="max-warranty-days">Max warranty days</Label>
              <TextInput
                id="max-warranty-days"
                type="number"
                min={1}
                value={maxWarrantyDays}
                onChange={(e) => setMaxWarrantyDays(Number.parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="credit-expiry-days">Credit expiry (days)</Label>
              <TextInput
                id="credit-expiry-days"
                type="number"
                min={1}
                value={creditExpiryDays}
                onChange={(e) => setCreditExpiryDays(Number.parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <h3 className="font-medium mb-2">Discount tiers (manufacturing defect)</h3>
          <div className="space-y-3 mb-4">
            {editableTiers.map((tier, index) => (
              <div
                key={tier.id ?? `tier-${String(index)}`}
                className="grid grid-cols-12 gap-2 items-end"
              >
                <div className="col-span-3">
                  <Label>Days from</Label>
                  <TextInput
                    type="number"
                    min={0}
                    value={tier.days_from}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value, 10) || 0;
                      setEditableTiers((prev) =>
                        prev.map((t, i) => (i === index ? { ...t, days_from: val } : t))
                      );
                    }}
                  />
                </div>
                <div className="col-span-3">
                  <Label>Days to</Label>
                  <TextInput
                    type="number"
                    min={0}
                    value={tier.days_to}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value, 10) || 0;
                      setEditableTiers((prev) =>
                        prev.map((t, i) => (i === index ? { ...t, days_to: val } : t))
                      );
                    }}
                  />
                </div>
                <div className="col-span-3">
                  <Label>Discount %</Label>
                  <TextInput
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={tier.discount_percent}
                    onChange={(e) => {
                      const val = Number.parseFloat(e.target.value) || 0;
                      setEditableTiers((prev) =>
                        prev.map((t, i) =>
                          i === index ? { ...t, discount_percent: val } : t
                        )
                      );
                    }}
                  />
                </div>
                <div className="col-span-3 flex gap-2">
                  <Button color="gray" size="sm" onClick={() => handleRemoveTier(index)}>
                    <HiTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button color="gray" size="sm" onClick={handleAddTier} className="mb-4">
            <HiPlus className="mr-1 h-4 w-4" />
            Add tier
          </Button>

          <Button color="blue" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save policy"}
          </Button>
          {message !== null && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </Card>

        <Card>
          <h3 className="font-medium mb-2">Tier preview</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="preview-day">Days since delivery</Label>
              <TextInput
                id="preview-day"
                type="number"
                min={0}
                value={previewDay}
                onChange={(e) => setPreviewDay(Number.parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <p className="text-gray-700 dark:text-gray-300 pb-2">
              Recommended percent: <strong>{previewPercent}%</strong>
            </p>
          </div>
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

const WarrantySettingsPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <WarrantySettingsInner />
    </FullAdminContextBundle>
  );
};

export default WarrantySettingsPage;
