"use client";
import React from "react";

const LoadingPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-16">
      <img
        alt=""
        src="/images/illustrations/maintenance.svg"
        className="lg:max-w-md"
      />
      <h1 className="mb-3 mt-6 w-4/5 text-center text-4xl font-bold dark:text-white">
        请稍候...
      </h1>
      <div className="flex items-center justify-center py-12">
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}


 export default function WrappedLoadingPage(props: any) {
   return (
     <LoadingPage {...props} />
   );
 }
 