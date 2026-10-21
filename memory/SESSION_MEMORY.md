# SESSION_MEMORY.md — Session Memory & Discoveries

This file records session notes, caveats, and discoveries across active sessions.

---

- **3-Tier Hierarchy (Branch Partner -> Business Partner -> Business Associate) & 0.5% Branch Commission Override [COMPLETED]**:
  - **Context & Architecture**:
    - The sales structure operates in a 3-tier hierarchy:
      1. **Branch / Regional Head (Branch Partner)**: Associated with the physical `Branch` (`branch.branchPartnerId`). Automatically earns a **0.5% Branch Commission override** on every booking collection realized within that branch.
      2. **Business Partner (BP)**: Senior sponsor (`sponsorId = null`), earning direct slab commissions and team differential commissions from downline associates.
      3. **Business Associate (BA)**: Downline sponsor (`sponsorId = partnerId`), earning direct slab commissions on self-sourced bookings.
    - Uses the unified authentication and portal model: Branch Partners log in via the existing sponsor portal (`/dashboard/business-developer`), which automatically detects their Branch Partner status, renders the 🏢 Branch Partner badge, calculates Branch Sales Turnover, and lists all BPs and BAs in that branch as subordinates.
  - **Backend Implementations**:
    - **Models**:
      - `server/models/branch.js`: Added `branchPartnerId: { type: ObjectId, ref: 'user', default: null }`.
      - `server/models/PlotBooking.js`: Added `branchId: { type: ObjectId, ref: 'Branch' }` and `branchPartnerId: { type: ObjectId, ref: 'User' }`.
      - `server/models/PlotProductBooking.js`: Added `branchId` and `branchPartnerId`.
      - `server/models/PlotSponsorCommission.js`: Added `'BRANCH_OVERRIDE'` to `commissionRole.enum`.
    - **Branch Management Controller (`server/controllers/admin.js`)**:
      - Updated `addBranch` and `editBranch` to save `branchPartnerId`, populate `branchPartnerId` in responses, and auto-add the branch to the sponsor's `branchIds`. Also populated `branchPartnerId` in `firstfetch`.
    - **Booking Sourcing & Branch Resolution**:
      - `server/services/plots/plotBooking.service.js` & `plotProduct.service.js`: Resolves branch from booking input, sponsor's `branchIds[0]`, parent sponsor's branch, or physical branch, and automatically pulls `branch.branchPartnerId` onto the booking record.
    - **Commission Calculation & Ledger Posting (`server/services/plots/plotDeveloper.service.js`)**:
      - In `syncBookingSponsorCommissions` & `syncProductBookingSponsorCommissions`: Computes $\text{Branch Override} = \text{Collection Realized} \times 0.5\%$.
      - Automatically creates a double-entry Credit transaction in the Branch Partner's universal ledger (`source: 'commission_branch'`) referencing the booking and collection receipt.
      - Saves an audit record in `PlotSponsorCommission` with `commissionRole: 'BRANCH_OVERRIDE'`.
      - Updated cleanup to preserve `commission_branch` when removing obsolete commission entries.
      - In `getSponsorDashboardStats`: Detects Branch Partner via `Branch.findOne({ branchPartnerId: sponsor._id })`, scopes branch bookings and collections, adds `roleDisplay: "Branch Partner (<Branch Name>)"`, branch sales turnover, and displays all branch BPs & BAs in network.
      - In `getSponsorStatement`: Maps transactions with role label `"Branch Override (0.5%)"`.
      - In `getSponsors`: Added `roleType === 'branch_partner'` filter and returned `isBranchPartner` & `branchPartnerBranch`.
    - **Monthly Target Closing (`server/services/plots/plotClosing.service.js`)**:
      - Detects `isBranch` partner and computes monthly target slabs matching Section 3 Branch Partner targets.
  - **Frontend Implementations**:
    - **Admin Organization (`addbranch.jsx`, `BranchManager.jsx`)**:
      - `addbranch.jsx`: Added Branch Partner selection dropdown using custom portal `Select`, fetching all registered sponsors with formatted badges (`Name (Code) — Role`).
      - `BranchManager.jsx`: Added "Branch Partner (0.5% Override)" table column with avatar & sponsor code, and dedicated override badge pill in grid view cards.
    - **Sponsor Views (`PlotBusinessDevelopers.jsx`, `BusinessDeveloperDashboard.jsx`)**:
      - `PlotBusinessDevelopers.jsx`: Added "🏢 Branch Partner" badge in Designation column and "🏢 Branch Partners" filter tab.
      - `BusinessDeveloperDashboard.jsx`: Displays "🏢 Branch Partner (Branch Name)" badge in profile header.
    - **Ledger Viewing**:
      - Branch Partner override transactions are viewable under `/dashboard/ledger/branch-partners` and individual ledger statements (`/dashboard/ledger/:id`) with real-time balance calculations.
  - **Documentation Updates**:
    - Updated `docs/STRUCTURE.md` with new models, modular plot sub-services, and client components.
    - Updated `docs/ARCHITECTURE.md` with Section 3.E data flow diagram.
    - Updated `docs/PROJECT_CONTEXT.md` Section 3.D with 3-tier hierarchy details.
    - Updated `docs/DECISIONS.md` with Decision #9.
    - Updated `docs/BUSINESS_PARTNER_ASSOCIATE_SPEC.md` with 3-tier hierarchy and commission sequence.

