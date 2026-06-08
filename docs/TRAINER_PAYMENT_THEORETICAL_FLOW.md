# Trainer Payment Flow

This document explains the complete trainer payment and wallet flow in simple business terms. It avoids technical details and focuses on how the payment system should work from trainer, student, admin, and organisation perspectives.

## Purpose

The trainer payment system should make trainer earnings clear, fair, and controlled.

The system should allow:

- Students to pay once and join a recurring live session.
- Trainers to see their earnings clearly.
- Admin to control session price and revenue share.
- Trainers to add payout account details.
- Trainers to request payout only when eligible.
- Admin to approve, reject, or complete trainer payouts.
- Organisation and trainer earnings to be tracked without confusion.

## Main Idea

A trainer creates a recurring session, but the trainer does not decide the payment amount directly.

Admin decides:

- Session price
- Trainer share
- Platform share
- Whether the session is approved for student purchase

Students pay one time for a session. After payment, they can continue attending the recurring session until the trainer ends that session.

Trainer earns only from successful student payments.

## Main Roles

### Student

Student pays for a session and receives access.

Student flow:

```text
View session
Pay one-time amount
Join recurring class
Continue attending until session ends
```

### Trainer

Trainer creates and conducts sessions.

Trainer can:

```text
Create recurring session
View wallet
View session-wise earnings
Add payout account details
Request payout after eligibility period
Track payout history
```

Trainer cannot:

```text
Set session price
Change trainer share
Change platform share
Approve own payout
Receive payout before payout cycle opens
```

### Admin

Admin controls payment rules and payout approval.

Admin can:

```text
Set session price
Set trainer share
Set platform share
Approve session for sale
Verify trainer account details
Approve payout request
Reject payout request
Mark payout as paid
Add payment reference number
```

### Organisation / Platform

The platform receives its share from each successful student payment.

The platform is responsible for:

```text
Payment collection
Trainer earning calculation
Payout control
Payment records
Dispute/refund handling
```

## Complete Flow

### 1. Trainer Creates Session

Trainer creates a recurring live session.

Example:

```text
Python Full Stack Live Class
Daily at 7:00 PM
```

At this stage, the session is not yet fully ready for paid student enrollment unless admin has approved pricing and share.

### 2. Admin Sets Price and Share

Admin reviews the trainer session and sets the payment rule.

Example:

```text
Session price: Rs. 1000
Trainer share: 40%
Platform share: 60%
```

This means when one student pays Rs. 1000:

```text
Trainer earns Rs. 400
Platform keeps Rs. 600
```

The share must always equal 100%.

```text
Trainer share + Platform share = 100%
```

### 3. Student Pays Once

Student pays the session price once.

After successful payment:

```text
Student gets access to the recurring session
Student can join every day
Student does not need to pay daily
Access continues until trainer ends the session
```

Only successful payments should create trainer earnings.

Failed, cancelled, test, or refunded payments should not be counted as trainer earnings.

### 4. Trainer Wallet Updates

After student payment is successful, the trainer wallet should show the earning.

Wallet should clearly separate:

```text
Pending amount
Available amount
Requested amount
Paid amount
Held amount
```

This avoids confusion between money earned and money ready for payout.

### 5. Payout Cycle Opens

Trainer cannot request payout every day.

Recommended payout cycle:

```text
Every 15 days
```

Example:

```text
Earning period: June 1 to June 15
Payout request opens: June 16
```

Before the payout date, trainer can see the amount but cannot request it.

### 6. Trainer Adds Account Details

Trainer must add payout account details before requesting payout.

Required details:

```text
Account holder name
Bank name
Account number
Confirm account number
IFSC code
Account type
Phone number
```

Optional details:

```text
UPI ID
PAN number
```

Account details should have a status:

```text
Not added
Pending verification
Verified
Rejected
```

Trainer should not receive payout unless account details are valid.

### 7. Trainer Requests Payout

Trainer can request payout only if all conditions are satisfied:

```text
Payout cycle is open
Trainer has available balance
Available balance is above minimum payout amount
Trainer account is active
Payout account is added and verified
No other payout request is pending
```

Recommended first version:

```text
Trainer requests full available balance
```

This is better than allowing custom amounts because it reduces confusion and calculation mistakes.

### 8. Admin Reviews Payout Request

After trainer requests payout, admin reviews it.

Admin can:

```text
Approve
Reject
Mark as paid
```

If rejected, admin should give a reason.

Example:

```text
Account details mismatch
Bank verification failed
Payout under review
```

### 9. Trainer Receives Payment

After admin completes the payment, payout status becomes paid.

Trainer payout history should show:

```text
Amount paid
Paid date
Bank/account ending number
Payment reference / UTR
Admin note if any
```

## Trainer Payment Sidebar

Trainer dashboard should show a Payments section.

Recommended structure:

