/**
 * Fallback mock data for all analytics pages.
 * Each export is used only when the corresponding real query returns an empty result set,
 * so real data always takes precedence.
 */

// ─── Shared helpers ────────────────────────────────────────────────────────────

/** Generates an array of ISO date strings (YYYY-MM-DD) ending today. */
function pastDates(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

// ─── Products page ─────────────────────────────────────────────────────────────

export interface BarDataPoint {
  x: string;
  y: number;
}

export interface ListEntry {
  title: string;
  amount: number;
  unit: string;
  media_url?: string;
}

/** Two-series monthly BarChart data — Add to Cart vs Checkout (Jan–Dec). */
export const MOCK_MONTHLY_BAR_TITLES: string[] = ["Add to Cart", "Checkout"];
export const MOCK_MONTHLY_BAR_DATA: BarDataPoint[][] = [
  [
    { x: "Jan", y: 30 }, { x: "Feb", y: 40 }, { x: "Mar", y: 35 },
    { x: "Apr", y: 50 }, { x: "May", y: 40 }, { x: "Jun", y: 55 },
    { x: "Jul", y: 60 }, { x: "Aug", y: 70 }, { x: "Sep", y: 80 },
    { x: "Oct", y: 90 }, { x: "Nov", y: 100 }, { x: "Dec", y: 110 },
  ],
  [
    { x: "Jan", y: 20 }, { x: "Feb", y: 30 }, { x: "Mar", y: 25 },
    { x: "Apr", y: 40 }, { x: "May", y: 30 }, { x: "Jun", y: 45 },
    { x: "Jul", y: 50 }, { x: "Aug", y: 60 }, { x: "Sep", y: 70 },
    { x: "Oct", y: 80 }, { x: "Nov", y: 90 }, { x: "Dec", y: 100 },
  ],
];
export const MOCK_MONTHLY_BAR_TOTAL = 840;

/** Revenue bar data (single-series, 14-day fallback used internally). */
const MOCK_REVENUE_VALUES = [320, 480, 215, 560, 390, 710, 445, 830, 290, 640, 510, 375, 920, 680];
export const MOCK_REVENUE_BAR_DATA: BarDataPoint[] = pastDates(14).map((date, i) => ({
  x: date,
  y: MOCK_REVENUE_VALUES[i] ?? 400,
}));
export const MOCK_REVENUE_TOTAL: number = MOCK_REVENUE_VALUES.reduce((a, b) => a + b, 0);

/** PieChart — Sale vs Stock */
export const MOCK_SALE_VS_STOCK = { series: [158462, 189168], labels: ["Stock", "Sale"] };

/** PieChart — Price distribution */
export const MOCK_PRICE_DISTRIBUTION = {
  labels: ["RM 2–10", "RM 10–20", "RM 20–40", "RM 40+"],
  series: [26, 33, 21, 15],
};

export const MOCK_BEST_PRODUCTS: ListEntry[] = [
  { title: "Coca Cola Classic", amount: 142, unit: "units" },
  { title: "Cold Brew Coffee", amount: 97, unit: "units" },
  { title: "Highland Black Tea", amount: 83, unit: "units" },
  { title: "Artisan Latte", amount: 76, unit: "units" },
  { title: "Lime Mint Soda", amount: 64, unit: "units" },
  { title: "Premium Roast Beans", amount: 51, unit: "units" },
  { title: "Korean Spicy Noodles", amount: 48, unit: "units" },
  { title: "Chocolate Variety Pack", amount: 39, unit: "units" },
];

export const MOCK_UNSELLABLE_PRODUCTS: ListEntry[] = [
  { title: "Green Tea Matcha Powder", amount: 120, unit: "units in stock" },
  { title: "Sparkling Mineral Water", amount: 96, unit: "units in stock" },
  { title: "Honey Lemon Drink Mix", amount: 74, unit: "units in stock" },
  { title: "Oat Milk Creamer", amount: 58, unit: "units in stock" },
  { title: "Dried Mango Chips", amount: 43, unit: "units in stock" },
];

export const MOCK_BEST_STATES: ListEntry[] = [
  { title: "Selangor", amount: 4280, unit: "MYR" },
  { title: "Kuala Lumpur", amount: 3610, unit: "MYR" },
  { title: "Johor", amount: 2190, unit: "MYR" },
  { title: "Penang", amount: 1740, unit: "MYR" },
  { title: "Sabah", amount: 980, unit: "MYR" },
];

export const MOCK_BEST_CITIES: ListEntry[] = [
  { title: "Petaling Jaya", amount: 2450, unit: "MYR" },
  { title: "Kuala Lumpur", amount: 2310, unit: "MYR" },
  { title: "Johor Bahru", amount: 1780, unit: "MYR" },
  { title: "Shah Alam", amount: 1340, unit: "MYR" },
  { title: "Georgetown", amount: 1090, unit: "MYR" },
];

// ─── Users page ────────────────────────────────────────────────────────────────

const MOCK_NEW_USER_COUNTS = [3, 5, 2, 7, 4, 8, 6, 11, 5, 9, 3, 7, 12, 8];

export const MOCK_NEW_USERS_CHART_DATA: number[] = MOCK_NEW_USER_COUNTS;
export const MOCK_NEW_USERS_CATEGORIES: string[] = pastDates(14);
export const MOCK_TOTAL_USERS: number = 248;
export const MOCK_ACTIVE_USERS: number = 87;

/** PieChart — customer ethnicity breakdown */
export const MOCK_RACE_PIE = {
  series: [15, 25, 60],
  labels: ["Others", "Chinese", "Malay"],
};

/** PieChart — customer age range */
export const MOCK_AGE_PIE = {
  labels: ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"],
  series: [20, 30, 25, 15, 10, 5],
};

/** PieChart — orders by state */
export const MOCK_STATE_PIE = {
  labels: [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
    "Pahang", "Perak", "Pulau Pinang", "Sabah", "Sarawak",
    "Selangor", "Terengganu", "W. Persekutuan",
  ],
  series: [10, 5, 3, 2, 1, 4, 6, 3, 7, 8, 20, 2, 4],
};

/** PieChart — orders by city */
export const MOCK_CITY_PIE = {
  labels: [
    "Kuala Lumpur", "Petaling Jaya", "Shah Alam", "Klang",
    "Subang Jaya", "Kajang", "Selayang", "Rawang",
    "Gombak", "Seremban", "Port Dickson", "Kuala Terengganu",
  ],
  series: [20, 10, 8, 6, 5, 4, 4, 3, 3, 2, 2, 1],
};

/** LineChart — VIP vs Normal customers over 7 days */
export const MOCK_USER_LINE_CHART_DATA = [
  { name: "VIP", data: [1000, 2000, 3000, 4000, 5000, 6000, 7000] },
  { name: "Normal", data: [2000, 3000, 4000, 5000, 6000, 7000, 8000] },
];
export const MOCK_USER_LINE_TITLE_DATA = [
  { title: "VIP", value: 28000, unit: "users" },
  { title: "Normal", value: 35000, unit: "users" },
];
export const MOCK_USER_LINE_CATEGORIES = ["1", "2", "3", "4", "5", "6", "7"];

/** BarChart — Product View → Add to Cart → Payment funnel */
export const MOCK_USER_FUNNEL_TITLES = ["Product View", "Add to Cart", "Payment"];
export const MOCK_USER_FUNNEL_DATA: BarDataPoint[][] = [
  [
    { x: "01 Feb", y: 150 }, { x: "02 Feb", y: 200 }, { x: "03 Feb", y: 250 },
    { x: "04 Feb", y: 300 }, { x: "05 Feb", y: 350 }, { x: "06 Feb", y: 400 },
    { x: "07 Feb", y: 450 },
  ],
  [
    { x: "01 Feb", y: 100 }, { x: "02 Feb", y: 150 }, { x: "03 Feb", y: 200 },
    { x: "04 Feb", y: 250 }, { x: "05 Feb", y: 300 }, { x: "06 Feb", y: 350 },
    { x: "07 Feb", y: 400 },
  ],
  [
    { x: "01 Feb", y: 50 }, { x: "02 Feb", y: 100 }, { x: "03 Feb", y: 150 },
    { x: "04 Feb", y: 200 }, { x: "05 Feb", y: 250 }, { x: "06 Feb", y: 300 },
    { x: "07 Feb", y: 350 },
  ],
];
export const MOCK_USER_FUNNEL_TOTAL = 1000;

// ─── Categories page ───────────────────────────────────────────────────────────

export interface CategoryStats {
  name: string;
  revenue: number;
  unitsSold: number;
}

export const MOCK_CATEGORY_STATS: CategoryStats[] = [
  { name: "Beverages", revenue: 5840, unitsSold: 412 },
  { name: "Snacks & Food", revenue: 3210, unitsSold: 278 },
  { name: "Household", revenue: 1780, unitsSold: 145 },
  { name: "Personal Care", revenue: 1120, unitsSold: 98 },
  { name: "Stationery", revenue: 650, unitsSold: 67 },
];

const CAT_DATES = ["1", "2", "3", "4", "5", "6", "7"];

/** LineChart — Department (Hot Drinks vs Cold Drinks vs Snacks) */
export const MOCK_CAT_DEPARTMENT_CHART = [
  { name: "Hot Drinks", data: [320, 432, 501, 534, 390, 730, 810] },
  { name: "Cold Drinks", data: [520, 682, 791, 934, 1090, 1230, 1410] },
];
export const MOCK_CAT_DEPARTMENT_TITLE = [
  { title: "Sold", value: 9210, unit: "pcs" },
  { title: "Sales", value: 124567, unit: "MYR" },
];
export const MOCK_CAT_DATES = CAT_DATES;

/** LineChart — Brand */
export const MOCK_CAT_BRAND_CHART = [
  { name: "Coca Cola", data: [420, 532, 601, 734, 690, 830, 910] },
  { name: "Nescafé", data: [320, 412, 501, 654, 790, 820, 900] },
  { name: "Lipton", data: [180, 232, 310, 390, 410, 560, 680] },
  { name: "Dutch Lady", data: [290, 354, 400, 534, 600, 780, 890] },
  { name: "Milo", data: [620, 782, 891, 1034, 1190, 1330, 1510] },
];
export const MOCK_CAT_BRAND_TITLE = [
  { title: "Sold", value: 17845, unit: "pcs" },
  { title: "Sales", value: 267980, unit: "MYR" },
];

/** LineChart — Seasonal Sales */
export const MOCK_CAT_SEASONAL_CHART = [
  { name: "Chinese New Year", data: [620, 730, 890, 1020, 1180, 1350, 1490] },
  { name: "Hari Raya", data: [540, 680, 750, 820, 940, 1120, 1230] },
  { name: "Deepavali", data: [290, 350, 430, 540, 680, 750, 830] },
  { name: "Christmas", data: [380, 460, 550, 630, 720, 890, 950] },
  { name: "Regular", data: [320, 450, 520, 610, 730, 850, 910] },
];
export const MOCK_CAT_SEASONAL_TITLE = [
  { title: "Sold", value: 15234, unit: "pcs" },
  { title: "Sales", value: 212345, unit: "MYR" },
];

/** LineChart — Product Category */
export const MOCK_CAT_CATEGORY_CHART = [
  { name: "Beverages", data: [560, 680, 790, 850, 920, 1100, 1250] },
  { name: "Snacks & Food", data: [320, 410, 500, 620, 730, 850, 920] },
  { name: "Personal Care", data: [480, 540, 650, 730, 850, 970, 1080] },
  { name: "Household", data: [390, 480, 580, 670, 790, 890, 970] },
];
export const MOCK_CAT_CATEGORY_TITLE = [
  { title: "Sold", value: 13450, unit: "pcs" },
  { title: "Sales", value: 187950, unit: "MYR" },
];

/** LineChart — Popular Flavours / Variants */
export const MOCK_CAT_FLAVOUR_CHART = [
  { name: "Original", data: [680, 750, 820, 910, 1030, 1120, 1250] },
  { name: "Sugar Free", data: [540, 610, 700, 820, 910, 1030, 1120] },
  { name: "Mint", data: [320, 400, 450, 520, 630, 750, 820] },
  { name: "Fruit Blend", data: [290, 350, 430, 520, 610, 720, 810] },
];
export const MOCK_CAT_FLAVOUR_TITLE = [
  { title: "Sold", value: 11230, unit: "pcs" },
  { title: "Sales", value: 167845, unit: "MYR" },
];

/** LineChart — Pack Size */
export const MOCK_CAT_PACK_CHART = [
  { name: "Single", data: [120, 150, 180, 210, 250, 290, 320] },
  { name: "6-Pack", data: [220, 270, 300, 350, 420, 490, 550] },
  { name: "12-Pack", data: [310, 380, 420, 460, 510, 580, 620] },
  { name: "24-Pack", data: [400, 460, 520, 580, 640, 710, 780] },
  { name: "Bulk (48+)", data: [200, 250, 300, 350, 400, 460, 510] },
];
export const MOCK_CAT_PACK_TITLE = [
  { title: "Sold", value: 10456, unit: "pcs" },
  { title: "Sales", value: 187560, unit: "MYR" },
];

// ─── Support page ──────────────────────────────────────────────────────────────

const MOCK_TICKET_COUNTS = [2, 5, 3, 7, 4, 6, 3, 8, 5, 4, 6, 9, 5, 7];

export const MOCK_VOLUME_CHART_DATA: number[] = MOCK_TICKET_COUNTS;
export const MOCK_VOLUME_CATEGORIES: string[] = pastDates(14);
export const MOCK_STATUS_LABELS: string[] = ["open", "closed", "pending"];
export const MOCK_STATUS_SERIES: number[] = [12, 47, 8];
export const MOCK_OPEN_COUNT: number = 12;
export const MOCK_CLOSED_COUNT: number = 47;

/** BarChart — ticket resolution funnel (Received → In Progress → Resolved) */
export const MOCK_SUPPORT_BAR_TITLES = ["Received", "In Progress", "Resolved"];
export const MOCK_SUPPORT_BAR_DATA: BarDataPoint[][] = [
  [
    { x: "01 Feb", y: 25 }, { x: "02 Feb", y: 30 }, { x: "03 Feb", y: 28 },
    { x: "04 Feb", y: 35 }, { x: "05 Feb", y: 40 }, { x: "06 Feb", y: 38 },
    { x: "07 Feb", y: 45 },
  ],
  [
    { x: "01 Feb", y: 18 }, { x: "02 Feb", y: 22 }, { x: "03 Feb", y: 20 },
    { x: "04 Feb", y: 28 }, { x: "05 Feb", y: 32 }, { x: "06 Feb", y: 30 },
    { x: "07 Feb", y: 36 },
  ],
  [
    { x: "01 Feb", y: 12 }, { x: "02 Feb", y: 18 }, { x: "03 Feb", y: 15 },
    { x: "04 Feb", y: 22 }, { x: "05 Feb", y: 26 }, { x: "06 Feb", y: 24 },
    { x: "07 Feb", y: 30 },
  ],
];
export const MOCK_SUPPORT_BAR_TOTAL = 241;

/** Fallback agent list when DB returns no agents */
export const MOCK_AGENT_LIST: string[] = [
  "All Agents",
  "Sarah Johnson",
  "Michael Chen",
  "Aisha Binti Rahman",
  "David Lim",
];
