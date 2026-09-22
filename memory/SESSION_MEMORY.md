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
- **Series Creation & Edit Modals**:
  - Bulk Series generator does NOT include PLC/Premium Heads block (Corner, Park Facing, etc.), as premium heads are assigned per individual plot during single plot add or plot configuration.
  - Manual entry of Plot Size (Sq Ft) in Series creation is removed and made strictly read-only auto-calculated dynamically from North, South, East, and West dimensions: $\text{Area} = \frac{\text{North} + \text{South}}{2} \times \frac{\text{East} + \text{West}}{2}$.
  - Plot dimensions across Series & Plot modals (North, South, East, West) default to `0`.

### Z. Plot Product Fractional Units EMI, Land Sourcing & Full-Page Booking Architecture
- **Micro-Plot Fractional Units**: Plot Products configured in `/dashboard/plots/products` allow booking fractional unit pieces with North/South/East/West dimensions on flexible RD/EMI tenure plans (12, 24, 36, 48, 60 months).
- **Dedicated Full-Page Booking Workflow**:
  - Route: `/dashboard/plots/products/book` (`ProductBookingPage.jsx`).
  - Follows the standard plot booking (`/dashboard/plots/addbooking`) interactive standard: Verified Customer search with auto-resolved BA/Sponsor detection, Product Specifications, Kisan Land Agreement stock selection/deduction, and Payment Plan configuration with a sticky live calculation sidebar.
  - **Land Sourcing Deduction**: Sourced from active Kisan Land Agreements (`GET /plots/kisan-agreements/sources`). Automatically checks parcel availability, validates area against unit square footage ($qty \times unitAreaSqFt$), increments `totalAllocatedSqFt` and decrements `totalAvailableSqFt` upon creation, and restores the area to the agreement if the booking is deleted.
- **EMI & 24% P.A. Late Fine Calculation**:
  - Unpaid installments past their scheduled due date plus grace period (15 days default from `PlotRateConfiguration`) accrue a 24% annual late fine (`(24/365)%` daily).
  - Waterfall collection rule: Late fine rebate reduces unpaid fine first; collected amount settles remaining unpaid late fine first, then principal.
- **Enriched Sales & Statement Tracking**:
  - `ProductSalesTab.jsx` displays overdue EMI counts, pending EMIs, and real-time accrued late fine amounts.
  - `ProductCustomerLedgerModal.jsx` provides an itemized statement with overdue days, late fine, rebate, and paid receipts.
  - `ProductInstallmentCollectModal.jsx` supports multi-installment selection, quick-fill buttons, late fine rebate, cheque 6-digit validation, and real-time payment calculations.
  - `ProductCollectionsPage.jsx` supports receipt deletion (`DELETE /plots/product-collections/:bookingId/:receiptNumber`) with confirmation dialog, monthly payout closing guard, waterfall installment ledger recalculation, and sponsor commission auto-sync.
  - For Monthly EMI plans, downpayment is eliminated ($0$) and the entire total valuation is divided equally into monthly installments over the chosen tenure. For One-Time Full Payment, the deposit/holding tenure period (12, 24, 36, 48, 60 months) is explicitly recorded to track the contract duration for product delivery or money-back refund on completion.

### AA. Dual Incentive Closing Architecture (Target Incentive vs Extra Incentive / Rewards)
- **Problem**: Fixed base commissions (5% BA / 2% BP) are credited immediately upon transaction collection. Target incentives (variable % slabs) and Extra Incentives / Rewards (additional column % & physical gifts/tours/vehicles) often follow different closing frequencies (e.g. Target Incentive closed every 3 months / quarterly, Extra Incentives closed every 6 months / semi-annually or annually).
- **Dual Closing Engine**:
  - `PlotClosing.js` has `closingType: { type: String, enum: ['TARGET_INCENTIVE', 'EXTRA_INCENTIVE'], default: 'TARGET_INCENTIVE' }`.
  - Prefix generation: `INC-YYYYMM-XXX` for Target Incentive closings, `EXT-YYYYMM-XXX` for Extra Incentive closings.
  - Independent commission tracking: `PlotSponsorCommission` and `InvestmentCommission` store `closingId` for Target Incentive and `extraClosingId` for Extra Incentive closing. This enables a transaction receipt to participate in both closings for distinct periods without locking collisions.
  - Universal ledger credits are recorded under `commission_closing` with explicit narrative particulars distinguishing Target Incentive from Extra Incentive / Rewards.
  - **Universal Ledger Narration Format**: All commission postings to developer / sponsor ledgers use a structured ` | ` pipe-separated standard:
    - **Fixed Commission (Plot Sale / Product / Investment)**:
      - `F.Comm (5%) on ₹50,000 | Downpayment | Receipt #RCP-001 | Booking #BK-001`
      - `F.Comm (2%) on ₹50,000 | Downpayment | Receipt #RCP-001 | Booking #BK-001 | BA: John Doe`
    - **Closing Credits (Target & Extra Incentive / Rewards)**:
      - `Extra Incentive & Reward | Closing #EXT-202610-001 (Diwali Special) | Slab: 10,00,000 - 19,99,999 (1% Extra Inc.) | Fund/Reward: Motorcycle, Car | Period Business: ₹15,00,000`
      - `Target Incentive | Closing #INC-202610-001 (Q3 Target) | Slab: 10,00,000 - 19,99,999 (1% Target Inc.) | Period Business: ₹15,00,000`
  - Reversal/deletion safely resets either `closingId` or `extraClosingId` and clears the associated universal ledger entry without corrupting the other closing type.
  - Frontend UI at `/dashboard/plots/incentives` provides dedicated tabs for **Target Incentive Closings** and **Extra Incentive & Rewards Closings** with dedicated processing buttons and filtered historical records.
  - **Terminology Standard**: Target Incentive % and Extra Incentive / Reward columns are strictly evaluated on a period closing basis (at closing settlement), so UI labels avoid "Monthly Bonus" and use "At Period Closing" / "Target Incentive (At Closing)".

### S. Frontend Route Conflict Resolution & Authorization Loop Prevention
- **Gotcha 1**: Placing a top-level `<Route path="/dashboard" element={!islogin && <Navigate to="/login" replace />} />` inside `<Routes>` in [App.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/App.jsx) caused React Router v6 to match `/dashboard` with `element={false}` when `islogin` was `true`, shadowing the nested `{roleRoute}` and rendering a blank white screen with no console errors.
- **Gotcha 2**: In `ProtectedRoutes.jsx`, when `role` was undefined during initial profile fetch, `!isAuthorized` redirected to `/`. But in `App.jsx`, `<Route path="/" element={<Navigate to="/dashboard" replace />} />` immediately bounced back to `/dashboard`, causing an infinite redirect loop (`/` <-> `/dashboard`) and rapid toast spam.
- **Fix Pattern**: In `ProtectedRoutes.jsx`, resolve `role` from JWT token payload immediately if profile is pending, render `<ContentLoader />` while determining authentication, and navigate to `/login` if unauthenticated/unauthorized instead of bouncing to `/`.

### U. Organization Settings Architecture & Relative Import Depths
- **Gotcha**: Files in `client/src/pages/admin/organization/pages/` (4 directory levels deep within `src`) require `../../../../utils/...` for utilities (`apiClient`, `toast`, `confirmDialog`) and `../../../../../store/...` (5 levels) to reach `client/store/userSlice.js`. Incorrect depth will cause dynamic import 500 errors in Vite lazy routes.
- **Organization Pages Redesign**:
  - `/dashboard/organization/branches`: Upgraded to 4 summary stat cards, live search, manager/timing filter tabs, dual card grid & DataTable views, and safe deletion checks.
  - `/dashboard/organization/departments`: Modernized with branch tabs, statistics, dual card/table views, and emerald accent theme.
  - `/dashboard/organization/admin`: Redesigned with 4 summary stat cards, active toggle, branch pills, 1-click permission presets, and dual card grid/table views.

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

### B1. Component Prop Safety (Null vs Undefined Defaults)
- **Gotcha**: ES6 default parameter syntax `{ notices = [], employees = [] }` only triggers when the passed value is `undefined`. When Redux slices initialize or return `null`, `notices.length` throws `Cannot read properties of null (reading 'length')`.
- **Fix Pattern**: Always guard with `Array.isArray(notices) ? notices : []` inside the component.

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
- **Series Creation & Edit Modals**:
  - Bulk Series generator does NOT include PLC/Premium Heads block (Corner, Park Facing, etc.), as premium heads are assigned per individual plot during single plot add or plot configuration.
  - Manual entry of Plot Size (Sq Ft) in Series creation is removed and made strictly read-only auto-calculated dynamically from North, South, East, and West dimensions: $\text{Area} = \frac{\text{North} + \text{South}}{2} \times \frac{\text{East} + \text{West}}{2}$.
  - Plot dimensions across Series & Plot modals (North, South, East, West) default to `0`.

### S. Frontend Route Conflict Resolution & Authorization Loop Prevention
- **Gotcha 1**: Placing a top-level `<Route path="/dashboard" element={!islogin && <Navigate to="/login" replace />} />` inside `<Routes>` in [App.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/App.jsx) caused React Router v6 to match `/dashboard` with `element={false}` when `islogin` was `true`, shadowing the nested `{roleRoute}` and rendering a blank white screen with no console errors.
- **Gotcha 2**: In `ProtectedRoutes.jsx`, when `role` was undefined during initial profile fetch, `!isAuthorized` redirected to `/`. But in `App.jsx`, `<Route path="/" element={<Navigate to="/dashboard" replace />} />` immediately bounced back to `/dashboard`, causing an infinite redirect loop (`/` <-> `/dashboard`) and rapid toast spam.
- **Fix Pattern**: In `ProtectedRoutes.jsx`, resolve `role` from JWT token payload immediately if profile is pending, render `<ContentLoader />` while determining authentication, and navigate to `/login` if unauthenticated/unauthorized instead of bouncing to `/`.

### V. Land Acquisition Sourcing & Multi-Plot Parcel Allocation
- **Architecture**: A single Kisan Agreement (`KisanLandAgreement`) can contain multiple land parcels (`landParcels`), each with its own `mauja`, `thanaNumber`, `khataNumber`, `khesraNumber`, `totalSqFt`, `allocatedSqFt`, and `availableSqFt`.
- **Plot Booking Sourcing**: In `/dashboard/plots/addbooking`, land sourcing supports allocating plot square footage across:
  - Multiple different Plot / Khesra numbers from the *same* agreement.
  - Or different plot numbers from *different* agreements.
  - Adding land sources auto-calculates remaining unallocated square footage and prevents exceeding total plot area.
