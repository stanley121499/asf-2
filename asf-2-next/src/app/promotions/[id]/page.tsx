"use client";

import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import { useProductContext } from "@/context/product/ProductContext";
import { usePromotionContext, type Promotion } from "@/context/PromotionContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { readDeletedAt } from "@/utils/softDeleteRuntime";
import { Button, Card, Label, Select, Spinner, Textarea, TextInput } from "flowbite-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

function toDatetimeLocalValue(iso: string | null): string {
  if (iso === null || iso.length === 0) {
    return "";
  }
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return "";
  }
  const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

const EditPromotionInner: React.FC = function () {
  const params = useParams();
  const router = useRouter();
  const rawId = params["id"];
  const id = typeof rawId === "string" ? rawId : "";

  const { products } = useProductContext();
  const { updatePromotion, deletePromotion } = usePromotionContext();

  const [loading, setLoading] = useState(true);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
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
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (id.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/promotions/${encodeURIComponent(id)}`);
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== "object" || json === null) {
        setPromotion(null);
        return;
      }
      const rec = json as Record<string, unknown>;
      const p = rec["promotion"];
      const pids = rec["productIds"];
      if (typeof p !== "object" || p === null) {
        setPromotion(null);
        return;
      }
      const pr = p as Promotion;
      setPromotion(pr);
      setName(pr.name);
      setDescription(pr.description ?? "");
      setCode(pr.code ?? "");
      setDiscountType(
        pr.discount_type === "fixed" ? "fixed" : "percentage"
      );
      setDiscountValue(String(pr.discount_value));
      setStartLocal(toDatetimeLocalValue(pr.start_date));
      setEndLocal(toDatetimeLocalValue(pr.end_date));
      setMaxUses(pr.max_uses !== null ? String(pr.max_uses) : "");
      setActive(pr.active);
      const ids = new Set<string>();
      if (Array.isArray(pids)) {
        for (const x of pids) {
          if (typeof x === "string") {
            ids.add(x);
          }
        }
      }
      setSelectedProductIds(ids);
    } catch {
      setPromotion(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeProducts = useMemo(() => {
    return products.filter((p) => readDeletedAt(p) === null);
  }, [products]);

  const toggleProduct = (pid: string): void => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (id.length === 0) {
      return;
    }
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
      const updated = await updatePromotion(id, {
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
      if (updated === undefined) {
        setError("Could not save. Check inputs and try again.");
        return;
      }
      router.push("/promotions");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (id.length === 0) {
      return;
    }
    await deletePromotion(id);
    setShowDelete(false);
    router.push("/promotions");
  };

  if (loading) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8 flex justify-center">
          <Spinner size="lg" />
        </div>
      </NavbarSidebarLayout>
    );
  }

  if (promotion === null) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8">
          <p className="text-gray-600">Promotion not found.</p>
          <Link href="/promotions" className="text-blue-600 hover:underline">
            Back to list
          </Link>
        </div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6 flex flex-wrap justify-between gap-4">
          <div>
            <Link
              href="/promotions"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              ← Back to promotions
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              Edit promotion
            </h1>
          </div>
          <Button color="failure" type="button" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            {error !== null && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div>
              <Label htmlFor="ep-name">Name</Label>
              <TextInput
                id="ep-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ep-desc">Description</Label>
              <Textarea
                id="ep-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ep-code">Code (optional)</Label>
              <TextInput
                id="ep-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ep-dtype">Discount type</Label>
                <Select
                  id="ep-dtype"
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
                <Label htmlFor="ep-dval">Discount value</Label>
                <TextInput
                  id="ep-dval"
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
                <Label htmlFor="ep-start">Start (optional)</Label>
                <TextInput
                  id="ep-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ep-end">End (optional)</Label>
                <TextInput
                  id="ep-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ep-max">Max uses (optional)</Label>
              <TextInput
                id="ep-max"
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ep-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="ep-active" className="mb-0">
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
                {saving ? "Saving…" : "Save"}
              </Button>
              <Link href="/promotions">
                <Button color="gray" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        <ConfirmDeleteModal
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={() => void handleDelete()}
          title="Remove promotion?"
          message="This will soft-delete the promotion. It will no longer apply to new orders."
        />
      </div>
    </NavbarSidebarLayout>
  );
};

const EditPromotionPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <EditPromotionInner />
    </FullAdminContextBundle>
  );
};

export default EditPromotionPage;
