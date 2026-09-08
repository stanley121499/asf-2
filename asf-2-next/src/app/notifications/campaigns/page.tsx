"use client";

import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Table } from "flowbite-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

/** Campaign row shape returned by GET /api/notifications/campaigns. */
type CampaignListItem = {
  id: string;
  title_i18n: Record<string, string>;
  body_i18n: Record<string, string>;
  default_locale: string;
  deep_link: string | null;
  status: string;
  created_by: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  error_summary: string | null;
  created_at: string;
};

/**
 * Picks a display title from campaign i18n using default_locale then en.
 *
 * @param titleI18n - Locale map
 * @param defaultLocale - Campaign default
 * @returns Non-empty title or a placeholder
 */
function displayTitle(
  titleI18n: Record<string, string>,
  defaultLocale: string
): string {
  const preferred = titleI18n[defaultLocale];
  if (typeof preferred === "string" && preferred.trim().length > 0) {
    return preferred.trim();
  }
  const en = titleI18n["en"];
  if (typeof en === "string" && en.trim().length > 0) {
    return en.trim();
  }
  for (const value of Object.values(titleI18n)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "(untitled)";
}

/**
 * Formats an ISO timestamp for the history table.
 *
 * @param iso - ISO string or null
 */
function formatWhen(iso: string | null): string {
  if (iso === null || iso.length === 0) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

/**
 * Parses the campaigns list API payload into typed rows.
 *
 * @param json - Raw JSON body
 * @returns Campaign rows (empty when shape is unexpected)
 */
function parseCampaignsPayload(json: unknown): CampaignListItem[] {
  if (typeof json !== "object" || json === null) {
    return [];
  }
  const rec = json as Record<string, unknown>;
  const list = rec["campaigns"];
  if (Array.isArray(list) === false) {
    return [];
  }
  const rows: CampaignListItem[] = [];
  for (const item of list) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row["id"] !== "string" ||
      typeof row["default_locale"] !== "string" ||
      typeof row["status"] !== "string" ||
      typeof row["created_at"] !== "string"
    ) {
      continue;
    }

    const titleRaw = row["title_i18n"];
    const titleI18n: Record<string, string> = {};
    if (typeof titleRaw === "object" && titleRaw !== null && Array.isArray(titleRaw) === false) {
      for (const [k, v] of Object.entries(titleRaw as Record<string, unknown>)) {
        if (typeof v === "string") {
          titleI18n[k] = v;
        }
      }
    }

    const deepLinkRaw = row["deep_link"];
    const sentAtRaw = row["sent_at"];
    const createdByRaw = row["created_by"];
    const recipientRaw = row["recipient_count"];
    const errorRaw = row["error_summary"];

    rows.push({
      id: row["id"],
      title_i18n: titleI18n,
      body_i18n: {},
      default_locale: row["default_locale"],
      deep_link: typeof deepLinkRaw === "string" ? deepLinkRaw : null,
      status: row["status"],
      created_by: typeof createdByRaw === "string" ? createdByRaw : null,
      sent_at: typeof sentAtRaw === "string" ? sentAtRaw : null,
      recipient_count:
        typeof recipientRaw === "number" && Number.isFinite(recipientRaw)
          ? recipientRaw
          : null,
      error_summary: typeof errorRaw === "string" ? errorRaw : null,
      created_at: row["created_at"],
    });
  }
  return rows;
}

/**
 * Status badge styling for campaign history.
 *
 * @param status - Campaign status string
 */
function statusClass(status: string): string {
  switch (status) {
    case "sent":
      return "text-green-700 dark:text-green-400";
    case "sending":
      return "text-blue-700 dark:text-blue-400";
    case "failed":
      return "text-red-700 dark:text-red-400";
    case "draft":
      return "text-gray-600 dark:text-gray-400";
    default:
      return "text-gray-700 dark:text-gray-300";
  }
}

/**
 * Admin history list for promotional push campaigns.
 */
const CampaignsHistoryInner: React.FC = function () {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/notifications/campaigns", {
        method: "GET",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setLoadError("Unauthorized — sign in as staff to view campaigns.");
        setCampaigns([]);
        return;
      }
      if (res.ok === false) {
        setLoadError("Failed to load campaigns.");
        setCampaigns([]);
        return;
      }
      const json: unknown = await res.json();
      setCampaigns(parseCampaignsPayload(json));
    } catch {
      setLoadError("Network error loading campaigns.");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  if (loading) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8">Loading campaigns…</div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Promo campaigns
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Compose and send promotional push/inbox messages to customers with
              push tokens and promotions enabled.
            </p>
          </div>
          <Link
            href="/notifications/campaigns/new"
            className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            New campaign
          </Link>
        </div>

        {loadError !== null ? (
          <Card>
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
            <Button
              color="light"
              className="mt-3"
              onClick={() => void loadCampaigns()}
            >
              Retry
            </Button>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <p className="text-gray-600 dark:text-gray-400">
              No campaigns yet. Create one to send a promo blast.
            </p>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell>Title</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Recipients</Table.HeadCell>
                <Table.HeadCell>Sent</Table.HeadCell>
                <Table.HeadCell>Created</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {campaigns.map((c) => (
                  <Table.Row
                    key={c.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="max-w-xs">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {displayTitle(c.title_i18n, c.default_locale)}
                      </p>
                      {c.deep_link !== null ? (
                        <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
                          {c.deep_link}
                        </p>
                      ) : null}
                      {c.error_summary !== null ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 line-clamp-2">
                          {c.error_summary}
                        </p>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`font-medium capitalize ${statusClass(c.status)}`}>
                        {c.status}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {c.recipient_count !== null ? c.recipient_count : "—"}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm">
                      {formatWhen(c.sent_at)}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm">
                      {formatWhen(c.created_at)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>
        )}
      </div>
    </NavbarSidebarLayout>
  );
};

/**
 * Staff page: `/notifications/campaigns`.
 */
const NotificationCampaignsPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <CampaignsHistoryInner />
    </FullAdminContextBundle>
  );
};

export default NotificationCampaignsPage;
