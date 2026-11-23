# SESSION_MEMORY.md — Session Memory & Discoveries

## 2026-11-23 — Removed Branch Partner Ledger Banner from Branch Manager
- **File Modified**: `client/src/pages/admin/organization/components/BranchManager.jsx`
- **Behavior**:
  - Removed the "Branch Partner Ledger (0.5% Commission & Target Slabs)" banner from the grid card view.
  - Removed the "Branch Override (0.5%)" column from the table view.
  - Cards now cleanly display branch code, name, location, timings, and assigned users without the commission override box.

## 2026-11-23 — User Branch vs Branch ManagerIds Two-Way Synchronization Fix
- **Context & Bug**:
  - In User Management (`/dashboard/organization/users`), all users (including Nawraj Singh Nayan - Cashier/Billing) were assigned to `BHR SHARIF`.
  - In Branch Manager (`/dashboard/organization/branches`), the `Depot` card was displaying Nawraj Singh Nayan as assigned user, while `BHR SHARIF` was missing him.
  - **Root Cause**:
    1. User Management reads `user.branchIds` from the `user` document.
    2. Branch Manager card reads `branch.managerIds` from the `Branch` document.
    3. When a user was edited via `editAdmin` in `server/controllers/admin.js`, it updated `user.branchIds` but **never synchronized `branch.managerIds`**. Therefore, old historical assignments in `branch.managerIds` were never removed or updated when moving a user to a different branch.
    4. `deleteAdmin` only pulled the user if `role === 'manager'`, ignoring cashiers/accountants.
- **Fixes Applied**:
  - Synchronized existing database branch `managerIds` so `Depot` and `Good Feel` are clean (`[]`) and `BHR SHARIF` holds `[Nawraj Singh Nayan, Ghanshyam, Ravi Ranjan]`.
  - Added two-way sync in `editAdmin`: whenever `parsedBranchIds` changes on a user, automatically `$pull` their ID from removed branches and `$addToSet` their ID on newly assigned branches.
  - In `deleteAdmin`: unconditionally `$pull` deleted user from all `branch.managerIds`.

## 2026-11-23 — Edit Branch "Cast to ObjectId failed for value '[object Object]'" Fix
- **Context & Bug**:
  - When editing a branch in Organization -> Branches (`/dashboard/organization/branches`) and saving (e.g., toggling "Override Company Default Rules"), the backend threw `500 Cast to ObjectId failed for value "[object Object]" (type string) at path "_id" for model "user"`.
  - **Root Cause**:
    1. In Redux `firstfetch`, branches were populated with user objects for `managerIds`, `branchPartnerId`, and `branchPartnerIds`.
    2. In `addbranch.jsx`, `branchPartnerIds` retained full objects from `editbranchdata`.
    3. In `server/controllers/admin.js` (`editBranch`), calling `.toString()` on populated partner/manager objects evaluated to `"[object Object]"`. When `usermodal.findByIdAndUpdate` was called with those values, Mongoose failed to cast `"[object Object]"` to an ObjectId.
- **Fixes Applied**:
  - `client/src/pages/admin/organization/addbranch.jsx`:
    - Cleaned `branchPartnerIds`, `managerIds`, and `branchPartnerId` in `useEffect` when populating `editbranchdata`.
    - Added `cleanId` helper before dispatching `handleSubmit` and `edite` to guarantee only pure string IDs are posted.
  - `server/controllers/admin.js`:
    - Added safe `toIdString` helper in `editBranch` that extracts `_id` / `id` from objects, ObjectIds, or strings, preventing `"[object Object]"` from ever being passed into Mongoose user updates.

## 2026-11-23 — Attendance Check-In "Missing required fields" 400 Validation Fix
- **Context & Bug**:
  - When submitting "Mark Individual Attendance" (`/dashboard/attandence`), the backend returned `400 Bad Request: {"message": "Missing required fields"}` even though all fields visually appeared filled in the modal.
  - **Root Cause**:
    1. In `Attandence.jsx`, `init.status` was initialized to empty string `""`.
    2. In `MarkAttandence.jsx`, the Status `<Select>` had `value={inp.status || 'present'}` which rendered "Present" visually in the dropdown. Because the user saw "Present" already selected, they didn't touch the dropdown. Therefore, `onChange` never triggered and `inp.status` remained `""` in React state.
    3. In `attandencehelper.jsx`, `payload.status` was sent as `""`.
    4. In `server/controllers/attandence.js`, `if (!employeeId || !date || !status)` failed because `!""` is true.
