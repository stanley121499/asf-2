import React from "react";

interface ListWidgetProps {
  title?: string;
  redirectUrl?: string;
  redirectText?: string;
  listData?: {
    title?: string;
    media_url?: string;
    amount?: number;
    unit?: string;
  }[];
}

const ListWidget: React.FC<ListWidgetProps> = ({
  title = "Top Products",
  redirectUrl,
  redirectText = "Products Report",
  listData = [],
}) => {
  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 md:space-y-6 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
      </div>

      {/* Product List */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {listData.map((data) => (
          <li key={data.title} className="py-3 sm:py-4">
            <div className="flex items-center">
              {data.media_url && (
                <div className="shrink-0">
                <img
                  className="h-9 w-9"
                  src={data.media_url}
                  alt={data.title}
                />
              </div>
              )}
              <div className="ms-4 min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900 dark:text-white">
                  {data.title}
                </p>
              </div>
              <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                {data.amount} {data.unit}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      {redirectUrl && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700 sm:pt-6">
          <a
            href={redirectUrl}
            className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold uppercase text-primary-700 hover:bg-gray-100 dark:text-primary-500 dark:hover:bg-gray-700 sm:text-sm">
            {redirectText}
            <svg
              className="ml-1 h-4 w-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m9 5 7 7-7 7"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default ListWidget;
