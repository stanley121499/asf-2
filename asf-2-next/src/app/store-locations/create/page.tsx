"use client";

import { FullAdminContextBundle } from "@/context/RouteContextBundles";
import { useStoreLocationContext } from "@/context/StoreLocationContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button, Card, Label, Textarea, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

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

const CreateStoreLocationInner: React.FC = function () {
  const router = useRouter();
  const { createStoreLocation } = useStoreLocationContext();

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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0 || mallName.trim().length === 0) {
      setError("Store name and mall name are required.");
      return;
    }
    if (addressLine1.trim().length === 0 || city.trim().length === 0 || state.trim().length === 0) {
      setError("Address, city, and state are required.");
      return;
    }

    const sortParsed = Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(sortParsed)) {
      setError("Sort order must be an integer.");
      return;
    }

    setSaving(true);
    try {
      const created = await createStoreLocation({
        name: name.trim(),
        mall_name: mallName.trim(),
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim().length > 0 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim().length > 0 ? postcode.trim() : null,
        country: country.trim().length > 0 ? country.trim() : "Malaysia",
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
      if (created === undefined) {
        setError("Could not create store location. Check required fields and URLs.");
        return;
      }
      router.push("/store-locations");
    } finally {
      setSaving(false);
    }
  };

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/store-locations"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to store locations
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            Add store location
          </h1>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            {error !== null && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div>
              <Label htmlFor="sl-name">Store name</Label>
              <TextInput id="sl-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="sl-mall">Mall name</Label>
              <TextInput id="sl-mall" value={mallName} onChange={(e) => setMallName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="sl-addr1">Address line 1</Label>
              <TextInput id="sl-addr1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="sl-addr2">Address line 2 (optional)</Label>
              <TextInput id="sl-addr2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sl-city">City</Label>
                <TextInput id="sl-city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="sl-state">State</Label>
                <TextInput id="sl-state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sl-postcode">Postcode (optional)</Label>
                <TextInput id="sl-postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sl-country">Country</Label>
                <TextInput id="sl-country" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="sl-phone">Phone (optional)</Label>
              <TextInput id="sl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sl-hours">Opening hours (optional)</Label>
              <Textarea id="sl-hours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sl-lat">Latitude (optional)</Label>
                <TextInput id="sl-lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sl-lng">Longitude (optional)</Label>
                <TextInput id="sl-lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="sl-gmaps">Google Maps URL (optional)</Label>
              <TextInput id="sl-gmaps" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sl-waze">Waze URL (optional)</Label>
              <TextInput id="sl-waze" value={wazeUrl} onChange={(e) => setWazeUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sl-images">Store photos (optional)</Label>
              <Textarea
                id="sl-images"
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
              <Label htmlFor="sl-sort">Sort order</Label>
              <TextInput id="sl-sort" type="number" step={1} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="sl-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sl-active" className="mb-0">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" color="blue" disabled={saving}>
                {saving ? "Saving…" : "Create"}
              </Button>
              <Link href="/store-locations">
                <Button color="gray" type="button">Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

const CreateStoreLocationPage: React.FC = function () {
  return (
    <FullAdminContextBundle>
      <CreateStoreLocationInner />
    </FullAdminContextBundle>
  );
};

export default CreateStoreLocationPage;
