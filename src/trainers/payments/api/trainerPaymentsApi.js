import { axiosClient } from "../../../shared/api/axiosClient";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "../../../shared/api/axiosError";

const PAYMENT_ERROR_FALLBACK = "Unable to load trainer payment details.";

function unwrap(res) {
  const data = res?.data;
  if (!data?.success) throw new Error(data?.message || "Request failed");
  return data.data;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function paiseToRupees(value) {
  return toNumber(value) / 100;
}

function getArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.earnings)) return payload.earnings;
  if (Array.isArray(payload?.requests)) return payload.requests;
  return [];
}

function normalizeStatus(value, fallback = "pending") {
  return String(value || fallback).trim().toLowerCase();
}

export function normalizePaymentSummary(dto = {}) {
  return {
    totalEarnings: paiseToRupees(dto.totalEarningsPaise),
    pendingEarnings: paiseToRupees(dto.pendingEarningsPaise),
    availableBalance: paiseToRupees(dto.availableBalancePaise),
    payableEarnings: paiseToRupees(dto.availableBalancePaise),
    lockedAmount: paiseToRupees(dto.lockedAmountPaise),
    requestedEarnings: paiseToRupees(dto.requestedAmountPaise),
    paidEarnings: paiseToRupees(dto.paidAmountPaise),
    heldEarnings: 0,
    minimumPayoutAmount: paiseToRupees(dto.minimumPayoutPaise || 50000),
    payoutCycle: dto.payoutCycleDays ? `Every ${dto.payoutCycleDays} days` : "Every 15 days",
    payoutBlockReason: dto.payoutBlockReason || "",
    payoutAccountStatus: dto.payoutAccountStatus || "",
    hasActiveRequest: Boolean(dto.hasActiveRequest),
    activeRequestStatus: dto.activeRequestStatus || "",
    raw: dto,
  };
}

export function normalizeEligibility(dto = {}) {
  return {
    isWindowOpen: Boolean(dto.isPayoutWindowOpen),
    canRequestPayout: Boolean(dto.isPayoutWindowOpen) && !dto.payoutBlockReason,
    reason: dto.payoutBlockReason || "",
    cycleStart: dto.cycleStart || "",
    cycleEnd: dto.cycleEnd || "",
    requestOpensAt: dto.nextPayoutDate || dto.cycleEnd || "",
    processingTime: "1-3 working days after admin approval",
  };
}

export function normalizeSessionEarning(dto = {}) {
  return {
    id: String(dto.id || dto.earningId || dto.sessionId || ""),
    sessionId: String(dto.sessionId || dto.id || ""),
    sessionTitle: dto.sessionTitle || dto.title || "Live session",
    adminSetPrice: paiseToRupees(dto.sessionPricePaise ?? dto.priceInPaise),
    paidStudents: toNumber(dto.paidStudentCount ?? dto.paidStudents),
    trainerSharePercent: toNumber(dto.trainerSharePercentage ?? dto.trainerSharePercent),
    trainerEarning: paiseToRupees(dto.finalPayablePaise ?? dto.trainerEarningPaise),
    refundAdjustment: paiseToRupees(dto.refundAdjustmentPaise),
    status: normalizeStatus(dto.status),
    availableFrom: dto.availableFrom || "",
    createdAt: dto.createdAt || "",
    updatedAt: dto.updatedAt || "",
    raw: dto,
  };
}

export function normalizePayoutAccount(dto = {}) {
  const hasAccount = Boolean(dto.id || dto.accountHolderName || dto.bankName || dto.status);
  return {
    id: dto.id || "",
    accountHolderName: dto.accountHolderName || "",
    bankName: dto.bankName || "",
    accountNumber: "",
    maskedAccountNumber: dto.maskedAccountNumber || "",
    accountNumberLast4: dto.accountNumberLast4 || "",
    ifscCode: dto.ifsc || dto.ifscCode || "",
    accountType: dto.accountType || "Savings",
    phoneNumber: dto.phoneNumber || "",
    upiId: dto.upiId || "",
    panNumber: dto.pan || dto.panNumber || "",
    status: hasAccount ? normalizeStatus(dto.status) : "missing",
    rejectionReason: dto.rejectionReason || "",
    isLocked: Boolean(dto.isLocked),
    createdAt: dto.createdAt || "",
    updatedAt: dto.updatedAt || "",
    raw: dto,
  };
}

