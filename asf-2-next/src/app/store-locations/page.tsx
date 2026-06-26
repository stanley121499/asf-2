"use client";

import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import { useStoreLocationContext, type StoreLocation } from "@/context/StoreLocationContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Badge, Button, Card } from "flowbite-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { HiPlus } from "react-icons/hi";

/**
 * Formats a single-line address for table display.
 */
function formatAddress(row: StoreLocation): string {
  const parts = [
    row.address_line_1,
    row.address_line_2,
    row.city,
    row.state,
    row.postcode,
    row.country,
  ].filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.join(", ");
}

const StoreLocationsListInner: React.FC = function () {
  const { storeLocations, loading } = useStoreLocationContext();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const sorted = [...storeLocations].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return sorted;
    }
    return sorted.filter((row) => {
      const haystack = [
        row.name,
        row.mall_name,
        row.city,
        row.state,
        formatAddress(row),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, storeLocations]);

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Store Locations
          </h1>
          <Link href="/store-locations/create">
            <Button color="blue">
              <HiPlus className="mr-2 h-5 w-5" />
              Add location
            </Button>
          </Link>
        </div>

        <Card>
          <div className="mb-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, mall, city…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No store locations yet. Add one to help customers find your stores.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Mall</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {row.name}
                      </td>
                      <td className="px-4 py-3">{row.mall_name}</td>
                      <td className="px-4 py-3">{row.city}</td>
                      <td className="px-4 py-3">
                        <Badge color={row.active ? "success" : "gray"}>
                          {row.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{row.sort_order}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/store-locations/${row.id}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

const StoreLocationsListPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <StoreLocationsListInner />
    </FullAdminContextBundle>
  );
};

export default StoreLocationsListPage;
