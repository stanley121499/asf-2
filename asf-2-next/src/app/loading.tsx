"use client";
import React from "react";

export default function LoadingPage() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img
          src="/images/logo.svg"
          alt="System App Formula"
          className="h-16 w-auto mb-3"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-xl font-bold tracking-wide text-gray-800 dark:text-white">
          System App Formula
        </span>
      </div>

      {/* Spinning ring */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="h-14 w-14 rounded-full border-4 border-indigo-100 dark:border-gray-700" />
        <div className="absolute h-14 w-14 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      </div>

      {/* Pulsing dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}