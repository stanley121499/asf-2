"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useAlertContext } from "@/context/AlertContext";
import { useTicketContext } from "@/context/TicketContext";
import { LandingLayout } from "@/layouts";
import BottomNavbar from "@/components/home/bottom-nav";
import { supabaseAnon } from "@/utils/supabaseClient";
import type { TablesInsert } from "@/database.types";

/**
 * Maps a ticket UUID to the short public label shown to customers (e.g. TK-A1B2C3D4).
 */
function formatTicketLabel(ticketId: string): string {
  const compact = ticketId.replace(/-/g, "");
  const slice = compact.slice(0, 8);
  return `TK-${slice.toUpperCase()}`;
}

export default function SupportChatPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { createTicket } = useTicketContext();

  const [formData, setFormData] = useState({
    type: "订单问题",
    subject: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [createdTicketLabel, setCreatedTicketLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
          <div className="flex items-center justify-center py-12">
            <div className="flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (submitted) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col pb-20">
          <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center justify-center border-b border-[var(--color-border)]">
            <h1 className="font-display text-lg tracking-wide">提交成功</h1>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">您的请求已提交</h2>
            {createdTicketLabel.length > 0 ? (
              <p className="text-[var(--color-text)] font-medium mb-2">
                工单编号：<span className="tracking-wide">{createdTicketLabel}</span>
              </p>
            ) : null}
            <p className="text-[var(--color-muted)] mb-8">我们将在24小时内与您联系</p>
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="btn-primary rounded-xl px-8 py-3 w-full max-w-xs"
            >
              返回设置
            </button>
          </div>
        </div>
      </LandingLayout>
    );
  }

  /**
   * Persists the ticket via TicketContext, then inserts a user notification using
   * the anon client so RLS applies. Ticket creation is treated as authoritative;
   * if the notification insert fails, we still show success but warn the user.
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const subjectTrimmed = formData.subject.trim();
    const descriptionTrimmed = formData.description.trim();
    if (subjectTrimmed.length === 0 || descriptionTrimmed.length === 0) {
      return;
    }
    if (user === null || typeof user.id !== "string" || user.id.length === 0) {
      showAlert("请先登录后再提交工单。", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket({
        user_id: user.id,
        type: formData.type,
        subject: subjectTrimmed,
        description: descriptionTrimmed,
        status: "open",
      });

      if (ticket === undefined) {
        return;
      }

      const label = formatTicketLabel(ticket.id);
      setCreatedTicketLabel(label);

      if (supabaseAnon === null) {
        showAlert(
          "工单已创建，但通知暂不可用（缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY）。",
          "warning"
        );
      } else {
        const body = `Your ticket #${label} has been received.`;
        const row: TablesInsert<"notifications"> = {
          user_id: user.id,
          type: "ticket_created",
          title: "Support Ticket Created",
          body,
        };
        const { error: notificationError } = await supabaseAnon.from("notifications").insert(row);
        if (notificationError !== null) {
          // Ticket already exists — surface notification failure without blocking success UX.
          showAlert(
            `工单已创建，但通知发送失败：${notificationError.message}`,
            "warning"
          );
        }
      }

      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    formData.subject.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    !isSubmitting;

  return (
    <LandingLayout>
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)] pb-24">
        <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0"
          >
            ← 返回
          </button>
          <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-12">联系客服</h1>
        </div>

        <div className="flex-1 flex flex-col items-center p-4 py-8">
          <div className="w-full max-w-md bg-[var(--color-panel)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
            <h2 className="font-display text-xl text-[var(--color-text)] mb-2">提交工单</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              请提供问题详情，以便我们更好地为您服务。
            </p>

            <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">问题类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-black appearance-none"
                  required
                >
                  <option value="订单问题">订单问题</option>
                  <option value="商品咨询">商品咨询</option>
                  <option value="账号问题">账号问题</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">主题</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="简要描述您的问题"
                  className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">描述</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请详细描述您的问题..."
                  className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-black resize-none"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full btn-primary rounded-xl py-3 text-sm font-medium disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmitting ? "提交中…" : "提交工单"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <BottomNavbar />
    </LandingLayout>
  );
}