- **Agreement Ledger & Plot Breakdown**:
  - In the agreement's **Land Stock Allocation Audit** ledger (`PlotKisanLedgerPage`), multiple parcel allocations for the same booking are grouped into a single consolidated transaction entry (e.g. 1200 Sq.Ft.), with individual parcel breakdowns listed clearly in the remarks.
  - A dedicated **Plot-wise Stock Breakdown** tab displays each individual Plot/Khesra number, Thana #, Khata, Jamabandi, Start Area, Booked/Allocated Area, Remaining Available Area, and live utilization percentage bars.
- **Backend Tracking**: `getAvailableLandStockSources` in `kisanLand.service.js` returns parcel-level stock data. When creating/rejecting bookings in `plotBooking.service.js`, both agreement-level and parcel-level `allocatedSqFt` and `availableSqFt` are accurately tracked and updated atomically.

### W. Payment Receipt Outstanding Balance & Downpayment Tracking
- **Receipt Types**: `BOOKING`, `DOWNPAYMENT`, `INSTALLMENT`, `FULL_PAYMENT`.
- **ReceiptViewer (`/dashboard/plots/receipts/:id`)**:
  - Displays **Date & Time in 12-hour format with guaranteed capital AM/PM** (e.g. `19 Sept 2026, 12:40 PM`) on all receipts.
  - For **Downpayment Receipts** (`DOWNPAYMENT` / `BOOKING`), displays 2 distinct outstanding datacells:
    1. **Outstanding D.P.** (`asOfRemainingDownpayment`): Remaining balance of the initial downpayment obligation.
    2. **Outstanding Total** (`asOfRemainingAmount`): Total remaining contract principal balance across the whole booking.
  - For regular installment receipts, displays the consolidated **Outstanding Balance**.
- **Downpayment Collection Form (`/dashboard/plots/collections/downpayment/add`)**:
  - Lists **all active contracts** in the select dropdown so users can select any booking without confusion.
  - Clearly shows `(✓ Downpayment Completed)` or `(Pending DP: ₹...)` in the dropdown options.
  - If a booking with completed downpayment is selected, displays an explicit green status banner (`Downpayment is Completed (100% Paid)`), shows a direct button to collect EMI instead, and prevents duplicate downpayment collection.

### T. Standalone MongoDB vs Replica Set Transactions
- **Gotcha**: Calling `session.startTransaction()` on a standalone local MongoDB instance throws `"Transaction numbers are only allowed on a replica set member or mongos"`.
- **Fix Pattern**: [server/conn/conn.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/conn/conn.js) patches `mongoose.startSession()` globally on boot. If the active MongoDB connection is standalone, `startTransaction()`, `commitTransaction()`, and `abortTransaction()` are safely handled as no-ops while passing standard operations through to MongoDB without transaction headers, while full multi-document ACID transactions remain active for replica sets / MongoDB Atlas.

### U. Modalbox Default Sizing & Custom Width Handling
- **Gotcha**: `Modalbox.jsx` defaults to `maxWidth = 'max-w-xl'` (576px) and applies `overflow-hidden` to its container. If an inner component uses fixed or large widths like `w-[900px]`, the modal container clips the right side.
- **Fix Pattern**: Always pass `size="5xl"` or `maxWidth="max-w-5xl"` (or `max-w-6xl` / `max-w-4xl`) on `<Modalbox>` and use responsive `w-full` on child containers with horizontal scroll wrappers (`overflow-x-auto`) for wide data tables.

### V. Plot Closings Architecture & Real-Time Preview
- **Default Naming & Date Range**: Default closing name is generated for the previous month (e.g. `August 2026 Closing` when current month is September 2026) with dates defaulting from 1st to last day of that previous month.
- **Terminology**: The word "Commission" is simplified to "Closing" / "Incentive" (e.g., `Process New Period Incentive`, `Incentive System`).
- **Query Optimization**: `previewPlotClosing` queries indexed collection records directly via `PlotSponsorCommission.find({ status: 'active', closingId: null, createdAt: { $gte: start, $lte: end } })` with a compound index on `{ status: 1, closingId: 1, createdAt: 1 }` and no redundant booking loops, making date switching instant (<20ms).
- **Dedicated Full-Page Workflow**: Process New Incentive and Edit Incentive are hosted on a dedicated full page [PlotIncentiveProcessPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentiveProcessPage.jsx) (`/dashboard/plots/incentives/new` and `/dashboard/plots/incentives/edit/:id`), providing maximum viewport width for large financial data tables, KPI cards, and sticky action bars.
- **Explicit Period Search / Fetch**: Date inputs do not trigger preview recalculations on every keystroke/change; an explicit **"Fetch Period"** button calculates collections and commissions on demand.
- **Target Incentive (Variable Part) Only in Payout Batches**:
  - Instant fixed commissions (5% for Business Associate, 2% for Business Partner, 7% for direct partner) are credited immediately upon receipt collection into the universal ledger.
  - Therefore, the period Incentive batch previews, calculates, and credits **strictly the achieved Target Incentive (variable part: e.g. 2%–10% for BA, 0.10%–1.00% for BP)** based on total period volume slabs.
  - The UI tables and KPI cards prominently display the achieved Target Incentive % (`+2% Inc.`, `+3% Inc.`, `+0.10% Inc.`), the exact incentive amount to credit, and an explanatory banner to ensure complete clarity.

### W. System Audit & Activity Logs Architecture
- **Unified Activity Ledger**: [server/models/AuditLog.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/models/AuditLog.js) stores mutation logs across all modules (`PLOTS`, `ATTENDANCE`, `LEAVE`, `PAYROLL`, `EMPLOYEE`, `ORGANIZATION`, `INVESTMENTS`, `AUTH`, `VOUCHER`, `SYSTEM`).
- **Compatibility**: Legacy `PlotAuditLog` model is unified to write into the `auditlogs` MongoDB collection so both existing plot actions and new system actions stream into a single searchable log.
- **Non-blocking Logger**: [server/utils/auditLogger.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/utils/auditLogger.js) provides `logActivity()`, an asynchronous, fail-safe helper that never crashes primary business operations on logging error.
- **Role Permissions**: Accessible by `developer`, `superadmin`, and `admin` roles via `/dashboard/activity-logs` with filters for modules, dates, and search keywords.

### Y. ID Generation Standards (Partners, Associates, Branches)
- **Business Partner (BP)**: Format `P/<FY>/<SEQ>` (e.g. `P/2627/001`), where `P` stands for Partner, `2627` is financial year (Apr 2026 – Mar 2027), and `001` is 3-digit zero-padded sequence via `Counter.getNextSequence('GNE-P-2627', null, 3)`.
- **Business Associate (BA)**: Format `A/<FY>/<SEQ>` (e.g. `A/2627/001`), where `A` stands for Associate, generated via `Counter.getNextSequence('GNE-A-2627', null, 3)`.
- **Branch Code**: Format `B/<FY>/<SEQ>` (e.g. `B/2627/001`), where `B` stands for Branch, generated via `Counter.getNextSequence('GNE-BRANCH-2627', null, 3)`.



### X. Two-Tier Sponsor Commission & Closing System (Fixed Instant + Period Target Incentive)
- **Instant Fixed Commission Credit**:
  - **Plot Collections (Downpayment / EMI)**: Business Associate (BA) earns **5.00%** fixed, and their parent Business Partner (BP) earns **2.00%** fixed. Direct Business Partner sales earn combined **7.00%** (5% + 2%).
  - **Investment Collections (RD / FD)**: Business Associate (BA) earns **2.50%** fixed, and their parent Business Partner (BP) earns **1.00%** fixed. Direct Business Partner sales earn combined **3.50%** (2.5% + 1.0%).
  - Fixed commission is credited immediately upon payment receipt approval to the sponsor's universal company financial ledger account (`Entry` with `source: 'commission_fixed'`).
- **Period Target Incentive on Closing**:
  - Target incentives are **not** credited on individual receipts; they are evaluated on total business volume across a closing date range (e.g. 90 days, 3 months, or custom date window).
  - When Admin executes a **Plot Closing**, the system calculates the sponsor's volume in that date range and matches it against `CommissionPolicyConfig` slabs (BA evaluated on direct volume, BP evaluated on direct + downline team volume).
  - Slabs determine the achieved Target Incentive % (e.g. BA Plot incentive 2% to 10%, BP Plot incentive 0.10% to 1.00%).
  - Only the **Target Incentive Amount** (`incentiveCommission`) is credited to the sponsor's universal ledger on closing (`Entry` with `source: 'commission_closing'`), completely eliminating double credit while ensuring mathematical consistency.
- **Sponsor Ledger Reconciliation**:
  - Available balance equals `Instant Fixed Credits + Periodic Target Incentive Credits - Payout Debits`.

### W. Plot Booking Wizard Structure Cleanup
- **Active Booking Components**: Stored in `client/src/pages/plots/booking/components/` (`BookingProgressBar`, `BookingSummarySidebar`, `StepCustomer`, `StepPlot`, `StepTermsAndPayment`). Used by `client/src/pages/plots/PlotBooking.jsx` mounted on route `/plots/addbooking`.
- **Removed Duplicate Code**: The legacy duplicate directory `client/src/pages/plots/bookingWizard/` and unused wrapper `client/src/pages/plots/booking/PlotBookingPage.jsx` were safely deleted.

### X. Business Developer Branch Scoping & Dual Creation Workflow
- **Branch Scoping**: Admin and Superadmin users view and assign from all created branches across the system. Subadmin/Manager users are strictly scoped to their assigned `user.branchIds`.
- **Dual Creation Buttons**:
  - **👑 Create Business Partner**: Registers a direct Level 1 partner directly under the company. Requires selecting the assigned **Branch**.
  - **👥 Create Business Associate**: Registers a Level 2 associate under an existing Business Partner. Requires selecting the parent **Business Partner**, and automatically assigns/inherits their branch.
- **Backend Sync**: `getSponsors` filters by `branchId` and populates `branchIds` on both the sponsor and their parent partner; `createSponsor` & `updateSponsor` save `branchIds` properly.

### X. Business Developer Module & Nomenclature Renaming
- **Terminology**: The submenu and module formerly named "Sponsors" under Plot Management has been renamed to **"Business Developer"** (`Business Developers` in header/titles).
- **Files and Directories**:
  - `client/src/pages/plots/businessDevelopers/PlotBusinessDevelopers.jsx`
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperDashboard.jsx`
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperReportPage.jsx`
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperBookingsPage.jsx`
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperLedgerPage.jsx`
- **Routing**: Mounted on `/dashboard/plots/business-developer` and `/dashboard/plots/business-developers` while retaining old `/dashboard/plots/sponsors*` alias routes for full backward compatibility without breaking existing backend APIs or bookmarks.

### G. Target Incentive & Fixed Commission Architecture (Oct – Dec 2026 Policy)
- **Hierarchy & Roles**:
  - `BUSINESS_PARTNER` (Business Partner): Direct sponsor ID with company (`sponsorId: null`).
  - `BUSINESS_ASSOCIATE` (Business Associate): Subordinate sponsor ID enrolled under a Business Partner (`sponsorId: ObjectId`).
