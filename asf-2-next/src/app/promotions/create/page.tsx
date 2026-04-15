"use client";

import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import { useProductContext } from "@/context/product/ProductContext";
import { usePromotionContext } from "@/context/PromotionContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { readDeletedAt } from "@/utils/softDeleteRuntime";
import { Button, Card, Label, Select, Textarea, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

function fromDatetimeLocalValue(local: string): string | null {
  const t = local.trim();
  if (t.length === 0) {
    return null;
  }
  const d = new Date(t);
  if (!Number.isFinite(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

const CreatePromotionInner: React.FC = function () {
  const router = useRouter();
  const { products } = useProductContext();
  const { createPromotion } = usePromotionContext();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [active, setActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProducts = useMemo(() => {
    return products.filter((p) => readDeletedAt(p) === null);
  }, [products]);

  const toggleProduct = (id: string): void => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    const dv = Number.parseFloat(discountValue);
    if (!Number.isFinite(dv) || dv < 0) {
      setError("Enter a valid discount value.");
      return;
    }
    if (discountType === "percentage" && dv > 100) {
      setError("Percentage cannot exceed 100.");
      return;
    }

    let maxUsesVal: number | null = null;
    if (maxUses.trim().length > 0) {
      const m = Number.parseInt(maxUses, 10);
      if (!Number.isInteger(m) || m <= 0) {
        setError("Max uses must be a positive integer or empty.");
        return;
      }
      maxUsesVal = m;
    }

    setSaving(true);
    try {
      const created = await createPromotion({
        name: name.trim(),
        description: description.trim().length > 0 ? description.trim() : null,
        code: code.trim().length > 0 ? code.trim() : null,
        discount_type: discountType,
        discount_value: dv,
        start_date: fromDatetimeLocalValue(startLocal),
        end_date: fromDatetimeLocalValue(endLocal),
        active,
        max_uses: maxUsesVal,
        product_ids: Array.from(selectedProductIds),
      });
      if (created === undefined) {
        setError("Could not create promotion. Check the code is unique.");
        return;
      }
      router.push("/promotions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/promotions"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to promotions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            Create promotion
          </h1>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            {error !== null && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div>
              <Label htmlFor="pm-name">Name</Label>
              <TextInput
                id="pm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pm-desc">Description</Label>
              <Textarea
                id="pm-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="pm-code">Code (optional)</Label>
              <TextInput
                id="pm-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SUMMER10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pm-dtype">Discount type</Label>
                <Select
                  id="pm-dtype"
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(
                      e.target.value === "fixed" ? "fixed" : "percentage"
                    )
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed (MYR)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="pm-dval">Discount value</Label>
                <TextInput
                  id="pm-dval"
                  type="number"
                  min={0}
                  step={discountType === "percentage" ? 1 : 0.01}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pm-start">Start (optional)</Label>
                <TextInput
                  id="pm-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pm-end">End (optional)</Label>
                <TextInput
                  id="pm-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pm-max">Max uses (optional)</Label>
              <TextInput
                id="pm-max"
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited if empty"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="pm-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="pm-active" className="mb-0">
                Active
              </Label>
            </div>
            <div>
              <Label>Products (optional — empty means all products)</Label>
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 space-y-1">
                {activeProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" color="blue" disabled={saving}>
                {saving ? "Saving…" : "Create"}
              </Button>
              <Link href="/promotions">
                <Button color="gray" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

const CreatePromotionPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <CreatePromotionInner />
    </FullAdminContextBundle>
  );
};

export default CreatePromotionPage;
