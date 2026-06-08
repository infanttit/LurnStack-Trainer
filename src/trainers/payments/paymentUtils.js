export function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getEarningStatusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (value === "payable") return "bg-blue-50 text-blue-700 border-blue-100";
  if (value === "requested" || value === "processing") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (value === "on hold" || value === "on_hold" || value === "rejected") {
    return "bg-red-50 text-red-700 border-red-100";
  }
  return "bg-amber-50 text-amber-700 border-amber-100";
}

export function getAccountLast4(account) {
  const explicit = account?.accountNumberLast4;
  if (explicit) return explicit;
  return String(account?.accountNumber || "").slice(-4);
}

export function createAccountForm(account = {}) {
  return {
    accountHolderName: account.accountHolderName || "",
    bankName: account.bankName || "",
    accountNumber: account.accountNumber || "",
    confirmAccountNumber: account.accountNumber || "",
    ifscCode: account.ifscCode || "",
    accountType: account.accountType || "Savings",
    phoneNumber: account.phoneNumber || "",
    upiId: account.upiId || "",
    panNumber: account.panNumber || "",
  };
}

export function getMockEarnings(mock) {
  return {
    ...mock.summary,
    sessionEarnings: mock.sessionEarnings,
  };
}

export function getPayoutBlockReason({
  earnings,
  eligibility,
  payoutAccount,
  payoutRequests,
  isTrainerActive,
}) {
  const activeRequest = payoutRequests.find((request) =>
    ["requested", "processing"].includes(String(request.status || "").toLowerCase())
  );
  if (!isTrainerActive) return "Trainer account is inactive.";
  if (activeRequest) return "A payout request is already pending.";
  if (payoutAccount?.status !== "verified") return "Add and verify payout account details first.";
  if (!eligibility?.isWindowOpen) return `Payout request opens on ${formatDate(eligibility?.requestOpensAt)}.`;
  const withdrawableAmount = Number(earnings.payableEarnings || 0) + Number(earnings.heldEarnings || 0);
  if (withdrawableAmount < Number(earnings.minimumPayoutAmount || 0)) {
    return `Minimum payout amount is ${formatMoney(earnings.minimumPayoutAmount)}.`;
  }
  if (withdrawableAmount <= 0) return "No available payout balance.";
  return "";
}
