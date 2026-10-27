# SESSION_MEMORY.md — Session Memory & Discoveries

This file records session notes, caveats, and discoveries across active sessions.

- **User Rename vs Cash Ledger Name Desynchronization Fix [COMPLETED]**:
  - **Issue**:
    - When logging in as Nawraj Singh Nayan (Cashier), the "From Account (Source)" dropdown in Fund Transfers showed `subodh kumar (Cash Ledger)`.
  - **Root Causes**:
    1. **Stale Ledger Name in DB**: The user document (`68aef4129017d8efd4f6a6ca`) was previously named "Subodh Kumar" and later renamed to "Nawraj Singh Nayan". However, in [ledger.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/ledger.js) (`createLedgerForUsers`), the name update condition was `if (primaryLedger.name !== expectedName && !primaryLedger.name.includes('(Cash Ledger)'))`. Because `primaryLedger.name` already included `'(Cash Ledger)'`, it skipped updating the name!
    2. **Missing Sync on User Edit**: [admin.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/admin.js) (`editAdmin`) updated the User collection without synchronizing the linked `user_cash` ledger title.
    3. **Unsafe Fallback**: In [FundTransfersPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/FundTransfersPage.jsx), `activeMyCash` fell back to `treasuryLedgers.cashLedgers[0]`, which could wrongly select another user's cash account if the user ID match failed.
  - **Fixes**:
    - Removed `!primaryLedger.name.includes('(Cash Ledger)')` in `createLedgerForUsers()` so renamed users always sync their cash ledger name.
    - In `editAdmin()`, added automatic synchronization of `Ledger` docs with `assignedUserId: id, ledgerType: 'user_cash'`.
    - Removed the unsafe `treasuryLedgers.cashLedgers[0]` fallback from `activeMyCash` in `FundTransfersPage.jsx`.
    - Synchronized Nawraj's ledger name in the database from `subodh kumar (Cash Ledger)` to `Nawraj singh nayan (Cash Ledger)`.

- **Cash Ledgers Granular Permissions & Fund Transfer Selection Scope [COMPLETED]**:
  - **Requirement**:
    - Provide a granular permission system for Cash Ledgers/Drawers in user editing (`/dashboard/organization/users/:id/edit`).
    - When initiating fund transfers in `/dashboard/ledger/transfers`, users should only see and transfer funds to cash drawers authorized for them.
    - Support "All Cash Accounts", "Selected Cash Accounts Only" (with Select All / Clear All checklist), and "No Cash Transfer Access".
  - **Implementation**:
    - **User Schema & Model ([user.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/user.js))**:
      - Added `cashPermissions: { accessScope: { type: String, enum: ['all', 'selected', 'none'], default: 'all' }, allowedCashLedgerIds: [{ type: ObjectId, ref: 'Ledger' }] }`.
    - **Admin Controller & FirstFetch ([admin.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/admin.js))**:
      - Handled `cashPermissions` parsing and saving in `addAdmin` and `editAdmin`.
      - Populated `cashPermissions.allowedCashLedgerIds` in `getAdmin`, `getAdminById`, and `firstfetch`.
    - **Treasury & Ledger Controller ([ledger.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/ledger.js))**:
      - In `getTreasuryLedgers`: filtered cash drawers by caller's `cashPermissions` (unless `all=true` is requested by superadmin or caller is supreme developer/superadmin with all scope).
    - **Fund Transfer Backend Verification ([fundTransfer.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/fundTransfer.js))**:
      - In `requestTransfer`: verified `cPerm` (`caller.cashPermissions`) when `toLedger.ledgerType === 'user_cash'`, ensuring non-superadmins can only transfer to authorized cash drawers.
    - **User Form Frontend ([AdminUserFormPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/organization/pages/AdminUserFormPage.jsx))**:
      - Added Section 4: "Cash Drawers & Inter-Account Transfer Authority" with scope radio controls, "Select All Cash Ledgers" / "Clear All" buttons, and interactive cash drawer cards with balances.
    - **Fund Transfer Frontend ([FundTransfersPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/FundTransfersPage.jsx))**:
      - Filtered "Recipient Cash Accounts" dropdown by `currentUser?.cashPermissions`, preventing unauthorized cash drawers from appearing.

- **Ledger Submenu "Add Ledger" Redundancy Removal (Option A) [COMPLETED]**:
  - **Requirement**:
    - Remove the confusing "Add Ledger" button on entity-specific ledger pages (Employees, Sellers, Business Associates, Business Partners, Branch Partners).
    - These ledgers are automatically synced reflections of their core domain records.
  - **Implementation**:
    - In [ledgerpagelist.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/ledgerpagelist.jsx), wrapped the "Add Ledger" button to only render when `category === "all"`.

- **Dedicated Incentive & Closings RBAC Permission (`plot_incentive`) [COMPLETED]**:
  - **Requirement**:
    - Disentangle the Incentive Matrix page (`/dashboard/plots/incentives`) and closing endpoints from `plot_sponsor`.
    - Provide a dedicated, granular permission `plot_incentive: "Incentive Closings & Rewards"` in the RBAC permissions matrix.
  - **Implementation**:
    - **Permissions Config & Presets ([userPermissionsConfig.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/organization/components/admin/userPermissionsConfig.js), [permission.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/utils/permission.js))**:
      - Added `plot_incentive` to `AllPermissionNames`, `MODULE_DISPLAY_NAMES`, and `MODULE_CATEGORIES.realestate`.
      - Configured role presets (`admin`: all [1,2,3,4], `manager`/`accountant`: [1,2,3], `sales`/`auditor`: [1], `cashier`/`hr`: []).
    - **Backend Routes ([plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js))**:
      - Replaced `plot_sponsor` with `plot_incentive` on `/closings/preview`, `POST /closings`, `GET /closings`, `GET /closings/:id`, `PUT /closings/:id`, and `DELETE /closings/:id`.
    - **Frontend Route Guards & Navigation ([App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx), [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx))**:
      - Sidebar "Incentive" menu item now requires `resource: "plot_incentive"`.
      - Route guards for `/dashboard/plots/incentives`, `/dashboard/plots/incentives/new`, `/dashboard/plots/incentives/edit/:id`, and `/dashboard/plots/closings*` now require `plot_incentive`.
    - **Granular Action Controls ([PlotIncentivesPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentivesPage.jsx))**:
      - Added `canCreate`, `canUpdate`, and `canDelete` permission checks on the "Process Target Incentive" button, batch edit button, and batch delete/reverse button.

- **Plot Booking & Investment Booking Strict RBAC Separation & Authorization Fix [COMPLETED]**:
  - **Issues**:
    1. "Investment Booking" was still showing in the sidebar and accessible even when only `plot_booking` was granted (due to an automatic backward-compatibility fallback from `investment_booking` to `plot_booking`).
    2. "Plot Booking" (`/dashboard/plots/booking`) was showing "Not Authorised" when granted `plot_booking` because the booking list component (`PlotReports.jsx`) queries `/plots/reports/bookings`, which was strictly guarded by `plot_reports` instead of `plot_booking`.
  - **Fixes**:
    - **Removed all fallbacks from `investment_booking` to `plot_booking`**:
      - In [CheckPermission.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/utils/CheckPermission.jsx) and [checkpermission.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/middleware/checkpermission.js), removed the fallback block.
      - In [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx) and [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx), set "Investment Booking" routes to strictly require `investment_booking`.
    - **Authorized Plot Booking Data Access**:
      - In [plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js):
        - Allowed `['plot_reports', 'plot_booking']` on `/reports/:type` so users with `plot_booking` can view the plot bookings and holds list.
        - Allowed `['plot_inventory', 'plot_booking']` on `GET /plots` and `GET /series` so users with `plot_booking` can create new bookings.
        - Separated `/product-bookings*` routes to strictly check `investment_booking`.

