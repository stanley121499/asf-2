/**
 * Points system configuration
 * 
 * Environment variables for configuring the points system:
 * - REACT_APP_POINTS_EARN_PERCENTAGE: Percentage of order total converted to points (default: 5%)
 * - REACT_APP_POINTS_PER_RM: How many points equal 1 RM (default: 100 points = 1 RM)
 */

export const POINTS_CONFIG = {
  /** Percentage of order total that gets converted to points (when not using points for discount) */
  EARN_PERCENTAGE: parseFloat(process.env.REACT_APP_POINTS_EARN_PERCENTAGE || "5") / 100,
  
  /** How many points equal 1 RM */
  POINTS_PER_RM: parseInt(process.env.REACT_APP_POINTS_PER_RM || "100", 10),
} as const;

/**
 * Calculate points earned from an order total
 */
export const calculatePointsEarned = (orderTotal: number): number => {
  // 5% of the order total as points directly
  // Example: RM 1000 * 5% = 50 points
  return Math.floor(orderTotal * POINTS_CONFIG.EARN_PERCENTAGE);
};

/**
 * Convert points to RM value
 */
export const pointsToRM = (points: number): number => {
  return points / POINTS_CONFIG.POINTS_PER_RM;
};

/**
 * Convert RM to points value
 */
export const rmToPoints = (rm: number): number => {
  return Math.floor(rm * POINTS_CONFIG.POINTS_PER_RM);
};

/**
 * Format currency in RM
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
};
