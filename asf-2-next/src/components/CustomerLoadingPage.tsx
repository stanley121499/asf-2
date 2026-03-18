/**
 * App-wide loading screen shown during page transitions.
 * Uses only Tailwind CSS — no external animation libraries needed.
 */
export default function CustomerLoadingPage(): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white">

      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-100 opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-100 opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-50 opacity-80 blur-2xl" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Logo mark */}
        <div className="relative">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 animate-ping rounded-2xl bg-indigo-400 opacity-20" />
          {/* Middle glow ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-indigo-200 to-purple-200 opacity-40 blur-lg" />
          {/* Icon tile */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 shadow-2xl shadow-indigo-300/50">
            {/* Abstract store / bag mark */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-9 w-9"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
        </div>

        {/* Heading + subtitle */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            正在加载
          </h1>
          <p className="text-sm text-gray-400">请稍候，马上就好</p>
        </div>

        {/* Staggered bouncing dots */}
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.4s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.2s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-600 [animation-delay:0s]" />
        </div>

      </div>

      {/* Slim brand stripe at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-60" />

    </div>
  );
}