- **Plot Incentives & Extra Incentive Period Closing: Brand Theme Alignment [COMPLETED]**:
  - **Requirement**:
    - Remove all purple-based colors from `/dashboard/plots/incentives?tab=extra` and `/dashboard/plots/incentives/new?type=EXTRA_INCENTIVE`.
    - Align both pages with the project's standard Good Nature deep teal (`teal-800`, `teal-700`) and emerald (`emerald-700`, `emerald-800`, `emerald-50`) palette.
  - **Changes**:
    - [PlotIncentivesPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentivesPage.jsx): Replaced purple tabs, period summary badges, table headers, and status badges with emerald/teal classes.
    - [PlotIncentiveProcessPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentiveProcessPage.jsx): Replaced purple headers, parameter buttons, calendar icons, breakdown preview cards, associate table headers & rows, collection badges, and batch submission buttons with project teal and emerald styles.
    - Verified zero remaining `purple` color classes in the incentives directory.

- **Employee Performance Dropdown: Same-Name Disambiguation Fix [COMPLETED]**:
  - **Issue**:
    - On `/dashboard/performance`, when multiple employees shared the same name (e.g., "Deepak Kumar (Director)" and "Deepak Kumar (Customer Support)"), both entries were highlighted as selected simultaneously.
    - Cause: The dropdown option `value` was generated as `toSlug(empName)` (e.g. `deepak-kumar`) instead of a unique ID. Since both options had the identical string value `deepak-kumar`, `SearchableSelect` marked both as selected.
  - **Fix**:
    - **Frontend ([AttenPerformance.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/attandence/AttenPerformance.jsx))**:
      - `employeeOptions` now assigns each option a unique `value` using `emp.empId || emp.userid?._id || emp._id`.
      - `matchedEmployeeInUrl` checks exact `rawId`, `empDocId`, and `empId` before falling back to slug matching for backward compatibility.
      - `selectedEmployeeValue` maps strictly to the unique ID of the single matched employee so only that employee is highlighted.
      - `fetchPerformanceData` passes the resolved exact unique employee ID to the backend.
    - **Navigation ([employeehelper.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/employee/employeehelper.jsx), [Employe.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/employee/Employe.jsx))**:
      - `onViewAttendance` now passes `row.userid?._id || row._id` directly instead of `row.rawname`.
    - **Backend ([attandence.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/attandence.js))**:
      - Updated `employeeAttandence` to search by `empId` before falling back to regex name matching.

- **Plot Management Submenu: Product Sales Dedicated Page & Clean Separation [COMPLETED]**:
  - **Requirement**:
    - Completely separate the Product Sales & Bookings functionality from the Plot Products catalog page.
    - Remove the 2nd tab ("Product Sales & Bookings") entirely from `/dashboard/plots/products`.
    - Place the dedicated Product Sales functionality exclusively under `/dashboard/plots/product-sales` with its own submenu item "Product Sales" directly below "Bookings" in the sidebar.
  - **Implementation**:
    - **Standalone Page ([ProductSalesPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductSalesPage.jsx))**:
      - Created a dedicated page component specifically rendering `ProductSalesTab` and `ProductCustomerLedgerModal`.
      - Renders clean top header banner with ShoppingCart icon, total booking counts, and full sales/booking actions (New Sale, View Booking, Collection, Passbook Ledger, Allotment Certificate, Settle/Cancel).
    - **Plot Products Page Streamlined ([PlotProductsPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/PlotProductsPage.jsx))**:
      - Completely removed the 2nd tab ("Product Sales & Bookings") from `VALID_TABS`, tab header buttons, and tab rendering.
      - Page now focuses purely on:
        1. **Product Master & Dimensions** (`catalog`)
        2. **Scheme Rules & Returns Matrix** (`schemes`)
        3. **Target & Extra Incentive Policy** (`incentives`)
    - **Sidebar & Routes ([sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx), [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx))**:
      - Submenu "Product Sales" points directly to `/dashboard/plots/product-sales` rendering `<ProductSalesPage />`.
      - Route is secured with `RoutePermissionGuard` supporting `resource={["plot_booking", "plot_inventory"]}`.

- **Voucher Immediate Disbursement & Approval Lifecycle Fix [COMPLETED]**:
  - **Issue**:
    - When creating a financial voucher with "Disburse Immediately", the voucher was created in `PENDING` status with `paidAmount: 0`. The requested initial payment was discarded or not stored, and when a manager subsequently approved the voucher, it became approved as 100% due (unpaid) or reset already disbursed amounts to due.
  - **Fix & Clarification**:
    - **Voucher Model ([voucher.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/voucher.js))**: Added `initialPayment` to `voucherSchema` so initial requested disbursements are preserved.
    - **Approval Lifecycle ([voucher.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/voucher.js))**:
      - `createVoucher`: Stores `reqInitialPayment` on the voucher.
      - `approveVoucher`: Correctly checks `prevPaid` and calculates `additionalDisburse = Math.max(0, disbNum - prevPaid)`. Never resets already paid vouchers to "all due" and prevents duplicate bank ledger debits.
    - **UI Streamlining ([VoucherList.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/vouchers/VoucherList.jsx))**:
      - Hidden the "Source Payment Account (Cash / Bank) / Disburse Immediately" section in the Create Financial Voucher modal as requested. Vouchers are created cleanly for expense authorization, and disbursements are executed systematically upon Approval or via the designated "Pay" action.

- **Refund & Settlement Disbursement with Corporate Bank & Cash Treasury Authorization [COMPLETED]**:
  - **Requirement**:
    - When returning money / disbursing refund amounts (on `/dashboard/plots/booking/:id/ledger`, `/dashboard/plots/interest-calculator`, and in the product customer ledger modal), implement the exact options and security controls as voucher creation.
    - When online / bank transfer / cheque / UPI mode is selected, show all available corporate bank accounts the caller is authorized to disburse from (with live available balances and account numbers).
    - Enforce corporate bank permissions (`caller.bankPermissions` — `accessScope: 'all' | 'selected' | 'none'`, `allowPayments`, `allowedBankIds`).
    - When cash mode is selected, route through personal custody cash ledger (`myCashLedger`) showing live balance.
    - Ensure double-entry accounting in the treasury ledger (debiting the bank or cash ledger balance so company funds decrease accurately) and generate a valid financial `Voucher` matching the system schema.
  - **Implementation**:
    - **Treasury Helper ([plotRefundHelper.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotRefundHelper.js))**:
      - `resolveAndAuthorizePaymentLedger`: Enforces caller's bank permissions and cash custody constraints.
      - `disburseRefundTransaction`: Generates voucher number (`VCH-FY-XXXX`), creates financial `Voucher` (`status: 'PAID'`), atomically records a `DEBIT` entry in the corporate bank or cash ledger via `accountingService.recordLedgerEntry` to decrease balance, and returns the formatted `paymentEntry`.
    - **Database Schemas ([PlotBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotBooking.js), [PlotProductBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProductBooking.js))**:
      - Added `paymentLedgerId`, `paymentLedgerName`, `bankName`, and `accountNumber` to `refundPayments` subdocuments.
    - **Backend Services ([plotBooking.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotBooking.service.js), [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js))**:
      - Integrated `disburseRefundTransaction` into both immediate cancellation settlements and subsequent refund part-payments.
      - Updated statement formatting in `getBookingLedger` to display `[paymentLedgerName / bankName]`.
    - **Frontend Interfaces**:
      - [PlotBookingLedgerPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/booking/PlotBookingLedgerPage.jsx): Refactored the Disburse Refund Payment modal to use the centralized [Modalbox.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/custommodal/Modalbox.jsx) component (`max-w-lg`) with fixed sticky header and footer, responsive `max-h-[92vh]`, and internal body scrolling so form fields never exceed the viewport. Includes corporate bank account selector, live balance display, balance warning alert, and dynamic reference label for NEFT vs Cheque vs UPI.
      - [PlotInterestCalculator.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/calculator/PlotInterestCalculator.jsx): Added corporate bank account dropdown with live balances for immediate cancellation payouts.
      - [ProductCustomerLedgerModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductCustomerLedgerModal.jsx): Added treasury fetching and corporate bank / cash account selection in the product refund part-payment modal.

