# TODO.md — Current Work, Backlog, & Known Enhancements

This document tracks known tasks, technical debt, and pending improvements identified across the codebase.

---

## 1. Pending Tasks & Backlog

- [ ] **Plot Schedulers Integration**:
  - `server/cron/plotHoldScheduler.js` (`initPlotHoldScheduler`) and `server/cron/plotPayoutScheduler.js` (`initPlotPayoutScheduler`) are defined, but verify if they are explicitly invoked in `server/index.js` during server startup.
- [ ] **Redis Connection Reliability**:
  - Ensure graceful handling and reconnection strategies if Redis becomes unavailable during peak load without blocking permission checks.
- [ ] **Controller Refactoring**:
  - `server/controllers/attandence.js` (~1778 lines) and `server/controllers/admin.js` (~1500+ lines) contain significant business logic that can gradually be delegated into services (`services/attendanceService.js`, `services/employeeService.js`).
- [ ] **Attendance Excel Import**:
  - Verify edge cases for bulk import date formatting when users upload CSV/Excel files with non-standard local date strings.
- [ ] **Automated Test Coverage**:
  - Backend currently contains skeleton test directories (`server/test/`, `server/tests/`) with no active automated test suites. Set up unit/integration tests for payroll calculation and plot installment ledgers.

---

## 2. Completed / Stabilized Features
- [x] Plot inventory generation and series master management with dimensional config.
- [x] Plot booking, hold expiry logic, and installment collection with receipt printing.
- [x] Tiered sponsor commission matrix (0, 3, 6, 9, 12, 15, 18, 21 months) locked at booking time.
- [x] Collection-based sponsor commission calculation engine (crediting commissions per payment receipt).
- [x] Unified Good Nature design system and symmetric page loading animation `<PageLoader />`.
- [x] Complete brand replacement to Good Nature Projects across printouts, vouchers, receipts, and watermarks.
- [x] eSSL biometric raw body parsing and heartbeat ping tracking.
- [x] Real-time Server-Sent Events (SSE) for attendance punch broadcasts.
- [x] In-memory developer API performance monitor (`/api/api-monitor/stats`).

