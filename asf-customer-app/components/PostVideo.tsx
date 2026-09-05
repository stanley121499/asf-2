import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";

/** Content-fit modes supported by `expo-video` VideoView. */
export type PostVideoContentFit = "contain" | "cover" | "fill";

interface PostVideoProps {
  /** Remote or local media URI. */
  uri: string;
  /** Layout style for the VideoView. */
  style: StyleProp<ViewStyle>;
  /** How the video fills the view (maps from former expo-av ResizeMode). */
  contentFit: PostVideoContentFit;
  /** Whether audio is muted. */
  muted: boolean;
  /** When true, play; when false, pause. */
  shouldPlay: boolean;
  /** Loop playback (default true — matches former Highlights behavior). */
  loop?: boolean;
}

/**
 * Highlights post video powered by expo-video (replaces expo-av Video).
 * Keeps mute / play / loop in sync with props used across theme screens.
 */
export function PostVideo({
  uri,
  style,
  contentFit,
  muted,
  shouldPlay,
  loop = true,
}: PostVideoProps): React.ReactElement {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = loop;
    instance.muted = muted;
    if (shouldPlay) {
      instance.play();
    }
  });

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, shouldPlay]);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={false}
    />
  );
}
