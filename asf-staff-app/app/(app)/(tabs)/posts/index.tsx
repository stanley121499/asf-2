import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { usePostContext, type Post } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";

import { C } from "./_lib/postTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "published" | "scheduled" | "draft";

interface EnrichedPost extends Post {
  resolvedStatus: StatusFilter;
  thumb: string | null;
  isVideo: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives a normalised status from the `status` DB column and `time_post`.
 * A future `time_post` without a "published" status resolves to "scheduled".
 */
function resolveStatus(status: string | null, timePosts: string | null): StatusFilter {
  if (status === "published") return "published";
  if (
    status === "scheduled" ||
    (timePosts !== null && new Date(timePosts) > new Date())
  ) {
    return "scheduled";
  }
  return "draft";
}

/** Returns badge styling for a given resolved status. */
function statusBadge(status: StatusFilter): {
  bg: string;
  color: string;
  label: string;
} {
  switch (status) {
    case "published":
      return { bg: "#D1FAE5", color: "#059669", label: "已发布" };
    case "scheduled":
      return { bg: "#FEF3C7", color: "#D97706", label: "已排期" };
    default:
      return { bg: "#F3F4F6", color: "#4B5563", label: "草稿" };
  }
}

/** Returns true when the media URL looks like a video by type column or extension. */
function isVideoMedia(url: string, mediaType: string): boolean {
  if (mediaType === "video") return true;
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm");
}

const STATUS_FILTERS: StatusFilter[] = ["all", "published", "scheduled", "draft"];

function labelForFilter(f: StatusFilter): string {
  const map: Record<StatusFilter, string> = {
    all: "全部",
    published: "已发布",
    scheduled: "已排期",
    draft: "草稿",
  };
  return map[f];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accentBg,
  accentColor,
}: Readonly<{
  label: string;
  value: number;
  accentBg: string;
  accentColor: string;
}>): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.panel,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: accentBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: accentColor }}>
          {value}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: C.muted, flex: 1, lineHeight: 15 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({
  item,
  onPress,
}: Readonly<{ item: EnrichedPost; onPress: () => void }>): React.ReactElement {
  const badge = statusBadge(item.resolvedStatus);
  const date = new Date(item.created_at).toLocaleDateString("zh-CN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  /*
   * IMPORTANT: Layout properties (flexDirection, alignItems, etc.) must NOT
   * go on the Pressable style callback in RN 0.81 — they are unreliable there.
   * Put them on a child View instead; use the Pressable only for press feedback.
   */
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Inner View owns all layout and background styling */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          minHeight: 96,
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          overflow: "hidden",
        }}
      >
        {/* ── Thumbnail ── */}
        <View
          style={{
            width: 96,
            height: 96,
            backgroundColor: "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {item.thumb !== null && !item.isVideo ? (
            <Image
              source={{ uri: item.thumb }}
              style={{ width: 96, height: 96 }}
              contentFit="cover"
            />
          ) : (
            <Ionicons
              name={item.isVideo ? "videocam-outline" : "image-outline"}
              size={26}
              color="#9CA3AF"
            />
          )}
        </View>

        {/* ── Content ── */}
        <View style={{ flex: 1, padding: 12 }}>
          {/* Name + active dot */}
          <View
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "700", color: C.text, flex: 1 }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item.active ? "#22C55E" : "#D1D5DB",
                marginLeft: 6,
                flexShrink: 0,
              }}
            />
          </View>

          {/* Caption preview */}
          {item.caption !== null && item.caption.length > 0 && (
            <Text
              style={{ fontSize: 12, color: C.muted, marginBottom: 6, lineHeight: 16 }}
              numberOfLines={2}
            >
              {item.caption}
            </Text>
          )}

          {/* Status badge + date */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
            }}
          >
            <View
              style={{
                backgroundColor: badge.bg,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: badge.color }}>
                {badge.label}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: C.muted }}>{date}</Text>
          </View>
        </View>

        {/* ── Chevron ── */}
        <View
          style={{ paddingRight: 12, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-forward" size={14} color={C.muted} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PostsListScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { posts, loading } = usePostContext();

  if (!isEnabled("highlights")) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }
  const { postMedias } = usePostMediaContext();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  /**
   * Build a map from post_id → first media item (sorted by arrangement).
   * Avoids repeated filter() calls in the renderItem.
   */
  const thumbMap = useMemo<Map<string, { url: string; mediaType: string }>>(() => {
    const map = new Map<string, { url: string; mediaType: string }>();
    const sorted = [...postMedias].sort(
      (a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)
    );
    sorted.forEach((m) => {
      if (!map.has(m.post_id)) {
        map.set(m.post_id, { url: m.media_url, mediaType: m.media_type });
      }
    });
    return map;
  }, [postMedias]);

  /** Enrich posts with resolved status, thumbnail, and video flag. */
  const enriched = useMemo<EnrichedPost[]>(() => {
    return posts.map((p) => {
      const first = thumbMap.get(p.id);
      const url = first?.url ?? null;
      const mediaType = first?.mediaType ?? "image";
      return {
        ...p,
        resolvedStatus: resolveStatus(p.status, p.time_post),
        thumb: url,
        isVideo: url !== null && isVideoMedia(url, mediaType),
      };
    });
  }, [posts, thumbMap]);

  /** Stat counts for the summary cards. */
  const stats = useMemo(
    () => ({
      published: enriched.filter((p) => p.resolvedStatus === "published").length,
      scheduled: enriched.filter((p) => p.resolvedStatus === "scheduled").length,
      draft: enriched.filter((p) => p.resolvedStatus === "draft").length,
    }),
    [enriched]
  );

  /** Visible posts after applying the search query and status filter. */
  const filtered = useMemo<EnrichedPost[]>(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((p) => {
      if (statusFilter !== "all" && p.resolvedStatus !== statusFilter) return false;
      if (q.length === 0) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [enriched, statusFilter, query]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
          帖子
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/posts/create")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: C.accent,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
            新建帖子
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {/* ── Stats ───────────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <StatCard
                label="已发布"
                value={stats.published}
                accentBg="#DCFCE7"
                accentColor="#15803D"
              />
              <StatCard
                label="已排期"
                value={stats.scheduled}
                accentBg="#EDE9FE"
                accentColor="#6D28D9"
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <StatCard
                label="草稿"
                value={stats.draft}
                accentBg="#F3F4F6"
                accentColor="#6B7280"
              />
              <StatCard
                label="帖子总数"
                value={enriched.length}
                accentBg="#DBEAFE"
                accentColor="#1D4ED8"
              />
            </View>

            {/* ── Search ──────────────────────────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.panel,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              <Ionicons name="search-outline" size={16} color={C.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="搜索帖子名称…"
                placeholderTextColor={C.muted}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  paddingLeft: 8,
                  fontSize: 14,
                  color: C.text,
                }}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={16} color={C.muted} />
                </Pressable>
              )}
            </View>

            {/* ── Status Filter Pills ─────────────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {STATUS_FILTERS.map((f) => {
                const active = f === statusFilter;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setStatusFilter(f)}
                    style={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: active ? C.accent : C.border,
                      backgroundColor: active ? C.accent : C.panel,
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: active ? "#FFFFFF" : C.text,
                      }}
                    >
                      {labelForFilter(f)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 56 }}>
            {loading ? (
              <ActivityIndicator color={C.accent} />
            ) : (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="newspaper-outline" size={30} color="#9CA3AF" />
                </View>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: "600" }}>
                  暂无帖子
                </Text>
                <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                  点击"新建帖子"创建
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            item={item}
            onPress={() => router.push(`/(app)/(tabs)/posts/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
