import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { PostMedia } from "@/context/post/PostMediaContext";
import { C } from "../_lib/postTokens";

const THUMB = 90;

// ─── Single thumbnail ─────────────────────────────────────────────────────────
function MediaThumb({
  media,
  index,
  onRemove,
}: Readonly<{
  media: PostMedia;
  index: number;
  onRemove: (id: number) => void;
}>): React.ReactElement {
  const isVid =
    media.media_type === "video" ||
    media.media_url.toLowerCase().endsWith(".mp4") ||
    media.media_url.toLowerCase().endsWith(".mov");

  return (
    <View
      style={{
        width: THUMB,
        height: THUMB,
        borderRadius: 10,
        backgroundColor: "#E5E7EB",
        overflow: "hidden",
      }}
    >
      {isVid ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="videocam-outline" size={28} color="#9CA3AF" />
          <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
            Video
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: media.media_url }}
          style={{ width: THUMB, height: THUMB }}
          contentFit="cover"
        />
      )}

      {/* Arrangement badge */}
      <View
        style={{
          position: "absolute",
          bottom: 4,
          left: 4,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 10, color: "#FFFFFF", fontWeight: "700" }}>
          #{index + 1}
        </Text>
      </View>

      {/* Remove ✕ button */}
      <Pressable
        onPress={() => onRemove(media.id)}
        hitSlop={6}
        style={({ pressed }) => ({
          position: "absolute",
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: pressed ? "#DC2626" : "rgba(0,0,0,0.65)",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Ionicons name="close" size={13} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// ─── Local preview thumbnail (before upload) ─────────────────────────────────
export function LocalThumb({
  uri,
  index,
  onRemove,
}: Readonly<{
  uri: string;
  index: number;
  onRemove: (index: number) => void;
}>): React.ReactElement {
  return (
    <View
      style={{
        width: THUMB,
        height: THUMB,
        borderRadius: 10,
        backgroundColor: "#E5E7EB",
        overflow: "hidden",
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: THUMB, height: THUMB }}
        contentFit="cover"
      />
      <Pressable
        onPress={() => onRemove(index)}
        hitSlop={6}
        style={({ pressed }) => ({
          position: "absolute",
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: pressed ? "#DC2626" : "rgba(0,0,0,0.65)",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Ionicons name="close" size={13} color="#FFFFFF" />
      </Pressable>
      {/* Upload pending indicator */}
      <View
        style={{
          position: "absolute",
          bottom: 4,
          left: 4,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 9, color: "#FCD34D", fontWeight: "700" }}>
          PENDING
        </Text>
      </View>
    </View>
  );
}

// ─── Add button ───────────────────────────────────────────────────────────────
/*
 * ALL sizing (width, height, borderRadius) goes on the inner View.
 * The Pressable only handles opacity so it does not interfere with layout
 * in RN 0.81 where Pressable style callbacks drop layout properties.
 */
function AddButton({
  uploading,
  onPress,
}: Readonly<{ uploading: boolean; onPress: () => void }>): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={uploading}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: THUMB,
          height: THUMB,
          borderRadius: 10,
          backgroundColor: "#DDDFE2",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={C.accent} />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={28} color="#555" />
            <Text style={{ fontSize: 11, color: "#555", fontWeight: "600" }}>
              Add
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface MediaGridProps {
  /** Persisted media rows from the database. */
  medias: ReadonlyArray<PostMedia>;
  /** Whether an upload is in progress. */
  uploading: boolean;
  /** Triggered when the Add button is pressed. */
  onAdd: () => void;
  /** Triggered when the ✕ on a persisted media item is pressed. */
  onRemove: (id: number) => void;
}

// ─── Grid ────────────────────────────────────────────────────────────────────
export function MediaGrid({
  medias,
  uploading,
  onAdd,
  onRemove,
}: Readonly<MediaGridProps>): React.ReactElement {
  const handleRemove = (id: number): void => {
    Alert.alert("Remove Media", "Remove this item from the post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onRemove(id),
      },
    ]);
  };

  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {medias.map((m, idx) => (
          <MediaThumb
            key={m.id}
            media={m}
            index={idx}
            onRemove={handleRemove}
          />
        ))}
        <AddButton uploading={uploading} onPress={onAdd} />
      </ScrollView>

      {medias.length === 0 && !uploading && (
        <Text
          style={{
            fontSize: 12,
            color: C.muted,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Tap Add to upload images or videos
        </Text>
      )}
    </View>
  );
}

// ─── Image picker helper ──────────────────────────────────────────────────────
/**
 * Requests photo library permissions and launches the multi-select image picker.
 * Returns the selected assets, or an empty array if cancelled / denied.
 */
export async function pickImages(): Promise<ImagePicker.ImagePickerAsset[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission required",
      "Please allow photo library access in Settings."
    );
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: true,
    quality: 0.85,
    selectionLimit: 10,
  });

  return result.canceled ? [] : result.assets;
}
