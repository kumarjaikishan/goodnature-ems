# SESSION_MEMORY.md — Session Memory & Discoveries

This file records session notes, caveats, and discoveries across active sessions.

---

## Active Session Notes

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
    - Added client-side validation guards inside `handleOpen`, `handleSubmit`, and `handleDelete` preventing unauthorized operations before any API request is dispatched.

