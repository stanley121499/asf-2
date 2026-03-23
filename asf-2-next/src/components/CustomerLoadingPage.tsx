/**
 * App-wide loading screen shown during page transitions.
 * Uses only Tailwind CSS — no external animation libraries needed.
 */
export default function CustomerLoadingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)]">
      <h1 className="font-display text-[28px] text-[var(--color-text)] mb-6 tracking-wide">
        SYSTEM APP FORMULA
      </h1>
      <div className="flex mb-4">
        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce inline-block mx-1" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce inline-block mx-1" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce inline-block mx-1" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-[14px] text-[var(--color-muted)]">正在加载…</p>
    </div>
  );
}
