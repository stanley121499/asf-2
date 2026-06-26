"use client";

import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import {
  useStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Label, Spinner, Textarea, TextInput } from "flowbite-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

/**
 * Parses optional numeric input to number or null.
 */
function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Splits a newline-separated textarea into a clean list of image URLs.
 */
function parseImageUrls(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Runtime helper: narrows unknown JSON into a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const EditStoreLocationInner: React.FC = function () {
  const params = useParams();
  const router = useRouter();
  const rawId = params["id"];
  const id = typeof rawId === "string" ? rawId : "";

  const { updateStoreLocation, deleteStoreLocation } = useStoreLocationContext();

  const [loading, setLoading] = useState(true);
  const [storeLocation, setStoreLocation] = useState<StoreLocation | null>(null);
  const [name, setName] = useState("");
  const [mallName, setMallName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("Malaysia");
  const [phone, setPhone] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [wazeUrl, setWazeUrl] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (id.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/store-locations/${encodeURIComponent(id)}`);
      const json: unknown = await res.json();
      if (!res.ok || !isRecord(json)) {
        setStoreLocation(null);
        return;
      }
      const row = json["storeLocation"];
      if (!isRecord(row) || typeof row["id"] !== "string") {
        setStoreLocation(null);
        return;
      }
      const loc = row as StoreLocation;
      setStoreLocation(loc);
      setName(loc.name);
      setMallName(loc.mall_name);
      setAddressLine1(loc.address_line_1);
      setAddressLine2(loc.address_line_2 ?? "");
      setCity(loc.city);
      setState(loc.state);
      setPostcode(loc.postcode ?? "");
      setCountry(loc.country);
      setPhone(loc.phone ?? "");
      setOpeningHours(loc.opening_hours ?? "");
      setLatitude(loc.latitude !== null ? String(loc.latitude) : "");
      setLongitude(loc.longitude !== null ? String(loc.longitude) : "");
      setGoogleMapsUrl(loc.google_maps_url ?? "");
      setWazeUrl(loc.waze_url ?? "");
      setImageUrlsText(loc.image_urls.join("\n"));
      setSortOrder(String(loc.sort_order));
      setActive(loc.active);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (id.length === 0) {
      return;
    }

    const sortParsed = Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(sortParsed)) {
      setError("Sort order must be an integer.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateStoreLocation(id, {
        name: name.trim(),
        mall_name: mallName.trim(),
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim().length > 0 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim().length > 0 ? postcode.trim() : null,
        country: country.trim(),
        phone: phone.trim().length > 0 ? phone.trim() : null,
        opening_hours: openingHours.trim().length > 0 ? openingHours.trim() : null,
        latitude: parseOptionalNumber(latitude),
        longitude: parseOptionalNumber(longitude),
        google_maps_url: googleMapsUrl.trim().length > 0 ? googleMapsUrl.trim() : null,
        waze_url: wazeUrl.trim().length > 0 ? wazeUrl.trim() : null,
        image_urls: parseImageUrls(imageUrlsText),
        sort_order: sortParsed,
        active,
      });
      if (updated === undefined) {
        setError("Could not update store location.");
        return;
      }
      router.push("/store-locations");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (id.length === 0) {
      return;
    }
    await deleteStoreLocation(id);
    router.push("/store-locations");
  };

  if (loading) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8 flex justify-center">
          <Spinner size="lg" />
        </div>
      </NavbarSidebarLayout>
    );
  }

  if (storeLocation === null) {
    return (
      <NavbarSidebarLayout>
        <div className="p-8">
          <p className="text-gray-600 dark:text-gray-400">Store location not found.</p>
          <Link href="/store-locations" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back
          </Link>
        </div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/store-locations" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Back to store locations
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              Edit store location
            </h1>
          </div>
          <Button color="failure" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            {error !== null && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div>
              <Label htmlFor="esl-name">Store name</Label>
              <TextInput id="esl-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="esl-mall">Mall name</Label>
              <TextInput id="esl-mall" value={mallName} onChange={(e) => setMallName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="esl-addr1">Address line 1</Label>
              <TextInput id="esl-addr1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="esl-addr2">Address line 2 (optional)</Label>
              <TextInput id="esl-addr2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="esl-city">City</Label>
                <TextInput id="esl-city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="esl-state">State</Label>
                <TextInput id="esl-state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="esl-postcode">Postcode (optional)</Label>
                <TextInput id="esl-postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="esl-country">Country</Label>
                <TextInput id="esl-country" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="esl-phone">Phone (optional)</Label>
              <TextInput id="esl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="esl-hours">Opening hours (optional)</Label>
              <Textarea id="esl-hours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="esl-lat">Latitude (optional)</Label>
                <TextInput id="esl-lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="esl-lng">Longitude (optional)</Label>
                <TextInput id="esl-lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="esl-gmaps">Google Maps URL (optional)</Label>
              <TextInput id="esl-gmaps" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="esl-waze">Waze URL (optional)</Label>
              <TextInput id="esl-waze" value={wazeUrl} onChange={(e) => setWazeUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="esl-images">Store photos (optional)</Label>
              <Textarea
                id="esl-images"
                value={imageUrlsText}
                onChange={(e) => setImageUrlsText(e.target.value)}
                rows={3}
                placeholder={"One image URL per line. The first image is used as the cover.\nhttps://…/storefront.jpg\nhttps://…/interior.jpg"}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Paste one image URL per line (different angles). The first image is the cover.
              </p>
              {parseImageUrls(imageUrlsText).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {parseImageUrls(imageUrlsText).map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Store photo ${index + 1}`}
                      className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="esl-sort">Sort order</Label>
              <TextInput id="esl-sort" type="number" step={1} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="esl-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="esl-active" className="mb-0">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" color="blue" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Link href="/store-locations">
                <Button color="gray" type="button">Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>

      <ConfirmDeleteModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => void handleDelete()}
        title="Delete store location?"
        message="This will hide the location from customers. You can add it again later if needed."
      />
    </NavbarSidebarLayout>
  );
};

const EditStoreLocationPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <EditStoreLocationInner />
    </FullAdminContextBundle>
  );
};

export default EditStoreLocationPage;
