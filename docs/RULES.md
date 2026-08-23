# RULES.md — Coding, Security, and Project Rules

## 1. Codebase & Language Conventions

### Backend (Node.js / Express)
- **CommonJS**: The server codebase uses standard CommonJS (`require` / `module.exports`). Do NOT introduce ES module imports (`import ... from ...`) in the server directory without architectural consensus.
- **Environment & Timezone**:
  - Node servers must run with `TZ=UTC` (configured via `cross-env TZ=UTC` in npm scripts).
  - Business timezone is standard `Asia/Kolkata` (defined in `ATTENDANCE_TIMEZONE`).
- **Date Handling**:
  - Always use `utils/attendanceTime.js` helper functions (`parseAttendanceDateTime`, `getAttendanceDateUTC`, `getMinutesInAttendanceTimezone`).
  - Attendance date keys in MongoDB must represent **UTC midnight** for that calendar date. Never save ad-hoc arbitrary hour timestamps in date key fields.
- **Permission Standard**:
  - Numeric CRUD constants: `1 = Read`, `2 = Create`, `3 = Update`, `4 = Delete`.
  - When creating or modifying routes, protect endpoints using `checkPermission('resource_name', numericAction)`.
- **Response Standardization**:
  - Use `ApiResponse` helper methods (`ApiResponse.success`, `ApiResponse.created`, `ApiResponse.paginated`) in controllers.

### Frontend (React 19 / Vite)
- **Component Architecture**:
  - Use functional components with hooks.
  - Wrap heavy routes in React `lazy()` and render within `<Suspense>`.
- **State & Storage**:
  - Use Redux slices for global auth/user state (`FirstFetch`, `empFirstFetch`).
  - Persist tokens in localStorage (`token` or auth state) and pass via `Authorization: Bearer <token>` header.
- **Styling**:
  - Utilize Material UI (MUI v7) paired with Tailwind CSS v4.
  - Maintain color schemes and dark/light aesthetic integrity.

---

## 2. Security & Access Rules

1. **Strict Password Hashing**:
   - Always hash passwords using `bcrypt` (minimum 10 salt rounds) inside Mongoose `pre('save')` hooks.
2. **Permission Invalidation**:
   - When a user's permissions or roles are updated by an admin, invalidate or update the corresponding Redis key `permissions:<userId>` to prevent stale permission elevation.
3. **Role Segregation**:
   - Never allow standard `employee`, `customer`, or `sponsor` roles to access `/dashboard` or admin endpoints without explicit checks in `Role_middleware.js` and `checkPermission`.
4. **Secrets & Keys**:
   - Never hardcode secret keys or database connection strings in source files. All secrets (`JWT_Key`, `db`, `CLOUDINARY_*`, `RAZORPAY_*`) belong in `.env`.

---

## 3. Database Rules (MongoDB / Mongoose)

1. **Indexes**:
   - Compound indexes with `{ status: 1, createdAt: -1 }` or `{ customerId: 1 }` must be respected when querying large collections (`PlotBooking`, `PlotPayment`, `Attendance`).
   - Use sparse unique indexes for optional user codes (`sponsorCode`, `customerCode`, `email`).
2. **Schema Separation**:
   - Keep business logic in dedicated services (`services/plots.service.js`, `services/attendanceService.js`, `services/accountingService.js`) rather than stuffing heavy aggregation logic into controllers.
