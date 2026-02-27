# Adsteric Dashboard — Technical Documentation

## 1. Dashboard Structure & Sections

The dashboard (`public/dashboard.html`) is a single-page app with these sidebar sections:

| Section | Route Fragment | Purpose |
|---|---|---|
| Home | `#home` | Welcome banner, quick-action cards, recent activity |
| Campaigns | `#campaigns` | List of all user campaigns + status |
| Create Campaign | `#create-campaign` | Form to submit a new campaign |
| Statistics | `#statistics` | Per-campaign daily stats table |
| Add Funds | `#add-funds` | Payment form + payment history |
| Profile | `#profile` | Edit account info / change password |
| Support | `#support` | Contact details |

The top navbar always shows the current **live balance** and an **Add Funds** shortcut button.

---

## 2. Email — When Sent and When NOT

### ✅ Emails ALWAYS sent (blocking — failure returns HTTP 500)

| Trigger | Recipient | Subject |
|---|---|---|
| User starts signup (Step 1) | New user | `Your Verification Code - Adsteric` |
| Forgot password (user) | User | `Password Reset Request` |
| Forgot password (admin) | Admin | `Admin Password Reset` |
| New payment request submitted | Company (`adstericteam@gmail.com`) | `Payment Request - $X.XX - user@email` |

### ✅ Emails ATTEMPTED (non-blocking — failure is silently logged, request still succeeds)

| Trigger | Recipient | Subject |
|---|---|---|
| Signup verified → account created | New user | `Welcome to Adsteric!` |
| Password reset completed (user) | User | `Password Changed Successfully` |
| Campaign created | User | `Campaign Created Successfully` |
| Campaign status changed by **user** | User | `Campaign Activated / Paused / Completed` |
| Campaign status changed by **admin** | User | `Campaign [Status]` |
| Campaign auto-paused due to **insufficient balance** | User | `Campaign Paused - Insufficient Balance` |

### ❌ Emails NEVER sent

- Sign-in / login events
- Profile update
- Balance top-up (when admin approves a payment, **no email is sent to the user** — the balance is just updated silently)
- Payment rejection (no email to user — only the dashboard notification bar shows the status)
- Campaign deletion
- Password change via Profile section
- Campaign pause/resume via the `/pause` and `/resume` API endpoints

---

## 3. Stats Generation — Full Formula

### 3A. Package Tier System

A user's tier is determined by their **`totalSpent`** (cumulative spend across all campaigns):

| Tier | Min Spent |
|---|---|
| standard | $0 |
| bronze | $301 |
| silver | $1,001 |
| gold | $3,001 |
| platinum | $8,001 |
| diamond | $25,001 |

The tier is recalculated each time the daily budget is deducted:
```
user.currentPackage = calculatePackageTier(user.totalSpent)
```

### 3B. Full Daily Stats Formula

Called once per campaign per day (at midnight via `scheduleDailyStatsGeneration`):

```
impressions  = random(tier.impressions.min, tier.impressions.max)
ctr          = random(tier.ctr.min, tier.ctr.max)          // %
clicks       = floor(impressions × ctr / 100)

convRate     = random(tier.conversionRate.min, tier.conversionRate.max)  // %
totalConv    = floor(clicks × convRate / 100)

approvedRate = random(tier.approvedRate.min, tier.approvedRate.max)       // %
holdRate     = random(tier.holdRate.min, tier.holdRate.max)               // %
approved     = floor(totalConv × approvedRate / 100)
hold         = floor(totalConv × holdRate / 100)
declined     = max(0, totalConv − approved − hold)

ppc          = random(tier.payoutPerConversion.min, tier.payoutPerConversion.max)
payApproved  = approved × ppc
payHold      = hold     × ppc × 0.8      // 80% payout on hold
payDeclined  = declined × ppc × 0.3      // 30% payout on declined
totalPayout  = payApproved + payHold + payDeclined

spent        = min(dailyBudget, dailyBudget × random(0.85, 1.0))

epc          = totalPayout / clicks       // earnings per click
```