- **Plot Booking Ledger Dedicated Page & Table Action [COMPLETED]**:
  - **Feature**: User requested a dedicated booking ledger accessible directly from the Actions column in the Plot Bookings table (`/dashboard/plots/booking`), rendered as a full page rather than a modal.
  - **Backend**:
    - Created `getBookingLedger(id)` in `server/services/plots/plotBooking.service.js` and exposed via `plotsService.getBookingLedger(id)` in `server/services/plots/index.js`.
    - Implemented `getBookingLedger` controller in `server/controllers/plots.controller.js` and mounted route `GET /plots/bookings/:id/ledger` in `server/router/plots.routes.js`.
    - Calculates real-time running ledger entries: Initial Contract Plot Consideration (Debit), each realized receipt collection (Credit), and any cancellation refunds, alongside full KPI summaries, installments schedule, and customer/plot metadata.
  - **Frontend**:
    - Built `client/src/pages/plots/booking/PlotBookingLedgerPage.jsx` featuring:
      - Back navigation, booking status/scheme badges, and quick action buttons ("Print Statement", "Collect Payment", "View Full Contract").
      - 5 KPI summary cards (Gross Value, Discount, Net Payable Debit, Realized Credit, Outstanding Balance Dr).
      - Amount in words banner using `amountInWords` utility.
      - Tabbed layout: Tab 1 "Financial Statement" (chronological running ledger table with search filter and printable receipts), Tab 2 "Installments Schedule" (due dates, principal, fine, paid amounts), Tab 3 "Allottee & Plot Details" (dimensions, boundaries, master data).
      - Official Print Statement generator formatted for A4 printing with company branding, table of accounts, and signature lines.
    - Wired up routes in `client/src/App.jsx` for `/dashboard/plots/booking/:id/ledger` and `/dashboard/plots/booking/ledger/:id` in both `managementRoutes` and `sponsorRoutes`.
    - Added dedicated emerald `BookOpen` action button in `BookingColumns.jsx` (`Actions` column of `/dashboard/plots/booking`) navigating directly to `/dashboard/plots/booking/${b._id}/ledger`.
    - Added an "Account Ledger" button in the action header of `PlotBookingDetails.jsx` for seamless navigation.

- **Plot Commission Slabs Magnitude Mismatch & Dynamic Range Labels [COMPLETED]**:
  - **Issue**: Slabs configured in Plot Products Policy were typed with 5 zeros (`100000` - `149999`) representing ₹1 Lakh to ₹1.5 Lakh instead of ₹10 Lakhs to ₹15 Lakhs (`1000000` - `1499999`). Consequently, Anuj Kumar's achieved period business of `₹11,00,000.00` (11 Lakhs, 7 digits) exceeded `₹3,00,000` (3 Lakhs), matching the 6th slab (`300000` to `Unlimited` at 2%), and displaying the hardcoded `₹3,00,000+` label.
  - **Fixes**:
    - **Database Policy Correction**: Updated `PLOT_PRODUCT` and `PLOT_SALE` target slabs to the intended 10-Lakhs tier scale (`1 - 9,99,999` @ 1%, `10,00,000 - 14,99,999` @ 1.2%, up to `30,00,000 & Above` @ 2.0%). Under this scale, ₹11,00,000 falls accurately into Slab 2 (`₹10,00,000 - ₹14,99,999`) yielding **1.2%** (`₹13,200.00`), and Mahendra's ₹8,30,000 falls into Slab 1 (`₹1 - ₹9,99,999`) yielding **1.0%** (`₹8,300.00`).
    - **Dynamic Slab Labeling (`server/models/CommissionPolicyConfig.js`)**: Replaced stale template strings with dynamic `formatSlabRange` so labels always reflect the true Indian range format (e.g. `₹10,00,000 - ₹14,99,999` or `₹30,00,000 & Above`).
    - **Centralized Amount in Words Utility (`client/src/utils/numToWord.jsx`)**: Built a robust `amountInWords(num, options)` common helper that converts numbers into proper Title Case Indian currency words (e.g. `1499999` -> `"Fourteen Lakh Ninety Nine Thousand Nine Hundred And Ninety Nine Rupees"`). Integrated below all slab inputs in `CommissionPolicyMatrix.jsx`, `PayLedgerModal.jsx`, and `SetupPayoutModal.jsx`.

