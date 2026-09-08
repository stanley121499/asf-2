"use client";

import {
  ALLOWED_TEMPLATE_VARS,
  interpolateTemplate,
  NOTIFICATION_TEMPLATE_LOCALES,
  SAMPLE_TEMPLATE_VARS,
  TEMPLATE_TYPE_LABELS,
  TRANSACTIONAL_TEMPLATE_TYPES,
  type NotificationTemplateLocale,
  type TransactionalTemplateType,
} from "@/app/api/_lib/notificationTemplateVars";
import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Label, Textarea, TextInput } from "flowbite-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HiChevronDown, HiChevronRight } from "react-icons/hi";

/** One locale's editable title/body fields. */
type LocaleFields = {
  title_template: string;
  body_template: string;
};

/** Draft state for one notification type across three locales. */
type TypeDraft = Record<NotificationTemplateLocale, LocaleFields>;

/** Template row shape returned by GET /api/notifications/templates. */
type TemplateApiRow = {
  id: string;
  type: string;
  locale: string;
  title_template: string;
  body_template: string;
  updated_at: string;
  updated_by: string | null;
};

/**
 * Builds an empty draft for all three locales.
 */
function emptyDraft(): TypeDraft {
  return {
    en: { title_template: "", body_template: "" },
    "zh-CN": { title_template: "", body_template: "" },
    ms: { title_template: "", body_template: "" },
  };
}

/**
 * Groups flat template rows into per-type drafts.
 *
 * @param rows - Rows from the list API
 * @returns Map of type → locale fields
 */
function draftsFromRows(rows: TemplateApiRow[]): Record<string, TypeDraft> {
  const next: Record<string, TypeDraft> = {};
  for (const type of TRANSACTIONAL_TEMPLATE_TYPES) {
    next[type] = emptyDraft();
  }
  for (const row of rows) {
    if (
      (NOTIFICATION_TEMPLATE_LOCALES as readonly string[]).includes(row.locale) ===
      false
    ) {
      continue;
    }
    const locale = row.locale as NotificationTemplateLocale;
    const existing = next[row.type];
    const draft = existing !== undefined ? existing : emptyDraft();
    draft[locale] = {
      title_template: row.title_template,
      body_template: row.body_template,
    };
    next[row.type] = draft;
  }
  return next;
}

/**
 * Editor panel for a single transactional notification type.
 */
