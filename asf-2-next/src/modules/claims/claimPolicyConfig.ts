/**
 * Configurable claim policy for the Post-Purchase Claims module.
 * Swap this config per client deployment without changing module logic.
 */

/** Resolution outcomes staff may grant. */
export type ClaimResolution =
  | "refund"
  | "replacement"
  | "repair"
  | "store_credit"
  | "reject";

/** Claim lifecycle status stored in `claims.status`. */
export type ClaimStatus =
  | "submitted"
  | "in_review"
  | "needs_info"
  | "approved"
  | "rejected"
  | "resolved";

/** A single claim type customers can select. */
export interface ClaimTypeConfig {
  key: string;
  label: string;
  /** Days after order delivery/completion when this claim type is eligible. */
  eligibleDaysAfterDelivery: number;
  requiresOrderItem: boolean;
  requiresPhotos: boolean;
  examplesCovered: readonly string[];
  examplesNotCovered: readonly string[];
  allowedResolutions: readonly ClaimResolution[];
}

/** Full module policy configuration. */
export interface ClaimPolicyConfig {
  moduleLabel: string;
  productPolicyTitle: string;
  productCareTitle: string;
  shippingPolicyTitle: string;
  claimTypes: readonly ClaimTypeConfig[];
  /** Generic covered / not-covered bullets shown on product page. */
  policyCoveredExamples: readonly string[];
  policyNotCoveredExamples: readonly string[];
  /** Product care copy (shoe-specific in default config). */
  careInstructions: string;
  /** Shipping and return window copy for product page. */
  shippingReturnCopy: string;
}

/**
 * Default shoe-store configuration.
 * For another vertical (e.g. herb store), replace labels and claim types only.
 */
export const DEFAULT_CLAIM_POLICY_CONFIG: ClaimPolicyConfig = {
  moduleLabel: "Warranty & Returns",
  productPolicyTitle: "保固与退换",
  productCareTitle: "材质与保养",
  shippingPolicyTitle: "配送与退货",
  claimTypes: [
    {
      key: "manufacturing_defect",
      label: "制造缺陷",
      eligibleDaysAfterDelivery: 90,
      requiresOrderItem: true,
      requiresPhotos: true,
      examplesCovered: [
        "鞋底开胶",
        "缝线脱落",
        "鞋眼/五金损坏",
        "材质缺陷",
      ],
      examplesNotCovered: [
        "正常磨损",
        "折痕",
        "刮痕",
        "水渍损坏",
        "户外穿着后尺码不合",
      ],
      allowedResolutions: ["replacement", "repair", "store_credit", "reject"],
    },
    {
      key: "size_exchange",
      label: "尺码退换",
      eligibleDaysAfterDelivery: 30,
      requiresOrderItem: true,
      requiresPhotos: false,
      examplesCovered: ["未穿着的尺码不合", "吊牌完好"],
      examplesNotCovered: ["已户外穿着", "鞋底有污渍"],
      allowedResolutions: ["replacement", "store_credit", "reject"],
    },
    {
      key: "wrong_item",
      label: "发错商品",
      eligibleDaysAfterDelivery: 30,
      requiresOrderItem: true,
      requiresPhotos: true,
      examplesCovered: ["收到错误颜色或尺码", "收到错误款式"],
      examplesNotCovered: ["下单时选错规格"],
      allowedResolutions: ["replacement", "refund", "reject"],
    },
    {
      key: "delivery_damage",
      label: "运输损坏",
      eligibleDaysAfterDelivery: 14,
      requiresOrderItem: true,
      requiresPhotos: true,
      examplesCovered: ["包裹破损", "鞋盒压坏导致商品受损"],
      examplesNotCovered: ["外包装轻微磨损但商品完好"],
      allowedResolutions: ["replacement", "refund", "store_credit", "reject"],
    },
  ],
  policyCoveredExamples: [
    "制造缺陷（开胶、断线、五金损坏）",
    "90天内质量问题保固",
    "30天内未穿着尺码退换",
  ],
  policyNotCoveredExamples: [
    "正常磨损、折痕、刮痕",
    "水渍、异味、人为损坏",
    "户外穿着后的退换",
  ],
  careInstructions:
    "请用软布轻拭鞋面，避免长时间浸泡。存放于阴凉干燥处，使用鞋撑保持鞋型。不可机洗。",
  shippingReturnCopy:
    "标准配送。30天内未穿着商品可免费退换。制造缺陷享90天保固。",
};

/** Active policy — import and replace for another client vertical. */
export const claimPolicyConfig: ClaimPolicyConfig = DEFAULT_CLAIM_POLICY_CONFIG;

/**
 * Finds a claim type config by key.
 */
export function getClaimTypeConfig(key: string): ClaimTypeConfig | undefined {
  return claimPolicyConfig.claimTypes.find((t) => t.key === key);
}

/**
 * Human-readable status label for UI.
 */
export function getClaimStatusLabel(status: string | null): string {
  const key = (status ?? "").trim().toLowerCase();
  switch (key) {
    case "submitted":
      return "已提交";
    case "in_review":
      return "审核中";
    case "needs_info":
      return "需补充资料";
    case "approved":
      return "已批准";
    case "rejected":
      return "已拒绝";
    case "resolved":
      return "已解决";
    default:
      return "处理中";
  }
}

/**
 * Human-readable resolution label for UI.
 */
export function getClaimResolutionLabel(resolution: string | null): string {
  const key = (resolution ?? "").trim().toLowerCase();
  switch (key) {
    case "refund":
      return "退款";
    case "replacement":
      return "换货";
    case "repair":
      return "维修";
    case "store_credit":
      return "店铺积分/抵扣";
    case "reject":
      return "拒绝";
    default:
      return resolution ?? "—";
  }
}
