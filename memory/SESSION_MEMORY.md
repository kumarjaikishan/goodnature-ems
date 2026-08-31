# SESSION_MEMORY.md — Persistent Discoveries & Context for Future Sessions

This file records crucial patterns, bugs solved, and architectural caveats found in the repository. Future AI sessions should consult this before debugging or adding code.

---

## 1. Important System Discoveries

### A. ESSL Biometric Device Communication
- **Caveat**: eSSL devices send non-standard HTTP requests (e.g. `/essl/iclock/cdata`, `/essl/iclock/cdata.aspx`, `getrequest.aspx`, `devicecmd`) with raw unencoded text payloads.
- **Handling**: `server/index.js` mounts a custom raw body stream reader specifically before standard `express.json()` to capture `req.bodyRaw`.
- Device heartbeats are recorded under `company.devices.$.lastHeartbeat`.

### B. Timezone & Attendance Calculations
- **Gotcha**: If attendance is queried by a date string (e.g. `2026-08-23`), converting with raw JavaScript `new Date("2026-08-23")` will cause shifts depending on the host server's local timezone.
- **Fix Pattern**: Always use `parseAttendanceDateTime()` and `getAttendanceDateUTC()` from `server/utils/attendanceTime.js`. Attendance records are saved with `date` set to UTC midnight (`YYYY-MM-DDT00:00:00.000Z`).

### C. Permission Matrix Mapping
- Permissions are stored in MongoDB as a `Map` of numbers (e.g., `employee: [1, 2, 3, 4]`).
- Key Legend: `1 = Read`, `2 = Create`, `3 = Update`, `4 = Delete`.
- When checked, Redis key `permissions:<userId>` is checked first. Superadmins and grant roles bypass checks.

### D. Duplicate Ledger Resolution (`fix_ledgers.js`)
- An operational script `fix_ledgers.js` exists in the project root to detect and merge duplicate ledgers for employees where multiple ledger documents were historically created.

### E. Plot Installment & Payout Architecture
- Payout schedules and vouchers track money disbursed back to plot customers/investors.
- `PlotBooking` status values: `HOLD`, `ACTIVE`, `COMPLETED`, `CANCELLED`.
- `PlotBooking` has compound index `{ status: 1, createdAt: -1 }` to optimize list view and report rendering.

### F. Plot Series & Inventory Unified Page
- The standalone Plot Inventory (`/dashboard/plots/inventory`) has been merged directly into [PlotSeriesMaster.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSeriesMaster.jsx) under `/dashboard/plots/series-master` (`Series & Inventory`).
- The page includes 3 interconnected tabs: **Series Blocks & Layout Grid**, **All Plots Inventory List (Cards & Table with live filters & pagination)**, and **Global Pricing & Commission Matrix**.
- Both `/dashboard/plots/series-master` and `/dashboard/plots/inventory` route to this unified component.

### G. Tiered Sponsor Commission Hierarchy & 40/60 Plot Booking Engine
- **Hierarchy Standard**: 2-level maximum hierarchy: `Company -> Developer Sponsor (direct) -> Sub-Sponsor`. Sub-sponsors cannot have children; referring sponsors must be Developer Sponsors (`sponsorId: null`).
- **Commission Split**:
  - Direct under Developer Sponsor: Developer Sponsor earns `(Promoter % + Developer %)`.
  - Under Sub-Sponsor: Sub-Sponsor earns `Promoter %`, parent Developer Sponsor earns `Developer %` (2% override).
  - Commission rates are snapshot/locked permanently at the moment of plot booking.
- **Plot Booking Breakdown**:
  - 0-Month: 100% Downpayment with time limit (1, 2, or 3 months).
  - \>0 Months: 40% Downpayment + remaining balance in EMIs distributed across chosen $N$ tenure months.
  - **Downpayment Calculation Basis**: Defaults to `BEFORE_DISCOUNT` (40% of Gross Plot Value, with discount reducing the EMI balance), with an option to toggle to `AFTER_DISCOUNT` (40% of Net Contract Value).
- **Rate Matrix Storage**: Configured in `PlotRateConfiguration.rateSlabs` and editable in [PlotSeriesMaster.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSeriesMaster.jsx) Pricing & Rates tab.

