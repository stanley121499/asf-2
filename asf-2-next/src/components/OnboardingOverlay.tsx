"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const OnboardingOverlay: React.FC = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const done = localStorage.getItem("onboarding_v1_done");
    if (!done) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("onboarding_v1_done", "1");
    setIsVisible(false);
  };

  const handleAuth = () => {
    handleClose();
    router.push("/authentication/sign-in");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A] text-white px-6 py-10 transition-opacity duration-300">
      
      {step < 3 && (
        <button 
          onClick={handleClose}
          className="absolute top-safe-area right-6 top-6 text-sm text-[var(--color-muted)] hover:text-white"
        >
          跳过
        </button>
      )}

      {step === 1 && (
        <div className="flex flex-col items-center justify-between h-full w-full py-12">
          <div className="flex flex-col items-center mt-32">
            <h1 className="font-display text-5xl tracking-widest mb-4">SYSTEM</h1>
            <p className="text-gray-300">优选品质，触手可及</p>
          </div>
          
          <div className="w-full flex flex-col items-center gap-6 mt-auto">
            <span className="text-sm text-[var(--color-muted)]">第 1 步 / 共 3 步</span>
            <button 
              onClick={() => setStep(2)}
              className="w-full h-[56px] rounded-full bg-white text-black font-medium text-lg flex items-center justify-center"
            >
              开始体验 →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center justify-between h-full w-full py-12">
          <div className="flex flex-col items-center text-center mt-20 px-4">
            <div className="flex gap-6 mb-8">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">🥉</span>
                <span className="text-xs text-orange-300">铜牌</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">🥈</span>
                <span className="text-xs text-gray-300">银牌</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">🥇</span>
                <span className="text-xs text-yellow-500">金牌</span>
              </div>
            </div>
            
            <h2 className="font-display text-2xl mb-4">每次购物，积分回馈</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              消费即积分，积分兑换专属奖励。<br/>等级越高，福利越多。
            </p>
          </div>
          
          <div className="w-full flex flex-col items-center gap-6 mt-auto">
            <span className="text-sm text-[var(--color-muted)]">第 2 步 / 共 3 步</span>
            <button 
              onClick={() => setStep(3)}
              className="w-full h-[56px] rounded-full bg-white text-black font-medium text-lg flex items-center justify-center"
            >
              下一步 →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-between h-full w-full py-12">
          <div className="flex flex-col items-center text-center mt-32">
            <h2 className="font-display text-3xl mb-4">开始您的购物旅程</h2>
            <p className="text-gray-400 text-sm px-6">
              登录后可保存收藏、追踪订单并获取积分
            </p>
          </div>
          
          <div className="w-full flex flex-col items-center gap-4 mt-auto">
            <button 
              onClick={handleAuth}
              className="w-full h-[56px] rounded-full bg-white text-black font-medium text-lg flex items-center justify-center"
            >
              登录 / 注册
            </button>
            <button 
              onClick={handleClose}
              className="w-full h-[56px] rounded-full border border-white text-white font-medium text-lg flex items-center justify-center"
            >
              游客浏览
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingOverlay;
