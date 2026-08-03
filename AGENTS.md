# AGENTS.md — Plot Module Integration Plan & Task Roadmap

> **Context**: All Plot-related files (Frontend pages/viewers, Backend models, controller, service, routes, and cron schedulers) have been copied into this project (`Ems-goodnature`) from the `CHANDU SIR` repository.

---

## 🎯 Task Objective
Wire up, integrate, and verify the newly added **Plot Module** so it works end-to-end smoothly within the `Ems-goodnature` project.

---

## 📋 Outstanding Tasks Checklist

### 1. Server Integration (`server/`)
- [ ] **Register Plot API Routes**:
  - Open `server/index.js` (or primary app file).
  - Mount `/api/plots` route:
    ```js
    const plotRoutes = require('./router/plots.routes');
    app.use('/api/plots', plotRoutes);
    ```
- [ ] **Check Auth & Permission Middleware**:
  - In `server/router/plots.routes.js`, verify imported middleware paths (e.g., `protect`, `restrictTo`, `verifyToken`).
  - Ensure the auth middleware matches the auth scheme used in `Ems-goodnature`.
- [ ] **Register Cron Schedulers (Optional)**:
  - If auto-payout or hold-release functionality is needed, initialize `server/cron/plotPayoutScheduler.js` and `server/cron/plotHoldScheduler.js` in `server/index.js`.

### 2. Frontend Integration (`frontend/src/`)
- [ ] **Register Plot Routes**:
  - Open `frontend/src/App.jsx`.
  - Add page routes pointing to components under `src/pages/plots/`:
    - `/plots/dashboard` -> `PlotDashboard.jsx`
    - `/plots/inventory` -> `PlotInventory.jsx`
    - `/plots/booking` -> `PlotBooking.jsx`
    - `/plots/booking/new` -> `PlotBookingFormPage.jsx`
    - `/plots/booking/:id` -> `PlotBookingDetails.jsx`
    - `/plots/customers` -> `PlotCustomers.jsx`
    - `/plots/installments` -> `InstallmentCollection.jsx`
    - `/plots/series-master` -> `PlotSeriesMaster.jsx`
    - `/plots/reports` -> `PlotReports.jsx`
    - `/plots/payout-ledger` -> `PlotPayoutLedgerPage.jsx`
    - `/plots/agreements/:id` -> `PlotAgreementViewer.jsx`
    - `/plots/certificates/:id` -> `BookingCertificateViewer.jsx`
    - `/plots/receipts/:id` -> `ReceiptViewer.jsx`
    - `/plots/vouchers/:id` -> `PlotPayoutVoucherPrint.jsx`
- [ ] **Add Sidebar / Navigation Links**:
  - Add Plot Module links to the main sidebar or navigation bar component in `frontend/src/components/`.
- [ ] **API Endpoint Base URL**:
  - Check `frontend/src/api/` or `frontend/src/config` to ensure API calls correctly hit `/api/plots`.

### 3. Database & Verification
- [ ] Verify Mongoose connection and ensure all models (`Plot`, `PlotBooking`, `PlotInstallment`, etc.) register correctly without schema conflicts.
- [ ] Run test build for frontend (`npm run build` or `npm run dev`) and server start (`npm start` or `npm run dev`) to verify no missing imports or broken path references exist.

---

## 📁 Key File Locations in `Ems-goodnature`
- **Frontend Pages**: `frontend/src/pages/plots/`
- **Backend Models**: `server/models/Plot*.js`
- **Backend Controller**: `server/controllers/plots.controller.js`
- **Backend Service**: `server/services/plots.service.js`
- **Backend Router**: `server/router/plots.routes.js`
- **Backend Cron**: `server/cron/plot*.js`

---

## 🛠️ Project Standards & Conventions Summary
Detailed documentation is maintained in [`PROJECT_STRUCTURE.md`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/PROJECT_STRUCTURE.md).

1. **Centralized API Calls**:
   - Always use `apiClient` (`frontend/src/utils/apiClient.js`) or the `useApi` hook (`frontend/src/utils/useApi.js`).
   - Do NOT write raw `fetch` or `axios` calls in components.
2. **Modal Dialogs**:
   - Always use `Modalbox` (`frontend/src/components/custommodal/Modalbox.jsx`).
3. **Tables**:
   - Use `react-data-table-component` (`DataTable`) for tabular views.
4. **Styling & Icons**:
   - Tailwind CSS v4 + `react-icons` + `framer-motion`.

