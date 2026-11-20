# SESSION_MEMORY.md — Session Memory & Discoveries

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
