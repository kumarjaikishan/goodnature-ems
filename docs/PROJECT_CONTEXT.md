# PROJECT_CONTEXT.md — Project Purpose, Modules, & Tech Stack

## 1. Project Purpose & Scope
**Good Nature EMS** is a full-stack multi-tenant web application catering to workforce management and real estate plot/installment operations. It combines:
1. **Employee Management System (EMS)**: Biometric (eSSL) & web-based attendance tracking, multi-tier leave & weekly-off management, shift rules, advances, expense vouchers, accounting ledgers, and automated monthly payroll.
2. **Real Estate / Plot Booking & Installment System**: Plot series creation, inventory management, customer & sponsor onboarding, booking & hold workflows, installment collections with receipt generation, and weekly payout/return distributions.

---

## 2. Technology Stack

### Backend (`server/`)
- **Runtime & Framework**: Node.js, Express.js (v5.1.0)
- **Database**: MongoDB (Mongoose ORM v8.15.1)
- **Caching**: Redis (`redis` v5.8.1) for user permissions caching (fallback gracefully to Mongo)
- **Authentication**: JWT (`jsonwebtoken` v9.0.2) + `bcrypt`
- **Media Storage**: Cloudinary (`cloudinary` v2.6.1) + Multer
- **Date & Timezone**: `dayjs` (with UTC, timezone, and customParseFormat plugins)
- **Task Scheduling**: `node-cron` v4.2.1
- **Payments & External**: Razorpay v2.9.6, Telegram Webhooks, Axios

### Frontend (`client/`)
- **Build Tool & Framework**: Vite v6.3.5, React 19 (`react` v19.1.0)
- **Routing**: `react-router-dom` v7.6.2
- **State Management**: Redux Toolkit (`@reduxjs/toolkit` v2.8.2) + `redux-persist`
- **UI Components & Styling**: Material UI (MUI v7), Tailwind CSS v4, Emotion, Styled Components, Lucide React, React Icons
- **Data & Charts**: `@mui/x-charts`, `@mui/x-date-pickers` (with `dayjs`), `react-data-table-component`, `xlsx`
- **Real-Time & Notifications**: Server-Sent Events (SSE), `react-toastify`, `sweetalert`
- **Printing & Documents**: `react-to-print`

---

## 3. Core Modules & Functionality

### A. Authentication & Access Control (RBAC + ABAC)
- **Roles**: `developer`, `superadmin`, `admin`, `manager`, `employee`, `grant`, `demo`, `customer`, `sponsor`, `agent`.
- **Granular Permission Matrix**: Permissions are keyed by module name (e.g. `employee`, `attandence`, `leave`, `payroll`, `plot_booking`) with numeric actions:
  - `1`: Read
  - `2`: Create
  - `3`: Update
  - `4`: Delete
- Caching layer via Redis with automatic Mongo fallback.

### B. Attendance & Biometric Integration
- **eSSL Device Protocol**: Handles incoming HTTP requests (`/essl/iclock/cdata`, `getrequest.aspx`, `devicecmd`) with raw body parsing.
- **Web Attendance**: Punch in/out with geolocation and photo upload.
- **Attendance Time Engine**: Normalizes dates to UTC midnight (`getAttendanceDateUTC`) while calculating shifts in local `Asia/Kolkata` timezone.
- **Stats & Rules**: Early/late check-in penalties, minimum work hours, half-day vs full-day calculations, earned weekly offs.

### C. Leave & Payroll
- **Leave Balance & Policies**: Monthly accrual, sick leave, casual leave, paid leaves, approval workflows.
- **Weekly Off Ledger**: Tracks earned vs utilized weekly offs.
- **Payroll**: Salary calculations considering worked days, paid leaves, deductions, advances, overtime, and payslip generation.
- **Ledger & Vouchers**: Financial transactions, advances, and voucher approval workflows.

### D. Plot & Real Estate Management
- **Rate Configuration & Series Master**: Dimensional plots, per-sqft pricing, series-based inventory generator.
- **Sponsors & Customers**: KYC details, nominee information, multi-tier sponsor commission structures.
- **Bookings & Holds**: Full payment vs monthly installment schemes, automatic hold expiry via hourly scheduler.
- **Installment Collection & Receipts**: Real-time receipt numbering, ledger tracking, print-ready receipts and certificates.
- **Weekly Payouts**: Automated weekly ROI/return calculations, payout ledger, and payout voucher disbursement.

### E. Developer & Observability
- **In-Memory API Performance Monitor**: Measures response time, p95 latency, error rates per route pattern (`/api/api-monitor/stats`).
- **Telegram Bot Notifications**: Real-time punch and system alert broadcasting.
- **Server-Sent Events (SSE)**: Live event feed (`/events`) pushing real-time check-in/out updates to active dashboards.
