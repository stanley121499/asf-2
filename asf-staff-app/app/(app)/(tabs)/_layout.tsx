import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useStaffRole } from "@/context/StaffRoleContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { roleAllowsTab } from "@/hooks/useRoleGuard";

/** Shared prop type for all tab bar icon render functions. */
type TabIconProps = { color: string; size: number };

/** Module-level icon render functions — stable references, no re-creation on each render. */
const HomeIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="home-outline" color={color} size={size} />
);
const OrdersIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="receipt-outline" color={color} size={size} />
);
const ChatIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="chatbubbles-outline" color={color} size={size} />
);
const ProductsIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="cube-outline" color={color} size={size} />
);
const PostsIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="newspaper-outline" color={color} size={size} />
);
const StocksIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="layers-outline" color={color} size={size} />
);
const AnalyticsIcon = ({ color, size }: TabIconProps): React.ReactElement => (
  <Ionicons name="stats-chart-outline" color={color} size={size} />
);

/** Render nothing — hides the tab bar button entirely. */
const hiddenButton = (): null => null;

/**
 * Applied to hidden tab items so they occupy zero space in the tab bar.
 * `tabBarButton: hiddenButton` hides the button but React Navigation v7
 * still allocates flex space for the container; `display: 'none'` collapses it.
 * Safe to use here because we do NOT use `href` on any screen.
 */
const hiddenItemStyle = { display: "none" as const };

/**
 * Bottom tab navigator for the staff app.
 *
 * Tab visibility is controlled by TWO independent guards:
 *   1. Role guard — `can(tabKey)` from `ROLE_TAB_ORDER` (who can access this tab)
 *   2. Feature flag — `isEnabled(featureKey)` from `feature_flags` table (whether the module is active)
 *
 * Both must be true for a tab to appear. Either guard alone is enough to hide it.
 *
 * Tabs + their feature flag keys:
 *   - dashboard  → (no feature flag — always available when role allows)
 *   - orders     → orders
 *   - chat       → support_chat
 *   - products   → (no feature flag — core module)
 *   - posts      → highlights
 *   - stocks     → stocks
 *   - analytics  → analytics
 *
 * Settings lives at app/(app)/settings — intentionally NOT a tab.
 */
export default function StaffTabsLayout(): React.ReactElement {
  const { role, loading } = useStaffRole();
  const { isEnabled } = useFeatureFlags();

  if (loading || role === null) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#000000" size="large" />
      </View>
    );
  }

  /** True when the role allows the tab AND the feature flag is on. */
  const canShow = (tabKey: string, featureKey?: string): boolean => {
    if (!roleAllowsTab(role, tabKey)) return false;
    if (featureKey !== undefined && !isEnabled(featureKey as Parameters<typeof isEnabled>[0])) {
      return false;
    }
    return true;
  };

  return (
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#C9A96E", // Gold
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: { borderTopWidth: 1, borderTopColor: "#E5E5E3", backgroundColor: "#FFFFFF" },
      }}
    >
      {/* 1 — Dashboard: leftmost, entry point for owner/manager */}
      <Tabs.Screen
        name="dashboard"
        options={
          canShow("dashboard")
            ? { title: "首页", tabBarIcon: HomeIcon }
            : { title: "首页", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 2 — Orders: gated by role + `orders` feature flag */}
      <Tabs.Screen
        name="orders"
        options={
          canShow("orders", "orders")
            ? { title: "订单", tabBarIcon: OrdersIcon }
            : { title: "订单", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 3 — Chat: gated by role + `support_chat` feature flag */}
      <Tabs.Screen
        name="chat"
        options={
          canShow("chat", "support_chat")
            ? { title: "聊天", tabBarIcon: ChatIcon }
            : { title: "聊天", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 4 — Products: core module, role-gated only */}
      <Tabs.Screen
        name="products"
        options={
          canShow("products")
            ? { title: "商品", tabBarIcon: ProductsIcon }
            : { title: "商品", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 5 — Posts: gated by role + `highlights` feature flag */}
      <Tabs.Screen
        name="posts"
        options={
          canShow("posts", "highlights")
            ? { title: "帖子", tabBarIcon: PostsIcon }
            : { title: "帖子", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 6 — Stocks: gated by role + `stocks` feature flag */}
      <Tabs.Screen
        name="stocks"
        options={
          canShow("stocks", "stocks")
            ? { title: "库存", tabBarIcon: StocksIcon }
            : { title: "库存", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 7 — Analytics: gated by role + `analytics` feature flag */}
      <Tabs.Screen
        name="analytics"
        options={
          canShow("analytics", "analytics")
            ? { title: "数据分析", tabBarIcon: AnalyticsIcon }
            : { title: "数据分析", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* Support: accessible via Chat stack push — never a tab button */}
      <Tabs.Screen
        name="support"
        options={{ title: "客服", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }}
      />

      {/* Settings: lives at app/(app)/settings — never a tab button */}
      <Tabs.Screen
        name="settings"
        options={{ title: "设置", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }}
      />
    </Tabs>
  );
}
