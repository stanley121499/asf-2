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
        Give us a moment
      </h1>
      <div className="px-3 py-1 text-xs font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse dark:bg-blue-900 dark:text-blue-200">loading...</div>
    </div>
  )
}

export default LoadingPage;