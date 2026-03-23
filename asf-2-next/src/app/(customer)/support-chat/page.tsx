"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import { LandingLayout } from "@/layouts";
import BottomNavbar from "@/components/home/bottom-nav";

export default function SupportChatPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  
  const [formData, setFormData] = useState({
    type: "订单问题",
    subject: "",
    description: ""
  });
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
          <div className="flex items-center justify-center py-12">
            <div className="flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
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
            <p className="text-[var(--color-muted)] mb-8">我们将在24小时内与您联系</p>
            <button 
              onClick={() => router.push('/settings')}
              className="btn-primary rounded-xl px-8 py-3 w-full max-w-xs"
            >
              返回设置
            </button>
          </div>
        </div>
      </LandingLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) return;
    setSubmitted(true);
  };

  return (
    <LandingLayout>
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)] pb-24">
        <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
          <button
            onClick={() => router.push('/settings')}
            className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0"
          >
            ← 返回
          </button>
          <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-12">
            联系客服
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center p-4 py-8">
          <div className="w-full max-w-md bg-[var(--color-panel)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
            <h2 className="font-display text-xl text-[var(--color-text)] mb-2">
              提交工单
            </h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              请提供问题详情，以便我们更好地为您服务。
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  问题类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  主题
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="简要描述您的问题"
                  className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  描述
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="请详细描述您的问题..."
                  className="w-full bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-black resize-none"
                  required
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={!formData.subject.trim() || !formData.description.trim()}
                  className="w-full btn-primary rounded-xl py-3 text-sm font-medium disabled:opacity-50 flex justify-center items-center"
                >
                  提交工单
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
