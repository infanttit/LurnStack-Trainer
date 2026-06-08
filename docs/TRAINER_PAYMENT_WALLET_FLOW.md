# Trainer Payment and Wallet Flow

This document defines the planned trainer-side payment, wallet, payout request, and payout account flow for the LurnStack trainer portal.

## Goal

Trainer should be able to:

- View earnings from paid recurring sessions.
- See how student payments are split between trainer and platform.
- Add or update payout account details.
- Request payout only when eligible.
- Track payout request and payout history.

The frontend can be built first with mock data. Backend APIs can replace the mock data later.

## Current Business Model

1. Trainer creates a recurring live session.
2. Admin sets the session price and trainer/platform share.
3. Student pays once using the existing Razorpay student payment flow.
4. Student can attend the recurring session every day until the trainer ends the session.
5. Trainer earns only after successful student payment.
6. Trainer can request payout only after the payout cycle opens.
7. Admin approves and pays the trainer manually or through payout integration.

## Payment Example

```text
Session price: Rs. 1000
Paid students: 20
Gross revenue: Rs. 20,000

Trainer share: 40%
Platform share: 60%

Trainer earning: Rs. 8,000
Platform earning: Rs. 12,000
```

Formula:

```text
grossRevenue = sessionPrice * paidStudents
trainerEarning = grossRevenue * trainerSharePercentage / 100
platformEarning = grossRevenue * platformSharePercentage / 100
trainerSharePercentage + platformSharePercentage = 100
```

## Trainer Payment Sidebar

Payments should be a collapsible sidebar section:

```text
Payments
  Wallet overview
  Session earnings
  Payout request
  Account details
  Payout history
```

## Wallet Overview

Wallet overview should show:

```text
Total trainer earnings
Pending balance
Available payout balance
Requested payout amount
Paid payouts
Next payout date
Current payout cycle
Minimum payout amount
Payout account status
```

Recommended wallet statuses:

```text
pending
available
requested
processing
paid
rejected
on_hold
```

Status meaning:

```text
pending     -> student paid, but amount is not eligible for payout yet
available   -> amount can be requested by trainer
requested   -> trainer submitted payout request
processing  -> admin approved or payment is being processed
paid        -> trainer received payout
rejected    -> admin rejected payout request
on_hold     -> amount is held because of dispute/refund/admin review
```

## Session Earnings

Session earnings should show session-wise revenue:

```text
Session title
Admin-set price
Paid students
Gross revenue
Trainer share percentage
Platform share percentage
Trainer earning
Platform earning
Earning status
```

Important rule:

```text
Trainer earning should be calculated from successful paid students only.
```

Do not calculate trainer earning from:

```text
failed payments
cancelled payments
refunded payments
free enrollments
test orders
```

## Payout Request

Trainer can request payout only when all rules pass:

```text
Payout window is open
Available balance is greater than or equal to minimum payout amount
Trainer has valid payout account details
No existing requested/processing payout is active
Trainer account is active
```

Recommended payout cycle:

```text
Every 15 days
```

Example:

```text
Cycle period: June 1 - June 15
Request opens: June 16
```

Before request date, button should be disabled:

```text
Payout request opens on 16 Jun 2026
```

After request date, button should be enabled:

```text
Request payout
```

Recommended first version:

```text
Trainer requests full available balance.
Trainer cannot manually enter custom payout amount.
```

This avoids mismatch between frontend amount and backend eligible amount.

## Payout Request Confirmation

Before submitting payout request, show confirmation:

```text
You are requesting Rs. 18,700

Payout account:
HDFC Bank
Account ending 4321

Processing time:
1-3 working days after admin approval
```

After trainer confirms:

```text
Create payout request
Move amount status from available to requested
Show request in payout history
Disable new payout request until current request is resolved
```

## Account Details

Trainer must add payout account details before requesting payout.

Required fields:

```text
Account holder name
Bank name
Account number
Confirm account number
IFSC code
Account type: Savings / Current
Phone number
```

Optional fields:

```text
UPI ID
PAN number
```

Account status:

```text
not_added
pending_verification
verified
rejected
```

Frontend validation:

```text
Account holder name is required
Bank name is required
Account number is required
Confirm account number must match account number
IFSC code is required
Account type is required
Phone number is required
UPI ID format should be valid if entered
PAN format should be valid if entered
```

Recommended UX copy:

```text
Wrong account details may delay payout. Please check carefully before saving.
```

## Payout History

Payout history should show:

```text
Payout ID
Period start
Period end
Amount
Status
Requested date
Approved date
Paid date
Reference / UTR
Admin note
Rejection reason
```

## Expected Frontend Mock Data Shape