### H. Collection-Based Sponsor Commission Engine
- **Core Rule**: Sponsor commissions are credited strictly on a **Collection Basis** (per receipt / payment collected, e.g. downpayment or monthly EMI collection), NOT on the gross plot value upfront.
- **Auto-Sync Engine**: `syncBookingSponsorCommissions(bookingId)` reads each receipt for the booking, calculates the principal collected (`receipt.amount - receipt.lateFinePaid`), and applies the booking's locked rate matrix slab percentages (`DIRECT_DEVELOPER` or `PROMOTER` + `DEVELOPER_OVERRIDE`).
- **Reports Sync**: `getReportsData('commissions')` automatically auto-syncs active bookings so all sponsor ledgers reflect exact collection-based commissions in real-time.

### I. Unified Good Nature Theme & Symmetrical Loading States
- **Theme**: Good Nature Deep Teal (`#0f766e` / `teal-700` / `teal-800` / `emerald-600`) across all buttons, inputs, tabs, and headers. Avoid ad-hoc `indigo-600` or `purple-600`.
- **Loading Standard**: Standardized symmetrical `<PageLoader />` (`client/src/components/common/PageLoader.jsx`) replaces ad-hoc spinners. Default is `fullScreen: false` so that loading animations render strictly in the content area, preserving the sidebar and navbar without viewport-blocking overlays.
- **Branding**: Dynamic Redux company selector and uppercase watermark across all printouts, receipts, vouchers, and certificates.

### J. Dedicated Sponsor Ledger Page (`/dashboard/plots/sponsors/:id/ledger`)
- **Action Button in Sponsors Page**: In [PlotSponsors.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx), clicking the ledger icon in the action column navigates to `/dashboard/plots/sponsors/:id/ledger`.
- **Credit, Debit & Running Balance Columns**: Calculates exact collection-based credits (e.g. `Downpayment Commission` or `EMI Collection Commission` with % and receipt number), payout debits, and running wallet balances chronologically.
- **Closing Batch Tagging**: Each ledger credit entry displays the associated `closingNumber` badge if the commission was settled in a closing period.

### K. Plot Commission Closing System & Closing-Driven Sponsor Ledger (`/dashboard/plots/closings`)
- **Period Selection**: Admins select customizable period dates (e.g. `01-Aug-2026` to `28-Aug-2026`) and assign a unique closing batch name.
- **Closing-Driven Ledger Credit**: When collections are received, commissions are calculated in the background but are **NOT** immediately credited to the sponsor's ledger balance. Commissions are strictly credited to the sponsor's ledger **upon closing** as a consolidated entry titled by the closing name and number (e.g. `July 2026 Commission Closing [CLS-202607-001]`).
- **Granular Breakdown & Multi-Slab Percentages**: Each sponsor statement and ledger entry itemizes the entire closing period's collections, including:
  - Direct collections with exact slab commission percentages (e.g., `10.5%`, `13%`).
  - Indirect downline collections with developer override percentage (`2%`).
  - Total business collections and net commission credited.
- **Date Adjustment**: Expanding or reducing closing dates in the edit modal automatically recalculates and updates the credited ledger amount.
- **Reversal on Deletion**: Deleting a closing immediately reverses the ledger credit, resets the sponsor's available balance, and disassociates all commissions (`closingId = null`) back to unclosed status.
- **Printable**: Fully formatted for printing with Good Nature header, audit stamps, and accounts/sponsor signature blocks.

### L. Downpayment & Installment Due Date Scheduling
- When booking or editing a plot with downpayment grace period (`downpaymentMonths`: 1, 2, 3, etc.), Downpayment (Inst #0) due date is calculated as `bookingDate + downpaymentMonths`.
- Subsequent monthly EMI installments (Inst #1..N) begin after the downpayment grace period: `bookingDate + downpaymentMonths + i`.
- Both `createBooking` and `updateBooking` in [`plots.service.js`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots.service.js) respect this calculation consistently.

### N. Sponsor Portal Authentication & Password Reset
- **Multi-Identifier Login**: Sponsors can log in with their **Sponsor ID / Code** (e.g., `GNE-26-27-001`), **Mobile Number**, or **Email** along with their password (default initial password: `123456`).
- **Lightmode Dual Mode Switch on `/login`**: Features a clean green-to-white gradient background (`from-green-100 via-emerald-50 to-white`) with dual mode tabs: **Staff / Admin** and **Sponsor Portal**.
- **Admin Password Reset Tool**: In the Sponsors table ([`PlotSponsors.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx)), clicking the **Key icon (`KeyRound`)** allows the administrator to reset any sponsor's password to `123456` (or a custom password) with instant bcrypt re-hashing via `POST /api/plots/sponsors/:id/reset-password`.
- **Role Isolation**: Logged-in sponsors land on their dedicated **Commission Ledger & Wallet Statement** (`/dashboard`), with sidebar access strictly scoped to their own ledger and profile.