- **Fixes Applied**:
  - `client/src/pages/admin/attandence/Attandence.jsx`: Initialized `status: "present"` in `init`.
  - `client/src/pages/admin/attandence/attandencehelper.jsx`:
    - Added safety fallback: `status: inp.status || 'present'`.
    - Added client-side validation for `employeeId`, `date`, and `punchOut` (when check-out) with clear warning toasts before firing the network request.
  - `server/controllers/attandence.js`:
    - In `checkin`: Defaulted `status` to `'present'` if empty/falsy instead of throwing 400.
    - Added specific error messages naming the missing field(s) if `employeeId` or `date` is absent.
    - In `checkout`: Added specific error message detailing which required field is missing.

## 2026-11-20 — Branch Partner Ledger Separation & Branch Entity Only
- **Context & Architecture**:
  - Branches are created in Organization -> Branches (`/dashboard/organization/branches`).
  - When a Branch Partner user is created in Business Developers, it is an authentication identity attached to that branch to grant dashboard login access.
  - All branch partner override commissions are credited exclusively to the **Branch's ledger** (e.g. `BHR SHARIF BRANCH`, code `B/2627/001`), NEVER to an individual sponsor ledger.
- **Files Modified**:
  - `client/src/pages/admin/ledger/ledgerpagelist.jsx`:
    - Updated `category === 'branch_partner'` and `typeFilter === 'branch_partner'` to strictly check `isBranch` (`l.ledgerType === 'branch' || Boolean(l.branchId)`).
    - Removed `tier === 'branch_partner'` from the branch filter so individual branch partner user profiles (`BRP-...`) are not displayed in the Branch Partner ledger list.
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperLedgerPage.jsx`:
    - When a Branch Partner accesses their ledger, navigates directly to their branch's ledger with the branch's name (e.g. `BHR SHARIF BRANCH`) and code (`B/2627/001`).
  - `server/controllers/ledger.js`:
    - In `createLedgerForSponsors`: BRP users (`isBranchPartner`, `BRP-` code, or branch partner IDs) are skipped from having individual sponsor ledgers created. Their `sp.ledgerId` is linked directly to their branch's ledger.
    - Added automatic deduplication for sponsor ledgers with the same `sponsorId`.
    - Added automated cleanup of empty/phantom sponsor ledgers created for Branch Partners or matching `BRP-` code (migrating any existing entries to their branch ledger).
    - In `visibleLedgers`: Filtered out any sponsor ledgers belonging to Branch Partners.
  - `server/services/plots/plotDeveloper.service.js`:
    - In `getSponsors`: Resolved `ledgerId` for Branch Partners directly to their branch's ledger; prevented auto-creating individual sponsor ledgers for Branch Partners.
    - In `createSponsor`: Automatically linked `sponsor.ledgerId` to the branch's ledger for new Branch Partners.

## 2026-11-20 — Admin User Form Stay on Page on Edit Save
- **File**: `client/src/pages/admin/organization/pages/AdminUserFormPage.jsx`
- **Behavior**:
  - Previously, `handleSave` unconditionally redirected to `/dashboard/organization/users` after saving.
  - Now, in edit mode (`isEditMode === true`), saving updates the user, dispatches `FirstFetch()`, displays success toast, and refreshes user details (`fetchAdminDetails(false)`) without redirecting.
  - The user stays on the edit page until they choose to navigate away or click the Back button.
  - Create mode (`!isEditMode`) retains redirection to the users list.

## 2026-11-20 — Business Developer ID Column Copy Button & BG Removal
- **File**: `client/src/pages/plots/businessDevelopers/PlotBusinessDevelopers.jsx`
- **Behavior**:
  - Removed badge backgrounds (`bg-amber-50`, `bg-teal-50`, `bg-slate-100`, etc.) and borders from the ID in the "Business Dev ID" column.
  - Added a Copy button with `Copy` and `Check` icon at the start of the ID.
  - Clicking the copy button copies the ID directly to the clipboard, displays a green checkmark feedback, and triggers a toast notification.

## 2026-11-20 — Branch Partner Multi-Tier Downline Network (Business Partners, Associates & Customers)
- **Files Modified**:
  - `server/router/plots.routes.js`:
    - Updated `router.get('/sponsors')`: When `req.user.role === 'sponsor'`, checks whether user is a designated Branch Partner (`isBranchPartner: true` / `BRP-` / listed in branch's `branchPartnerIds`). If Branch Partner, scopes `req.query.branchId` to their branches and skips forcing `req.query.parentSponsorId = userId`, enabling retrieval of both Business Partners (`roleType=partner`) and Business Associates (`roleType=associate`) under the branch.
  - `server/services/plots/plotDeveloper.service.js`:
    - In `getSponsors`: Handled `branchId` filtering; when `roleType === 'associate'` and `branchId` is passed, retrieves associates directly in branch or sponsored by partners in the branch. When `roleType === 'partner'`, ensures pure Business Partners are returned by excluding Branch Partners (`isBranchPartner: { $ne: true }` and sponsor codes not matching `BRP-|BR-`).
    - In `getCustomers`: Added Branch Partner scoping so Branch Partners see all customers booked across all partners and associates in their branch.
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperNetworkPage.jsx`:
    - Added dedicated Business Partners tab and downline Partners state (`partners`, `partnerColumns`, `fetchPartners`).
    - Added 3-tab layout for Branch Partners:
      1. **Business Partners**: Table of all Business Partners in the branch with code copy buttons, downline associates count, customers count, total bookings, total due, and actions ("Associates", "Customers", "Bookings").
      2. **Business Associates**: Table of all branch associates with Parent Partner column and Partner filter dropdown.
      3. **Branch Customers**: Table of all branch customers with Sponsoring Developer column and Developer filter dropdown.
    - Preserved 2-tab view for Business Partners (`Business Associates`, `Customers Under Associates`) and 1-tab view for Business Associates (`My Customers`).