```js
{
  summary: {
    totalEarnings: 48500,
    pendingEarnings: 11200,
    payableEarnings: 18700,
    requestedEarnings: 0,
    paidEarnings: 18600,
    grossRevenue: 121500,
    platformEarnings: 73000,
    nextPayoutDate: "2026-06-16",
    payoutCycle: "Every 15 days",
    minimumPayoutAmount: 500
  },
  eligibility: {
    isWindowOpen: true,
    canRequestPayout: true,
    reason: "",
    cycleStart: "2026-06-01",
    cycleEnd: "2026-06-15",
    requestOpensAt: "2026-06-16"
  },
  payoutAccount: {
    status: "verified",
    accountHolderName: "Trainer Name",
    bankName: "HDFC Bank",
    accountNumberLast4: "4321",
    accountType: "Savings",
    ifscCode: "HDFC0001234",
    upiId: "",
    panNumber: ""
  },
  sessionEarnings: [],
  payoutRequests: [],
  payouts: []
}
```

## Backend API Plan

Trainer APIs:

```text
GET   /api/trainer/wallet
GET   /api/trainer/session-earnings
GET   /api/trainer/payout-account
PATCH /api/trainer/payout-account
POST  /api/trainer/payout-requests
GET   /api/trainer/payouts
```

Admin APIs:

```text
GET   /api/admin/trainer-payout-requests
PATCH /api/admin/trainer-payout-requests/:id/approve
PATCH /api/admin/trainer-payout-requests/:id/reject
PATCH /api/admin/trainer-payout-requests/:id/mark-paid
```

## Backend Rules

Backend must enforce payout rules. Frontend validation is only for UX.

Backend should check:

```text
Trainer is authenticated
Trainer role is valid
Trainer account is active
Payout account exists
Payout account is verified
Payout window is open
Available amount is correct
Minimum payout amount is reached
No duplicate pending/processing payout request exists
```

## Likely Bugs and Difficulties

### 1. Double payout request

Problem:

```text
Trainer clicks request payout multiple times.
```

Fix:

```text
Frontend disables button while submitting.
Backend must block duplicate active payout requests.
```

### 2. Wrong available balance

Problem:

```text
Frontend mock or stale API data shows old wallet balance.
```

Fix:

```text
Backend recalculates payout amount during request creation.
Frontend should display backend-confirmed amount after submit.
```

### 3. Refund after trainer earning is calculated

Problem:

```text
Student payment is refunded after earning was counted.
```

Fix:

```text
Backend should reduce pending/available balance or create adjustment entry.
Already paid refunds may become negative adjustment in next payout cycle.
```

### 4. Admin changes share after students already paid

Problem:

```text
Admin changes trainer share from 40% to 35% after payments exist.
```

Fix:

```text
Each payment earning record should store the share percentage used at payment time.
Do not recalculate old paid orders using new share values unless admin explicitly runs adjustment.
```

### 5. Trainer edits bank account during processing

Problem:

```text
Trainer changes account details after payout request was submitted.
```

Fix:

```text
Payout request should snapshot bank details at request time.
Changing account details should not silently change an already submitted request.
```

### 6. Account verification

Problem:

```text
Trainer enters invalid account or IFSC.
```

Fix:

```text
Frontend validates format.
Backend/admin verifies account before allowing payout.
```

### 7. Timezone payout date issue

Problem:

```text
Request opens too early or late because server/client timezone differs.
```

Fix:

```text
Backend should return explicit requestOpensAt and isWindowOpen.
Frontend should not calculate eligibility alone.
```

### 8. Razorpay payment success but enrollment not created

Problem:

```text
Student paid, but access/earning was not created due to webhook failure.
```

Fix:

```text
Use Razorpay webhook verification.
Create idempotent payment processing.
Reconcile payments from Razorpay if webhook fails.
```

### 9. Session ended after student payment

Problem:

```text
Trainer ends recurring session after students paid.
```

Fix:

```text
Student access stops because session is ended.
Trainer earnings from already successful payments remain valid unless refund policy says otherwise.
```

### 10. Platform share mismatch

Problem:

```text
Trainer share + platform share is not 100.
```

Fix:

```text
Admin UI and backend validation must enforce total = 100.
```

## Recommended Database Concepts

Tables or collections:

```text
trainer_wallet_ledger
trainer_payout_accounts
trainer_payout_requests
trainer_payouts
session_payment_earnings
```

Ledger approach is recommended because it gives audit history.

Example wallet ledger entry:

```text
payment_earning
payout_requested
payout_paid
refund_adjustment
admin_adjustment
```

## Frontend Implementation Order

1. Extend mock data.
2. Add sidebar payment dropdown items:

```text
Wallet overview
Session earnings
Payout request
Account details
Payout history
```

3. Add account details form.
4. Add payout request card and confirmation modal.
5. Add validation and disabled states.
6. Add mock request behavior.
7. Build and test frontend.
8. After approval, connect backend APIs.

## Final Recommended Flow

```text
Student pays once
  -> Payment success verified
  -> Student gets recurring session access
  -> Earning ledger entry created
  -> Trainer wallet updates
  -> Amount becomes available after payout cycle
  -> Trainer adds verified payout account
  -> Trainer requests full available balance
  -> Admin approves/rejects
  -> Admin marks paid with UTR/reference
  -> Trainer sees payout in history
```
