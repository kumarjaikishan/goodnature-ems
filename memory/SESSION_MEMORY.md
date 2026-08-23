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
- The page includes 3 interconnected tabs: **Series Blocks & Layout Grid**, **All Plots Inventory List (Cards & Table with live filters & pagination)**, and **Global Pricing & Corner Rates**.
- Both `/dashboard/plots/series-master` and `/dashboard/plots/inventory` route to this unified component.