```text
Payments
  Wallet overview
  Session earnings
  Payout request
  Account details
  Payout history
```

## Wallet Overview

Wallet overview should explain the trainer's money clearly.

It should show:

```text
Total earnings
Pending balance
Available payout balance
Requested payout amount
Paid payouts
Held amount
Next payout date
Minimum payout amount
Account status
```

Recommended message:

```text
Your payout request opens every 15 days. Only available balance can be requested.
```

## Session Earnings

Session earnings should show how each session is performing.

It should show:

```text
Session name
Session price
Paid students
Gross revenue
Trainer share
Platform share
Trainer earning
Payment status
```

Example:

```text
Python Session
Price: Rs. 1000
Paid students: 20 dont show to trainer
Gross revenue: Rs. 20,000 dont show to trainer 
Trainer share: 40%
Trainer earning: Rs. 8,000
Platform share: 60% dont wnat to show 
Platform earning: Rs. 12,000 dont want to show
```

## Payout Request

Payout request section should clearly tell trainer whether payout can be requested or not.

Possible states:

```text
Request available
Request opens later
Add account details first
Account verification pending
Minimum payout not reached
Existing payout request pending
Trainer account inactive
```

If payout is available, trainer sees:

```text
Available amount
Bank name
Account ending number
Processing time
Request payout button
```

Before submitting, trainer should confirm:

```text
I confirm my account details are correct.
```

## Account Details

Account details section should allow trainer to add or update payout details.

It should clearly warn:

```text
Wrong account details may delay or block payout.
```

If account details are changed after a payout request, that old payout request should still use the account details saved at request time. This prevents confusion.

## Payout History

Payout history should show all past and current payout records.

It should include:

```text
Payout ID
Period
Amount
Status
Requested date
Approved date
Paid date
Reference / UTR
Admin note
Rejection reason
```

## Extra Recommended Features

### 1. Payment Hold

Admin should be able to hold trainer earnings if there is a refund, dispute, or suspicious payment.

Status:

```text
On hold
```

### 2. Refund Adjustment

If a student gets a refund after trainer earning is calculated, the system should adjust trainer balance.

If payout is not paid yet:

```text
Reduce available or pending balance
```

If payout already paid:

```text
Adjust from next payout cycle
```

### 3. Admin Notes

Admin should be able to add notes for payout actions.

Example:

```text
Rejected because IFSC code is invalid.
Payment completed through bank transfer.
```

### 4. Trainer Notification

Trainer should be notified when:

```text
Account details are verified
Payout request is submitted
Payout is approved
Payout is rejected
Payout is paid
```

### 5. Payment Reference

Every paid payout should have a reference number.

Example:

```text
UTR number
Bank reference number
Transaction ID
```

### 6. Minimum Payout Amount

Recommended minimum payout:

```text
Rs. 500
```

This avoids very small payout requests.

### 7. One Active Request Rule

Trainer should not be able to create multiple payout requests at the same time.

Allowed:

```text
One requested or processing payout at a time
```

### 8. Account Verification

Trainer account details should be verified before payout.

Possible verification flow:

```text
Trainer saves account details
Admin verifies details
Status becomes verified
Trainer can request payout
```

## Loopholes To Avoid

### Duplicate payout

Trainer should not receive payout twice for the same earning.

Prevention:

```text
Once amount is requested, it should move out of available balance.
```

### Early payout request

Trainer should not request before payout cycle opens.

Prevention:

```text
System must check payout date.
```

### Wrong account payout

Trainer may enter wrong account details.

Prevention:

```text
Account confirmation
Admin verification
Clear warning message
```

### Share mismatch

Trainer share and platform share must not exceed or fall below 100%.

Prevention:

```text
Admin must set valid share split.
```

### Refunded payment counted as earning

Refunded payment should not remain as trainer earning.

Prevention:

```text
Refund adjustment should be applied.
```

### Old share applied incorrectly

If admin changes share later, old student payments should not be accidentally recalculated.

Prevention:

```text
Each payment should keep the share rule used at payment time.
```

### Trainer changes account during payout

Trainer may update account details after request.

Prevention:

```text
Payout request should keep a snapshot of account details at request time.
```

## Clean Final Flow

```text
Trainer creates session
Admin sets price and share
Student pays once
Student gets recurring access
Trainer earning is calculated
Amount enters wallet
Amount becomes available after payout cycle
Trainer adds verified account details
Trainer requests payout
Admin reviews request
Admin approves or rejects
Admin pays trainer
Trainer sees payout history
```

## Final Recommendation

The safest first version should use this rule:

```text
Trainer can request only full available balance after 15 days.
```

Do not allow custom payout amount in the first version.

Do not allow payout without verified account details.

Do not allow more than one active payout request.

Keep all payout actions visible in history so trainer and admin both have a clear record.