- **Commission Split**:
  - **RIGHT SIDE (Plot Sales)**:
    - **Business Associate**: Base Fix `5.00%` + Target Incentive (`2.00% to 10.00%` based on individual period volume).
    - **Business Partner (Team Commission)**: Base Fix `2.00%` + Target Incentive (`0.10% to 1.00%` based on team cumulative volume).
    - **Business Partner (Direct Sale)**: Receives BOTH Upper BA rate (`5% + BA Incentive`) AND Lower BP rate (`2% + BP Incentive`).
  - **LEFT SIDE (RD / FD Investments)**:
    - **Business Associate**: Base Fix `2.50%` + Target Incentive (`1.00% to 5.00%`).
    - **Business Partner (Team Commission)**: Base Fix `1.00%` + Target Incentive (`0.050% to 0.500%`).
    - **Business Partner (Direct Sale)**: Receives BOTH Upper BA rate (`2.5% + BA Incentive`) AND Lower BP rate (`1.0% + BP Incentive`).
- **RD & FD Commission Policy Relocation & Tenure Matrix Simplification**:
  - Relocated the RD/FD Target Incentive & Fixed Commission Matrix (`INVESTMENT_RD_FD`) directly to [InvestmentSchemeMaster.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/investments/InvestmentSchemeMaster.jsx) (`/dashboard/investments/schemes`) under the bounds & premature interest settings.
  - Removed RD/FD commission policy controls from [PlotSeriesMaster.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSeriesMaster.jsx), keeping Plot Series Master exclusively dedicated to Plot Sales policies.
  - Cleaned up the Tenure table on the Investment Scheme page into `Customer Tenure Maturity Returns Matrix`, removing legacy per-tenure commission inputs (`Promoter Comm. % (R.D.)`, `Promoter Comm. % (F.D.)`, `Business Dev Override (%)`) and retaining purely customer maturity returns (`Tenure`, `R.D. Maturity Return %`, `F.D. Maturity Return %`).

### H. Dynamic Rate Editing & Modular Architecture in Plot Booking
- **Dynamic Rate Support & Downpayment Modes**:
  - At the time of booking, the **Plot Selling Rate** defaults to `₹1000/sqft` and is editable inline.
  - The **Downpayment** supports three dynamic modes: `₹ / Sq.Ft.`, `% (Percentage)`, and `₹ (Flat)`.
  - The **Govt. Base Rate** and **Discount** (Flat ₹, %, or ₹/Sq.Ft.) are sequenced directly before downpayment.
