"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Label, TextInput } from "flowbite-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

/** Shape returned by GET/PATCH /api/rewards/settings. */
type RewardsSettingsResponse = {
  content_view_points: number;
};

/**
 * Type guard for rewards settings API JSON.
 */
function isRewardsSettingsResponse(value: unknown): value is RewardsSettingsResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("content_view_points" in value)) {
    return false;
  }
  const points = Reflect.get(value, "content_view_points");
  return typeof points === "number" && Number.isFinite(points);
}

/**
 * Parses a non-negative integer from a number input string.
 *
 * @param raw - Raw input value
 * @returns Integer ≥ 0, or null when invalid
 */
function parseNonNegativeInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || String(parsed) !== trimmed) {
    return null;
  }
  return parsed;
}

/**
 * Admin Rewards settings — edit discovery `content_view_points`.
 * Gated by authenticated staff session + `rewards` feature flag.
 */
const RewardsSettingsInner: React.FC = function () {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();

  const [pointsInput, setPointsInput] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || flagsLoading) {
      return;
    }
    if (user === null) {
      router.replace("/authentication/sign-in");
      return;
    }
    if (!isEnabled("rewards")) {
      router.replace("/dashboard");
    }
  }, [authLoading, flagsLoading, isEnabled, router, user]);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rewards/settings", {
        method: "GET",
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized — sign in as staff to edit rewards settings.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load rewards settings.");
        return;
      }
      const body: unknown = await res.json();
      if (!isRewardsSettingsResponse(body)) {
        setError("Unexpected settings response.");
        return;
      }
      setPointsInput(String(body.content_view_points));
    } catch (err) {
      console.error("Rewards settings load", err);
      setError("Failed to load rewards settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || flagsLoading || user === null || !isEnabled("rewards")) {
      return;
    }
    void loadSettings();
  }, [authLoading, flagsLoading, isEnabled, loadSettings, user]);

  const handleSave = useCallback(async (): Promise<void> => {
    setMessage(null);
    setError(null);
    const parsed = parseNonNegativeInt(pointsInput);
    if (parsed === null) {
      setError("Enter a whole number ≥ 0 for content view points.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/rewards/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_view_points: parsed }),
      });
      if (res.status === 401) {
        setError("Unauthorized — sign in as staff to save.");
        return;
      }
      if (!res.ok) {
        setError("Failed to save rewards settings.");
        return;
      }
      const body: unknown = await res.json();
      if (isRewardsSettingsResponse(body)) {
        setPointsInput(String(body.content_view_points));
      }
      setMessage(
        "Rewards settings saved. New amount applies to future content views only."
      );
    } catch (err) {
      console.error("Rewards settings save", err);
      setError("Failed to save rewards settings.");
    } finally {
      setSaving(false);
    }
  }, [pointsInput]);

  if (authLoading || flagsLoading || user === null || !isEnabled("rewards")) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8">Loading rewards settings…</div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rewards Settings
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            积分设置 — points awarded the first time a logged-in customer opens a
            product, post, or promo linked-products surface.
          </p>
        </div>

        <Card>
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading…
            </p>
          ) : (
            <>
              <div className="mb-4 max-w-xs">
                <Label htmlFor="content-view-points">
                  Content view points
                </Label>
                <TextInput
                  id="content-view-points"
                  type="number"
                  min={0}
                  step={1}
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Integer ≥ 0. Default is 1. Changing this does not alter past
                  awards.
                </p>
              </div>

              <Button
                color="blue"
                onClick={() => void handleSave()}
                disabled={saving || loading}
              >
                {saving ? "Saving…" : "Save"}
              </Button>

              {message !== null && (
                <p className="mt-3 text-sm text-green-700 dark:text-green-400">
                  {message}
                </p>
              )}
              {error !== null && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

const RewardsSettingsPage: React.FC = function () {
  return <RewardsSettingsInner />;
};

export default RewardsSettingsPage;