- **Branch Access Scoping (`getemployee`, `Employe.jsx`)**:
  - **Backend**: Added `getUserAllowedBranchIds` helper in `server/controllers/admin.js`. For non-unrestricted roles (e.g. managers), fetches fresh `branchIds` from DB and enforces `{ branchId: { $in: allowedBranchIds } }` on `getemployee`, `employeelist`, `departmentlist`, and `firstfetch`. Even if "all" or no branch query param is passed, never returns employees from unauthorized branches.
  - **Frontend**: In `Employe.jsx`, `filteredEmployees` and `departmentlist` strictly filter by `userAllowedBranchIds` when "All Branches" is selected, and `branchOptions` restricts the selectable branches to the user's authorized branches.

- **Executive Dashboard System (7 Core Modules, Date Range Filters & Role Scoping) [COMPLETED]**:
  - **Backend**:
    - Created `server/services/dashboard.service.js` with `getDateRange` (Current Day as default, Financial Year 1 Apr - 31 Mar, Month, Custom Range in Asia/Kolkata timezone) and `getRoleScope` supporting all personas (Super Admin, Admin, Branch Manager, Accountant, Cashier, Employee, Promoter, Seller, Broker).
    - Implemented aggregations and detail queries for the 7 requested items:
      1. `Total Income` (Down Payment, EMI Payment, Voucher Receipt)
      2. `Total Expense` (Salary, Voucher Expense, Incentive Payment, Customer Refund Payment, Seller Payment)
      3. `All Customer` (Filter by Plan By: Full Payment, EMI, Plot Product)
      4. `All Promoters` (Search by Rank: Business Partner, Business Associate)
      5. `Account Ledger` (Filter by Bank Name, running liquid balances & turnover)
      6. `All Seller` (Filter by Plot No / Khesra Number)
      14. `All Employee` (Filter by Branch)
    - Created `server/controllers/dashboard.controller.js` and mounted `/api/dashboard/overview` & `/api/dashboard/section-details` in `server/router/route.js`.
  - **Frontend**:
    - Built `ExecutiveFilterBar.jsx` for seamless toggling of Current Day (default), Financial Year, Month, Custom Range, and authorized Branch selection.
    - Built `DashboardKpiCards.jsx` with 7 cards, real-time metrics in INR, and quick-filter chips.
    - Built `DashboardSectionModal.jsx` for comprehensive drill-down tables with search, sub-filter tabs, pagination, and status styling.
    - Preserved 100% of the existing HR Attendance display (avatars, status rings, and legends) in `AdminDashboard.jsx`.

- **Route-Level Permission Guard & Access Security [COMPLETED]**:
  - Implemented `client/src/utils/RoutePermissionGuard.jsx` using `hasPermission(profile, resource, action)` checking against the user profile stored in Redux (`state.user.profile` / `state.employee.profile`).
  - Wrapped secured routes in `App.jsx` (including `/dashboard/payroll`, `/dashboard/vouchers`, `/dashboard/advance`, `/dashboard/plots/...`, etc.) with `<RoutePermissionGuard resource="..." action={...}>`.
  - Blocks unauthorized users attempting direct URL paste navigation and cleanly redirects with a toast notification to `/dashboard`.

