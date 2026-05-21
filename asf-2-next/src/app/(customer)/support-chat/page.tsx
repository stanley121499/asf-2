"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useAlertContext } from "@/context/AlertContext";
import { useTicketContext } from "@/context/TicketContext";
import {
  useConversationContext,
  type Conversation,
} from "@/context/ConversationContext";
import { LandingLayout } from "@/layouts";
import BottomNavbar from "@/components/home/bottom-nav";
import ChatWindow from "@/components/ChatWindow";
import { supabase } from "@/utils/supabaseClient";
import type { TablesInsert } from "@/database.types";

/**
 * Maps a ticket UUID to the short public label shown to customers (e.g. TK-A1B2C3D4).
 */
function formatTicketLabel(ticketId: string): string {
  const compact = ticketId.replace(/-/g, "");
  const slice = compact.slice(0, 8);
  return `TK-${slice.toUpperCase()}`;
}

/**
 * Prefer live context data (messages + realtime) once the conversation appears in state.
 */
function resolveConversationForChat(
  conversations: Conversation[],
  fallback: Conversation | null,
  conversationId: string | null
): Conversation | null {
  if (conversationId === null || conversationId.length === 0) {
    return null;
  }
  const fromContext = conversations.find((c) => c.id === conversationId);
  if (fromContext !== undefined) {
    return fromContext;
  }
  if (fallback !== null && fallback.id === conversationId) {
    return fallback;
  }
  return null;
}

export default function SupportChatPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { createTicket } = useTicketContext();
  const {
    conversations,
    createConversation,
    addParticipant,
    createMessage,
    listMessagesByConversationId,
  } = useConversationContext();

  const [formData, setFormData] = useState({
    type: "订单问题",
    subject: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [createdTicketLabel, setCreatedTicketLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Conversation snapshot right after create; superseded by `conversations` when synced. */
  const [localConversation, setLocalConversation] = useState<Conversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const displayConversation = useMemo(
    () => resolveConversationForChat(conversations, localConversation, activeConversationId),
    [conversations, localConversation, activeConversationId]
  );

  /**
   * Load historical messages once we know the conversation id (realtime handles new rows).
   */
  useEffect(() => {
    if (activeConversationId === null || activeConversationId.length === 0) {
      return;
    }
    void listMessagesByConversationId(activeConversationId);
  }, [activeConversationId, listMessagesByConversationId]);

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
          <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full min-h-0">
            <div className="shrink-0 text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
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
              <p className="text-[var(--color-muted)] text-sm mb-2">您可以在下方继续与客服对话</p>
              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="btn-primary rounded-xl px-6 py-2 text-sm"
              >
                返回设置
              </button>
            </div>
            {displayConversation !== null ? (
              <div className="flex-1 min-h-[320px] flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden">
                <ChatWindow
                  conversation={displayConversation}
                  messages={displayConversation.messages}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--color-muted)] text-sm">
                正在加载对话…
              </div>
            )}
          </div>
        </div>
        <BottomNavbar />
      </LandingLayout>
    );
  }

  /**
   * Persists the ticket via TicketContext, creates a support conversation linked by
   * `ticket_id`, adds the customer as participant, seeds the thread, then notifies.
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

      const conversation = await createConversation({
        type: "support",
        ticket_id: ticket.id,
        active: true,
        created_at: new Date().toISOString(),
      });

      if (conversation === undefined) {
        showAlert("工单已创建，但对话创建失败，请重试或稍后再试。", "warning");
        return;
      }

      const participant = await addParticipant({
        conversation_id: conversation.id,
        user_id: user.id,
      });

      if (participant === undefined) {
        showAlert("工单与对话已创建，但加入会话失败。", "warning");
      }

      const seedLines = [
        `主题：${subjectTrimmed}`,
        `类型：${formData.type}`,
        "",
        descriptionTrimmed,
      ];
      const seedBody = seedLines.join("\n");
      await createMessage({
        conversation_id: conversation.id,
        content: seedBody,
        created_at: new Date().toISOString(),
        user_id: user.id,
        type: "text",
        media_url: null,
      });

      setLocalConversation(conversation);
      setActiveConversationId(conversation.id);

      const body = `Your ticket #${label} has been received.`;
      const row: TablesInsert<"notifications"> = {
        user_id: user.id,
        type: "ticket_created",
        title: "Support Ticket Created",
        body,
      };
      const { error: notificationError } = await supabase.from("notifications").insert(row);
      if (notificationError !== null) {
        showAlert(`工单已创建，但通知发送失败：${notificationError.message}`, "warning");
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