- **Files Modified**:
  - `server/services/plots/plotDeveloper.service.js`:
    - Fixed `getSponsorDashboardStats` where `Branch.findOne` included `...(sponsor.branchIds?.length > 0 ? [{ _id: { $in: sponsor.branchIds } }] : [])`. This previously misclassified ANY Business Partner or Business Associate assigned to a branch as a Branch Partner (`isBranchPartner: true`).
    - Separated `branchPartnerDoc` (finding designated branch where `branchPartnerId` or `branchPartnerIds` matches sponsor) from `assignedBranch` (display branch for BA/BP/BRP).
  - `server/services/plots/plotBooking.service.js`:
    - Fixed `getBookings` to check `isExplicitBRP` or `bpBranches` matching `branchPartnerId`/`branchPartnerIds`, preventing Business Partners from seeing branch-wide bookings.
  - `server/controllers/ledger.js`:
    - Corrected `branchesWithPartners` and `isBRP` branch lookup in ledger retrieval.
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperNetworkPage.jsx`:
    - Hardened role detection: `BA-` / `A/` prefix is strictly Business Associate; `BP-` / `P/` prefix is strictly Business Partner; only `BRP-` / `BR-` or explicit verified `isBranchPartner` is Branch Partner.
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperDashboard.jsx`:
    - Hardened `roleTitle` with prefix guarantees.
  - `client/src/pages/plots/businessDevelopers/BusinessDeveloperReportPage.jsx`:
    - Hardened `isBRP` and `isDeveloperPartner` detection with prefix guarantees.
  - `client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx`:
    - Hardened `isBranchPartnerUser` guard with prefix checks.

## 2026-11-20 — 3-Tier Business Developer Hierarchy & Personal Ledger Migration
- **Hierarchy Established**:
  - `Branch` (Organization entity)
    └── `Branch Partner (BRP)` (Personal Developer, `BRP-...`, `isBranchPartner: true`, personal ledger `ledgerType: 'sponsor'`)
          └── `Business Partner (BP)` (Personal Developer, `BP-...`, reports to Branch Partner or Direct, personal ledger `ledgerType: 'sponsor'`)
                └── `Business Associate (BA)` (Personal Developer, `BA-...`, reports to Business Partner, personal ledger `ledgerType: 'sponsor'`)
- **Ledger & Commission Routing**:
  - Direct Commission -> Booking linked Business Associate (`PROMOTER` / `DIRECT_DEVELOPER`)
  - Team Override -> Parent Business Partner (`DEVELOPER_OVERRIDE`)
  - Branch Override -> Parent Branch Partner's personal sponsor ledger (`BRANCH_OVERRIDE`), NOT to the branch office entity ledger.
  - Periodic Closings (Target Incentive & Extra Incentive) credit to respective developer's personal ledger (`sponsorId: sp.sponsorId`, `branchId: null`).
- **Migration Script (`server/scripts/migrate_branch_partners.js`)**:
  - Script is permanent and registered under `npm run migrate:branch-partners`.
  - Reusable and idempotent for when the user connects their real / production database.
  - Automatically deduplicates multiple ledgers for Branch Partners, transfers existing `commission_branch` override entries from Branch entity ledgers to the Branch Partner's personal sponsor ledger, updates `PlotSponsorCommission` and bookings, and recalculates running balances.
- **Frontend Pages Updated**:
  - `PlotBusinessDevelopers.jsx`: Modal supports Branch Partner selection for Business Partners, table displays 🏢 Branch Partner, 👑 Business Partner, and 👥 Business Associate badges, copyable IDs without background.
  - `ledgerpagelist.jsx`: `/dashboard/ledger/branch-partners` lists only Branch Partners (`tier === 'branch_partner'`), separating them from Branch office entity ledgers.
  - `BusinessDeveloperLedgerPage.jsx`: Forwards Branch Partners directly to their personal sponsor ledger (`sp.ledgerId`).
