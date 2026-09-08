"use client";

import { NOTIFICATION_TEMPLATE_LOCALES } from "@/app/api/_lib/notificationTemplateVars";
import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Label, Select, Textarea, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

/** Supported campaign locales (same set as templates). */
type CampaignLocale = (typeof NOTIFICATION_TEMPLATE_LOCALES)[number];

/** Empty i18n map for all three locales. */
type I18nDraft = Record<CampaignLocale, string>;

/**
 * Builds an empty three-locale draft.
 */
function emptyI18n(): I18nDraft {
  return {
    en: "",
    "zh-CN": "",
    ms: "",
  };
}

/**
 * Admin compose + send-now UI for a promotional campaign.
 *
 * Flow: validate form → confirm dialog → POST draft → POST send → history.
 */
const NewCampaignInner: React.FC = function () {
  const router = useRouter();
  const [titleI18n, setTitleI18n] = useState<I18nDraft>(emptyI18n);
  const [bodyI18n, setBodyI18n] = useState<I18nDraft>(emptyI18n);
  const [defaultLocale, setDefaultLocale] = useState<CampaignLocale>("en");
  const [deepLink, setDeepLink] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const previewTitle = useMemo(() => {
    const t = titleI18n[defaultLocale].trim();
    if (t.length > 0) {
      return t;
    }
    return titleI18n.en.trim() || "(empty title)";
  }, [titleI18n, defaultLocale]);

  const previewBody = useMemo(() => {
    const b = bodyI18n[defaultLocale].trim();
    if (b.length > 0) {
      return b;
    }
    return bodyI18n.en.trim() || "(empty body)";
  }, [bodyI18n, defaultLocale]);

  /**
   * Client-side gate before opening the confirm dialog.
   */
  const validateDraft = useCallback((): string | null => {
    if (titleI18n[defaultLocale].trim().length === 0) {
      return `Title for default locale (${defaultLocale}) is required.`;
    }
    if (bodyI18n[defaultLocale].trim().length === 0) {
      return `Body for default locale (${defaultLocale}) is required.`;
    }
    return null;
  }, [titleI18n, bodyI18n, defaultLocale]);

  const handleOpenConfirm = useCallback((): void => {
    const err = validateDraft();
    if (err !== null) {
      setFormError(err);
      setConfirmOpen(false);
      return;
    }
    setFormError(null);
    setConfirmOpen(true);
  }, [validateDraft]);

  /**
   * Creates a draft then immediately sends to eligible customers.
   */
  const handleSend = useCallback(async (): Promise<void> => {
    const err = validateDraft();
    if (err !== null) {
      setFormError(err);
      setConfirmOpen(false);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setStatusMessage("Creating campaign…");

    try {
      const createRes = await fetch("/api/notifications/campaigns", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_i18n: {
            en: titleI18n.en,
            "zh-CN": titleI18n["zh-CN"],
            ms: titleI18n.ms,
          },
          body_i18n: {
            en: bodyI18n.en,
            "zh-CN": bodyI18n["zh-CN"],
            ms: bodyI18n.ms,
          },
          default_locale: defaultLocale,
          deep_link: deepLink.trim().length > 0 ? deepLink.trim() : null,
        }),
      });

      const createJson: unknown = await createRes.json().catch(() => null);
      if (createRes.status === 401) {
        setFormError("Unauthorized — cannot create campaign.");
        setConfirmOpen(false);
        return;
      }
      if (createRes.ok === false) {
        let msg = "Could not create campaign.";
        if (typeof createJson === "object" && createJson !== null) {
          const rec = createJson as Record<string, unknown>;
          if (typeof rec["message"] === "string") {
            msg = rec["message"];
          }
        }
        setFormError(msg);
        setConfirmOpen(false);
        return;
      }

      let campaignId: string | null = null;
      if (typeof createJson === "object" && createJson !== null) {
        const rec = createJson as Record<string, unknown>;
        const campaign = rec["campaign"];
        if (typeof campaign === "object" && campaign !== null) {
          const c = campaign as Record<string, unknown>;
          if (typeof c["id"] === "string") {
            campaignId = c["id"];
          }
        }
      }

      if (campaignId === null) {
        setFormError("Campaign created but id missing from response.");
        setConfirmOpen(false);
        return;
      }

      setStatusMessage("Sending to eligible customers…");

      const sendRes = await fetch(
        `/api/notifications/campaigns/${campaignId}/send`,
        {
          method: "POST",
          credentials: "same-origin",
        }
      );
      const sendJson: unknown = await sendRes.json().catch(() => null);

      if (sendRes.status === 401) {
        setFormError("Unauthorized — cannot send campaign.");
        setConfirmOpen(false);
        return;
      }
      if (sendRes.ok === false) {
        let msg = "Send failed.";
        if (typeof sendJson === "object" && sendJson !== null) {
          const rec = sendJson as Record<string, unknown>;
          if (typeof rec["message"] === "string") {
            msg = rec["message"];
          }
        }
        setFormError(msg);
        setConfirmOpen(false);
        return;
      }

      let recipientCount = 0;
      if (typeof sendJson === "object" && sendJson !== null) {
        const rec = sendJson as Record<string, unknown>;
        if (typeof rec["recipientCount"] === "number") {
          recipientCount = rec["recipientCount"];
        }
      }

      setStatusMessage(`Sent to ${recipientCount} recipient(s).`);
      setConfirmOpen(false);
      router.push("/notifications/campaigns");
    } catch {
      setFormError("Network error while creating or sending.");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
      setStatusMessage(null);
    }
  }, [
    validateDraft,
    titleI18n,
    bodyI18n,
    defaultLocale,
    deepLink,
    router,
  ]);

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              New promo campaign
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Write copy in en / zh-CN / ms, pick a default locale, optional deep
              link, then send now.
            </p>
          </div>
          <Link
            href="/notifications/campaigns"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Back to history
          </Link>
        </div>

        <Card className="space-y-6">
          {NOTIFICATION_TEMPLATE_LOCALES.map((locale) => (
            <div key={locale} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                {locale}
                {locale === defaultLocale ? " (default)" : ""}
              </h2>
              <div>
                <Label htmlFor={`title-${locale}`}>Title</Label>
                <TextInput
                  id={`title-${locale}`}
                  value={titleI18n[locale]}
                  onChange={(e) =>
                    setTitleI18n((prev) => ({
                      ...prev,
                      [locale]: e.target.value,
                    }))
                  }
                  className="mt-1"
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor={`body-${locale}`}>Body</Label>
                <Textarea
                  id={`body-${locale}`}
                  value={bodyI18n[locale]}
                  onChange={(e) =>
                    setBodyI18n((prev) => ({
                      ...prev,
                      [locale]: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1"
                  disabled={submitting}
                />
              </div>
            </div>
          ))}

          <div>
            <Label htmlFor="default-locale">Default locale</Label>
            <Select
              id="default-locale"
              value={defaultLocale}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "en" || value === "zh-CN" || value === "ms") {
                  setDefaultLocale(value);
                }
              }}
              className="mt-1"
              disabled={submitting}
            >
              {NOTIFICATION_TEMPLATE_LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {locale}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used when the customer has no preferred locale or that locale is
              empty (then falls back to en).
            </p>
          </div>

          <div>
            <Label htmlFor="deep-link">Deep link (optional)</Label>
            <TextInput
              id="deep-link"
              value={deepLink}
              onChange={(e) => setDeepLink(e.target.value)}
              placeholder="/(tabs)/browse or product:<uuid>"
              className="mt-1 font-mono"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Stored on the notification as metadata.deep_link for the Expo app
              to open on tap. Examples:{" "}
              <span className="font-mono">/(tabs)/browse</span>,{" "}
              <span className="font-mono">{"product:<uuid>"}</span>.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Preview ({defaultLocale})
            </p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">
              {previewTitle}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {previewBody}
            </p>
          </div>

          {formError !== null ? (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          ) : null}
          {statusMessage !== null ? (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {statusMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              color="blue"
              onClick={handleOpenConfirm}
              disabled={submitting}
            >
              Review &amp; send
            </Button>
            <Link
              href="/notifications/campaigns"
              className={`inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 ${
                submitting ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Cancel
            </Link>
          </div>
        </Card>

        {confirmOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-send-confirm-title"
          >
            <Card className="max-w-md w-full space-y-4">
              <h2
                id="campaign-send-confirm-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Send this campaign?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This sends to <strong>all customers with a customer-app push
                token</strong> who have promotions enabled (or no prefs row yet).
                Customers with promotions off are excluded. There is no undo.
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {previewTitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  color="failure"
                  onClick={() => void handleSend()}
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Confirm send"}
                </Button>
                <Button
                  color="light"
                  onClick={() => setConfirmOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </NavbarSidebarLayout>
  );
};

/**
 * Staff page: `/notifications/campaigns/new`.
 */
const NewNotificationCampaignPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <NewCampaignInner />
    </FullAdminContextBundle>
  );
};

export default NewNotificationCampaignPage;