- **Commission Ledger Reversal on Booking & Product Cancellation [COMPLETED]**:
  - **Requirement**:
    - On the Plot Settlement & Cancellation Calculator page (`/dashboard/plots/interest-calculator`), when cancelling either a regular plot booking or a plot product sale booking, provide an option to reverse distributed commissions.
    - If "Reverse Commission" is chosen:
      - All commission amounts credited to Business Associates, Partners (override / direct), and Branch Partners for that booking must be debited from their respective ledger accounts.
      - Each debit entry must have the exact credited amount and proper narration matching the specific transaction (percentage, collection amount, receipt number, booking number, role).
      - Mark `PlotSponsorCommission` status as `reversed` with `reversedAt` and `reversalLedgerEntryId`.
    - If "Reverse Commission" is unchecked:
      - Beneficiaries retain their credited commission and no debit entries are added to their ledgers.
  - **Implementation**:
    - **Database Schemas**:
      - Updated [PlotSponsorCommission.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotSponsorCommission.js): Added `reversedAt` and `reversalLedgerEntryId` fields.
      - Updated [PlotBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotBooking.js) & [PlotProductBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProductBooking.js): Added `commissionReversed`, `commissionReversalDate`, `commissionReversalCount`, and `commissionReversalAmount`.
    - **Backend Services**:
      - In [plotBooking.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotBooking.service.js) (`processCustomerRefund`) and [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js) (`cancelProductBookingAndRefund`):
        - When `reverseCommission: true`: iterated over all active `PlotSponsorCommission` records for the booking and posted corresponding `DEBIT` entries via `accountingService.recordLedgerEntry` using exact matching amounts and detailed transaction narrations referencing receipt numbers and percentages.
        - Prevented accidental deletion of commissions or entries on cancelled bookings in [plotDeveloper.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotDeveloper.service.js) (`syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`).
      - Added endpoint `GET /plots/bookings/:id/commissions` and `GET /plots/product-bookings/:id/commissions` in [plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js) and [plots.controller.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/plots.controller.js).
    - **Frontend Calculator ([PlotInterestCalculator.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/calculator/PlotInterestCalculator.jsx))**:
      - Added real-time fetch of booking commissions (`bookingCommissions`).
      - Added prominent `Cancel Booking & Settle` trigger button right in the top header action buttons (next to `Print Statement`) and right below the Settlement Parameters strip in an active commission summary banner.
      - Added interactive Commission Reversal control in the cancellation modal with toggle (`Reverse Distributed Commissions`), badge indicating total amount to debit (e.g. `₹21,215.66 to debit`), and collapsible breakdown of each beneficiary, receipt #, rate %, and amount (defaulted to expanded so users immediately see each beneficiary).
      - Updated financial valuation card to display live Commission distribution status.

- **Mandatory Project Assignment for Plot Products & Booking Filter [COMPLETED]**:
  - **Requirement**:
    - Make Project Name mandatory (not optional) when creating or updating Plot Products (`/dashboard/plots/products`).
    - When booking a plot product (`/dashboard/plots/products/book`), choosing the Project Name will show and filter the plot products that belong under that project.
  - **Implementation**:
    - **Frontend Modal ([ProductCatalogTab.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductCatalogTab.jsx))**:
      - Updated label to `Project Name *` with required asterisk.
      - Removed default option `-- All Projects / General Portfolio --` and replaced with required `-- Choose Project * --`.
      - Added frontend submit validation rejecting submission if `!form.projectId`.
    - **Backend Schema & Service ([PlotProduct.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProduct.js), [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js))**:
      - Made `projectId` required in the Mongoose schema.
      - Enforced mandatory `resolvedProjectId` validation on both `createProduct` and `updateProduct`.
    - **Product Booking Screen ([ProductBookingPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx))**:
      - Made `Project Name *` mandatory on booking creation.
      - Selecting a project actively filters the `Select Plot Product` dropdown to show only products registered under that project (with fallback auto-selection of the first product under that project).
      - Added submission check verifying `form.projectId`.
    - **Quick Sales Modal ([ProductSalesTab.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx))**:
      - Product option labels clearly display `[Project: {projectName}]`.

- **Button Icon Rendering Fix (React 19 Compatibility) [COMPLETED]**:
  - **Issue**:
    - Visiting pages using `<Button startIcon={<Plus size={16} />} />` (e.g. Developer Dashboard) threw `Uncaught Error: Element type is invalid: expected a string or a class/function but got: <Plus />. Check the render method of Button`.
  - **Root Cause**:
    - `Button.jsx` used `typeof StartIcon === 'function' || typeof StartIcon === 'object'` to render `<StartIcon />`. In React 19, an instantiated JSX element is an object, leading to `< <Plus /> />`.
  - **Fix**:
    - Updated [Button.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/ui/Button.jsx) to check `isValidElement(StartIcon)` / `isValidElement(EndIcon)` first. If already a JSX element, it renders directly; otherwise, it instantiates it as a component (`<StartIcon className={...} />`).

- **Plot Settlement & Cancellation Calculator Layout Realignment [COMPLETED]**:
  - **Enhancement**:
    - Replaced the cramped single-line 12-column grid with a structured **Two-Tier Step-by-Step Layout**:
      - **Tier 1 (Booking Selection)**: Full-width search bar with quick autocomplete suggestions and an active contract pill badge showing the loaded booking number and customer name.
      - **Tier 2 (Settlement Parameters)**: 4 equal, well-balanced columns with consistent label headers, heights, and button states:
        1. **Settlement Action**: `+ Interest Return` vs `- Penalty Deduct`.
        2. **Interest Formula / Basis**: `Simple Interest` vs `Compounding` (or `Percentage (%)` vs `Flat Amount (₹)` in deduction mode).
        3. **Annual Rate / Penalty Value**: Input with unit suffix and scheme slab info.
        4. **Settlement / Cancellation Date**: Date picker aligned to the same grid height.

- **Plot Product Booking Allotment Certificate Layout Redesign [COMPLETED]**:
  - **Requirement**:
    - For plot product booking certificates (`/dashboard/plots/certificates/:id`):
      - Remove internal hierarchy & inventory breakdown: Business Associate, Partner Supervisor, Product Item, Dimensions (N/S/E/W), raw Unit Area & Quantity, Land Stock Reference (agreement numbers, raw allocation strings), and Unit Price Rate.
      - Add / keep clean official allotment fields:
        - `Total Area / कुल रकबा`: formatted cleanly as `${totalArea} Sq.Ft` (e.g. `400 Sq.Ft` without multiplication breakdown or dismil).
        - Dedicated clean land identification fields: `Mauja / मौजा`, `Thana No. / थाना`, `Khata No. / खाता`, `Khesra No. / खेसरा`.
        - For one-time (full payment): Upfront Paid `₹5,000`, Total Valuation `₹5,000`, Payment Status `FULLY SETTLED (100% PAID)`, Amount in Words, and official allotment header.
  - **Implementation**:
    - Updated [BookingCertificateViewer.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/printViewers/BookingCertificateViewer.jsx) for `isProductBooking`:
      - Calculated `unitArea` dynamically from length × width (`dims.north * dims.east`) or `product.areaSqFt`, and computed `totalArea = unitArea * qty`.
      - Replaced internal associate, supervisor, and inventory rows with dedicated rows for Mauja, Thana, Khata, Khesra, and Total Allocated Area.
      - Streamlined financial rows for one-time settlement (100% upfront) vs monthly EMI without displaying internal unit price rates or raw agreement stock references.