export function normalizePayoutRequest(dto = {}) {
  const snapshot = dto.payoutAccountSnapshot || {};
  return {
    id: String(dto.id || dto.requestId || ""),
    amount: paiseToRupees(dto.requestedAmountPaise ?? dto.amountPaise),
    requestedAmount: paiseToRupees(dto.requestedAmountPaise ?? dto.amountPaise),
    status: normalizeStatus(dto.status, "requested"),
    periodStart: dto.periodStart || dto.cycleStart || "",
    periodEnd: dto.periodEnd || dto.cycleEnd || "",
    requestedAt: dto.requestedDate || dto.createdAt || "",
    approvedAt: dto.approvedAt || "",
    processingAt: dto.processingAt || "",
    paidAt: dto.paidAt || dto.manualPaidDate || "",
    manualPaidDate: dto.manualPaidDate || "",
    reference: dto.utrReference || dto.reference || "",
    utrReference: dto.utrReference || dto.reference || "",
    adminNote: dto.adminNote || dto.rejectionReason || "",
    rejectionReason: dto.rejectionReason || "",
    payoutAccountSnapshot: {
      ...snapshot,
      bankName: snapshot.bankName || "",
      accountNumberLast4: snapshot.accountNumberLast4 || "",
      maskedAccountNumber: snapshot.maskedAccountNumber || "",
    },
    raw: dto,
  };
}

function paymentError(err, fallback = PAYMENT_ERROR_FALLBACK) {
  const status = getAxiosErrorStatus(err);
  if (status === 401) return "Please log in as a trainer to continue.";
  if (status === 403) return "You do not have access to trainer payment details.";
  if (status >= 500) return "Trainer payment service is unavailable. Please try again later.";
  return getAxiosErrorMessage(err, fallback);
}

export async function getTrainerPaymentSummary() {
  try {
    const data = unwrap(await axiosClient.get("/api/trainer/payment-summary"));
    return {
      earnings: normalizePaymentSummary(data),
      eligibility: normalizeEligibility(data),
    };
  } catch (err) {
    throw new Error(paymentError(err));
  }
}

export async function getTrainerSessionEarningsList(params = {}) {
  try {
    const data = unwrap(await axiosClient.get("/api/trainer/session-earnings", { params }));
    return getArray(data).map(normalizeSessionEarning);
  } catch (err) {
    throw new Error(paymentError(err, "Unable to load session earnings."));
  }
}

export async function getTrainerPayoutAccount() {
  try {
    const data = unwrap(await axiosClient.get("/api/trainer/payout-account"));
    return normalizePayoutAccount(data || {});
  } catch (err) {
    if (getAxiosErrorStatus(err) === 404) return normalizePayoutAccount({});
    throw new Error(paymentError(err, "Unable to load payout account."));
  }
}

export async function saveTrainerPayoutAccount(account, { hasExistingAccount = false } = {}) {
  try {
    const payload = {
      accountHolderName: account.accountHolderName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      confirmAccountNumber: account.confirmAccountNumber,
      ifsc: account.ifscCode,
      ifscCode: account.ifscCode,
      accountType: account.accountType,
      phoneNumber: account.phoneNumber,
      upiId: account.upiId,
      pan: account.panNumber,
      panNumber: account.panNumber,
    };
    const request = hasExistingAccount
      ? axiosClient.patch("/api/trainer/payout-account", payload)
      : axiosClient.post("/api/trainer/payout-account", payload);
    return normalizePayoutAccount(unwrap(await request));
  } catch (err) {
    throw new Error(paymentError(err, "Unable to save payout account."));
  }
}

export async function getTrainerPayoutRequests(params = {}) {
  try {
    const data = unwrap(await axiosClient.get("/api/trainer/payout-requests", { params }));
    return getArray(data).map(normalizePayoutRequest);
  } catch (err) {
    throw new Error(paymentError(err, "Unable to load payout history."));
  }
}

export async function createTrainerPayoutRequest(amount) {
  try {
    const amountPaise = Math.round(toNumber(amount) * 100);
    const data = unwrap(await axiosClient.post("/api/trainer/payout-requests", { amountPaise }));
    return normalizePayoutRequest(data);
  } catch (err) {
    throw new Error(paymentError(err, "Unable to submit payout request."));
  }
}