- **Live Pending Approval Badges & Authority Indicators [COMPLETED]**:
  - **Backend**:
    - Created `server/controllers/approvalController.js` and mounted `GET /approvals/pending-stats` in `server/router/route.js`.
    - Returns live counts for `voucher` (pending vouchers), `downpayment` (pending downpayments/full payments), `emi` (pending EMI installments), `fundTransfer` (pending inter-ledger fund transfers), `accountTotal`, and `total`.
    - Scopes data strictly: Superadmin/admin/developer see global counts; Managers see counts scoped to their assigned branches; other non-authority roles only see incoming fund transfers directed to their ledger/account.
  - **Frontend**:
    - Updated `client/src/components/sidebar.jsx` to fetch `/approvals/pending-stats` on mount and poll every 30s.
    - Added live badge counters to:
      - Parent `Account` menu (when `accountTotal > 0`) with pulsing dot indicator when sidebar is collapsed.
      - Child items: `Downpayment`, `EMI`, and `Vouchers`.
      - Parent `Ledger` menu and child `Fund Transfers` (when `fundTransfer > 0`).

- **Bank Ledger Edit / Add Permissions [COMPLETED]**:
  - **Frontend UI (`BankLedgersPage.jsx`)**:
    - Integrated `usePermission("bank_ledger", 2)` (`canCreate`) and `usePermission("bank_ledger", 3)` (`canUpdate`).
    - Hidden the `Add Bank Account` button when `canCreate` is false.
    - Hidden the `Edit` button (in both card and table views) when `canUpdate` is false.
    - Added guards in `handleOpenModal` and `handleSaveBank` to reject unauthorized attempts before any network call.
  - **Permission Fallback & Backend Route (`CheckPermission.jsx`, `checkpermission.js`, `route.js`)**:
    - Updated backend route for `/ledger/banks` and `/ledger/banks/:id` to check `bank_ledger` permission with seamless fallback to `ledger`.
    - Updated client `hasPermission` helper with intelligent sub-module fallback to `ledger` for `bank_ledger`, `cash_ledger`, `fund_transfer`, etc.

- **Plot Incentive Period Overlap & Duplicate Closing Prevention [COMPLETED]**:
  - **Backend (`plotClosing.service.js`)**:
    - Added `findOverlappingClosing` method querying non-reversed (`status !== 'REVERSED'`) batches of the same `closingType` where `startDate <= end && endDate >= start`.
    - Target Incentive (`TARGET_INCENTIVE`) and Extra Incentive (`EXTRA_INCENTIVE`) are evaluated independently (e.g. quarterly vs yearly) by scoping strictly to `closingType`.
    - Enforced hard validation in both `createPlotClosing` and `updatePlotClosing` (excluding `_id` on update) returning `ApiError.badRequest(...)` with clear batch name, number, and period dates.
    - Updated `previewPlotClosing` to return `overlappingClosing` details and formatted `overlappingWarning` text.
  - **Frontend UI (`PlotIncentiveProcessPage.jsx`)**:
    - Displays a prominent amber warning card explaining which batch already issued incentives and up to what date, prompting the admin to adjust the start date after that batch's end date.
    - Automatically disables both top and bottom "Confirm & Close Period" / "Save & Update Batch" buttons when an overlapping closed batch is detected.
    - Blocks submission in `handleSubmit` with an informative toast warning.
- **Voucher Creation Immediate Disbursement Restriction [COMPLETED]**:
  - In `client/src/pages/vouchers/VoucherList.jsx`, the "Source Payment Account (Cash / Bank)" section and the "Disburse Immediately" checkbox are now conditionally rendered strictly when `canApproveVoucher` is true (`canApproveVoucher = ['superadmin', 'admin', 'manager', 'developer', 'grant', 'demo'].includes(userRole) && canUpdate`).
  - Roles without voucher approval authority (such as cashier, accountant, employee) only create pending vouchers to "Submit for Approval". Actual disbursements and debit source accounts can only be authorized during approval or after approval by authorized users.
  - Form submission payload explicitly safeguards `initialPayment`, setting it to `0` and `paymentLedgerId: null` unless the creator has approval authority.