- **Downpayment & EMI Receipt Number Display and Removal of "RO-" Prefix [COMPLETED]**:
  - **Requirement**:
    - Show `Receipt No.` column in Downpayment (`/dashboard/plots/collections/downpayment`) and EMI (`/dashboard/plots/collections/emi`) collection lists.
    - Remove `RO` / `RO-` from generated receipt numbers across all collections (Plot DP, Plot EMI, Product Collections).
  - **Root Cause of RO**:
    - In `server/services/plots/plotCollection.service.js` line 438, receipt generation prefix was hardcoded as `RO-REC-PLT-${fyStr}`, producing receipt numbers such as `RO-REC-PLT-2627-00034`.
  - **Resolution**:
    - **Backend**:
      - In [plotCollection.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotCollection.service.js):
        - Changed `receiptPrefix` to `REC-PLT-${fyStr}` (removed `RO-`).
        - Seamlessly inherited sequence from legacy `RO-REC-PLT-${fyStr}` counter so numbering continues without restarts or gaps.
        - Updated `getReceiptById` to support receipt lookups by string with or without `RO-`.
      - Migrated existing documents in MongoDB (`plotreceipts`, `plotinstallments`, `counters`) to remove `RO-` (`REC-PLT-2627-XXXXX`).
    - **Frontend**:
      - In [ReceiptColumns.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/components/ReceiptColumns.jsx):
        - Added dedicated `Receipt No.` column right after `Date`, displaying the formatted receipt number and linking directly to `/dashboard/plots/receipts/:id`.
      - In [InstallmentCollection.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/InstallmentCollection.jsx):
        - Included `r.receiptNumber` in search query filter and updated search input placeholder to `"Search Receipt #, Booking, Plot #, Customer..."`.
      - In [ReceiptViewer.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/printViewers/ReceiptViewer.jsx) & [CollectionModals.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/components/CollectionModals.jsx):
        - Ensured `(receiptNumber || '').replace(/^RO-/, '')` sanitizes any legacy `RO-` display in printable vouchers and action modals.

- **Product Collections Duplicate Entry Fix [COMPLETED]**:
  - **Issue**:
    - On `/dashboard/plots/collections/products` (Product Collections & Receipts), bookings with an initial downpayment showed **two duplicate entries**:
      1. `PRD-DP-PRD-BK-XXXX-XXX` (generated upon booking creation / update and stored in `b.collections`).
      2. `DP-PRD-BK-XXXX-XXX` (synthesized as a fallback downpayment collection).
    - This caused duplicate table rows and doubled KPI totals (e.g. `Total Collected: ₹10,000` instead of `₹5,000` and `Total Bills Issued: 2` instead of `1`).
  - **Root Cause**:
    - In `server/services/plots/plotProduct.service.js` under `getProductCollections(query = {})`:
      - Step 1 loops through `b.collections` and pushes the saved downpayment receipt (`receiptNumber: PRD-DP-${b.bookingNumber}`) and records it in `seenReceipts`.
      - Step 3 (legacy fallback for downpayments) checked `if (b.downPayment > 0 && !seenReceipts.has('DP-${b.bookingNumber}'))`.
      - Because the saved receipt was prefixed with `PRD-DP-` and not `DP-`, `seenReceipts.has('DP-...')` returned `false`, synthesizing a second collection row with `receiptNumber: DP-${b.bookingNumber}`.
      - A matching prefix omission existed in `server/services/plots/plotDeveloper.service.js` during associate commission generation.
  - **Resolution**:
    - In [plotProduct.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotProduct.service.js):
      - In Step 1, guarded against duplicate receipts in `b.collections`: `if (!col.receiptNumber || seenReceipts.has(col.receiptNumber)) continue;`.
      - In Step 3, verified `hasDpCaptured` across both `PRD-DP-` and `DP-` formats, checking `seenReceipts`, existing collections (`c.receiptNumber`, `c.installmentNumbers.includes(0)`, remarks, or full-payment collections). Only synthesizes a fallback downpayment collection if no downpayment receipt exists.
      - In `deleteProductCollection`, updated regex to `receiptNumber.replace(/^(PRD-)?DP-/, '')` so both prefixes locate the booking.
    - In [plotDeveloper.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotDeveloper.service.js):
      - Updated downpayment collection detection to check `hasDpInCollections` before synthesizing a fallback downpayment entry for sponsor commissions.

- **Plot Product View Action Modal Data Enrichment [COMPLETED]**:
  - **Requirement**:
    - In the "View Booking Details" action modal (`Eye` icon on `/dashboard/plots/products?tab=sales`), provide complete, comprehensive data:
      - Selected Scheme Plan name (e.g. `A-24`, `Gold Scheme`, etc.).
      - Contract Period / Tenure in Months and Years (e.g. `24 Months (2.0 Years)`).
      - Payment Scheme Type (`One-Time Full (100% Upfront / F.D.)` vs `Monthly EMI (Recurring / R.D.)`).
      - Return Rates & Maturity Matrix: Annual Return Rate % P.A. (`annualInterestRate`), RD Maturity Return % (`rdMaturityPercent`), FD Maturity Return % (`fdMaturityPercent`).
      - Associate Commission Policies: Business Associate %, Business Partner %, Branch Partner %.
      - Project Master Link: Project Name, code, and portfolio.
      - Land Acquisition Sourcing: All multi-agreement rows with Agreement Number, Mauja, Thana, Khata, Plot (Khesra), and allocated Sq.Ft / Dismil.
      - Financial Breakdown: Total Valuation, Paid Upfront / Monthly EMI, Total Amount Paid, Outstanding Due, Installment Counts, Payment Mode, and Txn/Cheque Ref.
      - Direct modal footer quick actions: Print Certificate, View Ledger, Edit Booking, and Close.
  - **Implementation**:
    - Updated [ProductSalesTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx) viewing modal with `size="4xl"` and dedicated `Scheme Plan, Period / Tenure & Policy Matrix` card, multi-parcel land allocation breakdown, payment details strip, and action footer.
    - Updated [plotProduct.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotProduct.service.js) to populate `projectId` (`name code location`) in both `getAllProductBookings` and `getProductBookingById`.

- **Plot Product Edit Page (Dedicated Full Screen Page instead of Modal) [COMPLETED]**:
  - **Requirement**:
    - When editing a Plot Product Booking from `/dashboard/plots/products?tab=sales`, instead of opening a limited modal box, it must navigate to a full dedicated page (the same form layout as "Sell Plot Product / New Booking").
    - The dedicated edit page must expose ALL options present at the time of a new sale: Customer selection & details, Business Associate auto-link, Project selection, Plot Product & Quantity piece stepper, Unit Price, Dimensions & Area Sq.Ft, Payment Plan (EMI vs One-Time Full), Tenure Months, Commission percentages (BA, BP, Branch), Maturity Returns (RD%, FD%), Annual Interest Rate %, Kisan Land multi-agreement stock allocations, Payment Mode, Transaction Ref, Booking Date, Booking Status, and Remarks.
  - **Implementation**:
    - **Frontend Routing**:
      - Added route `/dashboard/plots/products/edit/:id` in [App.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/App.jsx) protected with `RoutePermissionGuard` (`plot_booking`, action 3).
      - Updated Edit button in [ProductSalesTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx) to navigate to `/dashboard/plots/products/edit/${b._id}`.
      - Removed old `showEditModal` state, handlers, and the `<Modalbox open={showEditModal}>` markup from `ProductSalesTab.jsx`.
    - **Dedicated Page**:
      - Updated [ProductBookingPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx) to detect `useParams().id` (`isEditMode`).
      - In edit mode, fetches `GET /plots/product-bookings/:id`, pre-fills all form controls, customer, product, project, scheme returns, commissions, and multi-parcel Kisan Land sourcing rows.
      - Dynamic headers display `Edit Plot Product Booking — PRD-BK-XXXX-XXX` and banner with status and total amount paid.
      - Added Booking Status dropdown (`ACTIVE`, `COMPLETED`, `CANCELLED`) for edit mode in Card 3.
      - Form submission dynamically calls `PUT /plots/product-bookings/:id` in edit mode and redirects back to `/dashboard/plots/products?tab=sales`.
    - **Backend Support**:
      - Updated `updateProductBooking` in [plotProduct.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotProduct.service.js) to accept and save `projectId`, `projectName`, `planName`, `promoterCommissionPercent`, `developerCommissionPercent`, `bpCommissionPercent`, `branchCommissionPercent`, `rdMaturityPercent`, `fdMaturityPercent`, `annualInterestRate`, and re-allocate `landSourcing` (releasing previous Kisan agreement allocations and booking new parcel allocations).

