import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { Redirect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  useReducedMotion,
} from "react-native-reanimated";

import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { useThemeTokens } from "@/context/ThemeContext";
import type { Tables } from "@/database.types";
import { motion } from "@/lib/motion";
import type { ThemeTokens } from "@/themes/types";

const SCREEN_WIDTH = Dimensions.get("window").width;

/** Fallback page height before the list container reports `onLayout`. */
const FALLBACK_PAGE_HEIGHT = Dimensions.get("window").height;

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  tokens: ThemeTokens;
}

/**
 * Soft paper comment sheet — outline send, matching Atelier Shop sheet calm.
 */
function CommentSheet({
  visible,
  onClose,
  tokens,
}: CommentSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = (): void => {
    if (text.trim().length === 0) {
      return;
    }
    setSent(true);
    setText("");
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(44,36,22,0.35)" }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: tokens.bg,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            padding: 24,
            paddingBottom: Math.max(insets.bottom, 24),
            borderTopWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 22,
                color: tokens.text,
              }}
            >
              {t("post.comment")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel={t("common.close")}>
              <Ionicons name="close" size={22} color={tokens.muted} />
            </Pressable>
          </View>
          <TextInput
            style={{
              height: 120,
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: 2,
              padding: 16,
              backgroundColor: tokens.panel,
              color: tokens.text,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
              textAlignVertical: "top",
            }}
            placeholder={t("post.commentPlaceholder")}
            placeholderTextColor={tokens.muted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />
          <Pressable
            onPress={handleSend}
            style={{
              marginTop: 16,
              height: 48,
              borderWidth: 1,
              borderColor: tokens.text,
              borderRadius: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: tokens.text,
                fontSize: 13,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: "Inter_400Regular",
              }}
            >
              {sent ? t("post.commentSubmitted") : t("post.send")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ChapterPageProps {
  post: Tables<"posts">;
  medias: Tables<"post_medias">[];
  tokens: ThemeTokens;
  /** Zero-based chapter index for quiet editorial numbering (01, 02…). */
  chapterIndex: number;
  /** Measured snap page height (list viewport above the tab bar). */
  pageHeight: number;
  /** Whether this chapter is the focused snap page (drives video playback). */
  isActive: boolean;
  /** Skip entrance fades when the user prefers reduced motion. */
  reducedMotion: boolean;
}

/**
 * One editorial journal chapter — full-bleed media filling the snap viewport,
 * quiet caption overlay, text actions (not a Reels-style icon column).
 */
function ChapterPage({
  post,
  medias,
  tokens,
  chapterIndex,
  pageHeight,
  isActive,
  reducedMotion,
}: ChapterPageProps): React.ReactElement {
  const { t } = useTranslation();
  const { translatePost } = useContentTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sortedMedias = useMemo(
    () => [...medias].sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)),
    [medias]
  );
  const firstMedia = sortedMedias[0] ?? null;
  const mediaUrl = firstMedia?.media_url ?? null;
  const isVideo = (firstMedia?.media_type ?? "image") === "video";
  const caption = translatePost(post.id, "caption", post.caption);
  const ctaText = translatePost(post.id, "cta_text", post.cta_text);

  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const likedRaw = await AsyncStorage.getItem("liked_posts");
        const savedRaw = await AsyncStorage.getItem("saved_posts");
        const liked = JSON.parse(likedRaw ?? "[]") as string[];
        const saved = JSON.parse(savedRaw ?? "[]") as string[];
        setIsLiked(liked.includes(post.id));
        setIsSaved(saved.includes(post.id));
      } catch {
        /* ignore corrupt storage */
      }
    })();
  }, [post.id]);

  const toggleLike = useCallback(async () => {
    const next = !isLiked;
    setIsLiked(next);
    try {
      const liked = JSON.parse(
        (await AsyncStorage.getItem("liked_posts")) ?? "[]"
      ) as string[];
      if (next) {
        if (!liked.includes(post.id)) {
          liked.push(post.id);
        }
      } else {
        const idx = liked.indexOf(post.id);
        if (idx > -1) {
          liked.splice(idx, 1);
        }
      }
      await AsyncStorage.setItem("liked_posts", JSON.stringify(liked));
    } catch {
      /* ignore */
    }
  }, [isLiked, post.id]);

  const toggleSave = useCallback(async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      const saved = JSON.parse(
        (await AsyncStorage.getItem("saved_posts")) ?? "[]"
      ) as string[];
      if (next) {
        if (!saved.includes(post.id)) {
          saved.push(post.id);
        }
      } else {
        const idx = saved.indexOf(post.id);
        if (idx > -1) {
          saved.splice(idx, 1);
        }
      }
      await AsyncStorage.setItem("saved_posts", JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [isSaved, post.id]);

  const chapterLabel = String(chapterIndex + 1).padStart(2, "0");
  /** Leave room under overlay chrome + home indicator when caption sits low. */
  const captionBottomPad = Math.max(insets.bottom, 12) + 20;

  const captionBlock = (
    <View style={{ paddingHorizontal: 24, paddingBottom: captionBottomPad }}>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 11,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: "rgba(246,241,232,0.72)",
          marginBottom: 12,
        }}
      >
        {chapterLabel}
      </Text>

      {caption.length > 0 ? (
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 26,
            lineHeight: 34,
            color: "#F6F1E8",
            marginBottom: 18,
            maxWidth: SCREEN_WIDTH - 72,
          }}
          numberOfLines={4}
        >
          {caption}
        </Text>
      ) : null}

      {/* Quiet editorial actions — sparse type, not a social icon rail */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 22,
          marginBottom: ctaText.length > 0 ? 16 : 0,
        }}
      >
        <TouchableOpacity onPress={() => void toggleLike()} hitSlop={8}>
          <Text
            style={{
              fontSize: 12,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: isLiked ? tokens.accent : "rgba(246,241,232,0.78)",
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("post.like")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCommentOpen(true)} hitSlop={8}>
          <Text
            style={{
              fontSize: 12,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "rgba(246,241,232,0.78)",
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("post.comment")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void toggleSave()} hitSlop={8}>
          <Text
            style={{
              fontSize: 12,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: isSaved ? tokens.accent : "rgba(246,241,232,0.78)",
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("post.save")}
          </Text>
        </TouchableOpacity>
      </View>

      {ctaText.length > 0 ? (
        <Pressable
          onPress={() => router.push("/(tabs)/browse")}
          style={{ paddingVertical: 4 }}
          accessibilityRole="button"
          accessibilityLabel={ctaText}
        >
          <Text
            style={{
              fontSize: 14,
              color: tokens.accent,
              fontFamily: "Inter_400Regular",
              letterSpacing: 0.3,
            }}
          >
            {ctaText}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: pageHeight,
        backgroundColor: tokens.text,
        overflow: "hidden",
      }}
    >
      {mediaUrl === null ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tokens.panel,
          }}
        >
          <Ionicons name="image-outline" size={36} color={tokens.muted} />
          <Text
            style={{
              color: tokens.muted,
              fontSize: 13,
              marginTop: 8,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("post.noContent")}
          </Text>
        </View>
      ) : isVideo ? (
        <Video
          source={{ uri: mediaUrl }}
          style={{ width: SCREEN_WIDTH, height: pageHeight }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isMuted={isMuted}
          isLooping
        />
      ) : (
        <Image
          source={{ uri: mediaUrl }}
          style={{ width: SCREEN_WIDTH, height: pageHeight }}
          contentFit="cover"
        />
      )}

      {/* Soft ink wash — calm lower frame for caption (editorial, not Reels UI) */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: Math.round(pageHeight * 0.42),
          backgroundColor: "rgba(44,36,22,0.58)",
        }}
      />

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {reducedMotion ? (
          captionBlock
        ) : (
          <Animated.View entering={FadeIn.duration(motion.duration.entrance)}>
            {captionBlock}
          </Animated.View>
        )}
      </View>

      {isVideo && mediaUrl !== null ? (
        <TouchableOpacity
          onPress={() => setIsMuted((m) => !m)}
          style={{
            position: "absolute",
            top: insets.top + 56,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: "rgba(44,36,22,0.45)",
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel={isMuted ? t("post.unmuteAria") : t("post.muteAria")}
        >
          <Ionicons
            name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
            size={16}
            color="#F6F1E8"
          />
        </TouchableOpacity>
      ) : null}

      <CommentSheet
        visible={commentOpen}
        onClose={() => setCommentOpen(false)}
        tokens={tokens}
      />
    </View>
  );
}

/**
 * Atelier Highlights — editorial chapter snap-paging (journal), not a Reels clone.
 *
 * Each post fills the list viewport (window height minus tab bar / chrome already
 * accounted for by the tabs shell). Swipe vertically to the next chapter.
 * Cart FAB is hidden on this route (see {@link AtelierCartChrome}).
 */
export function AtelierHighlightsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const tokens = useThemeTokens();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { isEnabled } = useFeatureFlags();
  const { posts, loading: postsLoading } = usePostContext();
  const { postMedias, loading: mediaLoading } = usePostMediaContext();

  /** Profile-stack entry keeps the back chevron; the root Highlights tab does not. */
  const showBack = pathname.includes("/profile");

  /**
   * Snap interval = measured FlatList height. The tabs layout already reserves
   * the bottom tab bar, so `onLayout` height is the usable story viewport.
   */
  const [pageHeight, setPageHeight] = useState(FALLBACK_PAGE_HEIGHT);
  const [activeIndex, setActiveIndex] = useState(0);

  const onListLayout = useCallback((event: LayoutChangeEvent): void => {
    const next = Math.round(event.nativeEvent.layout.height);
    if (next > 0) {
      setPageHeight(next);
    }
  }, []);

  const featured = useMemo(
    () =>
      [...posts]
        .filter((p) => p.id.length > 0)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        ),
    [posts]
  );

  const mediasForPost = useMemo(() => {
    const map = new Map<string, Tables<"post_medias">[]>();
    for (const m of postMedias) {
      if (typeof m.post_id !== "string") {
        continue;
      }
      const list = map.get(m.post_id) ?? [];
      list.push(m);
      map.set(m.post_id, list);
    }
    return map;
  }, [postMedias]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }): void => {
      const first = viewableItems[0];
      if (
        first !== undefined &&
        typeof first.index === "number" &&
        first.index >= 0
      ) {
        setActiveIndex(first.index);
      }
    }
  ).current;

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Tables<"posts">>): React.ReactElement => (
      <ChapterPage
        post={item}
        medias={mediasForPost.get(item.id) ?? []}
        tokens={tokens}
        chapterIndex={index}
        pageHeight={pageHeight}
        isActive={index === activeIndex}
        reducedMotion={reducedMotion}
      />
    ),
    [activeIndex, mediasForPost, pageHeight, reducedMotion, tokens]
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<Tables<"posts">> | null | undefined, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight]
  );

  if (!showBack && !isEnabled("highlights")) {
    return <Redirect href="/(tabs)" />;
  }

  const loading = postsLoading || mediaLoading;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.text }}>
      {/* Floating journal chrome — does not steal snap height from chapters */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingTop: insets.top,
        }}
      >
        <View
          style={{
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
          }}
        >
          {showBack ? (
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                backgroundColor: "rgba(44,36,22,0.35)",
              }}
              hitSlop={8}
              accessibilityLabel={t("orders.back")}
            >
              <Ionicons name="arrow-back" size={22} color="#F6F1E8" />
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(246,241,232,0.88)",
            }}
          >
            {t("highlights.atelierIntroTitle")}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {featured.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            backgroundColor: tokens.bg,
          }}
        >
          <Text
            style={{
              color: tokens.muted,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
            }}
          >
            {t("highlights.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={featured}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onLayout={onListLayout}
          pagingEnabled
          snapToInterval={pageHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
          overScrollMode="never"
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews
        />
      )}
    </View>
  );
}
