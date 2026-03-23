"use client";
import React, { useState, useRef } from "react";
import type { Tables } from "@/database.types";
import {
  HiOutlineHeart, HiHeart,
  HiOutlineChat,
  HiOutlineBookmark, HiBookmark,
  HiX,
  HiOutlinePhotograph,
  HiOutlineVolumeOff,
  HiOutlineVolumeUp,
} from "react-icons/hi";
import { useRouter } from "next/navigation";

interface PostCardProps {
  post: Tables<"posts">;
  medias: Tables<"post_medias">[];
  showActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, medias, showActions = true }) => {
  const router = useRouter();

  const sortedMedias = [...medias].sort((a, b) => (a.arrangement || 0) - (b.arrangement || 0));
  const firstMedia = sortedMedias[0] ?? null;
  const mediaUrl = firstMedia?.media_url ?? null;
  // Use media_type from DB column  instant, no fallback needed
  const isVideo = (firstMedia?.media_type ?? "image") === "video";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [imgError, setImgError] = useState(false);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  // Likes
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const liked = JSON.parse(localStorage.getItem("liked_posts") || "[]") as string[];
      return liked.includes(post.id);
    } catch { return false; }
  });
  const [likeCount, setLikeCount] = useState<number>(isLiked ? 13 : 12);

  const toggleLike = () => {
    setIsLiked(prev => {
      const next = !prev;
      setLikeCount(next ? 13 : 12);
      try {
        const liked = JSON.parse(localStorage.getItem("liked_posts") || "[]") as string[];
        if (next) { if (!liked.includes(post.id)) liked.push(post.id); }
        else { const idx = liked.indexOf(post.id); if (idx > -1) liked.splice(idx, 1); }
        localStorage.setItem("liked_posts", JSON.stringify(liked));
      } catch {}
      return next;
    });
  };

  // Saved
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = JSON.parse(localStorage.getItem("saved_posts") || "[]") as string[];
      return saved.includes(post.id);
    } catch { return false; }
  });

  const toggleSave = () => {
    setIsSaved(prev => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("saved_posts") || "[]") as string[];
        if (next) { if (!saved.includes(post.id)) saved.push(post.id); }
        else { const idx = saved.indexOf(post.id); if (idx > -1) saved.splice(idx, 1); }
        localStorage.setItem("saved_posts", JSON.stringify(saved));
      } catch {}
      return next;
    });
  };

  // Comments
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    setShowCommentSheet(false);
    setCommentText("");
    setToastMessage("留言已提交");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="w-full bg-white mb-8">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm z-50">
          {toastMessage}
        </div>
      )}

      {/* Media Block */}
      <div className="w-full relative pt-[125%] bg-black overflow-hidden">
        {!mediaUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <HiOutlinePhotograph className="w-10 h-10 mb-2" />
            <span className="text-sm">暂无内容</span>
          </div>
        ) : isVideo ? (
          /* ---- VIDEO: Instagram-style autoplay muted, mute toggle ---- */
          <div className="absolute inset-0">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {/* Video badge top-left */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-white text-xs font-medium">视频</span>
            </div>
            {/* Bottom-right controls row: mute + fullscreen */}
            <div className="absolute bottom-3 right-3 flex gap-2 z-10">
              <button
                type="button"
                onClick={toggleMute}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label={isMuted ? "开启声音" : "关闭声音"}
              >
                {isMuted ? <HiOutlineVolumeOff size={20} /> : <HiOutlineVolumeUp size={20} />}
              </button>
              <button
                type="button"
                aria-label="全屏播放"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const v = videoRef.current;
                  if (!v) return;
                  try {
                    if (v.requestFullscreen) void v.requestFullscreen();
                    else if ((v as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen)
                      (v as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
                  } catch { /* unsupported */ }
                }}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* ---- IMAGE ---- */
          imgError ? (
            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
              <HiOutlinePhotograph className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm font-medium">图片暂时无法加载</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={post.caption ?? "精选内容"}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 mt-4 text-[var(--color-text)] font-sans text-base">
          {post.caption}
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="px-4 py-3 flex items-center gap-6 mt-2">
          <button onClick={toggleLike} className="flex flex-col items-center gap-1 group">
            {isLiked
              ? <HiHeart size={24} className="text-red-500" />
              : <HiOutlineHeart size={24} className="text-[var(--color-text)] group-hover:text-red-500 transition-colors" />
            }
            <span className="text-xs text-[var(--color-muted)]">喜欢</span>
          </button>

          <button onClick={() => setShowCommentSheet(true)} className="flex flex-col items-center gap-1 group">
            <HiOutlineChat size={24} className="text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors" />
            <span className="text-xs text-[var(--color-muted)]">留言</span>
          </button>

          <button onClick={toggleSave} className="flex flex-col items-center gap-1 group">
            {isSaved
              ? <HiBookmark size={24} className="text-[var(--color-text)]" />
              : <HiOutlineBookmark size={24} className="text-[var(--color-text)] group-hover:text-black transition-colors" />
            }
            <span className="text-xs text-[var(--color-muted)]">收藏</span>
          </button>
        </div>
      )}

      {/* CTA button */}
      {post.cta_text && (
        <div className="px-4 pb-4 mt-2">
          <button
            onClick={() => router.push("/product-section")}
            className="btn-secondary rounded-xl"
          >
            {post.cta_text}
          </button>
        </div>
      )}

      {/* Comment Bottom Sheet */}
      {showCommentSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCommentSheet(false)} />
          <div className="relative bg-white rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl text-[var(--color-text)]">留言</h3>
              <button onClick={() => setShowCommentSheet(false)}>
                <HiX size={24} className="text-[var(--color-muted)]" />
              </button>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下您的留言"
              className="w-full h-32 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-panel)] text-[var(--color-text)] resize-none outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <button onClick={handleCommentSubmit} className="mt-4 btn-primary rounded-xl">
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
