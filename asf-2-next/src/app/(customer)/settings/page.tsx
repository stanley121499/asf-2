"use client";
import React, { useState, useEffect, useMemo } from "react";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineStar,
  HiOutlineUser,
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { FaUserCircle } from "react-icons/fa";
import { useAuthContext } from "@/context/AuthContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { claimPolicyConfig } from "@/modules/claims/claimPolicyConfig";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const ProfileSettingsPage: React.FC = () => {
  const router = useRouter();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (section: string): void => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const [userPoints, setUserPoints] = useState<number>(0);
  const { user, user_detail, signOut, loading } = useAuthContext();
  const pointsAPI = usePointsMembership();
  const { isEnabled } = useFeatureFlags();
  const claimsEnabled = isEnabled("claims");
  
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserPoints = async () => {
      if (user?.id) {
        try {
          const pointsRecord = await pointsAPI.getUserPointsByUserId(user.id);
          setUserPoints(pointsRecord?.amount || 0);
        } catch {
          setUserPoints(0);
        }
      }
    };
    fetchUserPoints();
  }, [user, pointsAPI]);

  useEffect(() => {
    const meta: Record<string, unknown> = (user?.user_metadata as Record<string, unknown>) || {};
    const metaPhone: string = isNonEmptyString(meta["phone"]) ? String(meta["phone"]) : "";
    if (!isNonEmptyString(phone) && isNonEmptyString(metaPhone)) {
      setPhone(metaPhone);
    }
    if (!isNonEmptyString(firstName) && isNonEmptyString(user_detail?.first_name)) {
      setFirstName(String(user_detail?.first_name));
    }
    if (!isNonEmptyString(lastName) && isNonEmptyString(user_detail?.last_name)) {
      setLastName(String(user_detail?.last_name));
    }
  }, [user?.id, user_detail?.first_name, user_detail?.last_name]); 

  const displayName = useMemo(() => {
    const joined = `${firstName} ${lastName}`.trim();
    return joined.length > 0 ? joined : (user?.email || "用户");
  }, [firstName, lastName, user?.email]);

  const handleLogout = async (): Promise<void> => {
    await signOut();
    router.push("/");
  };

  const handleSaveProfile = async (): Promise<void> => {
    if (!user?.id) return;
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName)) return;
    setSaving(true);
    try {
      const fullDisplayName = `${firstName} ${lastName}`.trim();
      const { error: detailErr } = await supabase
        .from("user_details")
        .update({ first_name: firstName, last_name: lastName })
        .eq("id", user.id)
        .single();
      if (detailErr) {
        setSaving(false);
        return;
      }
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          display_name: fullDisplayName,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      });
      if (authErr) {
        setSaving(false);
        return;
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] pb-24 flex flex-col">
        <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center justify-center border-b border-[var(--color-border)]">
          <h1 className="font-display text-lg tracking-wide">个人中心</h1>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <FaUserCircle className="w-24 h-24 text-gray-200 mb-6" />
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">登录以查看个人资料</h2>
          <p className="text-sm text-[var(--color-muted)] mb-8">管理账户、查看订单并享受会员特权</p>
          
          <Link
            href="/authentication/sign-in?returnTo=%2Fsettings"
            className="w-full btn-primary rounded-xl py-3 max-w-sm mb-4 flex items-center justify-center"
          >
            登录 / 注册
          </Link>
          
          {/* Guest escape — cannot leave user stuck */}
          <button
            onClick={() => router.push("/")}
            className="w-full max-w-sm h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center"
          >
            先逛逛，暂不登录
          </button>
        </div>
        
        <BottomNavbar />
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <NavbarHome />
      
      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center justify-center border-b border-[var(--color-border)]">
        <h1 className="font-display text-lg tracking-wide">
          个人中心
        </h1>
      </div>

      <div className="px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center shadow-sm mb-6 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-4 border border-[var(--color-border)]">
            {user_detail?.profile_image ? (
              <Image src={user_detail.profile_image} alt="Avatar" width={80} height={80} className="object-cover" />
            ) : (
              <FaUserCircle className="w-12 h-12 text-gray-300" />
            )}
          </div>
          <h2 className="text-xl font-display text-[var(--color-text)]">{displayName}</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">{user?.email}</p>
          
          <div className="mt-4 bg-[var(--color-panel)] border border-[var(--color-border)] px-4 py-1.5 rounded-full flex items-center gap-2">
            <HiOutlineStar className="text-[var(--color-accent)] w-4 h-4" />
            <span className="text-sm font-medium">积分: {userPoints.toLocaleString()}</span>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm mb-8">
          <Link href="/order-details" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-[var(--color-border)]">
            <HiOutlineShoppingBag className="w-5 h-5 text-[var(--color-text)] opacity-70" />
            <span className="flex-1 text-sm font-medium text-[var(--color-text)]">我的订单</span>
            <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
          </Link>
          
          <Link href="/wishlist" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-[var(--color-border)]">
            <HiOutlineHeart className="w-5 h-5 text-[var(--color-text)] opacity-70" />
            <span className="flex-1 text-sm font-medium text-[var(--color-text)]">我的收藏</span>
            <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
          </Link>
          
          <Link href="/rewards" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-[var(--color-border)]">
            <HiOutlineStar className="w-5 h-5 text-[var(--color-text)] opacity-70" />
            <span className="flex-1 text-sm font-medium text-[var(--color-text)]">我的奖励</span>
            <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
          </Link>

          {claimsEnabled ? (
            <Link href="/my-claims" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-[var(--color-border)]">
              <HiOutlineQuestionMarkCircle className="w-5 h-5 text-[var(--color-text)] opacity-70" />
              <span className="flex-1 text-sm font-medium text-[var(--color-text)]">{claimPolicyConfig.moduleLabel}</span>
              <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
            </Link>
          ) : null}

          {claimsEnabled ? (
            <Link href="/my-account/warranty-credits" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-[var(--color-border)]">
              <HiOutlineStar className="w-5 h-5 text-[var(--color-text)] opacity-70" />
              <span className="flex-1 text-sm font-medium text-[var(--color-text)]">保固抵扣</span>
              <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
            </Link>
          ) : null}
          
          <div>
            <button 
              onClick={() => toggleSection("account")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-[var(--color-border)]"
            >
              <HiOutlineUser className="w-5 h-5 text-[var(--color-text)] opacity-70" />
              <span className="flex-1 text-left text-sm font-medium text-[var(--color-text)]">账户设置</span>
              {openSection === "account" ? (
                <HiOutlineChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
              ) : (
                <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
              )}
            </button>
            {openSection === "account" && (
              <div className="px-5 py-4 bg-gray-50 space-y-4 border-b border-[var(--color-border)]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--color-muted)] mb-1">名</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-muted)] mb-1">姓</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-muted)] mb-1">联系电话</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black" />
                </div>
                <button onClick={handleSaveProfile} disabled={saving} className="w-full mt-2 bg-black text-white text-sm py-2 rounded-lg font-medium disabled:opacity-50">
                  {saving ? "保存中..." : "保存更改"}
                </button>
              </div>
            )}
          </div>

          <Link href={`/support-chat?from=${encodeURIComponent('/settings')}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
            <HiOutlineQuestionMarkCircle className="w-5 h-5 text-[var(--color-text)] opacity-70" />
            <span className="flex-1 text-sm font-medium text-[var(--color-text)]">联系客服</span>
            <HiOutlineChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
          </Link>
        </div>

        <button onClick={handleLogout} className="w-full text-center text-sm font-medium text-[var(--color-muted)] tracking-wider">
          退出登录
        </button>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default ProfileSettingsPage;
