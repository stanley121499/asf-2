import React from "react";

interface ListPageProps {
  title?: string;
  listData?: {
    title?: string;
    media_url?: string;
    amount?: number;
    unit?: string;
  }[];
}

const ListPage: React.FC<ListPageProps> = ({
  title = "Top Products",
  listData = [],
}) => {
  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
        {title}
      </h2>
      {/* Product List */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {listData.map((data) => (
          <li key={data.title} className="py-3 sm:py-4">
            <div className="flex items-center">
              {data.media_url && (
                <div className="shrink-0">
                  <img
                    className="h-9 w-9 object-cover rounded"
                    src={data.media_url}
                    alt={data.title ?? ""}
                    loading="lazy"
                    decoding="async"
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
    </div>
  );
};

export default ListPage;
