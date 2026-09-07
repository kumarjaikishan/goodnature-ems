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

### S. Frontend Route Conflict Resolution
- **Gotcha**: Placing a top-level `<Route path="/dashboard" element={!islogin && <Navigate to="/login" replace />} />` inside `<Routes>` in [App.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/App.jsx) caused React Router v6 to match `/dashboard` with `element={false}` when `islogin` was `true`, shadowing the nested `{roleRoute}` and rendering a blank white screen with no console errors.
- **Fix**: Removed the conflicting route and let `{roleRoute}` handle all `/dashboard` nested views through `<ProtectedRoutes />`, with fallback redirecting unauthenticated users to `/login`.

### T. Standalone MongoDB vs Replica Set Transactions
- **Gotcha**: Calling `session.startTransaction()` on a standalone local MongoDB instance throws `"Transaction numbers are only allowed on a replica set member or mongos"`.
- **Fix Pattern**: [server/conn/conn.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/conn/conn.js) patches `mongoose.startSession()` globally on boot. If the active MongoDB connection is standalone, `startTransaction()`, `commitTransaction()`, and `abortTransaction()` are safely handled as no-ops while passing standard operations through to MongoDB without transaction headers, while full multi-document ACID transactions remain active for replica sets / MongoDB Atlas.

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

### V. Comprehensive Database Seeding Script (`npm run seed`)
- **Script**: `server/scripts/seed.js` (executable via `npm run seed` in `server/`).
- **Features**:
  - Automatically clears previous test data for Plot Series, Plots, Customers, Kisan Agreements, Deeds, Kisan Ledgers, Stock Ledgers, Bookings, and Receipts.
  - Generates Series: **E Series** (11 plots, 800 sqft, 20x40), **A Series** (10 plots, 2400 sqft, 40x60), **D Series** (10 plots, 1600 sqft, 40x40), **C Series** (10 plots, 1200 sqft, 30x40).
  - Generates **Multi-Parcel Kisan Agreements** with Chaudhi, Dismil rates, document attachments, selective Registry Deeds, and fully balanced Kisan Financial Ledgers.
  - Seeds sample bookings with live downpayments and land stock allocation tracking.

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
  3. `server/services/plots.service.js`: Added explicit session propagation and safe `userId` ObjectId checks for `PlotAuditLog`.