- **Employee Advance Permission Enforcement & Token Invalidation Fix [COMPLETED]**:
  - **Backend Security Bug Fixed (`server/middleware/checkpermission.js`)**:
    - Previously, `checkPermission` had a bypass: `if (checkPermKey(userPermissions)) return next();` which read permissions baked into the JWT token at login. If superadmin revoked permissions in User Management (e.g. from `[1, 2, 3, 4]` down to `[1]` Read-only), the user's active session token was still honoring the old token permissions until logout.
    - Updated `checkPermission` to always evaluate the user's fresh permissions directly against the database (cached with fast 30s TTL and immediately invalidated on user edits in `admin.js`). Now, revoked permissions take effect immediately even if the user still holds an old JWT token.
  - **Frontend UI & Action Guards (`client/src/pages/advance/advance.jsx`)**:
    - Added `canCreate = usePermission('advance', 2)`, `canUpdate = usePermission('advance', 3)`, and `canDelete = usePermission('advance', 4)`.
    - Hidden the "Record Advance" button for users lacking create permission (`canCreate`).
    - In the advance transactions table, conditionally rendered the Edit button (`canUpdate`) and Delete button (`canDelete`), hiding the Actions column completely if the user only has Read access.
- **Plot Product Scheme Matrix: Annual Interest Rate, RD Yearly Compounding & Actual Plot Sale Slabs [COMPLETED]**:
  - **Math & Compounding Models (`client/src/utils/schemeInterestCalculator.js`)**:
    - **R.D. (Recurring Deposit) Yearly Compounding**: Implemented formula for monthly installments with annual compounding: $\sum_{k=1}^{M} P \times (1 + r/100)^{(M - k + 1) / 12}$.
    - **F.D. (Fixed Deposit) Standard Compounding**: Standard quarterly compounding $(1 + r/400)^{M/3}$ and annual compounding $(1 + r/100)^{M/12}$.
  - **Backend Model & Services (`InvestmentSchemeConfig.js`, `investment.service.js`, `plotProduct.service.js`)**:
    - Added `planType` (`'INVESTMENT_BUYBACK'` vs `'REGISTRY_SALE'`) and `annualInterestRate` (default 10.5% p.a.) to `schemeSlabSchema`.
    - Changed `rdMaturityPercent` and `fdMaturityPercent` `min: 100` to `min: 0` to officially support Actual Plot Sale (0% customer return, active hierarchy commissions).
    - Preserved `planType`, `annualInterestRate`, and `planName` across `updateSchemeConfig` and `getAvailableTenures()`.
  - **Frontend Matrix UI (`ProductSchemeRulesTab.jsx` & `ProductBookingPage.jsx`)**:
    - Removed `Plan Type` column as requested by user; simplified table to single `+ Add Tenure Slab` button.
    - If Annual Rate or RD/FD return is set to `0`, the row naturally represents an Actual Plot Sale (0% customer return, active hierarchy commissions).
    - Live auto-calculation from Annual Rate (% p.a.) into RD Return % (Yearly Compounding) and FD Return %.
    - Row-level recalculation action (`RotateCcw`) to re-sync returns from Annual Rate at any time.
    - Backend automatically infers `planType: 'REGISTRY_SALE'` when returns are 0, and `'INVESTMENT_BUYBACK'` when returns > 0, ensuring full backwards compatibility without requiring a dedicated input column.
    - Updated `ProductBookingPage.jsx` tenure selection dropdown to clearly distinguish between `Actual Plot Sale (0% Return / Registry)` and `Return: RD X% | FD Y%`.
- **Plot Booking Step 3: Scheme Plan Selector (by Plan Name) & Dynamic Hierarchy Commissions [COMPLETED]**:
  - **Backend Model & Services (`PlotBooking.js`, `plotConfig.service.js`, `plotBooking.service.js`, `plotDeveloper.service.js`)**:
    - Added `planName`, `bpCommissionPercent`, `branchCommissionPercent`, `rdMaturityPercent`, `fdMaturityPercent`, and `annualInterestRate` fields to `PlotBooking` schema.
    - Enhanced `getRateConfig()` in `plotConfig.service.js` to attach `schemeSlabs` from `InvestmentSchemeConfig`.
    - Enhanced `createBookingOrHold` in `plotBooking.service.js` to accept and persist plan name and locked commission rates.
    - Updated `syncBookingSponsorCommissions` in `plotDeveloper.service.js` to use dynamic `baFixedPct`, `bpFixedPct`, and `combinedFixedPct` from the booking's selected plan rather than hardcoded 5%/2%/7%.
  - **Frontend UI (`PlotBooking.jsx`, `StepTermsAndPayment.jsx`, `BookingSummarySidebar.jsx`, `PlotBookingDetails.jsx`)**:
    - Redesigned the Scheme Plan card to a clean, light, seamless styling matching the `PROJECT NAME` card with compact inline commission badges.
