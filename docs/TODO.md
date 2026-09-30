# TODO.md — Current Work, Backlog, & Known Enhancements

This document tracks known tasks, technical debt, and pending improvements identified across the codebase.

---

## 1. Pending Tasks & Backlog

- [x] **Plot Schedulers Integration**:
  - `server/cron/plotHoldScheduler.js` (`initPlotHoldScheduler`) and `server/cron/plotPayoutScheduler.js` (`initPlotPayoutScheduler`) are explicitly invoked on server startup in `server/index.js` with fail-safe error boundaries.
- [ ] **Redis Connection Reliability**:
  - Ensure graceful handling and reconnection strategies if Redis becomes unavailable during peak load without blocking permission checks.
- [ ] **Controller Refactoring**:
  - `server/controllers/attandence.js` (~1778 lines) and `server/controllers/admin.js` (~1500+ lines) contain significant business logic that can gradually be delegated into services (`services/attendanceService.js`, `services/employeeService.js`).
- [ ] **Attendance Excel Import**:
  - Verify edge cases for bulk import date formatting when users upload CSV/Excel files with non-standard local date strings.
- [ ] **Client Bundle Optimization & Migration Plan**:
  - Phase 1: Removed unused `date-fns` & `pagedjs` (Saved ~300KB+ bundle weight) [COMPLETED].
  - Phase 2: Standardized icon usage 100% onto `lucide-react`, fully uninstalled `react-icons` [COMPLETED].
  - Phase 3: Setup `sonner` universal toast adapter (`@/utils/toast`) and uninstalled `react-toastify` [COMPLETED].
  - Phase 4: Drop-in CJS ESM Interop verified and centralized via `DataTable.jsx` [COMPLETED].
  - Phase 5: Dynamic lazy-loading Excel parser & exporter (`excelHelper.js`) reducing initial bundle weight by over ~400KB on `AttendanceExcelImport.jsx` and `Holiday.jsx` [COMPLETED].
  - Phase 6: Completely purged deprecated membership module from frontend [COMPLETED].
- [ ] **Automated Test Coverage**:
  - Backend currently contains skeleton test directories (`server/test/`, `server/tests/`) with no active automated test suites. Set up unit/integration tests for payroll calculation and plot installment ledgers.

---

## 2. Completed / Stabilized Features
- [x] Plot inventory generation and series master management with dimensional config.
- [x] Plot booking, hold expiry logic, and installment collection with receipt printing.
- [x] Standardized 40% plot downpayment calculation always on Gross Plot Value (before discount).
- [x] Recurring Deposit (R.D.) and Fixed Deposit (F.D.) Investment Management module (Maturity matrix from 24M to 120M, Certificate generator, Passbook, Dues scanner, and Premature settlement).
- [x] Tiered sponsor commission matrix (0, 3, 6, 9, 12, 15, 18, 21 months) locked at booking time.
- [x] Collection-based sponsor commission calculation engine (crediting commissions per payment receipt).
- [x] Unified Good Nature design system and symmetric page loading animation `<PageLoader />`.
- [x] Complete brand replacement to Good Nature Projects across printouts, vouchers, receipts, and watermarks.
- [x] eSSL biometric raw body parsing and heartbeat ping tracking.
- [x] Real-time Server-Sent Events (SSE) for attendance punch broadcasts.
- [x] Plot booking deletion child cascade cleanup and auto-healing plot availability sync.
- [x] Enhanced numeric input UX with mobile numeric keypad support and dynamic 1st EMI helper text.
- [x] Commission closing submission race condition resolution and transaction session pass-through.
- [x] Dynamic multi-head Plot Premium & PLC (Preferential Location Charges) system on Series Master and plot configuration.
- [x] Deferred EMI schedule calculation dynamically activated from 100% Downpayment completion date.
- [x] Dedicated Downpayment Collections and EMI Collections pages in Sidebar and Router.
- [x] Plot Products micro-plot fractional units module with full-page booking workflow (`/dashboard/plots/products/book`), verified customer search, BA auto-detection, and Allotment Certificate.
- [x] Plot Products Kisan Land Agreement sourcing & parcel area deduction/restoration synchronization.
- [x] Project Management System: Dedicated Project Master tab in Land Purchase, project tagging across Kisan Land Purchase agreements, Series Master creation, Plot bookings (Step 2 selection filter), and Plot Product sales & catalog.
- [x] Multi-Ledger Treasury & Cash Management System: Configurable Corporate Bank Accounts (Axis, IDBI, HDFC, etc.) with opening balances & statement views, Auto-provisioned Cashier Personal Cash Ledgers (`user_cash`), Account-linked Receipt & Voucher collections with instant double-entry credits/debits, and Maker-Checker 2-Step Inter-Ledger Fund Transfers with deposit slip uploads and in-transit held balance safeguards.
- [x] Full System Technical Audit & Hardening (Sept 2026): Dynamic permission fallback & live cache invalidation in `checkpermission.js` and `admin.js`, Rate-Config billing whitelist for cashiers/accountants, deploy route hardening, compound database indexing on `attandences`, `entries`, `vouchers`, and `users`, and legacy attendance company scope matching.
- [x] **PROJECT_IMPROVEMENT_PLAN — All 21 Fixes Executed (2026-09-30)**:
  - CRITICAL: JWT rotated to 64-char hex (PLAN-01). `updatepassword` crash fixed (PLAN-02).
  - HIGH: `toast` import fixed in App.jsx SSE (PLAN-03). IDOR-001 on bookings — confirmed controller already had ownership check, no change needed (PLAN-04). Insecure `Math.random()` token → `crypto.randomBytes(32)` (PLAN-05). `/recordAttendanceFromLogs` secured with role+permission guard (PLAN-06). Dead `/superfirstfetch` route removed (PLAN-07). `apiClient.js` broken /refresh → redirect-to-login on 401 (PLAN-08).
  - MEDIUM: `admin` removed from frontend `hasPermission()` bypass (PLAN-09). `checkpermissionchange.js` deleted (PLAN-10). Duplicate DELETE route removed (PLAN-11). CORS localhost wrapped in NODE_ENV check (PLAN-12). N+1 leave approval loop → `updateMany + insertMany` (PLAN-13). N+1 deleteAdmin branch loop → `updateMany $pull` (PLAN-14). User model dual registration fixed, startup `dropIndex` removed (PLAN-15). SSE `dispatch(FirstFetch())` removed (PLAN-16).
  - LOW: Auth console.logs removed from App.jsx (PLAN-17). Dead `generateNextEmpId` removed from admin.js (PLAN-18). Cloudinary centralized to `server/utils/cloudinary.js` (PLAN-19). `.lean()` added to read-only queries in admin/ledger/voucher (PLAN-20). `console.log` → `console.error` in admin.js catch blocks (PLAN-21).
