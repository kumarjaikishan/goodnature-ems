# STRUCTURE.md — Codebase Directory & File Structure

This document provides a clean map of the codebase organization for both the backend and frontend.

```
Ems-goodnature/
│
├── AGENTS.md                   # Main instructions for AI sessions working on this repo
├── README.md                   # System overview & live deployment notes
├── fix_ledgers.js              # Operational maintenance script to merge duplicate employee ledgers
│
├── docs/                       # Project knowledge base
│   ├── PROJECT_CONTEXT.md      # Purpose, modules, and full tech stack details
│   ├── COMPONENT_CATALOG.md    # Catalog of centralized UI components, modals, loaders, and API clients
│   ├── FRONTEND_THEME_SYSTEM.md# Design tokens, color palette, and UI theme rules
│   ├── ARCHITECTURE.md         # Component diagrams, request pipelines, and data flows
│   ├── STRUCTURE.md            # File tree and directory breakdown (this file)
│   ├── RULES.md                # Coding conventions, security guidelines, and business constraints
│   ├── DECISIONS.md            # Architectural decisions and immutable patterns
│   └── TODO.md                 # Current backlog, technical debt, and pending tasks
│
├── memory/
│   └── SESSION_MEMORY.md       # Knowledge gained from past sessions (eSSL quirks, timezone handling, etc.)
│
├── server/                     # Backend Node.js / Express Application
│   ├── index.js                # Server entrypoint, middleware configuration, and router mounting
│   ├── package.json            # Backend dependencies and scripts (runs cross-env TZ=UTC)
│   ├── conn/
│   │   └── conn.js             # Mongoose database connection setup
│   ├── controllers/            # Route controllers
│   │   ├── admin.js            # Employee, department, branch, company, and role administration
│   │   ├── advance.js          # Employee salary advances
│   │   ├── apiMonitorController.js # In-memory API monitoring statistics
│   │   ├── attandence.js       # Punch-in/out, biometric processing, and attendance analytics
│   │   ├── developer.js        # Developer utilities and permission matrix management
│   │   ├── holiday.js          # Company holiday master
│   │   ├── leave.js            # Leave applications and approvals
│   │   ├── leaveBalance.js     # Monthly leave balance accrual
│   │   ├── ledger.js           # Financial transaction ledger
│   │   ├── notice.js           # Company noticeboard announcements
│   │   ├── payroll.js          # Monthly salary computation and payslip generation
│   │   ├── plots.controller.js # Plot series, inventory, bookings, installments, and payouts
│   │   ├── user.js             # Authentication, login, and password resets
│   │   ├── voucher.js          # Expense vouchers
│   │   └── weeklyOffLedger.js  # Weekly off tracking
│   ├── cron/                   # Scheduled tasks
│   │   ├── plotHoldScheduler.js    # Hourly auto-expiry of plot hold bookings
│   │   └── plotPayoutScheduler.js  # Automated weekly payout accruals
│   ├── essl.js                 # eSSL biometric device communication endpoints & heartbeat
│   ├── middleware/             # Express middlewares
│   │   ├── Role_middleware.js      # Role-based route guard
│   │   ├── auth_middleware.js      # JWT authentication and user payload attachment
│   │   ├── checkpermission.js      # Redis/Mongo permission matrix checker (Read/Create/Update/Delete)
│   │   ├── checkpermissionchange.js# Permission update guard
│   │   ├── employee_middleware.js  # Employee specific middleware
│   │   └── multer_middleware.js    # File upload handling
│   ├── models/                 # Mongoose schemas (37 models)
│   │   ├── user.js                 # User accounts, roles, sponsor codes, KYC, bank & ledgerId links
│   │   ├── branch.js               # Physical branches, managerIds, and branchPartnerId (Franchise Head)
│   │   ├── employee.js             # Employee profiles, branch/department links
│   │   ├── attandence.js           # Daily attendance records, punches, duration
│   │   ├── Plot.js                 # Individual plot inventory item
│   │   ├── PlotBooking.js          # Plot bookings, holds, branchId, branchPartnerId, scheme types, status
│   │   ├── PlotProductBooking.js   # Plot product bookings, tenure, branchId, branchPartnerId
│   │   ├── PlotCustomer.js         # Real estate customers
│   │   ├── PlotPayment.js          # Payment transaction entries
│   │   ├── PlotReceipt.js          # Official receipt numbers and payment records
│   │   ├── PlotSponsorCommission.js# Audit commissions (DIRECT, TEAM, SELF, BRANCH_OVERRIDE)
│   │   ├── PlotSeriesMaster.js     # Master plot series with dimensional config
│   │   ├── PlotPayoutSchedule.js   # Customer weekly return schedule
│   │   ├── PlotPayoutVoucher.js    # Customer payout payment vouchers
│   │   ├── payroll.js              # Monthly payroll records
│   │   └── ...                     # Additional schemas (leaves, vouchers, notices, etc.)
│   ├── router/
│   │   ├── route.js            # Main API routing table
│   │   └── plots.routes.js     # Plot module routing table
│   ├── services/               # Business logic layer
│   │   ├── accountingService.js    # Financial ledgers and balances
│   │   ├── attendanceService.js    # Attendance calculations, shifts, and rule evaluation
│   │   ├── employeeService.js      # Employee management helpers
│   │   ├── leaveService.js         # Leave requests & quota logic
│   │   ├── payment.js              # Payment gateway & webhook verification
│   │   ├── plots.service.js        # Core plot engine (booking, series, payout calculations)
│   │   ├── plots/                  # Modular Plot Engine Sub-Services
│   │   │   ├── plotBooking.service.js   # Booking lifecycle, branch & partner sourcing resolution
│   │   │   ├── plotCollection.service.js# Payment receipts & installment processing
│   │   │   ├── plotDeveloper.service.js # 3-tier commissions, branch override (0.5%), sponsor network & stats
│   │   │   ├── plotClosing.service.js   # Monthly incentive closings & Section 3 branch partner slabs
│   │   │   └── plotProduct.service.js   # Plot products, maturity calculations & branch partner resolution
│   │   └── weeklyOffService.js     # Weekly off accrual and sync logic
│   ├── telegramHook.js         # Telegram webhook handler
│   └── utils/                  # Helper utilities
│       ├── apiMonitor.js       # In-memory latency & error rate tracker
│       ├── apiResponse.js      # Standard JSON response formatter
│       ├── attendanceTime.js   # Timezone normalization (UTC midnight & Asia/Kolkata)
│       ├── esslLogger.js       # Biometric event logger
│       ├── redis.js            # Redis client connection
│       ├── sse.js              # Server-Sent Events real-time broadcast engine
│       └── telegram.js         # Telegram notification sender
│
└── client/                     # Frontend React 19 Application (Vite SPA)
    ├── package.json            # React, Redux Toolkit, MUI, Tailwind dependencies
    ├── vite.config.js          # Vite build configuration
    └── src/
        ├── App.jsx             # Top-level router with role-based protected routes
        ├── main.jsx            # React root mount and Redux Provider setup
        ├── api/                # Axios instance and API call wrappers
        ├── components/         # Reusable UI components and modal dialogs
        ├── pages/              # View pages grouped by feature area
        │   ├── admin/          # Admin dashboard, attendance, employee, organization & ledger
        │   │   ├── organization/   # Branch & company management with Branch Partner assignment
        │   │   └── ledger/         # Universal accounting ledgers (Banks, Cashiers, Branch Partners)
        │   ├── developer/      # Developer dashboard, permission manager, API monitor
        │   ├── employee/       # Employee self-service dashboard, attendance, leave
        │   ├── manager/        # Branch manager views
        │   ├── plots/          # Plot dashboard, inventory, bookings, installments, payouts
        │   │   ├── booking/        # Plot booking lists, creation, and dedicated full-page booking ledger
        │   │   ├── businessDevelopers/ # 3-tier portal: Branch Partner, Business Partner, Business Associate
        │   │   ├── customers/      # Customer directory and onboarding
        │   │   └── reports/        # Sponsor ledgers, payouts, and business performance reports
        │   ├── common/         # Common pages (e.g. payroll)
        │   └── vouchers/       # Expense voucher lists and creation
        └── utils/              # Client-side helpers, numToWord Indian currency formatter, SSE listener, route guards
```