Tier multiplier ranges for reference:

| Tier | Impressions | CTR % | Conv. Rate % | Approved % | Hold % | Declined % | Payout/Conv |
|---|---|---|---|---|---|---|---|
| standard | 1K–3K | 1.5–2.5 | 2.0–4.0 | 60–70 | 15–20 | 10–20 | $3–8 |
| bronze | 3K–8K | 2.0–3.5 | 3.0–5.0 | 65–75 | 12–18 | 7–15 | $5–10 |
| silver | 8K–20K | 2.5–4.0 | 3.5–6.0 | 70–80 | 10–15 | 5–10 | $8–15 |
| gold | 20K–50K | 3.0–5.0 | 4.0–7.0 | 75–85 | 8–12 | 3–8 | $12–20 |
| platinum | 50K–150K | 3.5–6.0 | 5.0–8.5 | 80–90 | 5–10 | 2–5 | $18–30 |
| diamond | 150K–500K | 4.0–7.5 | 6.0–10.0 | 85–95 | 3–7 | 1–3 | $25–50 |

### 3C. Incremental Stats Formula

Runs **every 15 minutes** via `scheduleIncrementalStatsGeneration` to simulate live traffic throughout the day:

```
factor       = random(0.008, 0.015)     // ~1% of a full day's stats per tick

impressions  = floor(full.impressions × factor)
clicks       = floor(full.clicks × factor)
totalConv    = floor(full.conversions.total × factor)
approved     = floor(totalConv × 0.65)  // fixed 65%
hold         = floor(totalConv × 0.20)  // fixed 20%
declined     = max(0, totalConv − approved − hold)

spent        = dailyBudget × factor × random(0.85, 1.0)
```

After each increment, the live metrics are recalculated:
```
ctr            = (totalClicks / totalImpressions) × 100
conversionRate = (totalConversions / totalClicks) × 100
epc            = totalPayouts / totalClicks
```

### 3D. Daily Budget Deduction (runs at midnight)

For each active campaign:
- If `campaign.statistics.spent >= campaign.totalBudget` → campaign is set to `completed`
- If `user.balance >= campaign.dailyBudget` → deduct `dailyBudget` from balance, add to `totalSpent`, recalculate tier
- If `user.balance < campaign.dailyBudget` → campaign is set to `paused`, **email sent** to user

---

## 4. Campaign Lifecycle

```
[Created] → pending (1.5 hours) → active
                                      ↓
                              incremental stats every 15 min
                              full daily stats at midnight
                                      ↓
                 user pauses → paused ←→ resumed → active
                 budget exhausted → completed
                 insufficient balance → paused (+ email)
                 admin rejects → rejected (cannot be reactivated)
```

- **Cannot edit** an active campaign — must pause first
- **Cannot delete** an active campaign — must pause first
- **Cannot reactivate** a rejected or completed campaign

---

## 5. Payment Flow

1. User submits amount + card/PayPal details via the Add Funds form
2. A `PaymentRequest` is saved with `status: pending`
3. **Only one pending request is allowed at a time**
4. An email is sent to **`adstericteam@gmail.com`** with full card/PayPal details
5. Admin reviews in `admin-dashboard.html` and approves or rejects
6. On **approval**: `user.balance += amount` — **no email to user**
7. On **rejection**: reason is stored — **no email to user**
8. The dashboard's notification bar reads the payment status on load and shows a green (approved) or red (rejected) banner

---

## 6. Authentication & Security

- Passwords hashed with **bcryptjs** (10 salt rounds) before storage
- JWT tokens expire in **7 days**, stored client-side
- Signup is **2-step**: verification code (expires in 10 min) → account creation
- Password reset tokens are SHA-256 hashed in DB, expire in **1 hour**
- Admin tokens carry a `role` claim (`admin` / `superadmin`); all admin routes verify this
