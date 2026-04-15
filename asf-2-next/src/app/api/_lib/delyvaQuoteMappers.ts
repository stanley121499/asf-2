/**
 * Maps Delyva `instantQuote` JSON to a stable list for the `/api/delivery/rates` response.
 */
export type NormalizedRate = {
  serviceCode: string;
  name: string;
  price: number;
  currency: string;
  etaDays: number | null;
};

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Parses the `services` array from a Delyva instantQuote response body.
 */
export function mapInstantQuoteServices(payload: unknown): NormalizedRate[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }
  const root = payload as Record<string, unknown>;
  // Delyva wraps the response under a `data` envelope: { errors, data: { services } }
  // Fall back to root-level `services` for forward-compatibility.
  const dataBlock = root.data;
  const servicesSource =
    typeof dataBlock === "object" && dataBlock !== null && !Array.isArray(dataBlock)
      ? (dataBlock as Record<string, unknown>)
      : root;
  const services = servicesSource.services;
  if (!Array.isArray(services)) {
    return [];
  }
  const out: NormalizedRate[] = [];
  for (const item of services) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const row = item as Record<string, unknown>;
    // `service.code` is the booking identifier Delyva needs back (e.g. "JNTDMY-PN-BD1").
    // `serviceCompany.companyCode` is a shorter company slug — not used for booking.
    const serviceObj = row.service;
    let serviceCode = "";
    let name = "";
    if (typeof serviceObj === "object" && serviceObj !== null) {
      const svc = serviceObj as Record<string, unknown>;
      if (typeof svc.code === "string" && svc.code.length > 0) {
        serviceCode = svc.code;
      }
      if (typeof svc.name === "string" && svc.name.length > 0) {
        name = svc.name;
      }
    }
    // Fallbacks for any future API shape changes
    if (serviceCode.length === 0 && typeof row.serviceCode === "string") {
      serviceCode = row.serviceCode;
    }
    const priceBlock = row.price;
    let price = 0;
    let currency = "MYR";
    if (typeof priceBlock === "object" && priceBlock !== null) {
      const pb = priceBlock as Record<string, unknown>;
      const am = readNumber(pb.amount);
      if (am !== null) {
        price = am;
      }
      if (typeof pb.currency === "string") {
        currency = pb.currency;
      }
    }
    const etaRaw = row.etaDay ?? row.etaDays ?? row.estimatedDeliveryDay;
    const etaDays =
      typeof etaRaw === "number" && Number.isFinite(etaRaw)
        ? etaRaw
        : typeof etaRaw === "string"
          ? Number.parseInt(etaRaw, 10)
          : null;
    if (serviceCode.length === 0) {
      continue;
    }
    out.push({
      serviceCode,
      name: name.length > 0 ? name : serviceCode,
      price,
      currency,
      etaDays: etaDays !== null && Number.isFinite(etaDays) ? etaDays : null,
    });
  }
  return out;
}
