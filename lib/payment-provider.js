/**
 * Stable boundary for payment handling. Manual review is the active provider;
 * a gateway can later implement the same normalized result shape.
 */
export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "manual";

export function normalizeManualPayment({ transactionId, screenshotUrl }) {
  if (!transactionId?.trim()) throw new Error("Transaction ID / UTR is required");
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(transactionId.trim())) throw new Error("Transaction ID / UTR must be 6–64 letters, numbers, hyphens or underscores");
  if (!screenshotUrl) throw new Error("Payment screenshot is required");
  return {
    provider: "manual",
    reference: transactionId.trim(),
    status: "pending",
    screenshotUrl,
    metadata: { submittedAt: new Date().toISOString() },
  };
}