- **Plot Product Cancellation & Settlement Engine with Scheme Matrix Rate Integration [COMPLETED]**:
  - **Requirement**:
    - Add a **Cancel** action button on `/dashboard/plots/products?tab=sales` in the table actions column for each product booking row.
    - Clicking Cancel opens the cancellation & settlement calculator (`/dashboard/plots/interest-calculator?productBookingId=...`).
    - **Scheme Matrix Rate Auto-Prefill (Image 2)**:
      - The return rate is strictly linked to the Scheme Rules & Returns Matrix (`InvestmentSchemeConfig.schemeSlabs`) configured under `tab=schemes`:
        - Matched by `tenureMonths` (12, 24, 36, 48, 60, 72 months) and payment plan type:
          - If `FULL_PAYMENT` (One-Time / F.D.): applies `fdAnnualInterestRate` (% P.A.) with Compound Annual calculation.
          - If `MONTHLY_INSTALLMENT` (EMI / R.D.): applies `rdAnnualInterestRate` (% P.A.) with Compound Annual calculation.
          - Fallback to `annualInterestRate` stored on the product booking record.
    - **Deduction Mode (- Deduct Penalty)**:
      - Admin can toggle from `+ Interest %` to `- Deduct` (Percentage `%` or Flat `₹`).
      - In deduction mode, interest % is 0, and the deduction penalty is subtracted from total customer deposits to establish the Net Refund Liability.
    - **Cancellation Execution & Audit Trail**:
      - `POST /plots/product-bookings/:id/refund` executes atomic cancellation:
        1. Restores product piece inventory (`PlotProduct.unitsSold -= booking.quantity`).
        2. Restores Kisan land agreement stock allocations in `KisanLandAgreement` and logs `LandStockLedger`.
        3. Reverses sponsor commissions in `PlotSponsorCommission` to `'reversed'`.
        4. Generates initial expense `Voucher` if paid at cancellation, logs `PlotAuditLog`, and sets `status = 'CANCELLED'`.
    - **Ledger Reconciliation & Part-Payments**:
      - `POST /plots/product-bookings/:id/refund-payments` records subsequent part-payment disbursements.
      - Each disbursement logs an expense voucher, debits the running customer ledger, and updates `pendingSettlementBalance`.
      - When all part-payments are complete, the customer ledger hits exactly **₹0.00 Settled**.
      - Updated `ProductCustomerLedgerModal.jsx` to render cancellation banners, breakdown cards, and a "+ Disburse Part Refund" modal.

- **Common Modalbox Component Header Standardization & Clipping Fix [FIXED]**:
  - **Issue**: In `/dashboard/plots/products`, opening the "Create New Plot Product" modal resulted in the title text being horizontally cut in half / clipped at the top of the modal card.
  - **Root Cause**: `Modalbox` (`Modal.jsx`) already rendered its own sticky header containing the close `X` button and `p-6` body padding. `ProductCatalogTab.jsx` did not pass `title`, `subtitle`, or `icon` to `<Modalbox>`, and instead rendered a duplicate nested header inside the scrollable body with an inner `<div className="p-5 md:p-6 bg-white space-y-4">`. This resulted in double padding and caused the inner title to collide with and be clipped under the top border.
  - **Fix**:
    - Enhanced [Modal.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/Modal.jsx) and [Modalbox.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/custommodal/Modalbox.jsx) to natively support the `icon` prop alongside `title` and `subtitle`.
    - Standardized [ProductCatalogTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductCatalogTab.jsx) and [ProductSalesTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx) to pass `title`, `subtitle`, and `icon` directly to `<Modalbox>`, removing the redundant nested header divs and duplicate padding.
    - Updated [ProductReceiptModal.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductReceiptModal.jsx) with `showClose={false}` and `bodyClassName="p-0"` for full-bleed printable receipt layout.

- **Plot Cancellation & Settlement Calculator with Deduction Penalty or Interest Return [COMPLETED]**:
  - **Feature & Requirements**:
    - URL: `/dashboard/plots/interest-calculator`
    - Top settlement mode switcher:
      - **+ Interest % (`INTEREST_RETURN`)**: Calculates accrued simple/compound interest or growth on each deposited payment based on the booking date/receipt date and annual return percentage.
      - **- Deduct (`DEDUCTION_PENALTY`)**: Allows selecting **Percentage (%)** or **Flat Amount (₹)**. When selected, no interest percentage is applied; instead, it deducts the penalty from the total customer deposit and displays the net refund amount.
    - Bottom Action:
      - **"Cancel & Settle Booking"** button opens a confirmation modal detailing total principal deposited, deduction/interest adjustment, and net refund liability payable.
      - On confirm, calls `POST /plots/bookings/:id/refund`, which cancels the booking, releases the plot back to `AVAILABLE` inventory, reverses sponsor commissions, reverses the plot contract consideration in the ledger, and records the initial liability.
  - **Accounting Reconciled in Ledger (`PlotBookingLedgerPage.jsx` & `plotBooking.service.js`)**:
    - **Reversal Entry**: Contract consideration (`Credit: netPlotValue`) cancels the original debit.
    - **Settlement Adjustment Entry**:
      - Deduction mode: `Debit: refundDeduction` (Administrative penalty).
      - Interest return mode: `Credit: refundInterestAmount` (Growth appreciation).
    - **Refund Part-Payments (`POST /plots/bookings/:id/refund-payments`)**:
      - Admin can disburse refund payments in multiple installments over time.
      - Each disbursement creates an expense `Voucher` and logs a `Debit: p.amount` entry in the running ledger.
      - As part-payments are recorded, the running balance decreases towards 0 and reaches exactly **₹0.00 Settled** on final payment.
    - **UI Enhancements in Ledger Page**:
      - Prominent cancellation status banner with a dynamic disbursement progress bar (`totalRefundPaid / netSettlementAmount * 100%`).
      - KPI cards adapt to show: Total Principal Deposited, Cancellation Penalty / Interest Adjustment, Net Refund Liability, Refund Disbursed, and Remaining Settlement Balance.
      - "+ Disburse Refund Payment" modal enables quick payouts with mode, date, and transaction reference.

