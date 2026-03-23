"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineQrcode, HiOutlineGift } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import BottomNavbar from "@/components/home/bottom-nav";

const RewardsClient: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const pointsAPI = usePointsMembership();

  const [userPoints, setUserPoints] = useState<number>(0);
  const [stamps, setStamps] = useState<boolean[]>(Array(9).fill(false));

  useEffect(() => {
    if (user?.id) {
      pointsAPI.getUserPointsByUserId(user.id).then((res) => {
        setUserPoints(res?.amount || 0);
      });
    }
  }, [user, pointsAPI]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("scratchCardProgress");
      if (saved) {
        setStamps(JSON.parse(saved));
      } else {
        const initial = Array(9).fill(false);
        setStamps(initial);
        localStorage.setItem("scratchCardProgress", JSON.stringify(initial));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleStampClick = (index: number) => {
    if (stamps[index]) return; // already stamped
    const newStamps = [...stamps];
    newStamps[index] = true;
    setStamps(newStamps);
    try {
      localStorage.setItem("scratchCardProgress", JSON.stringify(newStamps));
    } catch {
      // ignore
    }
  };

  const completedStamps = stamps.filter(Boolean).length;
  const remainingStamps = 9 - completedStamps;

  // Membership Tier Logic
  const goldThreshold = 1000;
  const silverThreshold = 500;
  
  let tierName = "铜牌会员";
  if (userPoints >= goldThreshold) tierName = "金牌会员";
  else if (userPoints >= silverThreshold) tierName = "银牌会员";

  const gapToGold = Math.max(0, goldThreshold - userPoints);
  const progressPercent = Math.min(100, (userPoints / goldThreshold) * 100);

  const mockSale = 450;
  const mockGoal = 1000;
  const goalPercent = Math.min(100, (mockSale / mockGoal) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
        <button onClick={() => router.push('/settings')} className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0">
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          返回
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-12">
          我的奖励
        </h1>
      </div>

      {/* Section 1 - Membership Card */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2417] rounded-3xl p-6 mx-4 mt-6 shadow-xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <h2 className="font-display text-xl text-[#d4af37] mb-6 relative z-10">{tierName}</h2>
        
        <div className="mb-8 relative z-10">
          <span className="text-4xl font-bold text-white tracking-tight">{userPoints.toLocaleString()}</span>
          <span className="text-white/70 text-sm ml-2">积分</span>
        </div>
        
        <div className="h-px bg-white/10 w-full mb-6 relative z-10" />
        
        <div className="flex justify-between items-end relative z-10">
          <div className="text-sm text-white/60 font-medium">
            {user?.email || "User"}
          </div>
          <div className="w-10 h-10 rounded-lg border border-white/20 flex flex-col items-center justify-center bg-white/5">
            <HiOutlineQrcode className="text-white/80 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section 2 - Tier Progress */}
      <div className="card-panel mx-4 mt-6 p-5">
        <h3 className="text-sm font-medium text-[var(--color-accent)] mb-4">
          {gapToGold > 0 ? `距离金牌会员还差 ${gapToGold} 积分` : "您已是最高等级的金牌会员"}
        </h3>
        
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-[var(--color-muted)] font-medium px-1">
          <span>铜牌 (0)</span>
          <span>银牌 (500)</span>
          <span>金牌 (1000)</span>
        </div>
      </div>

      {/* Section 3 - Stamp Card */}
      <div className="card-panel mx-4 mt-6 p-5">
        <h3 className="font-display text-lg text-[var(--color-text)] mb-5">每日集章</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stamps.map((isStamped, idx) => {
            const isGift = idx === 2 || idx === 5 || idx === 8;
            const isNext = !isStamped && (idx === 0 || stamps[idx - 1]);
            
            return (
              <button
                key={idx}
                onClick={() => isNext ? handleStampClick(idx) : null}
                disabled={!isNext && !isStamped}
                className={`
                  aspect-square rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isStamped ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-white border-gray-100 shadow-sm'}
                  ${isNext ? 'ring-4 ring-[var(--color-accent)] ring-opacity-20 border-[var(--color-accent)] animate-pulse' : ''}
                `}
              >
                {isStamped ? (
                  <span className="text-white text-xl font-bold">✓</span>
                ) : isGift ? (
                  <HiOutlineGift className={`w-6 h-6 ${isNext ? 'text-[var(--color-accent)]' : 'text-gray-300'}`} />
                ) : (
                  <span className={`text-lg font-medium ${isNext ? 'text-[var(--color-accent)]' : 'text-gray-300'}`}>
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="text-center text-sm font-medium text-[var(--color-text)] bg-gray-50 py-3 rounded-xl border border-gray-100">
          已集 {completedStamps}/9 枚 · <span className="text-[var(--color-accent)]">{remainingStamps > 0 ? `${remainingStamps} 枚可获奖励` : '已获得所有奖励！'}</span>
        </div>
      </div>

      {/* Section 4 - Annual Goal */}
      <div className="card-panel mx-4 mt-6 p-5">
        <h3 className="font-display text-lg text-[var(--color-text)] mb-4">年度目标</h3>
        <p className="text-sm text-[var(--color-text)] mb-3 font-medium">已消费 RM{mockSale} / 目标 RM{mockGoal}</p>
        
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-[var(--color-text)] rounded-full"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
        
        <p className="text-sm font-medium text-[var(--color-accent)] bg-orange-50 inline-block px-3 py-1.5 rounded-lg border border-orange-100">
          达成后享八折优惠！
        </p>
      </div>

      {/* Section 5 - Points History */}
      <div className="card-panel mx-4 mt-6 p-5">
        <h3 className="font-display text-lg text-[var(--color-text)] mb-5">积分记录</h3>
        
        <div className="space-y-4">
          {[
            { id: 1, points: "+20", desc: "订单 #8821", date: "3天前", positive: true },
            { id: 2, points: "+50", desc: "注册奖励", date: "7天前", positive: true },
            { id: 3, points: "-30", desc: "兑换折扣", date: "10天前", positive: false },
            { id: 4, points: "+15", desc: "订单 #8742", date: "14天前", positive: true },
            { id: 5, points: "+20", desc: "订单 #8633", date: "18天前", positive: true },
          ].map((row) => (
            <div key={row.id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-12 ${row.positive ? 'text-green-600' : 'text-red-500'}`}>
                  {row.points}
                </span>
                <span className="text-sm text-[var(--color-text)] font-medium">{row.desc}</span>
              </div>
              <span className="text-xs text-[var(--color-muted)]">{row.date}</span>
            </div>
          ))}
        </div>
        
        <button className="w-full text-center text-xs text-[var(--color-muted)] mt-4 pt-4 border-t border-gray-50">
          查看全部
        </button>
      </div>

      {/* Section 6 - How to Earn More */}
      <div className="card-panel mx-4 mt-6 mb-8 p-5">
        <h3 className="font-display text-lg text-[var(--color-text)] mb-5">如何获取更多积分</h3>
        
        <div className="space-y-4 text-sm font-medium text-[var(--color-text)]">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-xl">🛍</span>
            <span className="flex-1">每消费 RM1</span>
            <span className="text-[var(--color-accent)]">+1 积分</span>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 opacity-60">
            <span className="text-xl">✍️</span>
            <span className="flex-1">撰写商品评价</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">即将推出</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 opacity-60">
            <span className="text-xl">👥</span>
            <span className="flex-1">邀请朋友注册</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">即将推出</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default RewardsClient;