function TemplateTypePanel({
  type,
  draft,
  expanded,
  onToggle,
  onChange,
  onSave,
  saving,
  message,
}: Readonly<{
  type: TransactionalTemplateType;
  draft: TypeDraft;
  expanded: boolean;
  onToggle: () => void;
  onChange: (
    locale: NotificationTemplateLocale,
    field: keyof LocaleFields,
    value: string
  ) => void;
  onSave: () => void;
  saving: boolean;
  message: string | null;
}>): React.ReactElement {
  const allowed = ALLOWED_TEMPLATE_VARS[type];
  const samples = SAMPLE_TEMPLATE_VARS[type];
  const previewLocale: NotificationTemplateLocale = "en";
  const previewTitle = interpolateTemplate(
    draft[previewLocale].title_template,
    samples
  );
  const previewBody = interpolateTemplate(
    draft[previewLocale].body_template,
    samples
  );

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {TEMPLATE_TYPE_LABELS[type]}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {type}
          </p>
        </div>
        {expanded ? (
          <HiChevronDown className="h-5 w-5 shrink-0 text-gray-500" />
        ) : (
          <HiChevronRight className="h-5 w-5 shrink-0 text-gray-500" />
        )}
      </button>

      {expanded ? (
        <div className="mt-4 space-y-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              Allowed variables
            </p>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {allowed.length === 0
                ? "None — do not use {{placeholders}} in this template."
                : allowed.map((name) => `{{${name}}}`).join(" · ")}
            </p>
          </div>

          {NOTIFICATION_TEMPLATE_LOCALES.map((locale) => (
            <div key={locale} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                {locale}
              </h3>
              <div>
                <Label htmlFor={`${type}-${locale}-title`}>Title</Label>
                <TextInput
                  id={`${type}-${locale}-title`}
                  value={draft[locale].title_template}
                  onChange={(e) =>
                    onChange(locale, "title_template", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${type}-${locale}-body`}>Body</Label>
                <Textarea
                  id={`${type}-${locale}-body`}
                  value={draft[locale].body_template}
                  onChange={(e) =>
                    onChange(locale, "body_template", e.target.value)
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Preview (en, sample vars)
            </p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">
              {previewTitle.length > 0 ? previewTitle : "(empty title)"}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {previewBody.length > 0 ? previewBody : "(empty body)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button color="blue" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {message !== null ? (
              <p
                className={`text-sm ${
                  message.startsWith("Saved")
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/**
 * Admin UI to list and edit transactional notification templates (3 locales).
 */
const NotificationTemplatesInner: React.FC = function () {
  const [drafts, setDrafts] = useState<Record<string, TypeDraft>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedType, setExpandedType] =
    useState<TransactionalTemplateType | null>(null);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string | null>>({});

  const loadTemplates = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/notifications/templates", {
        method: "GET",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setLoadError("Unauthorized — sign in as staff to manage templates.");
        setDrafts({});
        return;
      }
      if (res.ok === false) {
        setLoadError("Failed to load notification templates.");
        setDrafts({});
        return;
      }
      const json: unknown = await res.json();
      if (typeof json !== "object" || json === null) {
        setLoadError("Invalid response from templates API.");
        setDrafts({});
        return;
      }
      const rec = json as Record<string, unknown>;
      const list = rec["templates"];
      if (Array.isArray(list) === false) {
        setLoadError("Invalid templates payload.");
        setDrafts({});
        return;
      }
      const rows: TemplateApiRow[] = [];
      for (const item of list) {
        if (typeof item !== "object" || item === null) {
          continue;
        }
        const row = item as Record<string, unknown>;
        if (
          typeof row["id"] !== "string" ||
          typeof row["type"] !== "string" ||
          typeof row["locale"] !== "string" ||
          typeof row["title_template"] !== "string" ||
          typeof row["body_template"] !== "string" ||
          typeof row["updated_at"] !== "string"
        ) {
          continue;
        }
        const updatedBy = row["updated_by"];
        rows.push({
          id: row["id"],
          type: row["type"],
          locale: row["locale"],
          title_template: row["title_template"],
          body_template: row["body_template"],
          updated_at: row["updated_at"],
          updated_by: typeof updatedBy === "string" ? updatedBy : null,
        });
      }
      setDrafts(draftsFromRows(rows));
    } catch {
      setLoadError("Network error loading templates.");
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const types = useMemo(() => [...TRANSACTIONAL_TEMPLATE_TYPES], []);

  const handleFieldChange = useCallback(
    (
      type: TransactionalTemplateType,
      locale: NotificationTemplateLocale,
      field: keyof LocaleFields,
      value: string
    ): void => {
      setDrafts((prev) => {
        const current = prev[type] ?? emptyDraft();
        return {
          ...prev,
          [type]: {
            ...current,
            [locale]: {
              ...current[locale],
              [field]: value,
            },
          },
        };
      });
      setMessages((prev) => ({ ...prev, [type]: null }));
    },
    []
  );

  const handleSave = useCallback(
    async (type: TransactionalTemplateType): Promise<void> => {
      const draft = drafts[type];
      if (draft === undefined) {
        return;
      }
      setSavingType(type);
      setMessages((prev) => ({ ...prev, [type]: null }));
      try {
        const res = await fetch("/api/notifications/templates", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            locales: {
              en: draft.en,
              "zh-CN": draft["zh-CN"],
              ms: draft.ms,
            },
          }),
        });
        const json: unknown = await res.json().catch(() => null);
        if (res.status === 401) {
          setMessages((prev) => ({
            ...prev,
            [type]: "Unauthorized — cannot save.",
          }));
          return;
        }
        if (res.ok === false) {
          let errMsg = "Save failed.";
          if (typeof json === "object" && json !== null) {
            const rec = json as Record<string, unknown>;
            if (typeof rec["message"] === "string") {
              errMsg = rec["message"];
            } else if (typeof rec["error"] === "string") {
              errMsg = rec["error"];
            }
          }
          setMessages((prev) => ({ ...prev, [type]: errMsg }));
          return;
        }
        setMessages((prev) => ({
          ...prev,
          [type]: "Saved. Reload confirmed from server.",
        }));
        await loadTemplates();
      } catch {
        setMessages((prev) => ({
          ...prev,
          [type]: "Network error while saving.",
        }));
      } finally {
        setSavingType(null);
      }
    },
    [drafts, loadTemplates]
  );

  if (loading) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8">Loading notification templates…</div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification templates
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Edit transactional push/inbox copy for en, zh-CN, and ms. Only
            whitelisted {"{{variables}}"} are allowed per type.
          </p>
        </div>

        {loadError !== null ? (
          <Card>
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
            <Button color="light" className="mt-3" onClick={() => void loadTemplates()}>
              Retry
            </Button>
          </Card>
        ) : (
          types.map((type) => {
            const draft = drafts[type] ?? emptyDraft();
            return (
              <TemplateTypePanel
                key={type}
                type={type}
                draft={draft}
                expanded={expandedType === type}
                onToggle={() =>
                  setExpandedType((prev) => (prev === type ? null : type))
                }
                onChange={(locale, field, value) =>
                  handleFieldChange(type, locale, field, value)
                }
                onSave={() => void handleSave(type)}
                saving={savingType === type}
                message={messages[type] ?? null}
              />
            );
          })
        )}
      </div>
    </NavbarSidebarLayout>
  );
};

/**
 * Staff page: `/notifications/templates`.
 */
const NotificationTemplatesPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <NotificationTemplatesInner />
    </FullAdminContextBundle>
  );
};

export default NotificationTemplatesPage;
