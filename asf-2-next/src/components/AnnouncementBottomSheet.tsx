"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiX } from "react-icons/hi";
import { useAnnouncementContext } from "@/context/AnnouncementContext";

/**
 * AnnouncementBottomSheet displays the current active announcement from
 * AnnouncementContext as a slide-up bottom sheet modal.
 *
 * - Appears after a 1500ms delay to avoid interfering with page load.
 * - Dismissed state is persisted to localStorage via AnnouncementContext.
 * - Shows an optional image, title, message, and CTA button.
 */
const AnnouncementBottomSheet: React.FC = () => {
  const { announcement, dismissAnnouncement } = useAnnouncementContext();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  /**
   * Delay appearance by 1500ms after the component mounts.
   * Only trigger if an announcement is actually available.
   */
  useEffect(() => {
    if (announcement === null) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [announcement]);

  /**
   * When the announcement changes (e.g. dismissed then a new one loads),
   * reset the visible state.
   */
  useEffect(() => {
    if (announcement === null) {
      setIsVisible(false);
    }
  }, [announcement]);

  /** Dismiss and hide the sheet */
  const handleDismiss = (): void => {
    if (announcement === null) return;
    setIsVisible(false);
    // Small delay so the close animation completes before state is cleared
    setTimeout(() => {
      dismissAnnouncement(announcement.id);
    }, 300);
  };

  // Don't render anything if there's no announcement
  if (announcement === null) return null;

  /** Determine the accent colour based on announcement type */
  const accentColor: string = (() => {
    switch (announcement.type) {
      case "promo": return "bg-yellow-500";
      case "warning": return "bg-orange-500";
      default: return "bg-indigo-600";
    }
  })();

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-black transition-opacity duration-300 ${
          isVisible ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className={`
          fixed bottom-0 left-0 right-0 z-[95]
          bg-white dark:bg-gray-900
          rounded-t-2xl shadow-2xl
          transform transition-transform duration-300 ease-out
          max-w-lg mx-auto
          ${isVisible ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Accent bar at the top of the sheet */}
        <div className={`h-1 w-full rounded-t-2xl ${accentColor}`} />

        {/* Drag handle visual cue */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="关闭公告"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>

        <div className="px-5 pb-8 pt-2">
          {/* Optional image banner */}
          {typeof announcement.image_url === "string" && announcement.image_url.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden relative w-full h-40">
              {/* Use next/image to avoid downloading full-size announcement banners */}
              <Image
                src={announcement.image_url}
                alt={announcement.title}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
                priority={false}
              />
            </div>
          )}

          {/* Title */}
          <h2
            id="announcement-title"
            className="text-lg font-bold text-gray-900 dark:text-white mb-2"
          >
            {announcement.title}
          </h2>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
            {announcement.message}
          </p>

          {/* CTA button — only rendered if cta_url and cta_label are provided */}
          {typeof announcement.cta_url === "string" &&
            announcement.cta_url.length > 0 &&
            typeof announcement.cta_label === "string" &&
            announcement.cta_label.length > 0 && (
              <Link
                href={announcement.cta_url}
                onClick={handleDismiss}
                className={`
                  block w-full py-3 px-6 rounded-xl text-center text-white text-sm font-semibold
                  transition-opacity hover:opacity-90 active:opacity-80
                  ${accentColor}
                `}
              >
                {announcement.cta_label}
              </Link>
            )}

          {/* Dismiss text link */}
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-3 block w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            不再提示
          </button>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBottomSheet;
