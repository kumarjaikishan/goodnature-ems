# DECISIONS.md — Architectural Decisions & Core Design Choices

This document lists foundational architectural decisions that must not be altered casually without clear requirements and careful review.

---

## 1. Dual-Core System (EMS + Plot Real Estate)
- **Decision**: Keep the Employee Attendance System and the Plot / Real Estate Booking System within the same unified backend and database instance.
- **Rationale**: Sponsors and plot managers frequently overlap with organizational staff, branches, and user management. Unifying them reduces microservice latency and infrastructure maintenance overhead.

## 2. Universal Timezone Normalization (`Asia/Kolkata` with UTC Midnight Storage)
- **Decision**: All attendance days are normalized and stored as UTC midnight representing the calendar date in `Asia/Kolkata` (IST), while server instances run in `TZ=UTC`.
- **Rationale**: Prevents day-boundary shifting issues across daylight saving / local server offsets, ensuring accurate queries for "today's punches" or "monthly attendance sheets".

## 3. Hybrid Permission Model (RBAC + ABAC with Redis Caching)
- **Decision**: Access control combines high-level roles (`superadmin`, `admin`, `manager`, `employee`, `developer`) with a granular resource-to-action permission matrix (`1: Read, 2: Create, 3: Update, 4: Delete`) cached in Redis with a 15-day TTL and Mongo fallback.
- **Rationale**: Allows enterprise customization of manager capabilities per department or branch without modifying backend route logic.

## 4. In-Memory Ring-Buffer for API Performance Observability
- **Decision**: API latency statistics are gathered via an in-memory ring buffer (`MAX_RECORDS_PER_ENDPOINT = 30`) keyed by parameterized route patterns, rather than writing performance telemetry to disk or MongoDB.
- **Rationale**: Eliminates DB write overhead on hot request paths and avoids database lock contention.

## 5. Dedicated Plot Scheduler Separation
- **Decision**: Cron jobs for hold expiry (`plotHoldScheduler.js`) and weekly payouts (`plotPayoutScheduler.js`) are isolated into the `server/cron/` directory and invoked on application startup.
- **Rationale**: Isolates batch business logic from live request processing.

## 6. Unified Good Nature Frontend Theme & Symmetrical Loaders
- **Decision**: The entire frontend uses a standardized Good Nature Emerald/Teal brand design system (`--color-primary: #0f766e` / `teal-700` / `teal-800` / `emerald-600`) with standardized symmetrical page loaders (`<PageLoader />`), eliminating fragmented ad-hoc colors (`indigo-600`, `purple-600`).
- **Rationale**: Establishes high-trust, consistent visual polish across all EMS and Plot modules.

## 7. Collection-Based Sponsor Commission Calculation
- **Decision**: Sponsor commissions are earned and credited strictly on a **Collection Basis** (per receipt / payment collected, e.g. downpayment or monthly EMI installment) using the booking's locked tenure matrix slab percentages, rather than on the gross plot value upfront.
- **Rationale**: Ensures commission payouts are synchronized with real incoming cash flow.

## 8. Treasury Multi-Ledger & In-Transit Maker-Checker Transfer Architecture
- **Decision**: Cashier physical cash is modeled via dedicated `ledgerType: 'user_cash'` ledgers assigned to staff, corporate bank accounts via `ledgerType: 'bank'`, and inter-account movements require Maker-Checker 2-step approvals (`FundTransfer`). During `PENDING` transfers, available balance is calculated as $\text{Available} = \text{Current Balance} - \text{Pending In-Transit Transfers}$ without prematurely writing ledger entries.
- **Rationale**: Prevents ledger balance drift upon transfer rejection/cancellation, prevents double-spending / overdrafts, and guarantees mathematical balance integrity through atomic double-entry bookkeeping upon approval.

## 9. 3-Tier Sales Hierarchy & Branch Entity Commission Ledger (Branch -> Business Partner -> Business Associate)
- **Decision**: Model the physical `Branch` itself as a first-class Ledger entity (`ledgerType: 'branch'`, `branchId: branch._id`) rather than assigning a single individual sponsor or employee as the branch commission recipient.
  - **Why Branch Entity over Personal Manager/Sponsor**: A branch typically has multiple assigned Branch Managers (`managerIds`) who are salaried employees on Payroll (TDS Section 192), whereas commission overrides are corporate franchise/branch earnings (TDS Section 194H). Conflating them into an individual's personal ledger corrupted payroll and ledger statements.
  - **Automatic 0.5% Branch Override**: When plot or product collections occur, a 0.5% branch override is automatically credited to the Branch's universal ledger account (`source: 'commission_branch'`, `branchId`).
  - **Quarterly / Period Incentive Closings**: In Incentive Closings (`PlotClosing`), Section 3 directly evaluates the Branch entity (`commissionRole: 'BRANCH_OVERRIDE'`) against Section 3 Target & Extra Slabs using the branch's period turnover.
  - **Dedicated Ledger & RBAC Permission**: Branch ledgers are accessed at `/dashboard/ledger/branch-partners` (icon 🏢) guarded by the granular `branch_ledger` permission (with fallback to `sponsor_ledger`), allowing authorized branch managers and accountants to inspect running balances, collection credits, and payout vouchers.
- **Rationale**: Preserves strict organizational hierarchy (`Branch -> Business Partner -> Business Associate`), completely isolates corporate branch overrides from individual employee payroll/taxes, and provides clear visibility of branch profitability and turnover.
## 10. Strict Commission Rate Immutability & Historical Ledger Protection
- **Decision**: Once a receipt or collection is generated and its corresponding commission is credited to a ledger account, that transaction's commission percentage (`fixedPercent`), calculated amount, and ledger entry (`Entry`) are **permanently locked and immutable**. Future changes to slab commission percentages in `/dashboard/plots/products?tab=schemes` apply **strictly to new bills/receipts** created under the new rate and must NEVER retroactively alter or rewrite historical receipts or ledger entries.
- **Rationale**: Rewriting historical accounting entries upon a policy or scheme rate change violates fundamental financial accounting standards, creates retroactive ledger drift, alters audited financial statements, and corrupts historical statements across all roles (Branch Partner, Business Partner, Business Associate).