- **Flexible EMI Frequency & Installment Periodicity**:
  - When a remaining balance exists (`remainingBalance > 0`), an **EMI Frequency** selector (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`) paired with an **Installment Count** input allows configuring customizable payment schedules.
  - Total tenure in months is calculated as `installmentCount * frequencyMultiplier` (e.g. 6 quarterly installments = 18 months tenure).
  - Installments are generated in `PlotInstallment` on booking creation with dates incremented by `i * frequencyMultiplier` months.
- **Modular Directory Structure**:
  - `client/src/pages/plots/booking/` holds the page container `PlotBooking.jsx` and its subfolder `components/` contains:
    - `BookingProgressBar.jsx` (Step stepper)
    - `StepCustomer.jsx` (Customer selector and creation)
    - `StepPlot.jsx` (Project/Sector/Block/Plot selector)
    - `StepTermsAndPayment.jsx` (Dynamic rates, Downpayment, EMI Frequency & Installments, and Land Stock allocation)
    - `BookingSummarySidebar.jsx` (Real-time dynamic financial breakdown card)
  - `client/src/pages/plots/PlotBooking.jsx` delegates cleanly to `booking/PlotBookingPage.jsx`.
- **Plot Booking Decoupling**:
  - Plot booking tenure duration (0, 6, 12, ... 60 months) now **strictly** defines customer pricing and installments.
  - Slabs and target milestones are resolved dynamically by `CommissionPolicyConfig.resolveSlab` based on monthly collection volumes.

### H. 90-Day Downpayment Grace Period & ₹500/Sq.Ft. Fixed Downpayment Model
- **Downpayment Due Window**:
  - All plot bookings default to **90 days** for the downpayment completion window (`downpaymentDays: 90`).
  - This period is editable during plot booking or editing.
  - EMI #1 starts on the 1st of the month following the downpayment due date.
- **Fixed ₹500 / Sq.Ft. Downpayment**:
  - Replaced the legacy 40% plot value downpayment rule.
  - For all installment plans (tenure > 0), downpayment amount is strictly computed as `Plot Area (Sq.Ft.) × ₹500`.
  - For 1-time full payment (tenure = 0), downpayment amount is `Plot Area × ₹1000`.
- **Discount Deduction Rule**:
  - Any discount given to the customer MUST be deducted **strictly and exclusively from the EMI balance** (`emiPrincipalAmount`), leaving the downpayment amount unchanged.
  - Formula:
    - Gross Plot Value = `Plot Area × Effective Rate`
    - Downpayment Amount = `Plot Area × 500`
    - Gross EMI Balance = `Gross Plot Value - Downpayment Amount`
    - Net EMI Balance = `Math.max(0, Gross EMI Balance - Discount)`
    - Total Contract Value = `Downpayment Amount + Net EMI Balance`
    - Monthly EMI = `Math.round(Net EMI Balance / Tenure Months)`
- **Sponsor Portal & Business Report**:
  - Shows Direct Business vs. Team Business, Current Qualifying Slabs, Base Fixed vs. Target Incentive Earned, and Next Milestone Progress.

### J. Deferred EMI Schedule & Dedicated Downpayment vs EMI Collection Pages
- **Deferred EMI Activation Engine**:
  - When an EMI plot booking is created, EMI installments (Inst #1..N) are created with `dueDate: null`.
  - In `PlotBookingDetails.jsx`, EMI rows render an `"Awaiting DP Completion"` status badge until the full downpayment is cleared.
  - When Downpayment (Inst #0) is 100% paid (`paidAmount >= dueAmount`), `rebuildBookingInstallmentsState` calculates the exact completion date and sets each EMI's `dueDate` starting from `dpPaidDate + (inst.installmentNumber * freqMultiplier)` months.
  - Late fines (standardized at **24% P.A. / 2% monthly**) apply to both Downpayment (if past 90-day due date + grace) and EMIs (if past due date + grace).
- **Waterfall Payment Distribution Rule**:
  - Step 1: Any Late Fine Rebate entered reduces unpaid late fine first.
  - Step 2: Collected payment is applied **FIRST to clear outstanding late fine**.
  - Step 3: Remaining collected payment is applied **SECOND to reduce principal due**.
  - From the next day, late fine levies only on the remaining unpaid principal balance.
- **Account Menu Navigation & Dedicated UI**:
  - Under **Account** in `sidebar.jsx`:
    - **Downpayment Collections** (`/dashboard/plots/collections/downpayment`): Automatically renders a dedicated Downpayment Summary Panel (Booking Date, Last Due Date, Total DP, Paid So Far, Principal Due, Late Fine, Total Payable) without requiring manual installment picker.
    - **EMI Collections** (`/dashboard/plots/collections/emi`): Exclusively manages and collects EMI installments for bookings whose downpayments are 100% completed.
    - **Payroll** (`/dashboard/payroll`): Employee salary, advances, and payroll processing.
    - **Vouchers** (`/dashboard/vouchers`): Debit vouchers and financial payout tracking.
    - `/dashboard/plots/installments` remains available for backward compatibility.

### V. Database Seeding Script (`npm run seed`)
- **Script**: `server/scripts/seed.js` (executable via `node server/scripts/seed.js` or `npm run seed` in `server/`).
- **Features**:
  - Automatically clears previous test data for Plot Series, Plots, Customers, Kisan Agreements, Deeds, Kisan Ledgers, Stock Ledgers, Bookings, Receipts, Installments, Payouts, Commissions, and Closings.
  - **Sponsors**: 2 Direct Company IDs (`SP-1001`, `SP-1002`, `sponsorId: null`) and 5 Sub IDs (`SP-2001` to `SP-2005` under direct sponsors).
  - **Customers**: Exactly 10 Customers (2 Direct Company Customers `CUST-001` & `CUST-002`, 8 Sub-Sponsor Customers `CUST-003` to `CUST-010`).
  - **Agreements**: Exactly 6 Multi-Parcel Kisan Agreements (`AGR-2627-001` to `AGR-2627-006`) with complete Chaudhi, parcels, and balanced Kisan Financial Ledgers.
  - **Plot Series**: 4 Series (**E Series** 11 plots, **A Series** 10 plots, **D Series** 10 plots, **C Series** 10 plots) with all 41 plots in `status: 'AVAILABLE'`.
  - **Bookings & Collections**: ZERO bookings or collections, providing a clean database state.

### I. Sponsor Integration with Unified Ledger & Voucher System
- **Ledger Types**: `Ledger` collection supports `ledgerType: ['employee', 'custom', 'sponsor']`.
- **Auto-Sync**: `createLedgerForSponsors()` syncs active users with role `sponsor` into the `Ledger` collection with `isVoucherLedger: true`.
- **Voucher Debits**: When an admin creates a manual voucher selecting a Sponsor Ledger, a `DEBIT` entry is recorded in `Entry` and the sponsor's outstanding ledger balance (`advance`) is reduced immediately.
- **Reference**: `Voucher` documents store `sponsorId` alongside `employeeId` to maintain clear relational links.
- **Reports Sync**: `getReportsData('commissions')` automatically auto-syncs active bookings so all sponsor ledgers reflect exact collection-based commissions in real-time.

### I. Unified Good Nature Theme & Symmetrical Loading States
- **Theme**: Good Nature Deep Teal (`#0f766e` / `teal-700` / `teal-800` / `emerald-600`) across all buttons, inputs, tabs, and headers. Avoid ad-hoc `indigo-600` or `purple-600`.
- **Loading Standard**: Standardized symmetrical `<PageLoader />` (`client/src/components/common/PageLoader.jsx`) replaces ad-hoc spinners. Default is `fullScreen: false` so that loading animations render strictly in the content area, preserving the sidebar and navbar without viewport-blocking overlays.
- **Branding**: Dynamic Redux company selector and uppercase watermark across all printouts, receipts, vouchers, and certificates.

### J. Dedicated Sponsor Ledger Page (`/dashboard/plots/sponsors/:id/ledger`)
- **Action Button in Sponsors Page**: In [PlotSponsors.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx), clicking the ledger icon in the action column navigates to `/dashboard/plots/sponsors/:id/ledger`.
- **Credit, Debit & Running Balance Columns**: Calculates exact collection-based credits (e.g. `Downpayment Commission` or `EMI Collection Commission` with % and receipt number), payout debits, and running wallet balances chronologically.
- **Closing Batch Tagging**: Each ledger credit entry displays the associated `closingNumber` badge if the commission was settled in a closing period.

### K. Plot Dimensions & Chaudhi (Directional Boundaries)
- **Geometry & Auto Calculation**: Plots support directional dimensions `{ north, south, east, west }` (in feet). When entering values (e.g., N: 30, S: 30, E: 40, W: 40), the UI automatically computes and populates Plot Area in Sq Ft via $\text{Area} = \frac{N+S}{2} \times \frac{E+W}{2}$ ($30 \times 40 = 1200\text{ Sq Ft}$).
- **Chaudhi (Boundaries)**: Plots and Series Masters support `{ north, south, east, west }` strings representing surrounding roads, adjoining plots, parks, or boundaries.
- **Integration Points**:
  - `PlotSeriesMaster.jsx`: Series generator modal, individual plot creation modal, and configure/adjust plot modal.
  - `PlotBookingDetails.jsx`: Specifications card displays directional dimensions and Chaudhi grid.
  - Printable Agreements & Certificates: [PlotAgreementEnglish.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotAgreementEnglish.jsx), [BookingCertificateViewer.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/BookingCertificateViewer.jsx), and [PlotBookingFormPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotBookingFormPage.jsx).

### L. Plot Commission Closing System & Closing-Driven Sponsor Ledger (`/dashboard/plots/closings`)
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

### U. Land Acquisition Sourcing & Plot Booking Sourcing Ledger
- **Validation**: When creating a plot booking (`POST /api/plots/bookings`), `landSourcing` is mandatory. The sum of allocated Sq Ft across selected Kisan Agreements / Registry Deeds must equal the plot area.
- **Stock Ledger**: Every booking writes a `DEBIT` entry to `LandStockLedger` for each allocated Kisan Agreement or Registry Deed with `allocatedSqFt`, `allocatedDismil`, `bookingNumber`, `customerName`, and `plotNumber`.
- **Plot Master & Booking Integration**:
  - `PlotBookingDetails.jsx` renders Card 6 ("Land Acquisition & Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड विवरण)") showing linked Agreement # / Deed #, Mauja, Khata, Khesra, and allocated area.
  - `getPlots` in `plots.service.js` attaches `activeBooking` with `landSourcing` for booked/held/registered plots.
  - `PlotSeriesMaster.jsx` renders badges with Agreement/Deed tags and customer names on plot cards, plus a dedicated Land Acquisition & Agreement Details card in the Plot Configuration modal.

- **Role Isolation**: Logged-in sponsors land on their dedicated **Commission Ledger & Wallet Statement** (`/dashboard`), with sidebar access strictly scoped to their own ledger and profile.

### O. Sponsor Date-Wise Business Breakdown Report (`/dashboard/plots/sponsors/:id/business-report`)
- **Action Button in Sponsors Page**: Clicking the blue **TrendingUp (`📈`)** icon on [`PlotSponsors.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx) opens the date-wise business breakdown.
- **Printable**: Fully formatted for printing and statement audits.

### Q. Kisan Land Acquisition, Registry Conversion & Multi-Source Stock Allocation
- **Models**:
  - `KisanLandAgreement`: Master agreement record storing Mauja, Thana, Khata, Khesra, Jamabandi, Arazi Dismil, multi-farmer subdocs (`farmers` array with share %, guardian, mobile, Aadhaar, PAN), `registryDeeds` subdocs array, and stock counters (`totalSqFt`, `totalRegisteredSqFt`, `unregisteredAllocatedSqFt`, `totalAllocatedSqFt`, `totalAvailableSqFt`). Standard: $1\text{ Dismil} = 435.6\text{ Sq. Ft.}$.
  - `LandStockLedger`: Granular land stock tracking (`INITIAL_AGREEMENT`, `REGISTRY_CONVERSION`, `BOOKING_ALLOCATION`, `BOOKING_RESTRUCTURING_DELTA`, `BOOKING_CANCELLATION_RESTORE`).
  - `KisanLedger`: Financial ledger for land acquisition recording debits/credits (token, advances, registry disbursement) with running balance payable to farmers.
  - `PlotBookingRevision`: Immutable snapshot audit trail recording previous vs new parameters, deltas, and user modification reasons.
- **Mandatory Land Sourcing Enforcement**:
  - Every plot booking requires 100% of its plot area (e.g. $1200\text{ Sq. Ft.}$) to be allocated from an active `KisanLandAgreement` (unregistered stock) or `registryDeeds` (registered stock).
  - Validated strictly on backend in `plotsService.createBooking` and frontend in `PlotBooking.jsx` (with one-click auto-allocation).
  - Every booking immediately creates a `BOOKING_ALLOCATION` DEBIT entry in `LandStockLedger` and reduces available stock on the respective agreement/deed.
  - Sourcing stock adjustment: If plot size increased, $+ \Delta\text{SqFt}$ is deducted from source agreement stock and logged as `DEBIT` in `LandStockLedger`; if reduced, $+ |\Delta\text{SqFt}|$ is credited back to source agreement.
- **Customer Cancellation & Refund Engine (`plotsService.processCustomerRefund`)**:
  - Calculates total paid collections, applies deduction fee, generates refund voucher, sets plot status back to `AVAILABLE`, and restores all sourced land stock chunks back to their respective agreement/registry deed pools.
- **Routes & UI**:
  - Main management page: `/dashboard/plots/kisan-land` (`PlotKisanLandPage.jsx`).
  - Sourcing selector added to Step 3 of Plot Booking (`PlotBooking.jsx`).
  - Restructure modal, Customer Refund modal, and Revision History table mounted in `PlotBookingDetails.jsx`.

### P. Account Ledger Detail Redesign (`/dashboard/ledger/:id`)
- **Theme**: Unified Good Nature deep teal styling with white cards, subtle borders, and smooth shadows.
- **Header Profile Card**: Displays account avatar, name, account type tag (`Employee Account`, `Sponsor Account`, or `Custom Ledger`), and employee ID.
- **Key Metrics Summary**: Three clear summary metric cards displaying Total Credit (`+₹...` in green), Total Debit (`-₹...` in red), and Net Balance (`₹...` with receivable/payable status).
- **Modern Filter Bar**: Year, Month, Date pickers with instant reset action.
- **Polished Modal**: Clean modal for adding/editing transaction entries with validated credit/debit inputs.

### Q. Unified Sponsor Financial Ledger & Closing Auto-Sync
- **Sponsor Ledgers in General Ledger**: Every sponsor automatically has an official account ledger registered in [`Ledger`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/models/ledger.js) (`ledgerType: 'sponsor'`), accessible directly from the main `/dashboard/ledger` page.
- **Commission Closing Credit Auto-Posting**: When a Plot Commission Closing batch is created or updated in [`plots.service.js`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots.service.js), every eligible sponsor with earned commissions is automatically posted a `CREDIT` transaction to their financial ledger account (`source: 'commission_closing'`).
- **Seamless Deletion & Reversal**: Reversing/deleting a closing batch automatically deletes and reverses all associated ledger entries.
- **Direct Sponsor Page Navigation**: In [`PlotSponsors.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx), clicking the **Ledger icon (`Banknote`)** navigates directly to the universal ledger detail page: `/dashboard/ledger/:id?name=...&empid=...&ledgertype=sponsor`.

### R. Sonner Confirmation Dialog System (`confirmDialog` / `swal`)
- **Complete Replacement of Legacy SweetAlert**: Uninstalled `sweetalert` package and replaced it with a modern, lightweight, themed confirmation utility in [`client/src/utils/confirmDialog.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/utils/confirmDialog.jsx) powered by `sonner`.
- **Zero Extra Bundle Size**: Uses existing `sonner` and Tailwind CSS to render clean, animated confirmation modals with native promise support (`const proceed = await confirmDialog({ title, text, isDanger })` or `swal({ title, text }).then(proceed => ...)`).
- **Universal Drop-in Compatibility**: Provides named exports `{ confirmDialog, swal }` so all existing code works with zero refactoring.
- **Pages Updated**:
  - `VoucherList.jsx`
  - `PlotClosingsPage.jsx`
  - `ledgerdetailpage.jsx`
  - `ledgerpagelist.jsx`
  - `payroll.jsx`
  - `Employe.jsx`
  - `Department.jsx`
  - `TelegramIntegrationPage.jsx`
  - `useOrganization.js`
  - `organization.jsx`
  - `LeavePolicyManager.jsx`
  - `Holiday.jsx`
  - `DeveloperEsslMonitor.jsx`
  - `Dashboard.jsx` (developer)
  - `adminManagerProfile.jsx`
  - `sidebar.jsx`
  - `logout.jsx`

### T. Dedicated Sponsor Portal Dashboard (`/dashboard`)
- **Landing Experience**: When a user with role `sponsor` logs in, `/dashboard` renders [`SponsorDashboard.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/SponsorDashboard.jsx).
- **Hero Profile Card**: Greets the sponsor with their profile image, role designation (`Developer Sponsor` vs `Sub-Sponsor`), Sponsor ID, contact info, and fast-action shortcuts to their **Official Ledger** and **Business Report**.
- **Financial & Portfolio Metrics**: 4 dynamic metric tiles displaying:
  - **Available Balance** (closed earnings net of disbursed vouchers, ready for withdrawal).
  - **Total Commission Earned** (with granular direct vs downline team breakdown).
  - **Bookings Portfolio Count** (direct vs team booked plot count).
  - **Total Sales & Collection Volume** (total contract value & collection amounts).
- **Monthly Performance Bar Chart**: 6-month visual volume tracker illustrating collection volume and credited commission trends with interactive tooltips.
- **Team Hierarchy Widget**: Displays enrolled sub-sponsors in the sponsor's downline network with active status and quick links.
- **Recent Plot Bookings & Latest Commission Credits**: Live feeds of recent plot purchases and collection commission entries.

### U. Recurring & Fixed Deposit (R.D. / F.D.) Investment Module
- **Dual Scheme Support**: Supports Recurring Deposit (R.D.) monthly installments (minimum ₹1,000 in multiples of ₹1,000) and Fixed Deposit (F.D.) one-time lump sum deposits (minimum ₹10,000 in multiples of ₹10,000).
- **Guaranteed Returns Schedule**: 24M (112% RD / 121% FD), 36M (120% RD / 135% FD), 48M (130% RD / 150% FD), 60M (140% RD / 175% FD), 72M (150% RD / 200% FD), 120M (200% RD / 350% FD).
- **Unified Customer & Sponsor Hierarchy**: Customers (`PlotCustomer`) and Sponsors (`User`) are shared with the Plot Management module. Sub-Sponsors receive Promoter commission % (4% - 15%), Developer Sponsors receive a 1.0% override.
- **Document & Print Generation**:
  - Official Certificate of Deposit / Bond with company logo watermark (`/dashboard/investments/certificates/:id`).
  - Customer Passbook & Installment Statement (`/dashboard/investments/passbook/:id`).
- **Settlement & Cancellation**: Supports premature closure with configurable simple interest rate calculations and audit notes.

### W. Kisan Land Agreements & Registry Deeds Architecture
- **Tabbed Interface Standard**: [PlotKisanLandPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotKisanLandPage.jsx) features 2 top-level tabs:
  1. **Kisan Land Agreements**: Lists all farmer land acquisitions with land particulars (Mauja, Khata, Khesra, Thana, Jamabandi), farmers breakdown, agreed area, registered area, free stock, and farmer payment balance. Rows feature direct actions: `+ Deed` (convert to registry deed), `Pay` (record farmer payment), `Kisan Ledger` (direct financial ledger), `Full Audit`, `Edit`, and `Delete`.
  2. **Registry Deeds Master**: Aggregated/flattened registry deeds view with search by Deed #, Mauja, Khata, Khesra, SRO Office, and Farmer name. Rows feature `Ledgers`, `Edit`, and `Delete`.
- **Modular Component Breakdown (`client/src/pages/plots/kisanLand/`)**:
  - `KisanSummaryMetrics.jsx`: Top 4 metric tiles.
  - `KisanAgreementsTable.jsx`: Filterable agreements table with 2-row left-aligned actions.
  - `RegistryDeedsTable.jsx`: Filterable registry deeds master table.
  - `CreateAgreementModal.jsx` & `EditAgreementModal.jsx`: Agreement creation/editing with live calculations and dynamic farmer rows.
  - `CreateDeedModal.jsx` & `EditDeedModal.jsx`: Registry deed creation and editing.
  - `RecordPaymentModal.jsx`: Farmer payment recording.
  - `KisanLedgersDrawer.jsx`: Full 4-tab modal drawer featuring Debit, Credit, and Balance columns for both financial and stock allocation ledgers.
- **Backend Service & Route Endpoints**:
  - `PUT /api/plots/kisan-agreements/:id`: Updates Mauja, Khata, Khesra, Thana, Jamabandi, Rate, Total Amount, Remarks, and Farmers array.
  - `DELETE /api/plots/kisan-agreements/:id`: Safely deletes agreement only if no plot bookings are actively allocated, no registry deeds exist, and no payments have been recorded.
  - `PUT /api/plots/kisan-agreements/:agreementId/deeds/:deedId`: Updates Deed number, date, Sub-Registrar Office, and remarks.
  - `DELETE /api/plots/kisan-agreements/:agreementId/deeds/:deedId`: Reverts converted stock back to unregistered agreement stock and removes deed stock ledger entries (blocked if deed area is actively allocated to plot bookings).

### V. Plot Booking Deletion & Plot Status Synchronization
- **Gotcha**: When a `PlotBooking` was permanently deleted via `DELETE /api/plots/bookings/:id`, child schedules and land sourcing were cleaned up, but `Plot.findByIdAndUpdate(booking.plotId, { status: 'AVAILABLE' })` was omitted. This caused plots to remain permanently stuck in `status: 'BOOKED'` across the Add Booking screen (`/dashboard/plots/addbooking`) and Series Master (`/dashboard/plots/series-master`).
- **Fix Pattern**:
  1. `plotsService.deleteBooking()` now explicitly deletes all child documents (`PlotInstallment`, `PlotPayoutSchedule`, `PlotSponsorCommission`, `PlotBookingRevision`) and resets the associated `Plot` status back to `'AVAILABLE'`.
  2. `plotsService.getPlots()` includes active self-healing: if any plot is flagged as `BOOKED` or `HOLD` but lacks an active `PlotBooking` record in MongoDB, it automatically falls back to `'AVAILABLE'` in the response and updates MongoDB in the background.
  3. Reconciled existing stuck plots via `server/scripts/syncPlotStatuses.js`.

### X. Plot Commission Closing Submit-Preview Race Condition & Ledger Entry Validation
- **Gotcha 1 (Submit Race Condition)**: Clicking "Confirm & Close Period" while a date input was focused triggered `onBlur` -> `fetchPreview()` immediately followed by `onSubmit` -> `handleCreateSubmit()`. `POST /plots/closings` completed quickly, tagging all unclosed commissions with `closingId`. The in-flight `fetchPreview` resolved right after, found 0 unclosed transactions, and set `previewError`, displaying an error message despite the closing succeeding in MongoDB.
- **Gotcha 2 (Entry Schema Enum Failure)**: When `createPlotClosing` or `updatePlotClosing` recorded ledger entries with `source: 'commission_closing'`, Mongoose failed with `ValidationError: Entry validation failed: source: commission_closing is not a valid enum value for path source`.
- **Gotcha 3 (Overlapping Closing Ranges)**: If an earlier closing batch covers multiple months (e.g. `01-Jun-2026` to `30-Sep-2026`), all receipts in July/August/September are tagged to that closing and will not show up as "unclosed" in subsequent monthly previews unless the earlier closing is adjusted or deleted.
- **Fix Pattern**:
  1. `client/src/pages/plots/PlotClosingsPage.jsx`: Added `isSubmittingRef`, `lastPreviewKeyRef`, and `AbortController` request cancellation to abort in-flight previews upon submit and ignore late responses while `isSubmittingRef.current` is active.
  2. `server/models/entry.js`: Added `'commission_closing'`, `'plot_payout'`, and `'investment'` to the `source` enum.
### Y. SearchableSelect Combobox Component Adoption
- **Component**: [`client/src/components/ui/SearchableSelect.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/SearchableSelect.jsx)
- **Features**: Live search filter, clear button (`allowClear`), keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`), custom option rendering with subtitles, and size variants (`sm`, `md`, `lg`).
- **Applied Locations**:
  - [VoucherList.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/vouchers/VoucherList.jsx): Ledger filter dropdown & Create/Edit Voucher dialog modal ledger picker.
  - [advance.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/advance/advance.jsx): Employee selector toolbar filter.
  - [leaveledger.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/leaveledger/leaveledger.jsx): Individual Employee selection in Add/Adjust Leave Balance modal.
### Z. Backend Security & Performance Hardening
- **CORS Allowlist**: [server/index.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/index.js) now explicitly validates incoming origins against `allowedOrigins` (`localhost:5173`, `localhost:5174`, `CLIENT_URL`), `*.vercel.app` preview deployments, and blocks rogue cross-origin callers.
- **Login Rate Limiting**: Added `express-rate-limit` to `/api/signin` and `/api/setpassword` (15 attempts / 15 minutes per IP) in [server/router/route.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/router/route.js).
- **Error Observability**: Centralized error middleware in [server/utils/error_util.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/utils/error_util.js) logs formatted error codes, HTTP methods, route paths, and stack traces.
- **Attendance Bulk Excel Import Optimization**: In `bulkMarkAttendanceExcel` ([server/controllers/attandence.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/controllers/attandence.js)), replaced per-row `findOne`/`findById` roundtrips with batch `$in` fetches for all employees, branches, and holidays upfront.
### AA. Developer Portal Error Logging Page (`/dashboard/error-logs`)
- **Backend Ring Buffer**: [`server/utils/errorLogger.js`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/utils/errorLogger.js) maintains the last 100 runtime errors in-memory with automatic payload sanitization (passwords, tokens, and secrets redacted).
- **Backend Endpoints**: `GET /api/developer/errors` and `DELETE /api/developer/errors` (restricted strictly to `developer` role).
- **Frontend Page**: [`client/src/pages/developer/ErrorLogs.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/developer/ErrorLogs.jsx) features real-time 5s auto-refresh, status breakdown cards (500, 400, 404), keyword search, expandable details (User, IP, ISO time, sanitized request body payload, and 1-click stack trace copy).
- **Navigation**: Visible in [sidebar.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/sidebar.jsx) under the Developer menu (`/dashboard/error-logs`).

### BB. Modularization of Plot Series Master & Commission Policy Matrix (`/dashboard/plots/series-master`)
- **Problem**: `PlotSeriesMaster.jsx` previously contained over 2,330 lines of code with all layouts, tables, pricing matrix, and 4 large modals in a single file. Furthermore, the newly implemented Target Incentive & Fixed Commission system (Valid 1/10/2026 to 31/12/2026) needed an interactive UI for administrators to view, edit, add, or delete commission slabs.
- **Modular Component Breakdown (`client/src/pages/plots/seriesMaster/`)**:
  1. `SeriesFilterBar.jsx`: Series selector, status filter, and keyword search bar.
  2. `SeriesLayoutGrid.jsx`: Series blocks configuration table and responsive plot status card maps.
  3. `CommissionPolicyMatrix.jsx`: Interactive UI to view and edit target incentive slabs for Business Associates (Fixed 5% + target incentive slabs) and Business Partners (Fixed 2% + target incentive slabs) for Plot Sales and RD/FD investments, with instant save via `PUT /api/plots/commission-policy?type=...`.
  4. `TenurePlotRatesMatrix.jsx`: Corner extra %, settlement rate %, grace days, daily fine, and customer plot pricing / 40% downpayment / 60% EMI breakdown matrix (legacy commission columns completely removed).
  5. `CreateSeriesModal.jsx`: Modal for generating series blocks with prefix and range.
  6. `EditSeriesModal.jsx`: Modal for editing series block parameters.
  7. `ConfigurePlotModal.jsx`: Modal for adjusting plot dimensions, boundaries (Chaudhi), and inspecting linked Kisan land agreements or registry deeds.
  8. `CreatePlotModal.jsx`: Modal for creating individual standalone or series plots.
- **Coordinator Pattern**: [PlotSeriesMaster.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSeriesMaster.jsx) reduced from 2,330 lines down to ~415 lines, cleanly orchestrating 3 tabs:
  - `Series Blocks & Layout Grid`
  - `Target Incentive Policy & Slabs` (The exclusive place for managing sponsor commissions)
  - `Plot Pricing & Customer EMI Plans` (Strictly for customer plot prices & payment terms)

### CC. Form Identity & Formatting Input Components (`PhoneInput`, `AadhaarInput`, `PanInput`)
- **Auto-Sync**: `createLedgerForSponsors()` syncs active users with role `sponsor` into the `Ledger` collection with `isVoucherLedger: true`.
- **Voucher Debits**: When an admin creates a manual voucher selecting a Sponsor Ledger, a `DEBIT` entry is recorded in `Entry` and the sponsor's outstanding ledger balance (`advance`) is reduced immediately.
- **Reference**: `Voucher` documents store `sponsorId` alongside `employeeId` to maintain clear relational links.
- **Reports Sync**: `getReportsData('commissions')` automatically auto-syncs active bookings so all sponsor ledgers reflect exact collection-based commissions in real-time.

### I. Unified Good Nature Theme & Symmetrical Loading States
- **Theme**: Good Nature Deep Teal (`#0f766e` / `teal-700` / `teal-800` / `emerald-600`) across all buttons, inputs, tabs, and headers. Avoid ad-hoc `indigo-600` or `purple-600`.
- **Loading Standard**: Standardized symmetrical `<PageLoader />` (`client/src/components/common/PageLoader.jsx`) replaces ad-hoc spinners. Default is `fullScreen: false` so that loading animations render strictly in the content area, preserving the sidebar and navbar without viewport-blocking overlays.
- **Branding**: Dynamic Redux company selector and uppercase watermark across all printouts, receipts, vouchers, and certificates.

### J. Dedicated Sponsor Ledger Page (`/dashboard/plots/sponsors/:id/ledger`)
- **Action Button in Sponsors Page**: In [PlotSponsors.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx), clicking the ledger icon in the action column navigates to `/dashboard/plots/sponsors/:id/ledger`.
- **Credit, Debit & Running Balance Columns**: Calculates exact collection-based credits (e.g. `Downpayment Commission` or `EMI Collection Commission` with % and receipt number), payout debits, and running wallet balances chronologically.
- **Closing Batch Tagging**: Each ledger credit entry displays the associated `closingNumber` badge if the commission was settled in a closing period.

### K. Plot Dimensions & Chaudhi (Directional Boundaries)
- **Geometry & Auto Calculation**: Plots support directional dimensions `{ north, south, east, west }` (in feet). When entering values (e.g., N: 30, S: 30, E: 40, W: 40), the UI automatically computes and populates Plot Area in Sq Ft via $\text{Area} = \frac{N+S}{2} \times \frac{E+W}{2}$ ($30 \times 40 = 1200\text{ Sq Ft}$).
- **Chaudhi (Boundaries)**: Plots and Series Masters support `{ north, south, east, west }` strings representing surrounding roads, adjoining plots, parks, or boundaries.
- **Integration Points**:
  - `PlotSeriesMaster.jsx`: Series generator modal, individual plot creation modal, and configure/adjust plot modal.
  - `PlotBookingDetails.jsx`: Specifications card displays directional dimensions and Chaudhi grid.
  - Printable Agreements & Certificates: [PlotAgreementEnglish.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotAgreementEnglish.jsx), [BookingCertificateViewer.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/BookingCertificateViewer.jsx), and [PlotBookingFormPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotBookingFormPage.jsx).

### L. Plot Commission Closing System & Closing-Driven Sponsor Ledger (`/dashboard/plots/closings`)
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

### U. Land Acquisition Sourcing & Plot Booking Sourcing Ledger
- **Validation**: When creating a plot booking (`POST /api/plots/bookings`), `landSourcing` is mandatory. The sum of allocated Sq Ft across selected Kisan Agreements / Registry Deeds must equal the plot area.
- **Stock Ledger**: Every booking writes a `DEBIT` entry to `LandStockLedger` for each allocated Kisan Agreement or Registry Deed with `allocatedSqFt`, `allocatedDismil`, `bookingNumber`, `customerName`, and `plotNumber`.
- **Plot Master & Booking Integration**:
  - `PlotBookingDetails.jsx` renders Card 6 ("Land Acquisition & Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड विवरण)") showing linked Agreement # / Deed #, Mauja, Khata, Khesra, and allocated area.
  - `getPlots` in `plots.service.js` attaches `activeBooking` with `landSourcing` for booked/held/registered plots.
  - `PlotSeriesMaster.jsx` renders badges with Agreement/Deed tags and customer names on plot cards, plus a dedicated Land Acquisition & Agreement Details card in the Plot Configuration modal.

- **Role Isolation**: Logged-in sponsors land on their dedicated **Commission Ledger & Wallet Statement** (`/dashboard`), with sidebar access strictly scoped to their own ledger and profile.

### O. Sponsor Date-Wise Business Breakdown Report (`/dashboard/plots/sponsors/:id/business-report`)
- **Action Button in Sponsors Page**: Clicking the blue **TrendingUp (`📈`)** icon on [`PlotSponsors.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx) opens the date-wise business breakdown.
- **Printable**: Fully formatted for printing and statement audits.

### Q. Kisan Land Acquisition, Registry Conversion & Multi-Source Stock Allocation
- **Models**:
  - `KisanLandAgreement`: Master agreement record storing Mauja, Thana, Khata, Khesra, Jamabandi, Arazi Dismil, multi-farmer subdocs (`farmers` array with share %, guardian, mobile, Aadhaar, PAN), `registryDeeds` subdocs array, and stock counters (`totalSqFt`, `totalRegisteredSqFt`, `unregisteredAllocatedSqFt`, `totalAllocatedSqFt`, `totalAvailableSqFt`). Standard: $1\text{ Dismil} = 435.6\text{ Sq. Ft.}$.
  - `LandStockLedger`: Granular land stock tracking (`INITIAL_AGREEMENT`, `REGISTRY_CONVERSION`, `BOOKING_ALLOCATION`, `BOOKING_RESTRUCTURING_DELTA`, `BOOKING_CANCELLATION_RESTORE`).
  - `KisanLedger`: Financial ledger for land acquisition recording debits/credits (token, advances, registry disbursement) with running balance payable to farmers.
  - `PlotBookingRevision`: Immutable snapshot audit trail recording previous vs new parameters, deltas, and user modification reasons.
- **Mandatory Land Sourcing Enforcement**:
  - Every plot booking requires 100% of its plot area (e.g. $1200\text{ Sq. Ft.}$) to be allocated from an active `KisanLandAgreement` (unregistered stock) or `registryDeeds` (registered stock).
  - Validated strictly on backend in `plotsService.createBooking` and frontend in `PlotBooking.jsx` (with one-click auto-allocation).
  - Every booking immediately creates a `BOOKING_ALLOCATION` DEBIT entry in `LandStockLedger` and reduces available stock on the respective agreement/deed.
  - Sourcing stock adjustment: If plot size increased, $+ \Delta\text{SqFt}$ is deducted from source agreement stock and logged as `DEBIT` in `LandStockLedger`; if reduced, $+ |\Delta\text{SqFt}|$ is credited back to source agreement.
- **Customer Cancellation & Refund Engine (`plotsService.processCustomerRefund`)**:
  - Calculates total paid collections, applies deduction fee, generates refund voucher, sets plot status back to `AVAILABLE`, and restores all sourced land stock chunks back to their respective agreement/registry deed pools.
- **Routes & UI**:
  - Main management page: `/dashboard/plots/kisan-land` (`PlotKisanLandPage.jsx`).
  - Sourcing selector added to Step 3 of Plot Booking (`PlotBooking.jsx`).
  - Restructure modal, Customer Refund modal, and Revision History table mounted in `PlotBookingDetails.jsx`.

### P. Account Ledger Detail Redesign (`/dashboard/ledger/:id`)
- **Theme**: Unified Good Nature deep teal styling with white cards, subtle borders, and smooth shadows.
- **Header Profile Card**: Displays account avatar, name, account type tag (`Employee Account`, `Sponsor Account`, or `Custom Ledger`), and employee ID.
- **Key Metrics Summary**: Three clear summary metric cards displaying Total Credit (`+₹...` in green), Total Debit (`-₹...` in red), and Net Balance (`₹...` with receivable/payable status).
- **Modern Filter Bar**: Year, Month, Date pickers with instant reset action.
- **Polished Modal**: Clean modal for adding/editing transaction entries with validated credit/debit inputs.

### Q. Unified Sponsor Financial Ledger & Closing Auto-Sync
- **Sponsor Ledgers in General Ledger**: Every sponsor automatically has an official account ledger registered in [`Ledger`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/models/ledger.js) (`ledgerType: 'sponsor'`), accessible directly from the main `/dashboard/ledger` page.
- **Commission Closing Credit Auto-Posting**: When a Plot Commission Closing batch is created or updated in [`plots.service.js`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots.service.js), every eligible sponsor with earned commissions is automatically posted a `CREDIT` transaction to their financial ledger account (`source: 'commission_closing'`).
- **Seamless Deletion & Reversal**: Reversing/deleting a closing batch automatically deletes and reverses all associated ledger entries.
- **Direct Sponsor Page Navigation**: In [`PlotSponsors.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSponsors.jsx), clicking the **Ledger icon (`Banknote`)** navigates directly to the universal ledger detail page: `/dashboard/ledger/:id?name=...&empid=...&ledgertype=sponsor`.

### R. Sonner Confirmation Dialog System (`confirmDialog` / `swal`)
- **Complete Replacement of Legacy SweetAlert**: Uninstalled `sweetalert` package and replaced it with a modern, lightweight, themed confirmation utility in [`client/src/utils/confirmDialog.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/utils/confirmDialog.jsx) powered by `sonner`.
- **Zero Extra Bundle Size**: Uses existing `sonner` and Tailwind CSS to render clean, animated confirmation modals with native promise support (`const proceed = await confirmDialog({ title, text, isDanger })` or `swal({ title, text }).then(proceed => ...)`).
- **Universal Drop-in Compatibility**: Provides named exports `{ confirmDialog, swal }` so all existing code works with zero refactoring.
- **Pages Updated**:
  - `VoucherList.jsx`
  - `PlotClosingsPage.jsx`
  - `ledgerdetailpage.jsx`
  - `ledgerpagelist.jsx`
  - `payroll.jsx`
  - `Employe.jsx`
  - `Department.jsx`
  - `TelegramIntegrationPage.jsx`
  - `useOrganization.js`
  - `organization.jsx`
  - `LeavePolicyManager.jsx`
  - `Holiday.jsx`
  - `DeveloperEsslMonitor.jsx`
  - `Dashboard.jsx` (developer)
  - `adminManagerProfile.jsx`
  - `sidebar.jsx`
  - `logout.jsx`

### T. Dedicated Sponsor Portal Dashboard (`/dashboard`)
- **Landing Experience**: When a user with role `sponsor` logs in, `/dashboard` renders [`SponsorDashboard.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/SponsorDashboard.jsx).
- **Hero Profile Card**: Greets the sponsor with their profile image, role designation (`Developer Sponsor` vs `Sub-Sponsor`), Sponsor ID, contact info, and fast-action shortcuts to their **Official Ledger** and **Business Report**.
- **Financial & Portfolio Metrics**: 4 dynamic metric tiles displaying:
  - **Available Balance** (closed earnings net of disbursed vouchers, ready for withdrawal).
  - **Total Commission Earned** (with granular direct vs downline team breakdown).
  - **Bookings Portfolio Count** (direct vs team booked plot count).
  - **Total Sales & Collection Volume** (total contract value & collection amounts).
- **Monthly Performance Bar Chart**: 6-month visual volume tracker illustrating collection volume and credited commission trends with interactive tooltips.
- **Team Hierarchy Widget**: Displays enrolled sub-sponsors in the sponsor's downline network with active status and quick links.
- **Recent Plot Bookings & Latest Commission Credits**: Live feeds of recent plot purchases and collection commission entries.

### U. Recurring & Fixed Deposit (R.D. / F.D.) Investment Module
- **Dual Scheme Support**: Supports Recurring Deposit (R.D.) monthly installments (minimum ₹1,000 in multiples of ₹1,000) and Fixed Deposit (F.D.) one-time lump sum deposits (minimum ₹10,000 in multiples of ₹10,000).
- **Guaranteed Returns Schedule**: 24M (112% RD / 121% FD), 36M (120% RD / 135% FD), 48M (130% RD / 150% FD), 60M (140% RD / 175% FD), 72M (150% RD / 200% FD), 120M (200% RD / 350% FD).
- **Unified Customer & Sponsor Hierarchy**: Customers (`PlotCustomer`) and Sponsors (`User`) are shared with the Plot Management module. Sub-Sponsors receive Promoter commission % (4% - 15%), Developer Sponsors receive a 1.0% override.
- **Document & Print Generation**:
  - Official Certificate of Deposit / Bond with company logo watermark (`/dashboard/investments/certificates/:id`).
  - Customer Passbook & Installment Statement (`/dashboard/investments/passbook/:id`).
- **Settlement & Cancellation**: Supports premature closure with configurable simple interest rate calculations and audit notes.

### W. Kisan Land Agreements & Registry Deeds Architecture
- **Tabbed Interface Standard**: [PlotKisanLandPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotKisanLandPage.jsx) features 2 top-level tabs:
  1. **Kisan Land Agreements**: Lists all farmer land acquisitions with land particulars (Mauja, Khata, Khesra, Thana, Jamabandi), farmers breakdown, agreed area, registered area, free stock, and farmer payment balance. Rows feature direct actions: `+ Deed` (convert to registry deed), `Pay` (record farmer payment), `Kisan Ledger` (direct financial ledger), `Full Audit`, `Edit`, and `Delete`.
  2. **Registry Deeds Master**: Aggregated/flattened registry deeds view with search by Deed #, Mauja, Khata, Khesra, SRO Office, and Farmer name. Rows feature `Ledgers`, `Edit`, and `Delete`.
- **Modular Component Breakdown (`client/src/pages/plots/kisanLand/`)**:
  - `KisanSummaryMetrics.jsx`: Top 4 metric tiles.
  - `KisanAgreementsTable.jsx`: Filterable agreements table with 2-row left-aligned actions.
  - `RegistryDeedsTable.jsx`: Filterable registry deeds master table.
  - `CreateAgreementModal.jsx` & `EditAgreementModal.jsx`: Agreement creation/editing with live calculations and dynamic farmer rows.
  - `CreateDeedModal.jsx` & `EditDeedModal.jsx`: Registry deed creation and editing.
  - `RecordPaymentModal.jsx`: Farmer payment recording.
  - `KisanLedgersDrawer.jsx`: Full 4-tab modal drawer featuring Debit, Credit, and Balance columns for both financial and stock allocation ledgers.
- **Backend Service & Route Endpoints**:
  - `PUT /api/plots/kisan-agreements/:id`: Updates Mauja, Khata, Khesra, Thana, Jamabandi, Rate, Total Amount, Remarks, and Farmers array.
  - `DELETE /api/plots/kisan-agreements/:id`: Safely deletes agreement only if no plot bookings are actively allocated, no registry deeds exist, and no payments have been recorded.
  - `PUT /api/plots/kisan-agreements/:agreementId/deeds/:deedId`: Updates Deed number, date, Sub-Registrar Office, and remarks.
  - `DELETE /api/plots/kisan-agreements/:agreementId/deeds/:deedId`: Reverts converted stock back to unregistered agreement stock and removes deed stock ledger entries (blocked if deed area is actively allocated to plot bookings).

### V. Plot Booking Deletion & Plot Status Synchronization
- **Gotcha**: When a `PlotBooking` was permanently deleted via `DELETE /api/plots/bookings/:id`, child schedules and land sourcing were cleaned up, but `Plot.findByIdAndUpdate(booking.plotId, { status: 'AVAILABLE' })` was omitted. This caused plots to remain permanently stuck in `status: 'BOOKED'` across the Add Booking screen (`/dashboard/plots/addbooking`) and Series Master (`/dashboard/plots/series-master`).
- **Fix Pattern**:
  1. `plotsService.deleteBooking()` now explicitly deletes all child documents (`PlotInstallment`, `PlotPayoutSchedule`, `PlotSponsorCommission`, `PlotBookingRevision`) and resets the associated `Plot` status back to `'AVAILABLE'`.
  2. `plotsService.getPlots()` includes active self-healing: if any plot is flagged as `BOOKED` or `HOLD` but lacks an active `PlotBooking` record in MongoDB, it automatically falls back to `'AVAILABLE'` in the response and updates MongoDB in the background.
  3. Reconciled existing stuck plots via `server/scripts/syncPlotStatuses.js`.

### X. Plot Commission Closing Submit-Preview Race Condition & Ledger Entry Validation
- **Gotcha 1 (Submit Race Condition)**: Clicking "Confirm & Close Period" while a date input was focused triggered `onBlur` -> `fetchPreview()` immediately followed by `onSubmit` -> `handleCreateSubmit()`. `POST /plots/closings` completed quickly, tagging all unclosed commissions with `closingId`. The in-flight `fetchPreview` resolved right after, found 0 unclosed transactions, and set `previewError`, displaying an error message despite the closing succeeding in MongoDB.
- **Gotcha 2 (Entry Schema Enum Failure)**: When `createPlotClosing` or `updatePlotClosing` recorded ledger entries with `source: 'commission_closing'`, Mongoose failed with `ValidationError: Entry validation failed: source: commission_closing is not a valid enum value for path source`.
- **Gotcha 3 (Overlapping Closing Ranges)**: If an earlier closing batch covers multiple months (e.g. `01-Jun-2026` to `30-Sep-2026`), all receipts in July/August/September are tagged to that closing and will not show up as "unclosed" in subsequent monthly previews unless the earlier closing is adjusted or deleted.
- **Fix Pattern**:
  1. `client/src/pages/plots/PlotClosingsPage.jsx`: Added `isSubmittingRef`, `lastPreviewKeyRef`, and `AbortController` request cancellation to abort in-flight previews upon submit and ignore late responses while `isSubmittingRef.current` is active.
  2. `server/models/entry.js`: Added `'commission_closing'`, `'plot_payout'`, and `'investment'` to the `source` enum.
### Y. SearchableSelect Combobox Component Adoption
- **Component**: [`client/src/components/ui/SearchableSelect.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/SearchableSelect.jsx)
- **Features**: Live search filter, clear button (`allowClear`), keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`), custom option rendering with subtitles, and size variants (`sm`, `md`, `lg`).
- **Applied Locations**:
  - [VoucherList.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/vouchers/VoucherList.jsx): Ledger filter dropdown & Create/Edit Voucher dialog modal ledger picker.
  - [advance.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/advance/advance.jsx): Employee selector toolbar filter.
  - [leaveledger.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/leaveledger/leaveledger.jsx): Individual Employee selection in Add/Adjust Leave Balance modal.
### Z. Backend Security & Performance Hardening
- **CORS Allowlist**: [server/index.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/index.js) now explicitly validates incoming origins against `allowedOrigins` (`localhost:5173`, `localhost:5174`, `CLIENT_URL`), `*.vercel.app` preview deployments, and blocks rogue cross-origin callers.
- **Login Rate Limiting**: Added `express-rate-limit` to `/api/signin` and `/api/setpassword` (15 attempts / 15 minutes per IP) in [server/router/route.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/router/route.js).
- **Error Observability**: Centralized error middleware in [server/utils/error_util.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/utils/error_util.js) logs formatted error codes, HTTP methods, route paths, and stack traces.
- **Attendance Bulk Excel Import Optimization**: In `bulkMarkAttendanceExcel` ([server/controllers/attandence.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/controllers/attandence.js)), replaced per-row `findOne`/`findById` roundtrips with batch `$in` fetches for all employees, branches, and holidays upfront.
### AA. Developer Portal Error Logging Page (`/dashboard/error-logs`)
- **Backend Ring Buffer**: [`server/utils/errorLogger.js`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/utils/errorLogger.js) maintains the last 100 runtime errors in-memory with automatic payload sanitization (passwords, tokens, and secrets redacted).
- **Backend Endpoints**: `GET /api/developer/errors` and `DELETE /api/developer/errors` (restricted strictly to `developer` role).
- **Frontend Page**: [`client/src/pages/developer/ErrorLogs.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/developer/ErrorLogs.jsx) features real-time 5s auto-refresh, status breakdown cards (500, 400, 404), keyword search, expandable details (User, IP, ISO time, sanitized request body payload, and 1-click stack trace copy).
- **Navigation**: Visible in [sidebar.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/sidebar.jsx) under the Developer menu (`/dashboard/error-logs`).

### BB. Modularization of Plot Series Master & Commission Policy Matrix (`/dashboard/plots/series-master`)
- **Problem**: `PlotSeriesMaster.jsx` previously contained over 2,330 lines of code with all layouts, tables, pricing matrix, and 4 large modals in a single file. Furthermore, the newly implemented Target Incentive & Fixed Commission system (Valid 1/10/2026 to 31/12/2026) needed an interactive UI for administrators to view, edit, add, or delete commission slabs.
- **Modular Component Breakdown (`client/src/pages/plots/seriesMaster/`)**:
  1. `SeriesFilterBar.jsx`: Series selector, status filter, and keyword search bar.
  2. `SeriesLayoutGrid.jsx`: Series blocks configuration table and responsive plot status card maps.
  3. `CommissionPolicyMatrix.jsx`: Interactive UI to view and edit target incentive slabs for Business Associates (Fixed 5% + target incentive slabs) and Business Partners (Fixed 2% + target incentive slabs) for Plot Sales and RD/FD investments, with instant save via `PUT /api/plots/commission-policy?type=...`.
  4. `TenurePlotRatesMatrix.jsx`: Corner extra %, settlement rate %, grace days, daily fine, and customer plot pricing / 40% downpayment / 60% EMI breakdown matrix (legacy commission columns completely removed).
  5. `CreateSeriesModal.jsx`: Modal for generating series blocks with prefix and range.
  6. `EditSeriesModal.jsx`: Modal for editing series block parameters.
  7. `ConfigurePlotModal.jsx`: Modal for adjusting plot dimensions, boundaries (Chaudhi), and inspecting linked Kisan land agreements or registry deeds.
  8. `CreatePlotModal.jsx`: Modal for creating individual standalone or series plots.
- **Coordinator Pattern**: [PlotSeriesMaster.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/PlotSeriesMaster.jsx) reduced from 2,330 lines down to ~415 lines, cleanly orchestrating 3 tabs:
  - `Series Blocks & Layout Grid`
  - `Target Incentive Policy & Slabs` (The exclusive place for managing sponsor commissions)
  - `Plot Pricing & Customer EMI Plans` (Strictly for customer plot prices & payment terms)

### CC. Form Identity & Formatting Input Components (`PhoneInput`, `AadhaarInput`, `PanInput`)
- **Location**: [`client/src/components/ui/`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/) (`PhoneInput.jsx`, `AadhaarInput.jsx`, `PanInput.jsx`, `index.js`).
- **Features**:
  - `PhoneInput`: Strict numeric digits only, max 10 digits, mobile numeric keypad trigger (`inputMode="numeric"`, `type="tel"`, `pattern="[0-9]*"`).
  - `AadhaarInput`: Strict numeric digits, max 12 digits raw, automatically formatted with space separation after every 4 digits (`XXXX XXXX XXXX`), mobile numeric keypad (`inputMode="numeric"`).
  - `PanInput`: Alphanumeric only, auto-uppercase, max 10 chars, validates standard Indian PAN format (`/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`), displays inline validation error message below input when invalid.
- **Adoption**:
  - `CreateAgreementModal.jsx` and `EditAgreementModal.jsx` updated to use `PhoneInput`, `AadhaarInput`, and `PanInput` across Kisan / Farmer and Purchaser / Buyer form grids.
  - Removed legacy `Share % in Land` input from Farmer rows.

### DD. Kisan / Seller & Purchaser Master Directories in Plot Purchase
- **Models**:
  - `KisanSeller.js`: Master directory for all farmers/sellers (Name, Guardian/Father Name, Mobile, Aadhaar, PAN, Address, Bank details).
  - `LandPurchaser.js`: Master directory for buyer entities and company profiles with `isDefault` flag.
- **Auto-Sync & Default Behavior**:
  - Automatically seeds default company buyer (`Good Nature Developers Pvt Ltd`) and auto-populates existing farmers on first boot/query.
  - In `CreateAgreementModal.jsx`, automatically sets purchaser to the default buyer.
  - Both `CreateAgreementModal.jsx` and `EditAgreementModal.jsx` feature 1-click **"Choose Registered Kisan"** and **"Choose from Buyer Directory"** dropdown selectors on each card.
- **UI Tabs on `/dashboard/plots/purchase`**:
  - Tab 1: `Plot Purchase Agreements`
  - Tab 2: `Registry Deeds Master`
  - Tab 3: `Land Sellers Directory` (`KisanSellersTable.jsx`)
  - Tab 4: `Purchasers / Buyers Master` (`PurchasersTable.jsx`)

### EE. Plot Premium & PLC (Preferential Location Charges) Heads System
- **Context & Purpose**: Expanded single hardcoded Corner (+20%) extra pricing into a dynamic, multi-head Plot Premium & PLC system.
- **Model Schema (`PlotRateConfiguration.js`)**:
  - `premiumHeads`: `[{ name: String, extraPercent: Number, description: String }]`
  - Initialized with default location heads: `Corner Plot` (+20%), `Park Facing` (+10%), `Main Road Facing` (+15%), `East Facing` (+5%).
- **Plot Model (`Plot.js`)**:
  - `premiumHeads`: `[{ name: String, extraPercent: Number }]`
  - Allows assigning zero, one, or multiple location premium heads to any plot.
  - Multiplier formula: $\text{Total Extra \%} = \sum \text{head.extraPercent}$; $\text{Effective SqFt Rate} = \text{Base Rate} \times (1 + \text{Total Extra \%} / 100)$.
- **Series Block Defaults (`PlotSeriesMaster.js`)**:
  - `defaultPremiumHeads`: Array of default heads attached to all plots generated in a series block.
- **UI Enhancements (`/dashboard/plots/series-master`)**:
  - `TenurePlotRatesMatrix.jsx`: Dedicated table for creating, editing, and deleting custom premium charge heads with extra percentage rates.
  - `ConfigurePlotModal.jsx`: Multi-selectable interactive badge toggles for attaching one or more premium heads, real-time live preview of Base Rate, Multiplier, Effective Rate, and Plot Total Value, with a fixed non-clipped layout and sticky footer.
  - `CreatePlotModal.jsx`, `CreateSeriesModal.jsx`, `EditSeriesModal.jsx`: Updated with multi-select premium heads group.
  - `SeriesLayoutGrid.jsx`: Displays attached premium head badges (e.g. `CORNER`, `PARK`, `+30% PLC`) on plot map cards.
  - `PlotBooking.jsx`, `PlotBookingEditPage.jsx`, `PlotBookingDetails.jsx`: Effective rates dynamically sum all attached `plot.premiumHeads`.

### FF. Downpayment & EMI Collections System & Deferred Schedule Architecture
- **Navigation & Menu Reorganization**:
  - Created a dedicated **Account** menu in [`client/src/components/sidebar.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/sidebar.jsx) containing:
    - **Downpayment** (`/dashboard/plots/collections/downpayment`)
    - **EMI** (`/dashboard/plots/collections/emi`)
    - **Payroll** (`/dashboard/payroll`)
    - **Vouchers** (`/dashboard/vouchers`)
- **No Checkbox Selection Pattern**:
  - Removed interactive checkbox selection from both **Downpayment** and **EMI** collection pages.
  - When a booking contract is selected:
    - **Downpayment**: Displays a dedicated Downpayment Summary Panel (Booking Date, DP Last Due Date, Total DP, Paid So Far, Principal Due, Late Fine at 24% P.A., and Total Payable Today).
    - **EMI**: Displays an EMI Active Installment Details Card (Active Inst #, EMI Due Date, Monthly EMI, Principal Due, Late Fine at 24% P.A., and Total Payable Today) along with a clean read-only schedule table.
    - The collection amount field auto-populates with `Total Payable Today` (Principal Due + Late Fine).
- **Waterfall Payment Allocation & 24% Late Fine**:
  - Late fine is standardized to 24% yearly ($\approx 0.06575\%$ daily rate).
  - Waterfall priority: Late Fine First $\rightarrow$ Principal Due Second.
  - If a partial payment is collected against principal and late fine, late fine is cleared to ₹0 till the collection date, and from the next day late fine resumes only on the remaining unpaid principal balance.
- **Deferred EMI Activation**:
  - In `PlotInstallment`, EMI installments (`installmentNumber > 0`) retain `dueDate: null` until 100% of the Downpayment target is cleared.
  - Once downpayment is paid in full on date $D$, EMIs automatically calculate `dueDate = D + (i * frequencyMultiplier)` months.

### GG. Dynamic DP & EMI Grace Period and Configurable Late Fine Resolution
- **Gotcha**: `PlotSeriesMaster.js` schema had hardcoded defaults (`default: 15`, `default: 24`). When reading series documents or checking plot installments, series schema defaults shadowed user-configured values from `PlotRateConfiguration` (set under Plot Pricing & Customer EMI Plans). This caused custom DP Grace Periods (e.g. 2 days) to be overridden with 15 days, resulting in 0 late fines even when collections were 4 days overdue, and hardcoded `24% P.A.` text in EMI cards and tables.
- **Fix Pattern**:
  - Removed shadowing schema defaults from `PlotSeriesMaster.js`.
  - Standardized `PlotRateConfiguration` as the authoritative global master for `dpGracePeriodDays`, `emiGracePeriodDays`, `lateFineFrequency`, and `lateFineRate` in [`plots.service.js`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots.service.js) across `createReceipt`, `updateReceipt`, and `rebuildBookingInstallmentsState`.
  - Hydrated `rateConfig` directly on component mount (`useEffect`) in [`InstallmentCollection.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/InstallmentCollection.jsx).
  - Dynamically formatted all fine labels (`Late Fine (${rateLabel})`) in [`ReceivePaymentForm.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/components/ReceivePaymentForm.jsx) and updated the Downpayment status badge to indicate whether payment is within grace or overdue by $N$ days.

### HH. Automated Billing Commission Ledger Integrity & Non-Editable/Non-Deletable Protection
- **Billing Edit & Delete Auto-Sync**:
  - In `plotDeveloper.service.js` (`syncBookingSponsorCommissions`), when a Downpayment/EMI receipt amount is edited or deleted, the system directly synchronizes the corresponding `commission_fixed` entry in the Business Associate / Business Partner ledger via `accountingService.updateLedgerEntry` or `accountingService.deleteLedgerEntry`.
  - Propagates running balance recalculations across all subsequent transactions on that ledger.
  - Cleans up orphan commission entries if a receipt is deleted or rejected.
- **Direct Edit / Delete Protection (Audit Integrity)**:
  - In `server/controllers/ledger.js` (`updateEntry` & `deleteEntry`), entries with `source.startsWith('commission')` or `source === 'plot_payout'` are blocked from direct manual editing or deletion (returning HTTP 400), ensuring they cannot diverge from billing receipts.
  - In `client/src/pages/admin/ledger/ledgerhelper.jsx` (`getLedgerColumns`), automated billing commission entries replace the standard Edit/Trash action buttons with a locked `Auto Billing` badge and explanatory tooltip.

### JJ. Plot Booking Authorization Workflow, Pre-Booking Confirmation & One-Time vs EMI Scheme
- **Pending Authorization Workflow**:
  - `PlotBooking` schema updated with `status: 'PENDING'` (default for new bookings) and `status: 'REJECTED'`.
  - When submitted, new plot bookings default to `status: 'PENDING'`. The plot is reserved, and land stock allocations are committed in pending state.
  - Authorized users (Admin/Manager) have **Approve Booking** (`PUT /api/plots/bookings/:id/approve`) and **Reject Booking** (`PUT /api/plots/bookings/:id/reject`) options in [PlotBookingDetails.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/booking/PlotBookingDetails.jsx).
  - Approving activates the booking to `ACTIVE` and generates audit stamps (`approvedBy`, `approvedAt`).
  - Rejecting updates status to `REJECTED`, marks `rejectedBy`, `rejectedAt`, and `rejectionReason`, releases the plot back to `AVAILABLE`, and restores allocated land stock back to the Kisan Land Agreement.
- **Pre-Booking Confirmation Modal**:
  - [BookingConfirmationModal.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/booking/components/BookingConfirmationModal.jsx) opens before final submission, showing verified customer details, plot specifications, rates, discounts, payment plan, and land sourcing allocation.
- **One Time (Full Payment) vs EMI Plan Toggle**:
  - In [StepTermsAndPayment.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/booking/components/StepTermsAndPayment.jsx), users can choose between **One Time (Full Payment)** and **EMI / Installment Plan**.
  - When **One Time** is selected, downpayment is automatically set to 100% of net contract value, EMI fields are omitted (`installmentCount: 0`, `tenureMonths: 0`), and the schedule card displays a confirmation banner.
  - When **EMI** is selected, the total duration (`8 Months total duration`) is rendered in a prominent, bold, and larger highlighted container badge.