- **Plot Product Booking (`/dashboard/plots/products/book`): Scheme Plan Selector & Dynamic Commission Locking [COMPLETED]**:
  - **Backend Model & Services (`PlotProductBooking.js`, `plotProduct.service.js`, `plotDeveloper.service.js`)**:
    - Added `planName`, `promoterCommissionPercent`, `developerCommissionPercent`, `bpCommissionPercent`, `branchCommissionPercent`, `rdMaturityPercent`, `fdMaturityPercent`, and `annualInterestRate` to `PlotProductBooking` schema.
    - Updated `createProductBooking` to store these locked plan rates on booking creation.
    - Updated `syncProductBookingSponsorCommissions` in `plotDeveloper.service.js` to prioritize matching scheme slabs by `booking.planName` first, then `booking.tenureMonths`, and respect custom locked commissions.
  - **Frontend UI (`ProductBookingPage.jsx` & `ProductSalesTab.jsx`)**:
    - Upgraded Card 3 from simple tenure selection to full Scheme Plan & Tenure dropdown uniquely identified by `getPlanKey` (`t._id` or composite key) to prevent value collisions when multiple slabs share the same name (e.g. `A-24`).
    - Kept selector UI minimal and clean without cluttering commission badge strips.
    - Updated right summary card to reflect Scheme Plan Name and Tenure cleanly.
    - Cleaned up duplicate icons on `ProductSalesTab.jsx` action button to use standard `<Plus size={15} />`.
    - Removed redundant manual asterisk from `DateInput` labels in `ProductBookingPage.jsx` to prevent `* *` duplicate asterisk rendering.
    - Cleaned up `BookingCertificateViewer.jsx`: removed "Plot & Fractional Land Development Division" subheader, "Official Product Certificate" badge, and subtitle disclaimer sentence as requested.
    - Fixed Overdue / Late Fine Calculation: Removed erroneous `+ 1` from `diffDays` calculation across backend services (`plotProduct.service.js`, `plotCollection.service.js`) and frontend forms (`ProductReceivePaymentForm.jsx`, `ProductInstallmentCollectModal.jsx`, `ProductCustomerLedgerModal.jsx`, `InstallmentCollection.jsx`). When paying on the exact due date (e.g. 14 Sep for 14 Sep), `diffDays` is now properly `0`, with `0 Days` delay, `₹0` late fine, and status remaining `Pending` / on-time.
    - Redesigned "Live Payment Assessment" banner in `ProductReceivePaymentForm.jsx` from heavy dark gradient to a clean, light card matching the rest of the page.
- **Independent Annual Interest Rates for RD & FD on Same Tenure Matrix [COMPLETED]**:
  - **Requirement**: Allow entering different annual interest rates for R.D. (Recurring Deposit / Monthly EMI) and F.D. (Fixed Deposit / One-Time Full Payment) within the same tenure slab row, and auto-calculate each return percent independently for its respective rate.
  - **Backend Model & Services (`InvestmentSchemeConfig.js`, `investment.service.js`, `plotProduct.service.js`, `plotConfig.service.js`)**:
    - Added `rdAnnualInterestRate` and `fdAnnualInterestRate` to `schemeSlabSchema` (with backwards compatibility fallback to `annualInterestRate`).
    - Updated `updateSchemeConfig`, `getAvailableTenures`, and `getRateConfig` to persist and return both `rdAnnualInterestRate` and `fdAnnualInterestRate`.
  - **Frontend UI (`ProductSchemeRulesTab.jsx`, `ProductBookingPage.jsx`)**:
    - Embedded the **RD Rate (% p.a.)** directly inside the **EMI (R.D.) Scheme** column (`Rate % | Return %`) and the **FD Rate (% p.a.)** directly inside the **One-Time (F.D.) Scheme** column (`Rate % | Return %`), eliminating the redundant standalone Annual Rate column.
    - Editing `rdAnnualInterestRate` inside the RD column auto-calculates `rdMaturityPercent` via Yearly Compounding.
    - Editing `fdAnnualInterestRate` inside the FD column auto-calculates `fdMaturityPercent` via Standard Banking Compounding.
    - Changing `tenureMonths` auto-calculates both returns using their respective independent rates.
    - Updated `ProductBookingPage.jsx` to dynamically assign `annualInterestRate` based on whether the booking is `MONTHLY_INSTALLMENT` (RD rate) or `FULL_PAYMENT` (FD rate).


