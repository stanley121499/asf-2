/**
 * App-wide loading screen shown during page transitions.
 * Uses the maintenance illustration consistent with the route-level loading.tsx.
 */
export default function CustomerLoadingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-16 bg-white dark:bg-gray-900">
      <img
        alt=""
        src="/images/illustrations/maintenance.svg"
        className="lg:max-w-md"
      />
      <h1 className="mb-3 mt-6 w-4/5 text-center text-4xl font-bold dark:text-white">
        Give us a moment
      </h1>
      <div className="px-3 py-1 text-xs font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse dark:bg-blue-900 dark:text-blue-200">
        loading...
      </div>
    </div>
  );
}