- **Booking Table Action Buttons 2-Row Alignment [COMPLETED]**:
  - Arranged the 8 action buttons in [`BookingColumns.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/reports/components/BookingColumns.jsx) into 2 clean rows:
    - **Row 1 (4 buttons)**: View (`Eye`), Ledger (`BookOpen`), Settlement Calculator (`Calculator`), Certificate/Receipt (`Printer`/`Receipt`).
    - **Row 2 (4 buttons)**: Legal Agreement (`ScrollText`), Edit Contract (`Edit3`), Revision History (`History`), Delete Booking (`Trash2`).
  - Standardized button dimensions to `w-7 h-7` with compact column `minWidth: '150px'`.

- **Scheme Plan Dropdown Selection Display Sync [FIXED]**:
  - **Issue**: On `/dashboard/plots/addbooking` (Step 3) and `/dashboard/plots/booking/edit/:id`, the scheme details (Tenure, BA %, BP %, Branch Partner %) and Buyback badge showed below the dropdown, but the `<select>` dropdown itself showed `-- Choose Mandatory Scheme Plan --`.
  - **Cause**: Scheme slabs without a custom `planName` rendered `<option value="slab-${tenure}">`, but `handleSelectPlan` saved `planName: "A-${tenure}"`, causing a value mismatch in the HTML `<select>`. Additionally, when reaching Step 3 with pre-set `tenureMonths`, `form.planName` was unset, resulting in the select defaulting to the empty placeholder.
  - **Fix**:
    - Introduced canonical slab identifier `getSlabValue(s)` (`s.planName.trim() || 'slab-' + s.tenureMonths`) matching both `<option>` and `handleSelectPlan`.
    - Bound `<select value={currentSelectValue}>` which dynamically resolves the active scheme slab key.
    - Added auto-sync `useEffect` to ensure `form.planName` is populated as soon as `currentSchemeSlab` is active.



- **Branch Partner Incentive & Turnover Missing in Target Incentive Closing [FIXED]**:
  - **Issue**:
    - On `/dashboard/plots/incentives/new?type=TARGET_INCENTIVE`, Business Associates and Business Partners showed their business turnover and target incentives, but Branch Partners showed 0 collections/turnover and `No branch partner collections in this period.`
    - Local DB showed branch overrides because bookings had branch commissions configured, but on the online MongoDB database:
      1. In `server/services/plots/plotDeveloper.service.js` (`syncBookingSponsorCommissions`), `branchFixedPct` was resolved by looking at `matchedSlab.branchRdCommissionPercent ?? 0`. In the online DB, the scheme slabs had `0` configured for branch commission, causing `branchFixedPct` to evaluate to `0`. Consequently, `if ((targetBranchId || targetBranchPartnerId) && branchFixedPct > 0)` evaluated to `false`, and no `BRANCH_OVERRIDE` commission records were created at all when collections were recorded.
      2. In `server/services/plots/plotClosing.service.js`, `const isBranch = c.commissionRole === 'BRANCH_OVERRIDE' || Boolean(c.branchId);` incorrectly conflated regular commissions having a branch attached with branch overrides.
  - **Fix & Core Rules Implemented**:
    - **No Hardcoded 0.5% Fallback**: All hardcoded `0.5%` defaults were removed across `plotDeveloper.service.js`, `plotClosing.service.js`, `plotBooking.service.js`, `plotProduct.service.js`, `plotConfig.service.js`, `ProductBookingPage.jsx`, and `StepTermsAndPayment.jsx`.
    - **Direct Commission Percent**: Strictly comes from `https://demo.goodfeelsd.com/dashboard/plots/products?tab=schemes` (`branchRdCommissionPercent` / `branchFdCommissionPercent`). If 0% is configured, direct instant commission is 0.
    - **Target & Extra Incentive**: Strictly comes from `https://demo.goodfeelsd.com/dashboard/plots/products?tab=incentives` (`CommissionPolicyConfig.resolveSlab(..., 'BRANCH_PARTNER', sp.totalBusiness)`).
    - **Turnover Tracking**: Changed condition `if ((targetBranchId || targetBranchPartnerId) && branchFixedPct > 0)` to `if (targetBranchId || targetBranchPartnerId)`. Even when direct commission percentage is 0%, the `BRANCH_OVERRIDE` `PlotSponsorCommission` document is created with `amount: 0` and `collectionAmount: collectionPrincipal`, guaranteeing that the branch's total business turnover is preserved for target and extra incentive closings.
    - In `server/services/plots/plotClosing.service.js`:
      - Changed `isBranch` to strictly evaluate `c.commissionRole === 'BRANCH_OVERRIDE'`.
      - Populated `branchPartnerId` on `branchId` to display the actual Branch Partner user's name and sponsor code when assigned, falling back cleanly to Branch name and code.

- **Scheme Matrix Routing: Add Booking (Step 3) vs Plot Product Book/Sale Filter [COMPLETED]**:
  - **Requirement**:
    - Allow admin to mark/check a plan in the Scheme Matrix (`/dashboard/plots/products?tab=schemes`).
    - If checked, the plan appears only in **Add Booking (Step 3)** (`/dashboard/plots/addbooking`).
    - If unchecked, the plan appears in **Plot Product Book/Sale** (`/dashboard/plots/products/book`).
  - **Implementation**:
    - Added `showInAddBooking: { type: Boolean, default: false }` to `schemeSlabSchema` in `server/models/InvestmentSchemeConfig.js`.
    - Handled persistence of `showInAddBooking` in `server/services/investment.service.js` (`updateSchemeConfig`).
    - Included `showInAddBooking: Boolean(s.showInAddBooking)` in `plotConfig.service.js` (used by `/plots/rate-config` for regular plot booking) and `plotProduct.service.js` (`getAvailableTenures` for `/plots/products/tenures`).
    - In `ProductSchemeRulesTab.jsx`, added a dedicated "Add Booking (Step 3 Only)" column with checkbox controls next to each plan row and updated table headers and help banner.
    - In `client/src/pages/plots/booking/components/StepTermsAndPayment.jsx`, filtered `schemeSlabs` to show only plans where `Boolean(s.showInAddBooking) === true`, and removed redundant project select input (since project is already chosen on Step 2 with plot).
    - In `client/src/pages/plots/booking/components/BookingSummarySidebar.jsx`, added a dedicated **Project** info row in the right-hand financial summary card.
    - In `client/src/pages/plots/products/ProductBookingPage.jsx`, filtered `tenures` to show plans where `!t.showInAddBooking`.
    - **Mandatory Scheme Plan Validation**: Made `planName` strictly required before booking can proceed or be submitted. Disabled the "Confirm Book Plot" button if `planName` is unselected, displayed a warning banner under the dropdown, and enforced backend validation in `server/services/plots/plotBooking.service.js` to safeguard hierarchy commission calculations (BA, BP, and Branch Partner).

- **Fund Transfer Bank Permission Scoping & Live Role Enforcement [FIXED]**:
  - **Issue**:
    - When a user's role was changed from `admin` to `accountant` and their bank access was revoked (`bankPermissions.accessScope: 'none'`), the user could still see corporate bank transfers (`IDBI -> AXIS BANK` and `AXIS BANK -> Ghanshyam cash`) in `/dashboard/ledger/transfers` and KPI cards still showed bank pending amounts.
    - Cause 1: `server/controllers/fundTransfer.js` evaluated role scoping using `req.user.role` from the JWT token. Because JWT tokens in browser localStorage are stateless, the token maintained `role: 'admin'` until re-login, causing `['superadmin', 'admin', 'developer'].includes(req.user.role)` to evaluate `true` and skip scoping.
    - Cause 2: Unlike `ledger.js` and `voucher.js`, `fundTransfer.js` never checked `bankPermissions`. Even with `bankPermissions.accessScope: 'none'`, all bank transfers were returned.
    - Cause 3: In `FundTransfersPage.jsx`, the Approve/Reject buttons were displayed based on hardcoded `isSuperOrAdmin = ['superadmin', 'admin', 'developer', 'grant'].includes(currentUserRole)` rather than checking granular permissions (`hasPermission(currentUser, 'fund_transfer', 3)`).
  - **Fix**:
    - In `server/controllers/fundTransfer.js`:
      - Created `buildTransferScopeFilter` which queries the fresh user record from MongoDB (`User.findById(userId).select('role permissions bankPermissions')`), instantly enforcing any role or bank permission changes made in the admin panel regardless of stale JWT token contents.
      - Enforced `bankPermissions.accessScope`: if `'none'`, strictly excludes third-party transfers involving corporate banks, while allowing direct participants (where `fromUserId/toUserId` or `fromLedgerId/toLedgerId` is the user's cash ledger) to see and sign off on transfers incoming to or originating from their personal cash drawer.
      - Updated `approveTransfer` to ensure recipient cashiers (`isRecipientUser`) can acknowledge receipt of cash into their drawer without being blocked by source bank payment checks (as the source bank disbursement was already authorized by the initiating administrator).
      - Combined query filters cleanly using `$and` arrays so `search`, `status`, and `ledgerId` do not overwrite role/bank scoping `$or` conditions.
      - Updated `getTransferStats`, `requestTransfer`, `approveTransfer`, `rejectTransfer`, and `cancelTransfer` to check live DB permissions, standard CRUD action numbers (3 for approve, 4 for cancel), and verify bank disbursement/receipt permissions when bank accounts are involved.
    - In `client/src/pages/admin/ledger/FundTransfersPage.jsx`:
      - Replaced `isSuperOrAdmin` with `hasPermission(currentUser, 'fund_transfer', 3)` and `isRecipient` for `canApprove`, `hasPermission(currentUser, 'fund_transfer', 4)` for `canCancel`, and `hasPermission(currentUser, 'fund_transfer', 2)` for initiating transfer requests.
      - Added `'BANK_WITHDRAWAL'` ("Bank Withdrawal to Cash") to `server/models/FundTransfer.js` enum and modal dropdown, renamed `'Cash Handover to Staff'` to `'Cash Transfer'`, and introduced smart auto-detection of transfer mode based on selected source/destination account types.

- **Sponsor Commission Realization for Approved Bank/Online Receipts [FIXED]**:
  - **Issue**:
    - When taking installment, downpayment, or product collections via cash, receipts are immediately `APPROVED` and commissions are credited directly to the sponsor's ledger (Business Associate, Parent Partner, Branch).
    - However, when collections were taken via online/bank (`paymentMode: 'bank_transfer' | 'neft_rtgs' | 'cheque' | 'upi'`), the receipt was initially saved with `status: 'PENDING'`.
    - When `syncBookingSponsorCommissions` ran on the pending receipt, it checked `if (fixedAmt > 0 && receipt.status !== 'PENDING')` before creating the ledger entry, causing `PlotSponsorCommission` documents to be created with `ledgerEntryId: null`.
    - Later, when the admin approved the receipt via `/plots/receipts/:id/approve` (`approveReceipt`), `receipt.status` became `'APPROVED'` and `syncBookingSponsorCommissions` ran again. Because `existingReceiptComms.length > 0` was true, the loop executed `continue;` and skipped creating the ledger entries, leaving `ledgerEntryId: null` forever and never crediting the sponsor's ledger.
  - **Fix**:
    - In `server/services/plots/plotDeveloper.service.js` (`syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`):
      - Added realization handling inside `if (existingReceiptComms.length > 0)`: whenever `!c.ledgerEntryId && receipt.status === 'APPROVED' && Number(c.fixedAmount || c.amount || 0) > 0`, it records the missing ledger entry in the sponsor's ledger (`accountingService.recordLedgerEntry`), assigns `c.ledgerEntryId = entry._id`, adds it to `validEntryIds`, and saves `c`.
    - In `server/services/plots/plotCollection.service.js`:
      - Made bank receipt ledger recording idempotent in `approveReceipt` by verifying `existingBankEntry`.
      - Added cleanup of bank receipt entries in `rejectReceipt` if an approved receipt is later rejected.
    - In `server/services/investment.service.js`:
      - Added `Ledger` import, resolved `ledgerId` for investment collections, and ensured bank/cash ledger entries are recorded idempotently upon collection/approval.

- **HTML Pattern Validation with Indian Comma Separator (`NumberInput`) [FIXED]**:
  - **Issue**:
    - When users filled in forms containing formatted numbers with commas (e.g., `₹ 78,458` in `NumberInput` or `CommissionPolicyMatrix`), submitting the form triggered HTML5 constraint validation: `"Please match the requested format."`.
    - Cause: The inputs were rendered with `pattern="[0-9]*"`, but the formatted display value contains commas (and optional decimal dots).
  - **Fix**:
    - In [NumberInput.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/NumberInput.jsx), made `pattern` support commas and decimals (`^[0-9,]*$` or `^[0-9,]*(\.[0-9]*)?$`), and auto-detected decimal allowances when `allowDecimal` or `step="any"` is specified.
    - In [CommissionPolicyMatrix.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/seriesMaster/components/CommissionPolicyMatrix.jsx), updated manual table input patterns to `^[0-9,]*$`.

- **Commission Immutability & Historical Ledger Preservation [COMPLETED]**:
  - **Critical Accounting Flaw Discovered**:
    - Previously, in `server/services/plots/plotDeveloper.service.js` (`syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`), every synchronization run executed `PlotSponsorCommission.deleteMany({ bookingId })` and looped over all historical receipts/collections, recalculating commissions for all past transactions using the *current* `InvestmentSchemeConfig` slab percentages.
    - Whenever commission percentages (e.g. Branch Partner, Business Associate, or Business Partner) were modified in `/dashboard/plots/products?tab=schemes` (e.g. from 1.2% to 2.1%), creating any new bill or viewing installments caused all past historical transactions in the ledger to be retroactively recalculated and overwritten with the new rate and amount.
  - **Resolution & Architecture**:
    - Removed destructive `deleteMany` calls from both `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`.
    - Implemented a **non-destructive historical preservation pattern**:
      1. Group existing active commissions by `receiptId` (or `receiptNumber` for products).
      2. If commissions already exist for a receipt (`existingReceiptComms.length > 0`), that receipt has already been billed: its commission percentage (`fixedPercent`), amount, and ledger entry are **permanently locked and immutable**. Past receipts are preserved intact and skipped from new slab rate recalculation.
      3. Only if a receipt's principal collection amount was modified in the UI is the commission amount adjusted proportionally using the *locked* `fixedPercent` stored on that commission record (never new slab rates).
      4. Only **new receipts** lacking commission records enter the dynamic slab resolution logic to calculate rates and amounts from the active `InvestmentSchemeConfig`.
      5. Only orphaned commissions and ledger entries for deleted/rejected receipts are purged.
    - Fixed `deleteProductBooking` in `server/services/plots/plotProduct.service.js` to delete by `productBookingId` instead of `bookingId`.

- **First-Class Branch Entity Commission Ledger & Section 3 Target Slabs [COMPLETED]**:
  - **Problem & Architectural Realignment**:
    - Previously, `addbranch.jsx` offered a dropdown of Business Associates (lowest tier) to assign as "Branch Partner", violating the sales hierarchy (`Branch -> Business Partner -> Business Associate`).
    - Furthermore, branches already have assigned Branch Managers (`Branch.managerIds`). However, assigning personal managers as commission recipients conflates salaried employee payroll (TDS Section 192) with corporate franchise commission overrides (TDS Section 194H), corrupting personal payroll ledgers when multiple managers run a branch.
    - **Solution**: The physical `Branch` itself (`BIHAR SHARIF BRANCH`, `RAJGIR BRANCH`) was promoted to a **first-class ledger account** (`ledgerType: 'branch'`, `branchId`).
  - **Key Implementations**:
    1. **Schema & Models**:
       - `server/models/ledger.js`: Added `branchId: { type: ObjectId, ref: 'Branch' }` and added `'branch'` to `ledgerType` enum.
       - `server/models/PlotSponsorCommission.js`: Added `branchId: { type: ObjectId, ref: 'Branch', default: null }`, made `sponsorId` optional (`required: false`), and registered `'BRANCH_OVERRIDE'` role.
       - `server/models/PlotClosing.js`: Added `branchId` to `sponsorSummarySchema`, made `sponsorId` optional (`required: false`).
       - `server/models/entry.js`: Added `'commission_branch'` to `source` enum.
    2. **Accounting Service (`server/services/accountingService.js`)**:
       - Updated `recordLedgerEntry` to accept `branchId`, find/upsert `Ledger.findOne({ branchId })`, and auto-create the Branch Ledger account with `ledgerType: 'branch'` and `name: '${branch.name} BRANCH'`.
    3. **Plot Sourcing & Automatic Override (`server/services/plots/plotDeveloper.service.js`)**:
       - Updated `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions` to compute 0.5% override directly on collection receipts and credit the `branchId` ledger account.
       - *Caveat & Bugfix*: In `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`, when building `closingTagMap` from `existingComms`, `c.sponsorId` is `null` for pure branch override commission documents (`commissionRole: 'BRANCH_OVERRIDE'`). Added safe entity fallback `(c.sponsorId || c.branchId || '').toString()` to prevent `TypeError: Cannot read properties of null (reading 'toString')` when regenerating installments.
       - Fixed booking resolution so that bookings always record `branchId` and default `branchCommissionPercent: 0.5`.
    4. **Quarterly Incentive Closing (`server/services/plots/plotClosing.service.js`)**:
       - Imported `models/branch` to ensure Mongoose schema registration for `.populate('branchId')`.
       - In `previewPlotClosing`, aggregated `commissionRole === 'BRANCH_OVERRIDE'` by `branchId`, resolved Section 3 slabs (`BRANCH_PARTNER`) for the Branch Entity, and computed Target & Extra slab incentives using the branch's total period collection turnover.
       - In `executePlotClosing` and `editPlotClosing`, recorded incentives directly to the Branch's ledger account.
    5. **Ledger Controller & RBAC Permissions**:
       - `server/controllers/ledger.js`: Auto-creates and populates `branchId` ledgers in `ledger()` list, `visibleLedgers`, and `Entries` (/entries/:id).
       - Added `branch_ledger: "Branch Partner Ledgers"` to `userPermissionsConfig.js` (`AllPermissionNames`, `MODULE_CATEGORIES.finance`, and default role presets).
       - Updated `RoutePermissionGuard.jsx`, `App.jsx`, and `sidebar.jsx` to support multi-permission checks (`resource={["branch_ledger", "sponsor_ledger"]}`).
       - Updated `ledgerpagelist.jsx` to render physical branches with the 🏢 `Building2` icon, `Branch Partner` tag, and direct access to statements and payout vouchers.
       - Replaced the misleading BA dropdown in `addbranch.jsx` with an informative 0.5% Branch Commission notice card and updated `BranchManager.jsx` table & card views.

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
    - Updated `ProductBookingPage.jsx` to dynamically assign `annualInterestRate` based on whether the booking is `MONTHLY_INSTALLMENT` (RD rate) or `FULL_PAYMENT` (FD rate).- **Real-Time Indian Numbering Format (INR Comma Notation, e.g. 1,12,529) [COMPLETED]**:
  - **Requirement**: Allow numeric inputs (especially collection slabs in `/dashboard/plots/products?tab=incentives` and shared `NumberInput`) to automatically format numbers in real-time according to the Indian Rupee system (`1,12,529`, `10,00,000`, `19,99,999`) without cursor jumping.
  - **Implementation**:
    - `client/src/utils/numToWord.jsx`:
      - Added `formatIndianNumber(val)`: Formats integers and decimal values using the Indian lakh/crore regex (`\B(?=(\d{2})+(?!\d))`).
      - Added `parseIndianNumber(val)`: Strips commas to return raw numeric strings.
      - Added `handleFormattedNumberInput(e, onChange)`: Cursor-stable input handler that calculates non-comma cursor offset, triggers the state callback with raw value, and restores the cursor using `requestAnimationFrame` and `input.setSelectionRange`.
    - `client/src/components/ui/NumberInput.jsx`:
      - Upgraded with `formatIndian = true` (default) to format values with Indian currency commas in real-time while preserving clean numeric types in callbacks and retaining cursor stability.
    - `client/src/pages/plots/seriesMaster/components/CommissionPolicyMatrix.jsx`:
      - Integrated `formatIndianNumber` and `handleFormattedNumberInput` on Target Slabs (`minAmount`, `maxAmount`) and Extra Campaign Slabs (`minAmount`, `maxAmount`).
- **Branch Partner Incentive Closing & 3-Tier Tables Isolation [COMPLETED]**:
  - **Context**: In `/dashboard/plots/incentives/new` (`PlotIncentiveProcessPage.jsx`), only Business Associates and Business Partners had display tables, omitting Branch Partners.
  - **Resolution**:
    - `client/src/pages/plots/incentives/PlotIncentiveProcessPage.jsx`:
      - Disentangled sponsor categorization into three mutually exclusive tiers:
        - `associateSponsors = previewData.sponsors.filter((s) => !s.isDeveloper && !s.isBranchPartner)`
        - `partnerSponsors = previewData.sponsors.filter((s) => s.isDeveloper && !s.isBranchPartner)`
        - `branchSponsors = previewData.sponsors.filter((s) => s.isBranchPartner)`
      - Added dedicated Section 3 table for **Branch Partners (Branch Franchise & Regional Sales Turnover)** with full expandable collection receipts, slab evaluation, and credit calculations.
    - `server/models/PlotClosing.js`:
      - Added `isBranchPartner: { type: Boolean, default: false }` and `branchBusiness: { type: Number, default: 0 }` to `sponsorSummarySchema`.
    - `server/services/plots/plotClosing.service.js`:
      - Set `entryFixedPct = 0.50` when `sp.isBranchPartner`.
      - Persisted `isBranchPartner` and `branchBusiness` in `createPlotClosing` and `updatePlotClosing`.

- **Fund Transfer Custody Authority & Maker-Checker Separation [COMPLETED]**:
  - **Requirement**:
    - If funds are transferred to a Cashier / User Cash Ledger (e.g. Account A to Cashier B): **ONLY Cashier B** (the receiving drawer holder) is authorized to approve/accept or reject the transfer. Admin or SuperAdmin CANNOT approve cash transfers destined for someone else's drawer.
    - If funds are transferred to a Corporate Bank Account: Only an Admin or SuperAdmin with receipt permissions for that specific bank can approve/accept the deposit.
    - If funds are transferred to an Admin/SuperAdmin's own cash ledger: They can approve because they are the receiving cashier.
    - Upon approval: Full double-entry transaction completes immediately via `accountingService.recordLedgerEntry` (debit on source, credit on destination) and updates running balances on both ledgers.
    - Added `BANK_WITHDRAWAL` ("Bank Withdrawal to Cash") mode and renamed "Cash Handover to Staff" to "Cash Transfer".
  - **Backend**:
    - `server/controllers/fundTransfer.js`:
      - Updated `approveTransfer` and `rejectTransfer` with custody validation:
        - If `isDestCash`: Throws error `Unauthorized. Only the receiving cashier / destination account holder can approve this cash transfer.` if caller is not the recipient cashier.
        - If `isDestBank`: Validates that caller is Superadmin/Dev or an Admin with receipt permission for that bank ledger (`bPerm.allowReceipts !== false`, allowed bank IDs).
    - `server/controllers/approvalController.js`:
      - Updated `getPendingApprovalStats` so `/approvals/pending-stats` only returns pending fund transfers that the logged-in user is actionable to approve (transfers to their own cash drawer, plus corporate bank deposits if they possess bank receipt authority). Prevents Admins from seeing pending badges for transfers destined for other cash drawers.
  - **Frontend**:
    - `client/src/pages/admin/ledger/FundTransfersPage.jsx`:
      - Computed `canApprove`: Strictly requires `isRecipient` for cash drawer destinations, and bank permission for bank destinations.
      - Replaced generic action state with contextual indicator badge (`Awaiting Recipient` or `Awaiting Bank Checker`) for pending non-actionable transfers.

- **Complete Removal of Weekly Return / Money-Back Payout System [COMPLETED]**:
  - **User Clarification**: The project does not use or need weekly return / money-back payouts for plot bookings.
  - **Frontend**:
    - `client/src/pages/plots/reports/components/BookingColumns.jsx`: Removed weekly payout setup button (`CalendarPlus`) and payout ledger button (`Coins`).
    - `client/src/pages/plots/reports/PlotReports.jsx`: Removed `SetupPayoutModal` import, state hooks, and modal rendering.
    - `client/src/pages/plots/reports/components/SetupPayoutModal.jsx`: Replaced with clean no-op component.
    - `client/src/pages/plots/booking/PlotBookingDetails.jsx`: Removed "Payout Ledger" button and unused `Banknote` icon import.
    - `client/src/App.jsx`: Removed `plots/payout-ledger` and `plots/vouchers/:id` (payout voucher print) routes and imports.
    - `client/src/components/Navbar.jsx`: Removed `payout-ledger` breadcrumb title mapping.
  - **Backend**:
    - `server/index.js`: Removed `initPlotPayoutScheduler` import and initialization.
    - `server/cron/plotPayoutScheduler.js`: Converted into a safe no-op.
    - `server/router/plots.routes.js`: Removed `/bookings/:id/payout/initialize`, `/bookings/:id/payout/pay`, `/bookings/:id/payout/ledger`, and `/payout-vouchers/:id` routes.

