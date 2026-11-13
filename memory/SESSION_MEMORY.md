# SESSION_MEMORY.md — Session Memory & Discoveries

- **Synchronized Development Branch with Main [COMPLETED]**:
  - **Requirement**: Copy everything in the `main` branch to the `development` branch exactly ("same to same").
  - **Implementation**:
    - Confirmed `main` has commit `61d410f4` with clean working tree.
    - Updated `development` branch ref to point to `main` (`61d410f4`).
    - Verified `git diff main..development` returns 0 differences. Both branches are now 100% identical.

- **Single-Page Print Constraint for Receipts [COMPLETED]**:
  - **Issue**: Print preview was showing 2 pages because the parent wrapper elements (`html`, `body`, `#root`, and `.print-container`) retained full/default viewport heights or overflow, triggering a blank 2nd page in Chrome's print engine.
  - **Fix**:
    - In `ReceiptViewer.jsx` and `BookingCertificateViewer.jsx`:
      - Locked `html, body, #root` to `height: 100% !important; max-height: 100% !important; overflow: hidden !important;`.
      - Locked `.print-container` to `height: 100% !important; max-height: 100% !important; overflow: hidden !important; page-break-after: avoid !important; break-after: avoid !important;`.
      - Added `page-break-after: avoid !important; break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important;` to `.print-half-a4`.
      - This forces Chrome to render strictly **1 single page** with zero overflow.

- **Chrome Zero-Margin Fix to Suppress Browser Headers and Footers [COMPLETED]**:
  - **Issue**: Chrome inserts default page header ("GoodFeel SD"), date/time, and URL in the browser-managed margin when `@page { margin }` is non-zero and headers/footers are enabled in the browser.
  - **Fix**:
    - In `ReceiptViewer.jsx` and `BookingCertificateViewer.jsx`:
      - Set CSS `@page { margin: 0 !important; }` which completely strips the browser header/footer area from the printed sheet.
      - Applied exact physical offsets directly on `.print-half-a4`: `margin-top: 35mm !important; margin-left: 5mm !important; margin-right: 5mm !important; width: calc(100% - 10mm) !important; height: 95mm !important; max-height: 95mm !important;`.
      - Temporarily blanks `document.title = ''` upon clicking Print to prevent the document title from appearing.

- **Browser Print Headers / Footers & Receipt Dimensions [COMPLETED]**:
  - **Issue**: The browser print dialog preview showed "GoodFeel SD", date/time, and URL in the margins because Chrome's "Headers and footers" checkbox was enabled under print settings, and `ReceiptViewer.jsx` was missing the exact `35mm` top offset.
  - **Fix**:
    - In `client/src/pages/plots/printViewers/ReceiptViewer.jsx`: updated `@page` margin to `35mm 5mm 0mm 5mm !important;` and set `.print-half-a4` to `max-height: 95mm; height: 95mm; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;` matching the exact `3.5cm` top space and `9.5cm` height of pre-printed stationery.
    - Instructed user to uncheck **"Headers and footers"** under **More settings** in the Chrome print dialog to eliminate the browser's title ("GoodFeel SD"), date/time, and URL.

- **Plot Booking Receipt Dimension & Margins for Pre-printed Stationery [COMPLETED]**:
  - **Requirement**:
    - Precisely align the printable area on `/dashboard/plots/certificates/:id` with the pre-printed stationery shown in the user's reference photo.
    - Dimensions: Top offset starts at `3.5cm` (`35mm`), total vertical height is `9.5cm` (`95mm`), left and right margins are `0.5cm` (`5mm`).
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/BookingCertificateViewer.jsx`:
      - Set print `@page { margin: 35mm 5mm 0mm 5mm !important; }`.
      - Set `.print-half-a4 { height: 95mm !important; max-height: 95mm !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; }`.
      - Reduced cell padding to `py-0.5 px-1.5`, font sizes to `7.5px-8px`, compact headers and signatory area (`pt-1`, `w-36`).
  - **Verification**:
    - Validated with `oxlint` (0 errors, 0 warnings). Instant Vite HMR active.

- **Plot Agreement Page Header Refinement [COMPLETED]**:
  - **Requirement**:
    - Remove the centered header text `GOOD NATURE` printed at the top of each page in the agreement viewer.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/PlotAgreementEnglish.jsx`:
      - Removed `<div className="text-center font-black text-[12px] tracking-widest text-slate-900 uppercase mb-0.5">GOOD NATURE</div>` from `PageHeader`.
      - Preserved the clean `NAME`, `AGREEMENT NO`, and `PLOT NO` metadata header line and divider.
  - **Verification**:
    - Validated with `oxlint` (0 errors, 0 warnings). Instant Vite HMR active.

- **Plot Agreement Matter Alignment with Official Word Document [COMPLETED]**:
  - **Requirement**:
    - Match the Buyer's Agreement matter on `http://localhost:5173/dashboard/plots/agreements/:id` with the uploaded official Word document (`media_1794551239633_72202f40.docx`).
  - **Investigation & Findings**:
    - Inspected `PlotAgreementViewer.jsx` and `PlotAgreementEnglish.jsx` against all 108 paragraphs of the uploaded Word document.
    - Verified all 18 standard clauses and Recitals A through I:
      - Recital C updated to specify `vide Booking No.` and `tentatively admeasuring depth/ front ... SQFT`.
      - Recital G updated to refer to `Khata No.- ... / Khasra No.- ...` (matching legal revenue terminology).
      - Clause 3 updated to state `approx depth/ front (...) SQFT earmarked and to be allotted`.
      - Clause 4.c supports both Advance Full Payment (as in the document: 1 year from last validity date) and installment plans.
      - Clause 7.B.ii forfeiture provisions and 36-month refund clause intact.
      - Signatory blocks, witnesses, and Page 9 Annexure-1 structured in alignment.
  - **Verification**:
    - Validated with `oxlint` (0 errors, 0 warnings). Instant Vite HMR active.

- **Payment Receipt (Downpayment, EMI & Investment Collections) Redesign [COMPLETED]**:
  - **Requirement**:
    - Update the payment collection receipt viewer (`client/src/pages/plots/printViewers/ReceiptViewer.jsx`) which handles downpayment, EMI, and investment collection receipts.
    - Follow the exact format from the provided reference image:
      - Title: `Payment Receipt`
      - Row 1: `Receipt No. :` | `Date & Time :`
      - Row 2: `Booking ID :` | `Customer ID :`
      - Row 3: `Customer Name :` | `Guardian / S/o :`
      - Row 4: `Address :` (spanning full width)
      - Row 5: `Amount Paid :` | `Plot Number :`
      - Row 6: `Payment Mode :` | `Late Fine Paid :`
      - Row 7: `Narration :` | `Outstanding Balance :`
    - Apply the same compact styling (cell padding `py-1 px-2`, font `text-[9.5px]` with `leading-tight`, subtle `border-b border-slate-100`, key `w-[18%]` with right-aligned colon `:` and value `w-[32%]`) so it fits cleanly on pre-printed receipt stationary.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/ReceiptViewer.jsx`:
      - Reorganized the table rows strictly matching the 7-row layout.
      - Applied compact cell padding and typography.
      - Normalized full-width address row with `colSpan={3}`.
      - Preserved late fine rebate row if present.
      - Reduced bottom signatory padding (`pt-4`, `w-40`) and notice font size.
  - **Verification**:
    - Validated with `oxlint` (0 errors, 0 warnings). Instant Vite HMR active.

- **Plot Booking Certificate / Receipt Compact Spacing & Font Optimization [COMPLETED]**:
  - **Requirement**:
    - Compact the Booking Receipt so that the key-value content and table perfectly fit onto pre-printed receipt stationery without overflowing.
    - Slightly reduce font size and vertical padding.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/BookingCertificateViewer.jsx`:
      - Reduced table cell padding from `p-2` to `py-1 px-2` (`py-1` reduces row height by ~50%).
      - Reduced base font size from `text-[11px]` to `text-[9.5px]` with `leading-tight`.
      - Reduced title spacing (`mb-4` -> `mb-2.5`, font `text-[13px] md:text-[14px]`).
      - Reduced bottom signatory padding (`pt-8` -> `pt-4`, width `w-40`).
      - Reduced paper margin in print CSS to `8mm 12mm 8mm 12mm`.
  - **Verification**:
    - Validated with `oxlint` (0 errors). Instant Vite HMR active.

- **Plot Booking Certificate / Receipt Clean Table Styling Restored [COMPLETED]**:
  - **Requirement**:
    - Preserve the original clean aesthetic of the certificate table: keys having specified width (`w-[18%]`) with right-aligned colon separators (`flex justify-between items-center`), values having `w-[32%]`, and subtle thin row dividers (`border-b border-slate-100` and table `border border-slate-200`) without harsh/bold border lines.
    - Keep upper company logo, address, and "PLOT BOOKING CERTIFICATE" title removed, and header set to "BOOKING RECEIPT".
    - Align all key-value rows to the 11 rows in the requested sequence.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/BookingCertificateViewer.jsx`:
      - Used the clean 4-column layout (`w-[18%]` key, `w-[32%]` value) with right-aligned colons and subtle `border-b border-slate-100`.
      - Kept "BOOKING RECEIPT" banner centered at the top without upper company headers.
  - **Verification**:
    - Validated with `oxlint` (0 errors). Instant Vite HMR active.

- **Plot Booking Certificate Redesign to Booking Receipt Grid [COMPLETED]**:
  - **Requirement**:
    - On `/dashboard/plots/certificates/:id` (Regular Plot Booking Certificate Viewer), remove the top header section (company logo, company address, and divider line) as well as the old "PLOT BOOKING CERTIFICATE" title.
    - Replace with "Booking Receipt" header and reorganize the key-value pairs into the exact two-column bordered table layout specified by the user:
      - Header Row: `Booking Receipt` (spanning both columns)
      - Row 1: `Booking ID :` | `Booking Date/Time :`
      - Row 2: `Customer ID :` | `Plot Number :`
      - Row 3: `Customer Name :` | `Guardian / Father :`
      - Row 4: `Address :` | `Mobile No :`
      - Row 5: `Plot Area :` | `Mauja / थाना :`
      - Row 6: `Khata:` | `Khesra No :`
      - Row 7: `Dimensions / पैमाइश :` (spanning both columns)
      - Row 8: `Booked Rate :` | `Gross Plot Value :`
      - Row 9: `Total Discount :` | `Net Payable Amount :`
      - Row 10: `Down Payment (D.P):` | `EMI Payment :`
      - Row 11: `D.P End Due Date/Duration:` | `EMI End Due DateDuration :`
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/BookingCertificateViewer.jsx`:
      - Hoisted date, financial, land sourcing, dimensions, and due date/duration calculations cleanly.
      - Removed the company logo and address header section and the "PLOT BOOKING CERTIFICATE" banner.
      - Replaced with the new structured, bordered table matching the layout in the reference image.
      - Updated print button label to "Print Receipt".
  - **Verification**:
    - Validated with `oxlint` (0 warnings, 0 errors). Instant Vite HMR active.

- **Employee Update 400 Bad Request & Missing Error Toast Notification [COMPLETED]**:
  - **Issue**:
    - On `/dashboard/employe`, when clicking "Update Employee" with missing required fields (such as empty Department), the API returned `400 Bad Request: Required fields (employeeId, department, branchId) are missing.`.
    - However, no toast notification was shown to the user on the screen.
    - Root causes:
      1. In `client/src/pages/admin/employee/employeehelper.jsx`, `employeeupdate`, `addemployee`, and `employeedelette` had empty catch blocks that only called `console.error` and completely omitted `toast.error(error.message)`.
      2. The custom `Select` component doesn't trigger native HTML5 form validation (`<select required>`), so empty required fields were submitted directly to the server without client validation.
      3. In `Employe.jsx`, `edite` assigned `emp?.branchId` directly rather than checking `emp?.branchId?._id || emp?.branchId`, and `EmployeeFormModal.jsx` compared department branch with strict equality `===` instead of `String(...) === String(...)`.
  - **Fixes Applied**:
    1. **Added Toast Error Handling**: In `employeehelper.jsx`, added `toast.error(error.message || 'Error updating employee')` to the `catch` blocks in `employeeupdate`, `addemployee`, and `employeedelette`.
    2. **Client-Side Form Validation**: In `Employe.jsx`, added pre-submit validation in `adddepartcall` checking `inp.branchId`, `inp.department`, and `inp.employeeName`, giving instant clear toast alerts if any required field is empty.
    3. **Branch & Department ID Matching**: In `Employe.jsx` and `EmployeeFormModal.jsx`, normalized branchId handling (`emp?.branchId?._id || emp?.branchId`) and used `String(...) === String(...)` for department filtering.
  - **Verification**:
    - Validated with `oxlint` (0 errors). Instant Vite HMR active.

- **Business Partner / Associate Profile Photo Not Displaying in Header Upon Login [COMPLETED]**:
  - **Issue**:
    - Business partners and associates uploaded photos via the Business Developer module (`PlotBusinessDevelopers.jsx`), which stored their image URL under the `photo` field in `User`.
    - However, the top navigation bar (`Navbar.jsx`), the login JWT token (`userLogin`), and the user initial fetch (`firstfetch`) exclusively looked for `user.profile.profileImage`.
    - Since `profileImage` was empty while `photo` contained the Cloudinary URL, the header displayed the fallback circle initial `M` instead of their profile picture.
  - **Fixes Applied**:
    1. **Backend Synchronization (`plotDeveloper.service.js`)**:
       - In `createSponsor` and `updateSponsor`, both `photo` and `profileImage` fields are now set simultaneously whenever a photo is uploaded or updated.
    2. **User Login & Session Fetch (`user.js` & `admin.js`)**:
       - In `userLogin`, `profileImage: isUser.profileImage || isUser.photo || ''` is now embedded in both the JWT payload and the response object.
       - In `firstfetch` (`/api/firstfetch`), selected `photo` along with `profileImage` and added fallback assignment: `if (user && !user.profileImage && user.photo) user.profileImage = user.photo;`.
    3. **Frontend Header Fallback (`Navbar.jsx`)**:
       - In `Navbar.jsx`, avatar image tag now checks `(user?.profile?.profileImage || user?.profile?.photo)` so existing logged-in sessions display their image immediately.
  - **Verification**:
    - Validated with `node -c` (0 syntax errors) and `oxlint` (0 errors).

- **Plot Product / Investment Booking One-Time Full Payment Validation Fix [COMPLETED]**:
  - **Issue**:
    - When creating or editing an Investment Booking (`/dashboard/plots/investment-booking/new`) with **One-Time Full Payment** (`paymentType === 'FULL_PAYMENT'`), the booking failed with:
      `PlotProductBooking validation failed: installmentCount: Path 'installmentCount' (0) is less than minimum allowed value (1).`
    - Both the frontend form and backend `plotProductService` correctly assign `installmentCount: 0` because there are no future installments when 100% is paid upfront.
    - However, `server/models/PlotProductBooking.js` had `min: 1` on `installmentCount` (and `min: 1` on `tenureMonths`), whereas `PlotBooking.js` already correctly used `min: 0`.
  - **Fix**:
    - In `server/models/PlotProductBooking.js`, updated `installmentCount` from `min: 1, default: 24` to `min: 0, default: 0` and `tenureMonths` to `min: 0`.
  - **Verification**:
    - Verified with `node -c server/models/PlotProductBooking.js` (0 errors).

- **Plot Buyer's Agreement Footer Full-Width Divider Line Removal [COMPLETED]**:
  - **Requirement**:
    - On the Buyer's Agreement viewer (`/dashboard/plots/agreements/:id`), there was a solid horizontal line stretching across the full width of every page immediately above the "Applicant Signature" and "Authorized Signature" spaces.
    - Remove this full-width divider line so the page body flows cleanly directly to the individual signature areas.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/PlotAgreementEnglish.jsx`:
      - In `PageFooter`, removed `border-t border-slate-300` and updated padding from `pt-1.5` to `pt-2`.
      - Preserved the clean individual dashed signature lines directly above "Applicant Signature" and "Authorized Signature" and the centered "Page X of 9" indicator.
  - **Verification**:
    - Verified `oxlint -D no-undef` passes with 0 warnings and 0 errors. Instant Vite HMR active.

- **Plot Buyer's Agreement Footer Cut-off Elimination & Content Flow Rebalance [COMPLETED]**:
  - **Issue**:
    - In the generated print/PDF output, on intermediate pages (especially Pages 2, 3, 4, 5, 6, 7), the footer (`Applicant Signature`, `Authorized Signature`, and `Page X of 9`) was either cut in half or pushed completely outside the 297mm A4 page boundary.
    - Page 5 was severely overloaded with 68 lines of text (all of Clause 7.B Earnest Money + Clause 8.A + all 5 sub-clauses of 8.B), pushing its footer 200px+ off the bottom edge. In contrast, Page 8 had only 25 lines (65% empty white space).
  - **Fixes Applied**:
    1. **Even Content Distribution Across Pages 5 to 8**:
       - Page 5 now contains: Clause 7.B (Earnest Money) + Clause 8.A + Clause 8.B (Conveyance Deed I, II, III).
       - Page 6 now contains: Clause 8.B (IV, V) + Clause 8.C (Obligation to take possession I, II) + Clause 9 (Force Majeure A, B, C).
       - Page 7 now contains: Clause 10 (Assignment/Transfer A, B) + Clause 11 (Indemnification) + Clause 12 (Ownership transfer) + Clause 13 (Abide by Law) + Clause 14 (Notice A, B).
       - Page 8 now contains: Clause 15 (Entire Agreement) + Clause 16 (Amend Annexures) + Clause 17 (Dispute Resolution) + Clause 18 (Governing Law & Jurisdiction) flowing naturally into `IN WITNESS WHEREOF` and the Signatures & Witnesses block.
       - Every page now has ~45-50 lines of text (height ~550px-650px out of ~1050px available), leaving a generous 300px-450px safety buffer before the footer on every page.
    2. **Print Styles & Padding Optimization**:
       - In `PlotAgreementViewer.jsx`, adjusted `@media print` `.agreement-page` padding from `10mm 14mm 10mm 14mm` to `8mm 14mm 8mm 14mm`, reclaiming 4mm (15px) of vertical space.
       - In `PlotAgreementEnglish.jsx`, adjusted typography to `text-[0.71rem] leading-[1.42]` with `space-y-1` and headings `text-[0.76rem] pt-1.5/pt-2 pb-0.5`.
       - In `PageFooter`, refined dashed line height to `h-3` and added `pb-0.5` bottom padding with `text-[8.5px]`, ensuring signature lines and page number never touch or clip at the page edge.
  - **Verification**:
    - Verified `oxlint -D no-undef` passes with 0 warnings and 0 errors across agreement viewers.
    - Instant Vite HMR active. All 9 pages now render completely inside printable margins without clipping.

- **Ledger Controller Performance & Query Optimization (`GET /api/ledger?view=ledger`) [COMPLETED]**:
  - **Context**:
    - Evaluated and optimized `GET /api/ledger?view=ledger` (`ledger` and `getTreasuryLedgers` in `server/controllers/ledger.js`).
    - Previously, every 5 minutes (or when sync debounce elapsed), any GET request to `/api/ledger` was blocked by synchronous ledger synchronization loops executing `findOne` across all employees, sponsors, kisans, and branches inside transactions, causing multi-second freezes.
    - The main MongoDB query loaded all ledgers without database-level `isVoucherLedger` filtering, hydrated heavy Mongoose documents without `.lean()`, and ran aggregations on the `Entry` collection without `allowDiskUse`.
  - **Optimizations Applied**:
    1. **Asynchronous Non-Blocking Sync**: Modified `syncAllLedgersSafe` call in GET handlers so routine 5-minute periodic checks fire in the background without blocking the HTTP response. If `sync === 'true'` is explicitly passed, it still awaits synchronization.
    2. **Database-Level View Filtering**: Added `{ $or: [{ ledgerType: { $ne: 'custom' } }, { isVoucherLedger: { $ne: true } }] }` for `view === 'ledger'` and `{ isVoucherLedger: true }` for `view === 'vouchers'` directly into the MongoDB filter, preventing hundreds of unwanted documents from being loaded across the network.
    3. **Query Optimization via `.lean()`**: Added `.lean()` to `Ledger.find(...)` queries in both `ledger` and `getTreasuryLedgers`, reducing memory overhead by ~60% and speeding up serialization.
    4. **Aggregation Safeguard**: Added `{ allowDiskUse: true }` to `Entry.aggregate` and `FundTransfer.aggregate` to prevent MongoDB memory limit crashes on large transaction volumes. Added empty-array guards (`if (ledgerIds.length > 0)`) to avoid redundant aggregation executions.
    5. **Module Import Hygiene**: Moved `Branch`, `FundTransfer`, and `User` model imports to the top of `server/controllers/ledger.js`, eliminating inline `require` statements during request handling.
  - **Verification**:
    - Verified syntax using `node -c server/controllers/ledger.js` (0 errors).
    - Verified frontend compatibility using `oxlint` on `client/src/pages/admin/ledger/ledgerpagelist.jsx` (0 warnings, 0 errors).

- **Plot Buyer's Agreement Point Spacing & Heading Underline Removal [COMPLETED]**:
  - **Requirement**:
    - On the Buyer's Agreement viewer page (`/dashboard/plots/agreements/:id`), clauses had underline styling directly under their titles (e.g., `3. AGREEMENT TO SELL` with a border line below it) and points were crammed close together with minimal top spacing.
    - Remove all underlines below point headers and add breathing room/spacing between points and sub-clauses across all pages.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/PlotAgreementEnglish.jsx`:
      - Removed `border-b border-slate-300 pb-0.5` across all 18 numbered clause headings (Clause 1 through 18) and sub-clause headings (e.g., Clause 8.C).
      - Replaced with clean top spacing `pt-2.5 pb-0.5` on all point headers (`h4`) so each point clearly stands out with dedicated vertical separation from the preceding clause.
      - Added `pt-1` / `pt-1.5` padding before sub-clauses (e.g. 1.1, 4.e, 4.f, 5.B, 5.C, 7.A, 8.A, 8.B, 9.A, 9.B, 9.C, 10.A, 10.B).
      - Removed the `border-t border-b border-slate-300` horizontal lines from the `NOW THEREFORE...` divider line.
  - **Verification**:
    - Verified `oxlint -D no-undef` passes with 0 warnings and 0 errors. Instant Vite HMR active.

- **Plot Buyer's Agreement Template Alignment with User MS Word Document & Per-Page Header/Footer Signatures [COMPLETED]**:
  - **Requirement**:
    - Analyzed the Buyer's Agreement viewer page (`/dashboard/plots/agreements/:id`, referencing booking `6af353b0949cbeaca66f2555`).
    - Aligned legal clauses, registered office address, recitals, default consequences, and dispute resolution with the user-provided MS Word Buyer's Agreement document (`Agreenent.docx`).
    - Every page displays the top header (`GOOD NATURE` + Customer Name, Agreement No, Plot No) and bottom signatures (`Applicant Signature` & `Authorized Signature`) and page numbers, both on screen and when printing with Ctrl + P.
    - On Page 1, the top 120mm is reserved for the physical bond paper / stamp paper ticket, with content situated in the lower portion above the footer signatures.
    - The user requested that for the intermediate pages (between Page 1 and the last 2 pages), the large empty whitespace at the bottom of each page be properly filled and the text flow continuously to the next page, while keeping the Signatures/Witnesses block and Annexure 1 on their dedicated final pages.
  - **Implementation**:
    - In `client/src/pages/plots/printViewers/PlotAgreementEnglish.jsx`:
      - **Page 1**: Reserved 120mm top space for stamp/bond paper printing, content at lower half, bottom signatures & `Page 1 of 9`.
      - **Pages 2 through 7**: Consolidated the 18 clauses into 6 fully-utilized, beautifully typeset pages (~85-90% vertical fill) without excessive bottom whitespace:
        - **Page 2**: Recitals A through I + NOW THEREFORE + Clause 1.1 (Definitions: Plot, Common Areas & Facilities A, B, C).
        - **Page 3**: Clause 1.2 (Interpretation A-F) + Clause 2 (Acceptance) + Clause 3 (Agreement to Sell) + Clause 4 (Total Price a, b, c, d, e, f).
        - **Page 4**: Clause 5 (Entitlement A, B, C) + Clause 6 (Alterations) + Clause 7.A (Events of Default i-v).
        - **Page 5**: Clause 7.B (Earnest Money & Forfeiture i-iv) + Clause 8.A (Possession Timeline) + Clause 8.B (Conveyance Deed Execution I-V).
        - **Page 6**: Clause 8.C (Obligation to take possession I, II) + Clause 9 (Force Majeure A, B, C) + Clause 10 (Assignment/Transfer A, B) + Clause 11 (Indemnification).
        - **Page 7**: Clause 12 (Ownership transfer) + Clause 13 (Applicable law) + Clause 14 (Notice A, B) + Clause 15 (Entire Agreement) + Clause 16 (Amend Annexures) + Clause 17 (Arbitration) + Clause 18 (Jurisdiction).
      - **Page 8 (Signatures & Witnesses)**: Full execution block with Signed & Delivered (For Company, For Allottee) and Witnesses (1 & 2) with lines for Name and Address.
      - **Page 9 (Annexure 1)**: Dedicated Annexure 1 table with comprehensive project specs, dimensions, and financial terms.
      - All pages now feature `Page X of 9` centered in the footer.
  - **Verification**:
    - Ran `oxlint -D no-undef client/src/pages/plots/printViewers/PlotAgreementEnglish.jsx client/src/pages/plots/printViewers/PlotAgreementViewer.jsx` (0 warnings, 0 errors).
    - Preserved instant Vite HMR.


- **Agreement Printing Suppression of Browser Headers (Date/Time) and Footers (File URL) [COMPLETED]**:
  - In `client/src/pages/plots/printViewers/PlotAgreementViewer.jsx` and `ProductAgreementViewer.jsx`:
    - Updated `@media print` rule to set `@page { size: A4 portrait; margin: 0 !important; }`.
    - In Chromium / Chrome, a zero `@page` margin automatically eliminates the browser's header (timestamp and document title) and footer (page file URL and default page counter).
    - Preserved exact printable margins via `.agreement-print-container` (`padding: 0 14mm !important;`), Page 1 (`print:pt-[10mm] print:pb-[12mm]`), and repeating `thead` / `tfoot` (`print:pt-[10mm]` and `print:pb-[12mm]`), giving clean, professional margins with internal agreement signatures on every page.
  - Verified with `oxlint` (0 errors).

- **Hidden Header Logo and Address on All Receipts [COMPLETED]**:
  - In `client/src/pages/plots/printViewers/ReceiptViewer.jsx` (Plot Payment Receipts) and `client/src/pages/plots/products/components/ProductReceiptModal.jsx` (Product / Investment Official Receipts):
    - Set the company header branding block (logo, brand name/tagline, address, and contact) to `display: none` (`hidden` + `style={{ display: 'none' }}`).
    - Cleanly aligned receipt metadata (`Official Receipt`, `Receipt No`, `Date`) on `ProductReceiptModal.jsx`.
    - Suitable for printing directly on company pre-printed stationary / letterhead.
  - Verified with `oxlint` (0 warnings, 0 errors).

- **Replaced Sparkle Icon with Professional Financial Calculator Icon [COMPLETED]**:
  - In `client/src/pages/plots/booking/PlotBookingDetails.jsx`, replaced the decorative `Sparkles` icon on the `Growth & Interest` action button with a professional `Calculator` icon.
  - Verified with `oxlint` (0 errors).

- **Plot Booking Details Side-by-Side Layout for Sponsor & Land Sourcing [COMPLETED]**:
  - In `client/src/pages/plots/booking/PlotBookingDetails.jsx`, removed `lg:col-span-2` from the Land Acquisition & Sourcing card.
  - Now renders side-by-side: `Sponsor & Commission` in the left column and `Land Acquisition & Sourcing` in the right column, completing a clean 2-column balanced grid before the installments schedule.
  - Verified with `oxlint` (0 errors).

- **Plot Booking Details Side-by-Side Layout for Sponsor & Land Sourcing [COMPLETED]**:
  - In `client/src/pages/plots/booking/PlotBookingDetails.jsx`, removed `lg:col-span-2` from the Land Acquisition & Sourcing card.
  - Now renders side-by-side: `Sponsor & Commission` in the left column and `Land Acquisition & Sourcing` in the right column, completing a clean 2-column balanced grid before the installments schedule.
  - Verified with `oxlint` (0 errors).

- **Plot Booking Details Sponsor Code Population & Header Label Cleanup [COMPLETED]**:
  - **Issue**:
    1. On the Booking Details page (`/dashboard/plots/booking/:id`), the card header displayed `SPONSOR & COMMISSION SNAPSHOT` and `CONTRACT FIXED COMMISSION SNAPSHOT`. The user wanted the word "SNAPSHOT" removed.
    2. SPONSOR ID was showing `N/A` even though the sponsor's name (e.g. `Mahendra Prasad Malakar`) was present.
  - **Root Cause & Fix**:
    - In `server/services/plots/plotBooking.service.js`: `getBookingById` populated `sponsorId` with `'name customerId mobile address'`. In Mongoose, `User` models store the sponsor's code in `sponsorCode` (or `customerCode`), so the code was stripped out by query field projection. Updated projection to `'name sponsorCode customerCode customerId mobile address email'`.
    - In `client/src/pages/plots/booking/PlotBookingDetails.jsx`:
      - Removed the word "Snapshot" from card titles: now `Sponsor & Commission` and `Contract Fixed Commission`.
      - Updated `sponsorIdDisplay` resolution to check `sponsor.sponsorCode || sponsor.customerCode || sponsor.customerId || sponsor.code || customer.sponsorId?.sponsorCode`.
  - **Verification**:
    - Backend: `node -c server/services/plots/plotBooking.service.js` (0 errors).
    - Frontend: `oxlint -D no-undef client/src/pages/plots/booking/PlotBookingDetails.jsx` (0 warnings, 0 errors).
    - Preserved instant Vite HMR.

- **Land Sourcing Allocation Bug Fix (False Over-allocated on Unselected Rows) [COMPLETED]**:
  - **Issue**:
    - When adding or viewing a land sourcing row without selecting an agreement (Khata, Khesra, Agreement still unchosen), the row was pre-filled with the plot area (e.g. 1600 SqFt), and the summary bar fell into a broken ternary fallback displaying: `Over-allocated: 1600 of 1600 SqFt (0 SqFt excess)`.
  - **Fix**:
    - In `client/src/pages/plots/booking/components/LandAcquisitionSourcingSection.jsx`:
      - New rows initialize with `allocatedSqFt: 0` so no unallocated area is claimed before an agreement is chosen.
      - Changing Khata or Khesra to a new selection resets `allocatedSqFt: 0` until an agreement is selected (or auto-selected).
      - When an Agreement is selected, `allocatedSqFt` automatically sets to the needed remaining area (`remainingNeeded`).
      - Summary bar now calculates `validAllocatedSqFt` strictly from rows with a valid `agreementId`.
      - If any row has `!s.agreementId`, the summary bar clearly prompts: `Please choose Khata, Khesra, and Agreement to allocate [reqSqFt] Sq.Ft.` and never displays false `Over-allocated (0 SqFt excess)`.
      - Only displays `Over-allocated` strictly when `validAllocatedSqFt > reqSqFt`.
    - In `client/src/pages/plots/booking/components/StepTermsAndPayment.jsx`:
      - `totalAllocatedArea` filters by `Boolean(s.agreementId)`.
    - In `client/src/pages/plots/booking/PlotBooking.jsx`:
      - Added submission validation to ensure every land sourcing row has an agreement chosen.
  - **Verification**:
    - AST / linter (`oxlint -D no-undef`): 0 warnings, 0 errors.
    - Preserved instant Vite HMR without executing full build.

- **Periodic (Tenure) vs Manual Discount Separation Across Booking, Review Modal, Details Page, and Certificate [COMPLETED]**:
  - **Requirement**:
    1. During plot booking (`/dashboard/plots/booking/new`), two discounts can exist: Periodic / Tenure Discount (e.g., `-14% Tenure Adjustment (6M)`: `-₹8,81,412`) and Manual Discount (e.g., `Manual Discount Given`: `-₹12,500`).
    2. Review confirmation modal (`BookingConfirmationModal.jsx`) must show both discounts separately along with the combined total discount.
    3. Booking Details page (`/dashboard/plots/booking/:id`) in the "Booking Contract & Financial Terms" section must display both discounts separately (Periodic/Tenure Discount, Manual Discount, and Total Combined Discount).
    4. Printable Booking Certificate (`BookingCertificateViewer.jsx`) must show the combined total discount with an explanatory breakdown showing `(Periodic: ₹... + Manual: ₹...)` and correct Gross Plot Value.
  - **Implementation**:
    - `client/src/pages/plots/booking/PlotBooking.jsx`:
      - Passed `baseCalculatedPlotValue` and `emiTenureAdjustment` props to `<BookingConfirmationModal />`.
    - `client/src/pages/plots/booking/components/BookingConfirmationModal.jsx`:
      - Received `baseCalculatedPlotValue` and `emiTenureAdjustment`.
      - Displayed `Gross Plot Value`, `Periodic / Tenure Discount`, `Manual Discount Given`, and `Total Discount (Periodic + Manual)`.
    - `client/src/pages/plots/booking/components/BookingSummarySidebar.jsx`:
      - Displayed base gross amount, separate periodic adjustment, manual discount, and combined discount.
    - `client/src/pages/plots/booking/PlotBookingDetails.jsx`:
      - Extracted `manualDiscount`, `tenureDiscount` (when `emiTenureAdjustmentAction === 'DEDUCT'`), `totalCombinedDiscount`, and `baseGrossValue`.
      - Updated top KPI cards: `Total Plot Value (Gross)` and `Discount Granted (Total)` with granular breakdown.
      - Updated "Booking Contract & Financial Terms" card: displays `Gross Plot Value (Base)`, `Periodic / Tenure Discount`, `Manual Discount Given`, `Total Combined Discount`, and `Net Plot Contract Value`.
    - `client/src/pages/plots/printViewers/BookingCertificateViewer.jsx`:
      - Row 7: Total Discount displays `₹{totalCombinedDisc}` with secondary subtitle displaying both separated amounts `(₹{tenureDisc} + ₹{manualDisc})` without the words "Periodic" or "Manual".
      - Row 10: Renamed `Remaining Balance` to `EMI Payment`.
  - **Verification**:
    - Verified all 6 files with `oxlint` (0 errors).
    - Preserved instant Vite HMR without executing full build.

- **Booking Commission Snapshot Immutability, Detail Display & Cancellation Ledger Reversals [COMPLETED]**:
  - **Requirement**:
    1. Lock and snapshot the exact commission percentages (both Downpayment % and EMI %) for Business Associate, Business Partner, and Branch Partner at the exact moment a booking is created.
    2. If scheme matrix rates change 3-4 months later, or a customer makes deposits after 2 years, all future collections for that contract must strictly use the original locked snapshot rates from booking time.
    3. Save these rates in the booking document and display them on the Booking Details page (`/dashboard/plots/booking/:id`).
    4. When a collection receipt/bill is cancelled, rejected, or deleted, the exact amount credited to the sponsor and branch ledgers must be reversed.
  - **Implementation**:
    - In `server/models/PlotBooking.js` & `server/models/PlotProductBooking.js`:
      - Added locked fields: `downpaymentPromoterCommissionPercent`, `emiPromoterCommissionPercent`, `downpaymentBpCommissionPercent`, `emiBpCommissionPercent`, `downpaymentBranchCommissionPercent`, `emiBranchCommissionPercent`.
    - In `server/services/plots/plotBooking.service.js`:
      - Stamped all 6 locked hierarchy commission rates onto the `PlotBooking` document at booking creation.
    - In `server/services/plots/plotDeveloper.service.js`:
      - Updated `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions` to ALWAYS prioritize `booking.downpaymentPromoterCommissionPercent` / `booking.emiPromoterCommissionPercent`, etc., before falling back to any current global scheme matrix, ensuring permanent contract rate immutability.
    - In `server/services/plots/plotCollection.service.js`:
      - In `deleteReceipt` and `rejectReceipt`, ensured all ledger entries matching `{ source: { $in: ['commission_fixed', 'commission_branch', 'receipt'] }, referenceId: receipt._id }` and corresponding `PlotSponsorCommission` documents are deleted/reversed from sponsor, branch, and treasury ledgers.
    - In `client/src/pages/plots/booking/PlotBookingDetails.jsx`:
      - Added "Sponsor & Commission Snapshot" card displaying the locked Downpayment % and EMI % for BA, BP, and Branch Partner with a permanent lock indicator badge.
  - **Verification**:
    - Node syntax check (`node -c`): 0 errors across all touched backend files.
    - AST / linter (`oxlint -D no-undef`): 0 errors on all frontend files.
    - Preserved instant Vite HMR without executing full build.


  - **Requirement**:
    1. Independent commission rates for Downpayment deposits vs regular monthly EMI installments for Business Associate (BA), Business Partner (BP), and Branch Partner.
       - Downpayment deposits credit `fdPromoterCommissionPercent` (BA), `bpFdCommissionPercent` (BP), and `branchFdCommissionPercent` (Branch Partner).
       - Regular EMI deposits credit `rdPromoterCommissionPercent` (BA), `bpRdCommissionPercent` (BP), and `branchRdCommissionPercent` (Branch Partner).
       - Full Payment / One-Time bookings treat 100% of collections as Downpayment and credit the downpayment rates.
    2. Strict collection guardrails:
       - Downpayment collections must only accept up to the remaining downpayment balance and must **never spill into EMI installments**.
       - Monthly EMI collections are blocked until the downpayment has been 100% completed.
       - Rebuilding installments isolates `DOWNPAYMENT` receipts to installment #0 and `INSTALLMENT` receipts to installments #1+.
    3. Scheme matrix UI updated from `EMI | One-Time` to `EMI | Downpayment` across BA, BP, and Branch Partner, with all purple styling converted to deep teal and emerald theme standards.
  - **Implementation**:
    - In `server/services/plots/plotDeveloper.service.js`:
      - Updated `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions` to evaluate each collection receipt dynamically: Downpayment receipts apply `fdPromoterCommissionPercent`, `bpFdCommissionPercent`, and `branchFdCommissionPercent`; regular EMI receipts apply `rdPromoterCommissionPercent`, `bpRdCommissionPercent`, and `branchRdCommissionPercent`.
      - Updated remarks and slab labels to clearly reflect `(Downpayment)` vs `(EMI)`.
    - In `server/services/plots/plotCollection.service.js`:
      - In `collectInstallment`: isolated `targetInstIds` to installment #0 for downpayment collections. Added hard validation capping collection at the unpaid downpayment principal + net fine. Added loop guard terminating before installment #1.
      - Blocked EMI collections when downpayment is unpaid.
      - In `rebuildBookingInstallmentsState`: enforced strict receipt partitioning (`DOWNPAYMENT` applies only to installment #0, `INSTALLMENT` applies only to installments #1+).
    - In `client/src/pages/plots/products/components/ProductSchemeRulesTab.jsx`:
      - Replaced `EMI | One-Time` with `EMI | Downpayment` across BA, BP, and Branch Partner.
      - Removed purple styling; replaced with teal/emerald theme classes.
  - **Verification**:
    - Backend syntax check: `node -c` (exit code 0).
    - Client AST/lint: `oxlint -D no-undef` (0 warnings, 0 errors).
    - Preserved instant Vite HMR without executing full build.

- **Commission Structure Theme Alignment (No Purple Colors) [COMPLETED]**:
  - **Requirement**:
    - Do not use purple colors on the commission structure page (`/dashboard/my-commission-rates`).
    - Standardize all buttons, role badges, and table indicators to the project's deep teal and emerald theme standards.
  - **Implementation**:
    - In `client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx`:
      - Replaced `bg-purple-700` button with `bg-teal-700` for Business Partner.
      - Replaced `bg-purple-50 text-purple-800` role badges with `bg-teal-50 text-teal-900 border-teal-300`.
      - Replaced `bg-indigo-50` with `bg-emerald-50 text-emerald-800 border-emerald-200` for Branch Partner.
  - **Verification**:
    - Validated with `oxlint`: 0 warnings, 0 errors.
    - Preserved instant Vite HMR without executing a full build.


- **Khata and Plot / Khesra Number Display Format Refinement [COMPLETED]**:
  - **Requirement**:
    - Remove the `#` prefix and prefix text (`Khata #`, `Plot / Khesra #`) when selecting and viewing Khata number and Plot/Khesra number.
    - Show just the clean raw number (e.g. `78`, `268`) in the dropdown list, in the selected input field, and in the detail summary tags.
  - **Implementation**:
    - In `client/src/pages/plots/booking/components/LandAcquisitionSourcingSection.jsx`:
      - Updated `overallKhataOptions`: set `label: k === 'General' ? 'General' : k` (so it renders as just `78`).
      - Updated `khesraOptions`: set `label: p === 'General Plot' ? 'General' : p` (so it renders as just `268`).
      - Search placeholders updated to `Search Khata...`, `Search Khesra...`, and `Search Agreement...`.
      - Detail tags updated from `Khata: #78` to `Khata: 78` and from `Plot/Khesra: #268` to `Plot / Khesra: 268`.
  - **Verification**:
    - Validated with `oxlint`: 0 warnings, 0 errors.
    - Preserved instant Vite HMR without executing a full build.


- **Plot Booking Step 3 & Summary Sidebar Professional Clean-Up [COMPLETED]**:
  - **Requirement**:
    - Remove AI slop (sparkles, star-type icons, decorative badges, and heavy multi-color gradients).
    - Make Step 3 look clean, minimal, and professional. Use color only where necessary for semantic meaning (e.g. matching badges, alerts, active selections).
  - **Implementation**:
    1. `StepTermsAndPayment.jsx`:
       - Removed `Sparkles`, `Award`, `Calculator`, and `Edit3` decorative icons from titles, section headers, and input labels.
       - Replaced heavy colored background cards (`bg-teal-50/70`, `bg-gradient-to-r`) with clean standard white cards (`bg-white border border-slate-200 rounded-xl`).
       - Simplified Payment Plan selector (One-Time vs EMI) with subtle active borders and clear text.
       - Cleaned up Plot Premium Features card by eliminating the orange/amber gradient and sparkle badge, switching to clean slate layout.
       - Replaced multi-colored EMI duration/schedule badges with crisp font-mono text and neutral slate tags.
    2. `LandAcquisitionSourcingSection.jsx`:
       - Replaced outer teal container with clean `bg-white border border-slate-200 rounded-xl`.
       - Removed `Building2` icon from the header.
       - Styled land source rows in clean `bg-slate-50/70 border border-slate-200 rounded-xl` with neat tags for Khata, Khesra, and Agreement.
    3. `BookingSummarySidebar.jsx`:
       - Removed `Sparkles` icon from Contract Financial Summary header.
       - Replaced the rainbow gradient installment card with a clean, readable slate card (`bg-slate-50 border-t border-slate-200`).
  - **Verification**:
    - Validated with `oxlint`: 0 warnings, 0 errors.
    - Preserved instant Vite HMR without executing a full build.


- **Cascading Land Acquisition Sourcing (Khata No. -> Plot / Khesra No. -> Agreement No.) [COMPLETED]**:
  - **Requirement**:
    - In Plot Booking Step 3 (`StepTermsAndPayment.jsx`) and Investment Booking (`ProductBookingPage.jsx`), replace the flat 2-dropdown layout with a 3-step cascading searchable workflow:
      1. First selectable & searchable dropdown for **Khata No.**
      2. Second selectable & searchable dropdown for **Plot / Khesra No.** (filtered strictly by selected Khata No.).
      3. Third selectable & searchable dropdown for **Agreement No.** (filtered by chosen Khata and Plot/Khesra No., showing available agreement numbers and available Sq.Ft. & Dismil stock).
      4. Auto-fill remaining area or custom allocated area (Sq.Ft.) and instant area balance validation.
  - **Implementation**:
    - **Created Reusable Component**: `client/src/pages/plots/booking/components/LandAcquisitionSourcingSection.jsx`
      - Flattens available land sources (`landSources`) and their parcels into uniform units indexed by Khata, Khesra, and Agreement.
      - Utilizes `SearchableSelect` (`client/src/components/ui/SearchableSelect.jsx`) for portal-rendered search and selection.
      - Automatically clears downstream selections (Khesra / Agreement) if an upstream selection (Khata) is changed.
      - Automatically auto-selects if only one Khesra exists under a Khata, or only one Agreement exists under a Khesra.
      - Retains auto-fill remaining area button, delete row button, info badges (Mauja, Thana, Available Sq.Ft. & Dismil), and perfect match / over / under-allocation status bar.
    - **Integrated into Step 3 Plot Booking**:
      - `client/src/pages/plots/booking/components/StepTermsAndPayment.jsx`: Replaced old agreement/parcel dropdowns with `<LandAcquisitionSourcingSection />`.
    - **Integrated into Investment Booking**:
      - `client/src/pages/plots/products/ProductBookingPage.jsx`: Replaced old agreement/parcel dropdowns with `<LandAcquisitionSourcingSection />` powered by `availableAgreementsForProject`.
  - **Verification**:
    - Executed `oxlint`: 0 warnings, 0 errors in `LandAcquisitionSourcingSection.jsx`.
    - Preserved instant Vite HMR without executing a full build.


- **Business Partner vs Business Associate Commission Structure Rates Fix [COMPLETED]**:
  - **Issue Identified**:
    - On `/dashboard/my-commission-rates` (`CommissionStructurePage.jsx`), when a Business Partner (such as `GoodFeel Sd Realtech Pvt Ltd`) logged in, they were being shown the Business Associate rates (e.g. Down Payment Fix Commission 3% - 8% and EMI 2% - 7%) instead of the configured Business Partner rates (Down Payment 1% - 2% and EMI 0.75% - 1.75%).
    - In addition, both Business Associate and Business Partner were seeing identical Associate incentive and reward slabs.
  - **Root Cause**:
    1. In `CommissionStructurePage.jsx`, the component called `useSelector((state) => state.auth)` to read `user`. However, in this application, `state.auth` only contains `{ islogin, head, loader, isadmin }`, while the actual user profile is stored in Redux `state.user.profile`.
    2. Because `user` was `undefined`:
       - `isAdminOrStaff` evaluated to `false`.
       - `isDirectPartner` evaluated to `false`.
       - `activeRoleMode` was hardcoded to fall back to `'associate'`, forcing all users (including Business Partners and Admins) to always render the Business Associate rates.
    3. Even if `user` had been defined, `isDirectPartner` only checked `userRole === 'BUSINESS_PARTNER'`. In Good Nature EMS, all partners and developers hold `role: 'sponsor'` and are distinguished by `isDeveloperSponsor === true`, `sponsorCode.startsWith('BP-')`, or `!sponsorId`.
    4. Table 1 (Commission Slab %) was reading `activeRoleMode` rather than `effectiveRole`, which meant that even if a partner toggled the view, Table 1 did not dynamically update.
  - **Comprehensive Fix**:
    1. In `client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx`:
       - Integrated `userProfile` from `state.user?.profile` and fallback JWT decode via `getJwtPayload(localStorage.getItem('emstoken'))`.
       - Added robust role detection for `isBranchPartnerUser`, `isDirectPartnerUser`, and `isAdminOrStaff`.
       - Set default initial role to `'partner'` for Business Partners, `'branch_partner'` for Branch Partners, and `'associate'` for Business Associates.
       - Defined `effectiveRole`:
         - When logged in as Business Partner: defaults to Business Partner rates (`bpFdCommissionPercent` and `bpRdCommissionPercent`, plus `BUSINESS_PARTNER` incentive and reward slabs).
         - Allows Business Partners to switch between `Business Partner (Self)` and `Business Associate (Downline Team)` to inspect their team's rates.
         - When logged in as Admin / Superadmin: provides a 3-way toggle between `Business Associate`, `Business Partner`, and `Branch Partner`.
       - Added dynamic role pill badges (`Business Associate`, `Business Partner`, `Branch Partner`) to all three table banners (Commission Slab %, Incentive Slab %, Reward Slab %) so the active tier is immediately visible.
  - **Verification**:
    - Lint check via `oxlint`: 0 warnings, 0 errors.
    - Preserved instant Vite HMR without executing a full build.

- **Ledger Submenu Pages Universal Pagination Implementation & Type Column Removal [COMPLETED]**:
  - **Requirement**:
    1. Check whether all submenu pages under the "Ledger" menu (`/dashboard/ledger/sellers`, `/dashboard/ledger/employees`, `/dashboard/ledger/business-associates`, `/dashboard/ledger/business-partners`, `/dashboard/ledger/branch-partners`, `/dashboard/ledger/banks`, `/dashboard/ledger/cash-accounts`, `/dashboard/ledger/transfers`) have pagination applied to their tables. If not, implement pagination carefully.
    2. Remove the redundant "Type" column from `/dashboard/ledger/employees` and `/dashboard/ledger/sellers`.
    3. Removed the redundant top count indicator (`Showing X of Y ledgers`) entirely across ledger pages, as accurate pagination range indicators (`1-7 of 7`, `1-10 of 49`) are already cleanly handled by `<TablePagination />` at the bottom.
    4. On `/dashboard/ledger/sellers` (Seller / Kisan ledger), display "PAN: <PAN_NUMBER>" instead of "ID: <empId>" below the seller name in both Table View and Card View, and support searching by seller PAN.
  - **Findings**:
    - `DataTable.jsx` is used by `BusinessDeveloperLedgerPage.jsx` and `ledgerdetailpage.jsx` which already had built-in pagination.
    - `ledgerpagelist.jsx` (which powers 5 submenus: Sellers, Employees, Business Associates, Business Partners, Branch Partners), `BankLedgersPage.jsx` (Bank Accounts), `CashLedgersPage.jsx` (Cash Accounts), and `FundTransfersPage.jsx` (Fund Transfers) were rendering all items in a single flat list without pagination controls.
    - On the dedicated `/dashboard/ledger/employees` and `/dashboard/ledger/sellers` pages, all listed entities share the exact same entity type, making the dedicated "Type" column redundant visual clutter.
    - In `ledgerpagelist.jsx`, the header filter indicator referenced `{ledgers.length}` (the raw count of all 49 ledgers returned from the backend) instead of scoping to the current category's total count.
  - **Implementation**:
    1. **Reusable Component `TablePagination.jsx`**:
       - Created `client/src/components/common/TablePagination.jsx` adhering to Good Nature EMS styling standards.
       - Features rows-per-page selector (10, 20, 50, 100), item range display ("1-10 of 45"), first/prev/next/last navigation buttons, and responsive layout for mobile and desktop screens.
    2. **`ledgerpagelist.jsx`** (5 Submenu Routes):
       - Added `currentPage` and `rowsPerPage` state, `paginatedLedgers` slice memoization.
       - Added auto-reset `setCurrentPage(1)` on filter/search/sort change.
       - Integrated `<TablePagination />` in both Card View and Table View.
       - Added conditional `showTypeColumn = category !== 'employee' && category !== 'seller' && category !== 'kisan'`, cleanly omitting the `<th>Type</th>` and `<td>` cells on Employee and Seller ledger tables.
       - Added `baseCategoryLedgers` memoization to filter base items by category, updating the count indicator to `Showing {filteredLedgers.length} of {baseCategoryLedgers.length} ledgers` (e.g. `Showing 7 of 7 ledgers` instead of `7 of 49`).
    3. **`BankLedgersPage.jsx`** (Bank Accounts):
       - Added `currentPage`, `rowsPerPage`, `paginatedLedgers`.
       - Integrated `<TablePagination />` in both Card View and Table View.
       - Cleaned up unused Lucide icons (`Building`, `CreditCard`, `CheckCircle2`, `ShieldCheck`).
    4. **`CashLedgersPage.jsx`** (Cash Accounts):
       - Added `currentPage`, `rowsPerPage`, `paginatedLedgers`.
       - Integrated `<TablePagination />` in both Card View and Table View.
       - Cleaned up unused imports (`Button`, `User`, `ShieldAlert`, `Plus`).
    5. **`FundTransfersPage.jsx`** (Fund Transfers):
       - Added `currentPage`, `rowsPerPage`, `paginatedTransfers`.
       - Reset `setCurrentPage(1)` on tab filter change (`statusTab`).
       - Integrated `<TablePagination />` below the transfers table.
       - Cleaned up unused imports (`UploadCloud`, `FileText`, `AlertTriangle`, `Receipt`).
  - **Verification**:
    - Linted via `client/node_modules/.bin/oxlint.cmd -D no-undef` across all touched files: 0 warnings, 0 errors.
    - Instant HMR with no full build step ("don npm build").


- **Table Skeleton Sizing & Header Overlap Fix [COMPLETED]**:
  - **Issue Identified**:
    - On `/dashboard/attandence` (and other tables using `TableRowSkeleton` with `DataTable`), the loading skeleton was rendered via an absolute overlay (`absolute inset-0 z-10`) that covered the dark teal table header row, creating an awkward visual overlay effect.
    - The skeleton rows were too small in height, and `TableRowSkeleton` rendered an unnecessary redundant internal table header.
  - **Comprehensive Fix**:
    - In `client/src/components/common/DataTable.jsx`:
      - Moved `progressPending` rendering inside the table `<tbody>` (`<tr><td colSpan={...}>...</td></tr>`).
      - This keeps the real dark teal `<thead>` permanently visible at the top, completely eliminating header overlap.
      - Increased container minimum height to `min-h-[240px]` to give proper loading presence.
    - In `client/src/components/skeletons/TableRowSkeleton.jsx`:
      - Removed the duplicate internal header skeleton.
      - Increased row height and padding to `py-4`, with realistic multi-line placeholders, badge pills, and circular action icons matching the Attendance table structure.
  - **Verification**:
    - `oxlint -D no-undef`: 0 warnings, 0 errors.
    - No full build run to keep Vite dev server HMR instant.

- **Resilient API Error Handling & Gateway Sanitization [COMPLETED]**:
  - **Issue Identified**:
    - When the backend server was offline, unreachable, or port misconfigured, Nginx/proxy/hosting returned HTML error pages (502/503/504/404).
    - `apiClient.js` unconditionally called `await response.json()` before checking response content-type or status, causing V8 to throw `SyntaxError: Unexpected token '<', "<html> <h"... is not valid JSON`, which was toasted directly to the user.
    - Raw network errors like `Failed to fetch` were also directly toasted.
  - **Comprehensive Fix**:
    - In `client/src/utils/apiClient.js`:
      - Wrapped network fetch in try/catch to intercept connection refused / port errors, returning clean *"Unable to connect to server. Please verify the server address or check your connection."*.
      - Added `getStatusErrorMessage()` to map standard status codes (502, 503, 504, 500, 404, 403) to friendly human messages.
      - Safely checked `contentType.includes("application/json")` before parsing JSON, preventing HTML parser syntax crashes.
      - Removed `body` from GET/HEAD requests to adhere to strict fetch standards.
    - In `client/src/utils/useApi.js`:
      - Intercepted and sanitized any low-level parser errors (`Unexpected token`, `is not valid JSON`, `Failed to fetch`) before setting error state or showing toasts.
      - Removed dead/unused `logger2` function.
    - In `client/src/pages/Login.jsx`:
      - Added fallback message sanitization in login submission error catch.
    - In `client/src/api/axios.js`:
      - Added network & 502/503/504 status message normalization in response error interceptor.
  - **Verification**:
    - Lint/AST verified via `oxlint`: 0 warnings, 0 errors across all 4 touched files.
    - No full build run to keep Vite dev server HMR instant.

- **Login Page Mobile Responsiveness & Illustration Display [COMPLETED]**:
  - **Requirement**:
    - Hide the girl illustration on mobile screens so it only appears on desktop view.
    - Ensure the login card and header are fully responsive, clean, and fit on mobile screens without unnecessary scrolling.
  - **Implementation**:
    - In `client/src/pages/Login.jsx`:
      - Changed illustration container to `hidden md:flex`, displaying the illustration exclusively on desktop screens (`>= 768px`).
      - Updated main card width to `w-full max-w-[420px] md:max-w-[820px]` and corner rounding to `rounded-2xl sm:rounded-3xl`.
      - Replaced `w-screen` with `w-full` on container to prevent horizontal scrollbars on mobile viewports.
      - Scaled logo & tagline responsively (`w-13 h-13 sm:w-16 sm:h-16` and `h-13 sm:h-16 max-w-[170px] sm:max-w-[220px]`).
      - Set input font sizes to `text-base sm:text-sm` to prevent mobile iOS Safari auto-zoom on field focus.
  - **Verification**:
    - Verified fast AST/lint check via `oxlint`: 0 errors.

- **Simplified EMI Tenure Slabs Header Banner [COMPLETED]**:
  - **Requirement**:
    - On the Plot Products & Fractional Unit Master page (`/dashboard/plots/products?tab=emi_slabs`), simplify the heavy dark-green gradient banner to a clean, minimal white card matching the rest of the application.
    - User requested no full build step ("don npm build").
  - **Implementation**:
    - In `client/src/pages/plots/products/components/ProductEmiTenureSlabsTab.jsx`:
      - Replaced the large dark-gradient box with a clean card: `bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs`.
      - Styled the icon badge with subtle teal accents (`bg-teal-50 text-teal-700 border border-teal-100`).
      - Styled the title as clean text (`text-base md:text-lg font-bold text-slate-900`) and subtitle in slate-500.
      - Styled the action buttons with clean borders and branded teal primary button.
  - **Verification**:
    - Hot module reload updated instantly via Vite dev server.

- **Commission Structure Table Header Width Balance [COMPLETED]**:
  - **Requirement**:
    - Under the "% REWARD SLAB %" table on `/dashboard/my-commission-rates`, reduce the width of "Yearly Performance Business Target" so that "Yearly Performance Reward %" displays cleanly across 2 lines instead of wrapping into 5-6 fragmented lines.
  - **Implementation**:
    - In `client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx`:
      - Replaced rigid `w-32` with proportional `w-[55%]` / `w-[45%]` split on the Reward Slab table and `w-[56%]` / `w-[44%]` on the Incentive Slab table.
      - Added structured line break `<br className="hidden sm:inline" />` between "Yearly Performance" and "Reward %" so the header renders cleanly on two lines.
  - **Verification**:
    - Build verified via `npm run build --prefix client` (Exit code 0, 6.00s).

- **Business Developer Bookings Table Clean-up [COMPLETED]**:
  - **Requirement**:
    1. Remove the "Hierarchy / Type" column and its "Direct Booking" badge from the "My Plot Bookings" table (`/dashboard/my-bookings`).
    2. In the "Plot No / Type" column, remove the prefix "Plot #" so it shows just the clean plot number (e.g. `A002`) and `1200 sqft`.
  - **Implementation**:
    - In `client/src/pages/plots/businessDevelopers/BusinessDeveloperBookingsPage.jsx`:
      - Removed the `Hierarchy / Type` column definition entirely.
      - Simplified the `Plot No / Type` cell renderer to display `{row.plotId?.plotNumber || '-'}` and `{row.plotId?.plotSize || row.plotId?.area || 0} sqft`.
  - **Verification**:
    - AST check (`oxlint`): 0 errors.
    - Verified with `npm run build --prefix client` (Exit code 0, 9.84s).

- **Interactive Logout Confirm Modal with Spinner & Progress State [COMPLETED]**:
  - **Issue Identified**:
    - When a user clicked "Logout" in the sidebar and then clicked "Logout" in the confirmation dialog, there was no visual feedback or indicator that the button was clicked or that any background process/transition was executing.
  - **Comprehensive Fix**:
    - Enhanced `client/src/utils/confirmDialog.jsx`:
      - Added `isSubmitting` state management with spinning `Loader2` icon on the confirm button.
      - Supported `loadingText` option (e.g. `"Logging out..."`).
      - Supported async `onConfirm` callback that holds the loading state active until execution finishes.
      - Disabled interaction on both buttons and close button while submitting to prevent double-clicks.
    - Updated `client/src/components/sidebar.jsx`:
      - Passed `loadingText: "Logging out..."` and async `onConfirm` callback to cleanly wipe Redux and auth tokens via `clearAuthSession(dispatch, false)` before navigating to `/login`.
    - Updated `client/src/pages/logout.jsx`:
      - Replaced raw `return null;` with full-screen branded `<PageLoader title="Logging out..." subtitle="Securely terminating your session" />` so direct hits to `/logout` display seamless visual feedback.
  - **Verification**:
    - Verified with `npm run build --prefix client` (Exit code 0, 5.01s).

- **Full Codebase Static AST Linter Audit & Runtime ReferenceError Resolution [COMPLETED]**:
  - **Issue Identified**:
    - Vite/Rollup bundling compiles JavaScript without deep runtime identifier checking (unlike TypeScript). In standard JS bundling, undeclared variables are treated as assumed globals, causing builds to pass with exit code 0, only to throw fatal `ReferenceError: <variable> is not defined` when the browser mounts the component.
    - Specifically, in `client/src/components/sidebar.jsx`, extraction of the menu configuration had inadvertently severed imports for `useNavigate`, `useLocation`, `useSelector`, `NavLink`, `confirmDialog`, `apiClient`, and helper methods `getGroupPendingCount` and `getChildPendingCount`.
  - **Comprehensive Fix**:
    - Configured `client/.oxlintrc.json` with comprehensive browser environment globals and `no-undef` strict validation.
    - Executed AST-level scan across all 246 client source files and systematically resolved all 8 real runtime identifier defects:
      1. `client/src/components/sidebar.jsx`: Restored `useNavigate`, `useLocation`, `NavLink` from `react-router-dom`, `useSelector` from `react-redux`, `confirmDialog` from `utils/confirmDialog`, `apiClient` from `utils/apiClient`, and approval badge handlers (`fetchPendingApprovals`, `getGroupPendingCount`, `getChildPendingCount`).
      2. `client/src/pages/employee/EmployeeDashboard.jsx`: Added lightweight zero-overhead `motion.div` passthrough for framer-motion calls, eliminating 20 fatal runtime errors on employee login.
      3. `client/src/pages/plots/booking/PlotBookingEditPage.jsx`: Defined `landSourcesData` from `landSourcesRes.data`.
      4. `client/src/components/common/DataTable.jsx`: Extracted `sortFunction` safely from `sortColumn.sortFunction`.
      5. `client/src/pages/plots/businessDevelopers/PlotBusinessDevelopers.jsx`: Added missing `confirmDialog` import for block/delete actions.
      6. `client/src/pages/admin/attandence/AttenPerformance.jsx`: Added missing `swal` import from `utils/confirmDialog`.
      7. `client/src/pages/plots/products/components/ProductInstallmentCollectModal.jsx`: Removed duplicate `isCash` declaration in the same scope.
      8. `client/src/pages/plots/incentives/PlotIncentivesPage.jsx`: Imported missing `ChevronDown` from `lucide-react`.
  - **Verification**:
    - Oxlint scan across all 246 files: 0 errors.
    - `npm run build --prefix client`: 0 errors (completed in 10.29s).

- **Role-Scoped Code Splitting, Lazy Loading & Controller Modularization [COMPLETED]**:
  - **Requirement**:
    1. Implement proper role-scoped lazy loading so when a Business Associate or Partner logs in, only chunks strictly relevant to them are downloaded. Eliminate exposure of administrative URL definitions, manifests, and component chunks to non-admin roles.
    2. Decompose oversized single files (frontend and backend) into clean, maintainable modules without breaking existing functionality.
    3. Update all documentation files (`RULES.md`, `FRONTEND_THEME_SYSTEM.md`, `STRUCTURE.md`, `COMPONENT_CATALOG.md`, `ARCHITECTURE.md`, `TODO.md`, `SESSION_MEMORY.md`).
  - **Implementation**:
    1. **Frontend Role-Scoped Routers (`client/src/routes/`)**:
       - Created `SponsorRoutes.jsx` (dedicated to `sponsor` role, gzipped size: 1.5 kB).
       - Created `EmployeeRoutes.jsx` (dedicated to `employee` role, gzipped size: 1.0 kB).
       - Created `DeveloperRoutes.jsx` (dedicated to `developer` role, gzipped size: 0.8 kB).
       - Created `ManagementRoutes.jsx` (for `superadmin`, `admin`, `manager`, `accountant`, `cashier`, gzipped size: 5.4 kB).
       - In `client/src/App.jsx`, dynamically imported sub-routers matching `effectiveRole`. Reduced main bundle size from 169.6 kB to 151.8 kB.
    2. **Sidebar Modular Decomposition**:
       - Extracted 220+ lines of static navigation menus and role mapping from `client/src/components/sidebar.jsx` into `client/src/components/sidebar/sidebarMenuConfig.jsx`.
    3. **Backend Controller Decomposition**:
       - Extracted eSSL biometric device monitoring & log bulk operations (`getEsslLogsDeveloper`, `getEsslEventsDeveloper`, `bulkDeleteEsslLogs`, `bulkDeleteEsslEvents`) from `server/controllers/admin.js` into `server/controllers/esslLogs.controller.js`.
       - Re-exported functions from `server/controllers/admin.js` to guarantee 100% backward compatibility for all existing route references.
  - **Build Status**: Verified via `npm run build --prefix client` and `node -c` on backend controllers (Exit code 0).


- **Plot Availability Scoped to Business Associate & Partner Portals Only [COMPLETED]**:
  - **Requirement**: Removed "Plot Availability" from Admin / Superadmin / Management "Plot Management" sidebar menu (`client/src/components/sidebar.jsx`), keeping it exclusively in the Business Associate & Partner (`roles: ["sponsor"]`) sidebar at `/dashboard/plot-availability`.
  - **Build Status**: Verified via `npm run build --prefix client` (Exit code 0).

- **Branded Good Feel Loader & Clean Full-Screen Restructure [COMPLETED]**:
  - **Requirement**:
    1. Redesign system loaders (`PageLoader.jsx`, `ContentLoader.jsx`, `utils/loader.jsx`) to feature the Good Feel brand logo with a smooth breathing zoom-in / zoom-out animation and ambient gradient backlight glow.
    2. Remove the old rotating dashed gears and outer box pod as requested by the user, leaving a floating emblem with sleek uppercase `LOADING` and animated wave dots / micro-progress bar.
    3. Ensure `App.jsx` cleanly uses `<PageLoader fullScreen={true} />` as the top-level Suspense and session-check fallback while routing directly to dashboard and views without premature or double loaders.
  - **Build Status**: Verified via `npm run build --prefix client` (Exit code 0).

- **Plot & Project Hide/Unhide Feature and Business Associate/Partner Availability Portal [COMPLETED]**:
  - **Requirement**:
    1. On `Plot Series Master` (`/dashboard/plots/series-master`), give admin the capability to hide any plot or an entire project.
    2. Hidden plots (or plots under hidden projects) must NOT show in New Plot Booking (`/dashboard/plots/booking`).
    3. Create a new dedicated page and menu for Business Associates & Partners (`role: 'sponsor'`) and admin (`/dashboard/plot-availability` & `/dashboard/plots/availability`) where they can view unhidden plots (like A001, A002, etc.) with color indication (Available = Emerald, Booked = Rose, Hold = Amber, Registered = Purple), filtered project-wise, while hidden plots are strictly excluded.
  - **Implementation**:
    1. **Database Models**:
       - `server/models/PlotProject.js`: Added `isHidden: { type: Boolean, default: false, index: true }`.
       - `server/models/Plot.js`: Added `isHidden: { type: Boolean, default: false, index: true }`.
    2. **Backend Services & Routes**:
       - `server/services/kisanLand.service.js`: Supported `unhiddenOnly` and `isHidden` filters in `getProjects`, and handled `isHidden` in `createProject` and `updateProject`.
       - `server/services/plots/plotInventory.service.js`: In `getPlots`, when `unhiddenOnly === 'true'` (or for sponsors), filters out `isHidden: true` plots AND all plots belonging to hidden projects (`PlotProject.find({ isHidden: true })`). Handled `isHidden` in `createPlot` and `updatePlot`.
       - `server/services/plots/plotBooking.service.js`: Added hard validation in `createBookingOrHold` rejecting any attempt to book a plot that is hidden or belongs to a hidden project.
       - `server/router/plots.routes.js`: Automatically forced `unhiddenOnly = 'true'` when `role === 'sponsor'` fetches projects or plots, and granted sponsors read access to `/plots/projects`, `/plots/series`, and `/plots`.
    3. **Admin Series & Inventory Master**:
       - `client/src/pages/plots/seriesMaster/components/PlotProjectsSection.jsx`: Added Visibility column with interactive Eye/EyeOff toggle buttons and status badges for projects. Added `form.isHidden` checkbox in the Add/Edit Project form.
       - `client/src/pages/plots/seriesMaster/components/ConfigurePlotModal.jsx`: Added "Plot Visibility" card with an interactive switch toggle to hide/unhide plots.
       - `client/src/pages/plots/seriesMaster/components/SeriesLayoutGrid.jsx`: Added quick one-click Eye/EyeOff toggle button on each plot card, rendered amber `HIDDEN` badges on hidden plot cards, and added legend item.
       - `client/src/pages/plots/seriesMaster/PlotSeriesMaster.jsx`: Added `handleQuickTogglePlotHide` and passed it down to `SeriesLayoutGrid`.
    4. **Booking Exclusion**:
       - `PlotBooking.jsx` and `PlotBookingEditPage.jsx`: Fetched plots and projects with `unhiddenOnly=true`.
       - `StepPlot.jsx`: Filtered out any plots or projects marked `isHidden`.
    5. **New Plot Availability Page for BA / BP & Admin**:
       - `client/src/pages/plots/availability/PlotAvailabilityPage.jsx`: Created full-featured page with project selector, series block filter, status filter cards (Available, Booked, Hold, Registered), plot number search, visual layout grid with color codes, and read-only plot specifications modal (dimensions, boundaries, size, valuation).
       - `client/src/components/sidebar.jsx`: Added "Plot Availability" to sponsor menu (`/dashboard/plot-availability`) and Plot Management menu (`/dashboard/plots/availability`).
       - `client/src/App.jsx`: Registered routes with lazy loading.
       - `client/src/components/Navbar.jsx`: Added breadcrumb titles.
  - **Build Status**: Verified via `node -c` on all modified backend files and `npm run build --prefix client` (built cleanly in 3.20s).

- **Fixed Plot Booking Default SqFt Rate Sync in Inventory & Configure Plot Modal [COMPLETED]**:
  - **Issue**: Admin set the Default Rate under "Plot Booking Base Rate" to `1499` in `Series & Inventory` (`/dashboard/plots/series-master`), but clicking unbooked plots (e.g. `Plot A003`) in the inventory grid opened "Configure Plot" showing `BASE RATE: ₹1000/sqft` and `EFFECTIVE RATE: ₹1000/sqft` instead of `1499`.
  - **Root Cause**:
    1. In `ConfigurePlotModal.jsx`, `baseRate` was computed as `Number(selectedPlot?.baseRate) || Number(rateConfig.baseSqFtRate) || 1000`. Because plots created earlier had `baseRate: 1000` stored directly in MongoDB, it prioritized the plot's stale document rate over the admin's master configured `rateConfig.baseSqFtRate` (1499).
    2. In `plotConfig.service.js`, `updateRateConfig` saved `baseSqFtRate` into `PlotRateConfiguration`, but did not update existing unbooked plots (`status: { $in: ['AVAILABLE', 'HOLD'] }`) in MongoDB.
    3. In `plotInventory.service.js`, `getPlots` and `updatePlot` did not synchronize unbooked plots with the active `baseSqFtRate`.
  - **Implementation**:
    1. `client/src/pages/plots/seriesMaster/components/ConfigurePlotModal.jsx`: For unbooked plots (`!isLocked`), prioritize `rateConfig.baseSqFtRate` over `selectedPlot.baseRate`. (Locked booked plots still preserve their contract rate).
    2. `client/src/pages/plots/seriesMaster/PlotSeriesMaster.jsx`: In `handleConfigSubmit`, explicitly pass `baseRate: activeBaseRate` (`1499`) in the PUT payload.
    3. `server/services/plots/plotConfig.service.js`: In `updateRateConfig`, automatically update all unbooked plots (`AVAILABLE` and `HOLD`) with the new `baseSqFtRate`, recalculating their `effectiveRate` and `totalPlotValue`.
    4. `server/services/plots/plotInventory.service.js`: In `getPlots`, dynamically align unbooked plots with the active `baseSqFtRate` and update any stale plots in the background. In `updatePlot`, default unbooked plots to `rateConfig.baseSqFtRate`.
  - **Build Status**: Verified via `node -c` on backend and `npm run build --prefix client` (built cleanly in 3.78s).

- **Custom Ledger Creation Permission & Non-Superadmin Access [COMPLETED]**:
  - **Issue**: Non-superadmin user roles could not create or add custom ledgers, and administrators could not identify which permission governed it.
  - **Findings**:
    1. The permission governing custom financial ledgers in the EMS 4-number CRUD standard (`1: Read, 2: Create, 3: Update, 4: Delete`) is **`ledger`**:
       - `ledger: 1` -> View Ledgers
       - `ledger: 2` -> Create Custom Ledgers
       - `ledger: 3` -> Edit Custom Ledgers
       - `ledger: 4` -> Delete Custom Ledgers
    2. In `client/src/pages/admin/organization/components/admin/userPermissionsConfig.js`, the module was labeled `"Master All Ledgers Overview (Accounting)"`, making it non-obvious that action `2` creates custom ledgers.
    3. In `client/src/pages/admin/ledger/ledgerpagelist.jsx`:
       - `canCreateLedger` was missing entirely.
       - Line 903 modal box check was `open={editOpen && canEditLedger}` where `canEditLedger` was hardcoded to `isSuperAdmin || hasPermission(profile, 'commission_ledger_action', 3)`. As a result, non-superadmins with `ledger: 2` had `editOpen = true` but the modal remained closed.
    4. In `server/controllers/ledger.js`:
       - `updateLedger` and `deleteLedger` checked only `commission_ledger_action` (3 & 4), ignoring users possessing general `ledger` (3 & 4) permissions.
  - **Implementation**:
    1. `client/src/pages/admin/ledger/ledgerpagelist.jsx`:
       - Defined `canCreateLedger = isSuperAdmin || hasPermission(profile, 'ledger', 2);`
       - Updated `canEditLedger = isSuperAdmin || hasPermission(profile, 'ledger', 3) || hasPermission(profile, 'commission_ledger_action', 3);`
       - Updated `canDeleteLedger = isSuperAdmin || hasPermission(profile, 'ledger', 4) || hasPermission(profile, 'commission_ledger_action', 4);`
       - Updated "Add Ledger" button guard: `{category === "all" && canCreateLedger && (`
       - In `handleOpenLedgerDialog`, checked `canCreateLedger` for new ledgers and `canEditLedger` for existing ledgers with helpful toasts.
       - Updated Modalbox open prop: `open={editOpen && (editLedgerId ? canEditLedger : canCreateLedger)}`.
    2. `server/controllers/ledger.js`:
       - Allowed users with `ledger: 3` or `commission_ledger_action: 3` in `updateLedger`.
       - Allowed users with `ledger: 4` or `commission_ledger_action: 4` in `deleteLedger`.
    3. `client/src/pages/admin/organization/components/admin/userPermissionsConfig.js`:
       - Clarified the display label to: `"Master All Ledgers & Custom Ledgers (Create / Edit Accounts)"`.
  - **Build Status**: Verified via `node -c server/controllers/ledger.js` and `npm run build --prefix client` (built cleanly in 4.01s).

- **Fixed Collection Receipt Time & UTC Midnight 05:30 AM Artifact [COMPLETED]**:
  - **Issue**: Payment receipts (`ReceiptViewer.jsx`) showed time as `05:30 AM` (e.g. `03 Nov 2026, 05:30 AM`) even when created in the evening/night. This occurred because collection forms submitted date-only strings (`YYYY-MM-DD`), which JavaScript parsed as UTC midnight (`00:00:00.000Z`). In Indian Standard Time (UTC+5:30), `00:00:00.000Z` renders as `05:30 AM`.
  - **Implementation**:
    1. `client/src/pages/plots/printViewers/ReceiptViewer.jsx`: Updated `formatReceiptDateTime(dateVal, fallbackVal)` to detect UTC midnight date strings. If detected, it falls back to the real document creation timestamp (`receipt.updatedAt`), preventing the `05:30 AM` artifact on existing receipts. Also updated the Customer Bank Details row to display for all non-cash modes (`!isCash`).
    2. `client/src/pages/plots/installments/InstallmentCollection.jsx`, `ProductReceivePaymentForm.jsx`, and `ProductInstallmentCollectModal.jsx`: Added `resolveSubmissionDateTime` to attach the exact current local time (hours, minutes, seconds) when submitting collections for today, or preserving the time-of-day for custom dates.
    3. `server/services/plots/plotCollection.service.js` & `server/services/plots/plotProduct.service.js`: Added check in `collectInstallment` and `collectProductInstallment` so that if an incoming `customDate` has UTC midnight (00:00:00), it automatically attaches the current local time of day instead of setting midnight UTC.
  - **Build Status**: Verified via `npm run build --prefix client` and `node -c` on backend — compiled cleanly with 0 errors.

- **Customer Bank Details for All Non-Cash Collections & Auto-Prefill with Editable Inputs [COMPLETED]**:
  - **Requirement**: In Downpayment collection (`/dashboard/plots/collections/downpayment/add`), EMI collection (`/dashboard/plots/collections/emi/add`), and Investment collection (`/dashboard/plots/collections/products/add` & modal), when selecting any online/bank payment mode (UPI / Online, Bank Transfer / NEFT / RTGS, Cheque), ask for customer bank details (Bank Name, Branch Name, IFSC Code, Account Number, Account Holder Name). Auto-prefill them if the customer's profile already has bank details, while keeping them completely editable.
  - **Implementation**:
    1. `client/src/pages/plots/installments/components/ReceivePaymentForm.jsx`: Changed visibility condition from `form.paymentMode === 'cheque'` to `form.paymentMode !== 'cash'`. Renamed title to "Customer Bank Details". Added prefill logic on payment mode change from `selectedBooking.customerId`.
    2. `client/src/pages/plots/installments/InstallmentCollection.jsx`: In `handleBookingSelect` and booking details fetch, auto-prefill `bankName`, `bankBranch`, `accountNumber`, `accountHolderName`, `ifscCode` from `customerId`. Updated `handleSubmit` payload to send `bankDetails` for all non-cash modes (`paymentMode !== 'cash'`).
    3. `client/src/pages/plots/installments/components/CollectionModals.jsx`: In `EditReceiptModal`, updated visibility to `editForm.paymentMode !== 'cash'` and added Branch Name field.
    4. `client/src/pages/plots/products/ProductReceivePaymentForm.jsx`: Added customer bank details state, auto-prefill on booking selection and mode switch, rendered "Customer Bank Details" card for non-cash modes, and included `bankDetails` in the collection payload.
    5. `client/src/pages/plots/products/components/ProductInstallmentCollectModal.jsx`: Added bank details state and inputs for non-cash collections, auto-prefilled from `booking.customerId`, and passed in collection submission.
    6. `server/models/PlotProductBooking.js`: Added `bankName`, `bankBranch`, `accountNumber`, `accountHolderName`, `ifscCode` to `collectionTransactionSchema`.
    7. `server/models/InvestmentReceipt.js`: Added `bankBranch`, `accountNumber`, `accountHolderName`, `ifscCode` fields.
    8. `server/services/plots/plotCollection.service.js`: Persist `bankDetails` to `PlotReceipt` for all non-cash modes (`!isCash`). Auto-updates customer bank details in `PlotCustomer` profile.
    9. `server/services/plots/plotProduct.service.js`: In `collectProductInstallment`, accept `bankDetails`, update `PlotCustomer` profile, and persist bank fields in `PlotProductBooking.collections`. Populated customer bank fields in `getProductBookings`.
  - **Build Status**: Verified via `npm run build --prefix client` and `node -c` on backend — compiled cleanly with 0 errors.

- **Removed Scheme Commission Policy Matrix in Investment Booking [COMPLETED]**:
  - **Requirement**: In Investment Booking (`/dashboard/plots/investment-booking/new`), under section `3. Payment Plan Scheme & Period`, remove the bottom scheme details box containing `% Scheme Commission Policy: Associate (BA): ... • Partner (BP): ... • Branch Partner: ...`.
  - **Implementation**:
    - File: `client/src/pages/plots/products/ProductBookingPage.jsx`.
    - Removed the `{/* Active Scheme Commission Policy Matrix */}` card element directly beneath the `EMI Scheme Plan & Tenure` select box.
    - Cleaned up unused `Percent` icon import.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled in 3.56s with 0 errors.

- **Removed Tenure & Commission Badges from Scheme Plan Selection in Booking [COMPLETED]**:
  - **Requirement**: While creating or editing a plot booking, remove the badge pills (`TENURE`, `BA`, `BP`, `BRANCH`) rendered directly underneath the **SCHEME PLAN** dropdown selector.
  - **Implementation**:
    - Removed the badge pill group from `client/src/pages/plots/booking/components/StepTermsAndPayment.jsx` (New Booking step 3).
    - Also removed the corresponding badge pills from `client/src/pages/plots/booking/PlotBookingEditPage.jsx` (Edit Booking page).
  - **Build Status**: Verified via `npm run build --prefix client` — compiled in 2.92s with 0 errors.

- **Receipt Layout, Amount in Words & Plot Number Formatting [COMPLETED]**:
  - **Requirement**: In `ReceiptViewer.jsx` (Payment Receipt print/view page for Down Payment and EMI collections):
    1. Show amount in words directly inside the same cell as Amount Paid, placed just below the amount in smaller text `({numberToWords(...)})`, and remove the redundant separate bottom row for "Amount in Words".
    2. Format "Down Payment" with proper spacing (`DOWN PAYMENT` / `Down Payment`), eliminating `"DOWNPAYMENT"`.
    3. Format Plot Number cleanly as `A005 | 1200 sqft` (removing `#` prefix and writing area as `| <size> sqft`).
    4. For online transactions (or pending clearance), display a bill status line in small font below in the bill: `* Bill Status: Approval Pending` (or `Approved`).
  - **Implementation**:
    - File: `client/src/pages/plots/printViewers/ReceiptViewer.jsx`.
    - Integrated clean plot number and area formatting: `((plotNumber).replace(/^#/, '') + ' | ' + size + ' sqft')`.
    - Amount Paid cell now contains amount + words in parentheses.
    - Added online transaction detection (`isOnlinePayment`) and dynamic `* Bill Status: Approval Pending` / `Approved` in the footer notice section.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled in 3.48s with 0 errors.

- **Integrated `GuardianInput` & Cleaned Address Title in Kisan Sellers Table [COMPLETED]**:"

  - **Requirement**: In "Add / Edit Land Seller Details" ([KisanSellersTable.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/components/KisanSellersTable.jsx)), replace the standalone text input with the new common `GuardianInput` featuring the left-side selectable relation prefix (`S/o`, `D/o`, `W/o`, `H/o`, `C/o`). In the address field, simplify the label to just `"Address"` (replacing `"Village / Full Address"`).
  - **Implementation**:
    1. `client/src/components/ui/GuardianInput.jsx`: Added smart relation normalization mapping (e.g. `'Father'`, `'Son of'` &rarr; `'S/o'`, `'Wife of'` &rarr; `'W/o'`, etc.) and dynamic option inclusion so existing database records render their prefix smoothly.
    2. `client/src/pages/plots/purchase/components/KisanSellersTable.jsx`: Replaced the Guardian text input with `GuardianInput` bound to `form.relation` (default `'S/o'`) and `form.guardianName`. Updated address input label to `"Address"`.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled in 2.98s with 0 errors.

- **Reusable `GuardianInput` UI Component & Business Partner Integration [COMPLETED]**:
  - **Requirement**: Create a reusable, standardized form input component for collecting guardian/relative names with a selectable prefix (`S/o`, `D/o`, `W/o`, `H/o`, `C/o`) on the left side, designed for project-wide reusability. Integrate it into the "Create/Edit Business Partner & Associate" modal.
  - **Implementation**:
    1. `client/src/components/ui/GuardianInput.jsx`:
       - Created unified component adhering to the deep teal / emerald styling standards with focus-within ring transitions.
       - Built-in relation options: `S/o`, `D/o`, `W/o`, `H/o`, `C/o` (supports custom options and multiple sizes `sm`, `md`, `lg`).
       - Supports both dual props (`relation`, `onRelationChange`, `value`, `onChange`) and single object prop (`value={{ relation, name }}`).
    2. `client/src/components/ui/index.js`: Re-exported `GuardianInput` for universal import from `@/components/ui`.
    3. `client/src/pages/plots/businessDevelopers/PlotBusinessDevelopers.jsx`:
       - Paired `Full Name` and `GuardianInput` side-by-side in a 2-column responsive grid.
       - Integrated state bindings for `relationType` (default `'S/o'`) and `fatherOrHusbandName`.
       - Rendered guardian details in the Business Developer profile view modal.
    4. `server/services/plots/plotDeveloper.service.js`:
       - Added `relationType` and `fatherOrHusbandName` to `createSponsor` and `updateSponsor` to persist guardian information in the `User` document.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled in 3.83s with 0 errors.

- **URL Query Sync for Plot Purchase Main Tabs [COMPLETED]**:
  - **Requirement**: Synchronize the main navigation tabs on Plot Purchase & Land Master (`/dashboard/plots/purchase`) with the URL query parameter `?tab=agreements|deeds|sellers`. When any tab is active and the user refreshes the page, the user remains on the exact same active tab.
  - **Implementation**:
    1. In `client/src/pages/plots/purchase/PlotPurchasePage.jsx`:
       - Integrated `useSearchParams` from `react-router-dom`.
       - Added `TAB_ALIASES` mapping supporting `'agreements'`, `'deeds'`, and `'sellers'` (including aliases like `land_sellers`, `registry_deeds`, etc.).
       - Initialized `mainTab` from URL parameter `searchParams.get('tab')`.
       - Implemented `handleMainTabChange` which updates state and synchronizes URL query with `{ replace: true }` without page reload.
       - Handled browser back/forward history via `useEffect([tabParam])`.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled in 4.46s with 0 errors.

- **Standardized Common Modalbox & UI Components in Plot Purchase [COMPLETED]**:
  - **Requirement**: Use the centralized common `Modalbox` component from `components/ui` (standard header with icon, title, subtitle, close button, and docked footer) instead of custom ad-hoc modal headers, raw inputs, and custom close buttons.
  - **Touched Files**:
    1. `client/src/components/ui/index.js`: Re-exported `Modalbox` alongside `Modal` for direct imports from `@/components/ui` or `../../../../components/ui`.
    2. `client/src/pages/plots/purchase/components/KisanSellersTable.jsx`: Standardized "Edit Land Seller Details" / "Add New Land Seller" modal to use `<Modalbox>` props (`title`, `subtitle`, `icon`, `maxWidth="max-w-2xl"`, `footer` with `<Button variant="outline">` and `<Button variant="primary">`) and standardized `Input`, `PhoneInput`, `AadhaarInput`, `PanInput`.
    3. `client/src/pages/plots/purchase/components/PurchasersTable.jsx`: Standardized "Edit Purchaser / Buyer" / "Add New Purchaser / Buyer" modal with the same unified `Modalbox`, `Input`, and `Button` pattern.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled cleanly with 0 errors.

- **Special Dedicated Authority for Plot & Investment Collections & Transactions [COMPLETED]**:
  - **Requirement**: Separate transaction visibility control from the 4-number RBAC matrix (`[Read, Create, Update, Delete]`) and general accounting ledgers (`cash_ledger` and `bank_ledger`). Provide a special section card in User Management above the RBAC table (matching the style of "Cash Drawers & Inter-Account Transfer Authority") to configure:
    1. **All Transactions (Cash & Bank/Online)** (`both`)
    2. **Cash Transactions Only** (`cash_only`)
    3. **Bank & Online Transactions Only** (`bank_only`)
    4. **Restricted (Neither)** (`none`)
  - **Scope Limitation**:
    Strictly applies ONLY to:
    1. Plot Booking Ledger: `/dashboard/plots/booking/:id/ledger`
    2. Investment Booking Ledger: Customer ledger in Product Bookings
    3. Down Payment Collections: `/dashboard/plots/collections/downpayment`
    4. EMI Collections: `/dashboard/plots/collections/emi`
    5. Investment Collections: `/dashboard/plots/collections/products`
    *(General ledgers, vouchers, personal accounts, and cash drawers are completely unaffected).*
  - **Schema & Persistence**:
    - Added `plotTransactionScope: { type: String, enum: ['both', 'cash_only', 'bank_only', 'none'], default: 'both' }` to `server/models/user.js`.
    - Updated `server/controllers/admin.js` (`addAdmin`, `editAdmin`, and `firstfetch` select) to read and persist `plotTransactionScope`.
  - **UI Authority Card in User Edit**:
    - In `client/src/pages/admin/organization/pages/AdminUserFormPage.jsx`: Rendered dedicated Special Section Card above the Granular Module Permissions table with 4 card choices (Globe, Wallet, CreditCard, Ban) and live state badges.
  - **Frontend & Backend Scoping**:
    - `server/utils/transactionPermission.js` & `client/src/utils/transactionPermission.js`: Resolve `{ canViewCash, canViewBank }` strictly from `plotTransactionScope`.
    - `PlotBookingLedgerPage.jsx`: Statement entries and receipts filtered by scope; running balance recalculated dynamically; live status banner shown.
    - `InstallmentCollection.jsx`: Down Payment and EMI receipts filtered by scope; status banner rendered.
    - `ProductCollectionsPage.jsx`: Investment collections filtered by scope; status banner rendered.
    - `server/controllers/plots.controller.js` (`getBookingLedger`, `getProductCustomerLedger`) & `server/services/plots/plotCollection.service.js` (`getReceipts`): Scoped to `plotTransactionScope`.
  - **Reversion of Unrelated Files**:
    - Completely reverted `server/controllers/ledger.js`, `server/controllers/voucher.js`, `client/src/pages/admin/ledger/ledgerdetailpage.jsx`, `client/src/pages/vouchers/VoucherList.jsx`, and `client/src/pages/plots/purchase/PlotKisanLedgerPage.jsx`.
    - Restored `cash_ledger` and `bank_ledger` labels in `userPermissionsConfig.js`.
  - **Build Status**: Verified via `npm run build --prefix client` — compiled cleanly with 0 errors.

- **Fixed Granular Ledger Entry (Add/Edit/Delete) Permission Resolution [COMPLETED]**:
  - **Issue**: When an admin gives a user (such as Cashier Nawraj) access to a specific ledger module like Cash Accounts (`cash_ledger`) with Create/Update permissions, the user was unable to see "Add Entry", "Edit Entry", or delete manual transaction entries on that ledger's statement page.
  - **Cause**:
    1. In `ledgerdetailpage.jsx`, entry permissions were hard-coded to check ONLY the generic `ledger_entry` permission key (`hasPermission(userProfile, 'ledger_entry', 2/3/4)`), ignoring specific ledger module permissions (`cash_ledger`, `bank_ledger`, `associate_ledger`, etc.) granted to the user.
    2. In backend `server/middleware/checkpermission.js`, `checkPermission('ledger_entry', key)` did not resolve target ledger IDs to check if the user had Create/Update/Delete permissions on the corresponding specific ledger submodule (e.g. `cash_ledger`).
  - **Fix**:
    1. In `client/src/pages/admin/ledger/ledgerdetailpage.jsx`, introduced `getLedgerPermissionResource` and `checkLedgerActionPermission`. It evaluates permissions across:
       - Direct `ledger_entry` permission
       - Master `ledger` overview permission
       - Specific ledger submodule (`cash_ledger` for cash accounts, `bank_ledger` for banks, `employee_ledger`, `kisan_ledger`, `associate_ledger`, `partner_ledger`, `branch_ledger`).
    2. In `client/src/utils/CheckPermission.jsx`, added `ledger_entry` to `LEDGER_SUBMODULES` so master `ledger` access cascades seamlessly.
    3. In `server/middleware/checkpermission.js`, implemented dynamic ledger resolution (`resolveLedgerModule`) for `ledger_entry` routes (`POST /ledgerentry`, `PUT /ledgerentry/:id`, `DELETE /ledgerentry/:id`, `GET /entries/:id`). It checks whether the user holds permission for the targeted ledger type, properly granting or restricting operational access.
  - **Build Status**: Verified via `npm run build --prefix client` — 0 errors.

- **Fixed Double Active Highlighting between Plot Purchase and Purchasers / Buyers [COMPLETED]**:
  - **Issue**: When navigating to `/dashboard/plots/purchasers` (Purchasers / Buyers Master), both "Purchasers / Buyers" and "Plot Purchase" were simultaneously highlighted in the left sidebar.
  - **Cause**: In `client/src/components/sidebar.jsx`, `isSubmenuItemActive` previously used `currentPath.startsWith(childLink)`. Because `/dashboard/plots/purchasers` shares the same string prefix as `/dashboard/plots/purchase`, "Plot Purchase" mistakenly evaluated to active.
  - **Fix**: Replaced prefix matching with strict path segment matching: `currentPath === childLink || currentPath.startsWith(childLink + '/')`. This prevents substring collisions while preserving active highlighting for nested child routes (e.g. `/dashboard/plots/purchase/:id/ledger`).
  - **Build Status**: Verified via `npm run build --prefix client` — compiled with zero errors.

- **Completely Removed Project Master Page, Route, and Files [COMPLETED]**:
  - **Requirement**: Completely remove the "Project Master" page (`/dashboard/plots/projects`), its left sidebar menu item, its route, and delete all associated files and components.
  - **Implementation**:
    - **Deleted Files**: Removed `client/src/pages/plots/projects/` directory (`PlotProjectsPage.jsx` and `components/TenurePeriodCommissionMatrix.jsx`), and deleted `client/src/pages/plots/purchase/components/ProjectsTable.jsx`.
    - **Sidebar**: Removed the `Project Master` menu item from `client/src/components/sidebar.jsx` under `Plot Management`.
    - **Routing**: Removed `PlotProjectsPage` lazy-import and `/dashboard/plots/projects` route guard from `client/src/App.jsx`.
    - **Navbar**: Removed the `"projects": "Project Master"` title entry from `client/src/components/Navbar.jsx`.
    - **Build Status**: Verified via `npm run build --prefix client` — compiled with zero errors.

- **Commission Ledgers Edit & Delete Restricted to Superadmin & Authorized IDs [COMPLETED]**:
  - **Requirement**: In Business Associates Commission Ledgers (and partner/branch commission ledgers), the Edit (Pencil) and Delete (Trash) options must be visible and executable ONLY by Superadmin and specific user IDs explicitly authorized by Superadmin. For all other roles/IDs, these options must remain completely hidden on the frontend and strictly protected at the backend API level.
  - **Implementation**:
    1. **Special Permission Registered**:
       - Added permission identifier `commission_ledger_action` ("Commission Ledgers (Edit & Delete Authorization)") in `client/src/pages/admin/organization/components/admin/userPermissionsConfig.js` under `finance` and `AllPermissionNames`.
       - In all default preset roles (`adminPermission`, `managerPermission`, etc.), `commission_ledger_action` defaults to `[]` (empty), ensuring no role automatically gains edit or delete privileges.
       - In `server/utils/permission.js`, granted `commission_ledger_action: [3, 4]` strictly to `superAdmin` only.
    2. **Frontend UI Protection (`ledgerpagelist.jsx`)**:
       - In `client/src/pages/admin/ledger/ledgerpagelist.jsx`:
         - Computed `canEditLedger` (`isSuperAdmin || hasPermission(profile, 'commission_ledger_action', 3)`).
         - Computed `canDeleteLedger` (`isSuperAdmin || hasPermission(profile, 'commission_ledger_action', 4)`).
         - Wrapped both Table view action buttons and Card view action buttons with `{canEditLedger && ...}` and `{canDeleteLedger && ...}`.
         - Guarded `handleOpenLedgerDialog`, `deleteLedger`, and `Modalbox` (`open={editOpen && canEditLedger}`) to block unpermitted executions.
    3. **Backend API Protection (`server/controllers/ledger.js` & `server/router/route.js`)**:
       - In `server/controllers/ledger.js`:
         - `updateLedger` (`PUT /ledger/:id`): Blocks non-superadmins without `commission_ledger_action: 3` with 403 Forbidden.
         - `deleteLedger` (`DELETE /ledger/:id`): Blocks non-superadmins without `commission_ledger_action: 4` with 403 Forbidden.
       - In `server/router/route.js`: Attached `checkPermission(["commission_ledger_action", "ledger"], ...)` to the routes.

- **Hidden 'Edit Profile' Option for Non-Superadmin Users [COMPLETED]**:
  - **Requirement**: Hide the "Edit Profile" button and modal on `/dashboard/profile` for all roles except `superadmin`.
  - **Implementation**:
    - In `client/src/pages/profile/adminManagerProfile.jsx`:
      - Determined `isSuperAdmin` using user profile state and JWT token (`(user?.profile?.role || profile?.role || getRoleFromToken())?.toLowerCase() === 'superadmin'`).
      - Wrapped the `<Button variant="primary"><Edit2 size={14} /> Edit Profile</Button>` button with `{isSuperAdmin && ...}`.
      - Wrapped the Edit Profile `<Modalbox ... />` with `{isSuperAdmin && ...}` so non-superadmins cannot view or trigger profile modification modals.
      - Aligns with backend `server/router/route.js:128` which already restricts `/update-profile` to `authorizeRoles('superadmin')`.

- **Removed Background & Border from Sidebar Logo [COMPLETED]**:
  - **Requirement**: Remove any background, borders, and card wrapping from the company logo in the sidebar brand header.
  - **Implementation**:
    - In `client/src/components/sidebar.jsx`, replaced the boxed container styling `rounded-xl overflow-hidden ... border border-teal-100 shadow-xs ... bg-white` with a clean, transparent flex container `<div className="w-9 h-9 md:h-10 md:w-10 flex items-center justify-center bg-transparent">`.
    - Added `bg-transparent mix-blend-multiply` to `<img />` so the logo sits naturally and cleanly against the sidebar without any card background, borders, or shadows.

- **Separated Purchasers / Buyers Master and Project Master into Dedicated Pages & Submenus [COMPLETED]**:
  - **Requirement**: In `Plot Purchase` (`/dashboard/plots/purchase`), separate the `Purchasers / Buyers Master` and `Project Master` tabs into 2 distinct dedicated pages and 2 individual submenus under `Plot Management` in the left sidebar, ensuring nothing breaks (permissions, routes, modal dependencies).
  - **Implementation**:
    - **Dedicated Purchasers Page**: Created [PurchasersMasterPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/PurchasersMasterPage.jsx) mounted at `/dashboard/plots/purchasers`. It wraps [PurchasersTable.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/components/PurchasersTable.jsx) with complete CRUD, default buyer assignment, and search capabilities.
    - **Dedicated Projects Page**: Integrated [PlotProjectsPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/projects/PlotProjectsPage.jsx) mounted at `/dashboard/plots/projects`, featuring full project CRUD, "Show in Add Booking" toggles, and project commission policy slabs.
    - **Cleaned PlotPurchasePage**: Removed tabs 4 and 5 from [PlotPurchasePage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/PlotPurchasePage.jsx) (and unused imports), while preserving backend fetch and state passed down to `CreateAgreementModal` / `EditAgreementModal` / filters so agreement creation and filtering remain 100% operational.
    - **Sidebar Submenus**: Added `{ menu: "Purchasers / Buyers", link: "/dashboard/plots/purchasers", roles: OPERATIONAL_ROLES, resource: ["plot_purchase", "plot_inventory"] }` and `{ menu: "Project Master", link: "/dashboard/plots/projects", roles: OPERATIONAL_ROLES, resource: ["plot_purchase", "plot_inventory"] }` under `Plot Management` in [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx).
    - **Route & Breadcrumbs**: Registered routes in [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx) with `RoutePermissionGuard`, and added `"purchasers": "Purchasers / Buyers Master"` and `"projects": "Project Master"` in [Navbar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/Navbar.jsx).

- **CustomerPlansPage Endpoint Correction [COMPLETED]**:
  - **Issue**: On `/dashboard/my-plans` (`CustomerPlansPage.jsx`), an error toast `Failed to load scheme configuration` appeared.
  - **Fix**: Corrected the endpoint URL from `/plots/scheme-config` to `/investments/config` (which provides the official `InvestmentSchemeConfig` tenure and return slabs).


- **Removed 'Business Developer Portfolio' Badge on My Bookings Page [COMPLETED]**:
  - **Requirement**: On `/dashboard/my-bookings` (`BusinessDeveloperBookingsPage.jsx`), remove the top "Business Developer Portfolio" badge and clean up the page title to "My Plot Bookings" so Business Associates and Partners see consistent, clean labeling.
  - **Implementation**:
    - In `client/src/pages/plots/businessDevelopers/BusinessDeveloperBookingsPage.jsx`:
      - Removed the `<div className="inline-flex ...">Business Developer Portfolio</div>` badge above the header title.
      - Simplified header title to `My Plot Bookings`.
      - Simplified loader title to `Loading Bookings...`.


- **Separated Plan & Commission into 2 Dedicated Pages with 2 Sidebar Submenus [COMPLETED]**:
  - **Requirement**: Separate the combined `Plan & Commission` page (`/dashboard/my-commission-rates`) into 2 distinct pages without on-page tabs, and provide 2 submenus under `Plan & Commission` in the left sidebar:
    1. **Plan** (`/dashboard/my-plans`): Customer Plan Tenure & Return slabs.
    2. **Commission** (`/dashboard/my-commission-rates`): Commission Slab, Incentive Slab, and Reward Slab.
  - **Implementation**:
    - Created [CustomerPlansPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/CustomerPlansPage.jsx) dedicated to customer plan tenures, interest rates, and maturity return matrices for EMI and One-Time plans.
    - Updated [CommissionStructurePage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx) to remove tab switches, rendering the commission, incentive, and reward slabs directly.
    - Updated [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx) with parent menu `Plan & Commission` having two expandable submenus: `Plan` (`/dashboard/my-plans`) and `Commission` (`/dashboard/my-commission-rates`).
    - Registered routes `/dashboard/my-plans`, `/dashboard/plans`, and `/dashboard/plots/plans` in [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx).
    - Updated [Navbar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/Navbar.jsx) to display `"Plan"` and `"Commission"`.


- **Operational Transaction Data Reset Script [COMPLETED]**:
  - **Requirement**: Create a dedicated reset script to clear all transactional data: plot bookings, investment bookings, downpayments, EMIs, product collections, vouchers, and reset all ledgers to ₹0 balance except seller/kisan initial agreement values.
  - **Implementation**:
    - Created [server/scripts/resetOperationalData.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/scripts/resetOperationalData.js).
    - Added npm script `"reset:data"` in [server/package.json](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/package.json) (`npm run reset:data`).
    - What it resets:
      1. **Plot Bookings**: Deletes `PlotBooking`, revisions, installments, payments, closings, payout vouchers, and sponsor commissions.
      2. **Plot Status**: Resets all `Plot` records back to `status: 'AVAILABLE'`.
      3. **Investment Bookings & Accounts**: Deletes `PlotProductBooking`, `InvestmentAccount`, `InvestmentInstallment`, `InvestmentReceipt`, and `InvestmentCommission`.
      4. **Collections & Receipts**: Deletes all `PlotReceipt` records (Downpayments, EMIs, Product collections).
      5. **Vouchers & Transfers**: Deletes all `Voucher` and `FundTransfer` records.
      6. **Land Stock**: Clears booking allocation records from `LandStockLedger` and restores available sqft pools on all `KisanLandAgreement` records.
      7. **Ledgers & Financial Entries**: Deletes all `Entry` records except `source: 'kisan_agreement'`. Deletes any kisan debit/payment records from `KisanLedger`. Resets all Bank, Cash, Sponsor, Branch, and Expense ledgers to ₹0 (`advance: 0, openingBalance: 0`). Re-evaluates and preserves initial agreement values on all Kisan ledgers.
      8. **Counters**: Resets numbering sequences (Bookings, Receipts, Vouchers, Transfers) back to #1.


- **Sidebar Menu Renames & Permission Verification: Down Payment & Investment Collection [COMPLETED]**:
  - **Requirement**:
    - Under the "Account" section in the left sidebar, rename "Downpayment" to "Down Payment" and "Product Collections" to "Investment Collection".
    - Check and ensure no permissions or approval notification badges are affected by this change.
  - **Verification & Implementation**:
    - **Permissions Intact**: Sidebar visibility checks use `child.resource` (`"plot_collection"`), NOT the display string `child.menu`. Route guards (`RoutePermissionGuard`), frontend hooks (`usePermission('plot_collection', ...)`), and backend API routes (`checkPermission('plot_collection', ...)`) all authenticate against the resource identifier `plot_collection`. No permission checks were affected.
    - **Pending Badges Intact**: `getChildPendingCount` evaluates against route URLs (`/dashboard/plots/collections/downpayment` and `/dashboard/plots/collections/products`), ensuring pending counters continue working seamlessly.
    - **Display Updates**:
      - `client/src/components/sidebar.jsx`: Renamed to `Down Payment` and `Investment Collection`.
      - `client/src/components/Navbar.jsx`: Updated page title mapping to `Down Payment Collection` and `Investment Collection`.
      - `client/src/pages/plots/products/ProductCollectionsPage.jsx`: Updated header title and empty state text to `Investment Collection & Receipts`.
      - `client/src/pages/admin/organization/components/admin/userPermissionsConfig.js`: Clarified label for `plot_collection` as `Collections (Down Payment, EMI & Investment)`.


- **Plot Price Calculator Downpayment & EMI Discount Logic Refined [COMPLETED]**:
  - **Requirement**:
    - When an EMI plan is selected (e.g. 1 month, 2 months, etc.):
      - Downpayment is ALWAYS fixed at 40% of the **gross plot value** (not discounted, and not 40% of net value).
      - The tenure discount (e.g. 19% for 1 month, 18% for 2 months) is deducted entirely from the **remaining 60% EMI balance**, NOT from the downpayment.
    - When 0 month (Full One-Time Payment) is chosen, downpayment remains 100% (all downpayment) with the 20% discount.
  - **Implementation**:
    - In `client/src/pages/plots/businessDevelopers/components/PlotPriceCalculatorTab.jsx`:
      - Replaced variable downpayment with fixed 40% of gross value: `Math.round((grossPlotValue * 40) / 100)`.
      - Remaining EMI principal computed as `netPlotValue - downpaymentAmount` which equals `(0.60 * grossPlotValue) - adjustmentAmount`.
      - Removed variable range slider and replaced with fixed 40% initial downpayment indicator.
      - Updated Payment Terms Schedule breakdown to clearly show Downpayment Amount (40% of Gross Value) and Remaining EMI Principal with discount deducted.


- **Commission Structure Incentive & Reward Column Headers and Slabs Adjusted [COMPLETED]**:
  - **Requirement**:
    1. In `/dashboard/my-commission-rates` (`CommissionStructurePage.jsx`):
       - Under **Commission Slab**, rename associate column headers from `Business Associate Fixed % (EMI)` / `Business Associate Fixed % (One-Time)` to simply `EMI %` and `One-Time %`.
       - Under **Incentive Slab**, rename column `TARGET INCENTIVE %` to `Performance Incentive %`.
       - Under **Reward Slab**, rename column `EXTRA INCENTIVE %` to `Performance Reward %`.
       - Remove `+` prefix from every percentage badge in the Reward Slab table rows (e.g. `+0.5%` -> `0.5%`).
  - **Implementation**:
    - In `client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx`:
      - Updated associate column headers in Commission Slab to `EMI %` and `One-Time %` (and simplified partner view to `Partner EMI %` / `Partner One-Time %` / `Associate EMI %` / `Associate One-Time %`).
      - Replaced `Target Incentive %` with `Performance Incentive %`.
      - Replaced `Extra Incentive %` with `Performance Reward %`.
      - Replaced `+{extraPct}%` with `{extraPct}%`.
      - Updated summary banner subtext accordingly.


- **Commission Structure Page Section Headers & Sidebar Menu Renamed [COMPLETED]**:
  - **Requirement**:
    1. On `/dashboard/my-commission-rates` (`CommissionStructurePage.jsx`), rename:
       - "Direct Fixed Commission Structure" -> "Commission Slab"
       - "Target Collection Slabs & Additional Incentive %" -> "Incentive Slab"
       - "Extra Incentive Campaign Slabs & Performance Rewards" -> "Reward Slab"
    2. Rename the left sidebar menu item for `/dashboard/my-commission-rates` from "Commission Rates" to "Plan & Commission".
    3. Update Navbar and dashboard quick-link title to match "Plan & Commission".
  - **Implementation**:
    - `client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx`: Updated table card headings to `Commission Slab`, `Incentive Slab`, and `Reward Slab`.
    - `client/src/components/sidebar.jsx`: Updated menu label to `Plan & Commission`.
    - `client/src/components/Navbar.jsx`: Updated route mapping for `my-commission-rates` to `Plan & Commission`.
    - `client/src/pages/plots/businessDevelopers/BusinessDeveloperDashboard.jsx`: Updated quick-link button label to `Plan & Commission`.


- **Organization User Login Username Prefix & Domain Standardization [COMPLETED]**:
  - **Requirement**: In User Management Add / Edit modal & page, show fixed `@goodfeelsd.com` on the right side of the input. Admin inputs only the username prefix (e.g. `nawrajsingh`), creating `nawrajsingh@goodfeelsd.com` as the login username.
  - **Fix**: In `AdminUserFormPage.jsx` and `UserFormModal.jsx`, replaced domain replacement with `.split('@')[0]` so existing accounts with domains like `@gmail.com` cleanly populate only the username prefix. Enhanced `onChange` to automatically strip any `@` domain entered.

- **Direct Password Change & Profile Modals Standardized with Common Modalbox [COMPLETED]**:
  - **Requirement**: Allow all created users (Cashier, Accountant, Manager, Admin, Superadmin, Business Associate, Business Partner, and Employees) to change their password directly on the Profile page without requiring an email reset link, and ensure both profile modals use the centralized `Modalbox` component props (`title`, `subtitle`, `icon`, `maxWidth`, `footer`).
  - **Implementation**:
    - **Backend Controller & Route**: Added `changeMyPassword` in `server/controllers/user.js` and mounted `POST /change-password` in `server/router/route.js` behind `authmiddlewre`. Validates new password length (min 4 chars), verifies current password if provided, hashes with bcrypt via model hook, and logs audit activity.
    - **Frontend (`AdminManagerProfile.jsx` & `profile.jsx`)**:
      - Replaced inner manual modal structures with the shared `Modalbox` component using standard props: `title`, `subtitle`, `icon`, `maxWidth="max-w-md"`, and `footer` buttons.
      - Edit Profile Modal: clean avatar preview/upload and name input with proper `Modalbox` header and footer.
      - Change Password Modal: Current Password (if known), New Password, and Confirm New Password with show/hide password visibility toggles, proper `Modalbox` header and footer.

- **Standalone Plot Price Calculator Simplification & Fixed Rate Integration [COMPLETED]**:
  - **Requirement**:
    1. Remove the reference table below ("Complete EMI Tenure Slabs Scale (0 to 24 Months)").
    2. Fix the Plot Selling Rate so it is locked/read-only, populated directly from the admin-configured `baseSqFtRate` (from `Plot Series Master` > `Plot Configuration & Rates`).
    3. Allow user to enter/adjust only the EMI month:
       - Entering `0` means all downpayment / one-time payment with a 20% discount.
       - Entering `1` month gives 19% discount, `2` months gives 18% discount, up to 20 months (0% base), and 21+ months adds markup (+1% per month).
       - Live plot value updates dynamically with gross value, discount/adjustment, net payable value, downpayment, and monthly EMI.
  - **Implementation**:
    - Updated `PlotPriceCalculatorTab.jsx`:
      - Locked `baseSqFtRate` input as read-only with a lock badge.
      - Replaced dropdown with an interactive numeric stepper & input for EMI Tenure (Months) plus quick-select chips (`0M`, `1M`, `3M`, `6M`, `12M`, `20M`, `24M`) and a dynamic live calculation banner.
      - Removed the 0 to 24 months simulation table completely.
      - In live pricing breakdown, `0 Month` cleanly indicates 100% full cash downpayment and zero installments.
  - **Requirement 1**: In `Plot Configuration & Rates` tab of Plot Series Master (`/dashboard/plots/series-master`), added dedicated card for `Plot Booking Base Rate (₹/Sq.Ft)` saving to `baseSqFtRate`, which auto-fills the default selling sqft rate in New Plot Booking (`/dashboard/plots/booking/new`).
  - **Requirement 2**: Separated `/dashboard/price-calculator` into its own standalone page (`PlotPriceCalculatorPage.jsx`) displaying only the price & tenure simulation tool.
  - **Requirement 3**: Removed the Price Calculator tab from `/dashboard/my-commission-rates` (`CommissionStructurePage.jsx`), retaining only the **Plan** and **Commission** tabs.
  - **Requirement 4**: In Plot Booking Step 1 (`StepCustomer.jsx`), removed duplicate bottom "Next: Choose Plot" button.
  - **Requirement 5**: In `BookingCertificateViewer.jsx`, removed top-right Booking No and Date labels, and displayed the Amount in Words right below Total Valuation in a muted faded subtitle.

- **EMI Tenure Rate Adjustment Slabs Configuration & Plot Booking Integration [COMPLETED]**:
  - **Requirement**:
    - In http://localhost:5173/dashboard/plots/products, add an additional tab for Admin to configure EMI tenure rate slabs.
    - Field for EMI month (0 Month up to 20+ Months, with option to add more slabs), action select (ADD or DEDUCT), and percentage field.
    - Rule scale: 0 Month (Full One-Time Payment) gives 20% discount (deduct), 1 Month gives 19% discount, 2 Months gives 18% discount ... 20 Months is 0% (standard plot rate), and 21+ Months adds markup (+1%, +2%, etc.).
    - Dynamically applied in Plot Booking (http://localhost:5173/dashboard/plots/booking) in Step 3 (Terms & Payment) on the calculated plot value, and displayed in breakdown tables and modal summaries.
  - **Implementation**:
    - **Model**: Added emiTenureAdjustmentSchema to PlotRateConfiguration with tenureMonths, action (ADD | DEDUCT), and percentage. Defaulted to the 0-24 month scale (0M: 20% DEDUCT ... 20M: 0% ... 24M: 4% ADD). Added static helper getDefaultEmiTenureAdjustments().
    - **Services**: Ensured getRateConfig and updateRateConfig in plotConfig.service.js read and persist emiTenureAdjustments. Updated booking creation logic in plotBooking.service.js to compute emiTenureAdjustmentPercent, emiTenureAdjustmentAction, and emiTenureAdjustmentAmount and persist them in PlotBooking.
    - **Frontend Products Page**: In PlotProductsPage.jsx, added 4th tab emi_slabs (EMI Tenure Slabs) with ProductEmiTenureSlabsTab.jsx, featuring Add Slab, Delete Slab, Reset 0-24 Scale, live formula preview, and Save Configuration.
    - **Frontend Booking Wizard**: In PlotBooking.jsx, StepTermsAndPayment.jsx, BookingSummarySidebar.jsx, and BookingConfirmationModal.jsx, added real-time lookup of tenure adjustment based on payment plan mode (0M for One-Time Full Payment, or total tenure months for EMI). Shows clear line items and badges in Step 3, the financial sidebar, and review modal before submission.

- **Product Collections: Maker-Checker Approval Workflow & Pending Notification Badges [COMPLETED]**:
  - **Issue & Requirement**:
    - Show pending approval count on the left sidebar under `Product Collections` (just like Downpayment/EMI) and show who is authorized to approve the bills.
    - When online collections were created, the left sidebar didn't show the pending counter badge on `Product Collections`.
  - **Implementation**:
    - **Backend (`approvalController.js`)**:
      - Integrated `PlotProductBooking.aggregate` to count pending product collections under `productCollection`.
      - Scoped by user authority: Global Admins (superadmin, admin, developer) see all pending product collections; Branch Managers see pending product collections scoped to their assigned branches/users.
      - Added `productCollection` count to `accountTotal` and `total`.
    - **Sidebar (`Sidebar.jsx`)**:
      - Stored `productCollection` in state and mapped `/dashboard/plots/collections/products` in `getChildPendingCount`.
      - Shows the live amber counter badge directly on `Product Collections` and rolls it up into `Account`.
    - **Table UI (`ProductCollectionsPage.jsx`)**:
      - For pending bills, clearly display `Pending` with `Requires Approval` subtitle.
      - Action buttons now feature a clear `Approve` label with tooltip indicating authorization (`Approve Bill & Realize into Ledger (Authorized)`).
      - Users without update permissions see `Awaiting Auth` (indicating waiting on Manager/Admin approval).
      - Dispatches `ems-refresh-approvals` upon approving, rejecting, or creating a collection to update the sidebar badge in real-time.
  - **Issue & Root Cause**:
    - Previously, when making an online/bank collection at `/dashboard/plots/collections/products/add`, it appeared as directly approved rather than `PENDING` awaiting authorized person / ID approval.
    - Root Causes:
      1. `collectionTransactionSchema` in `PlotProductBooking.js` had a hardcoded `default: 'APPROVED'`, which defaulted non-cash collections without explicit status to approved. Fixed schema default with dynamic getter: `function() { return String(this.paymentMode).toLowerCase() === 'cash' ? 'APPROVED' : 'PENDING'; }`.
      2. In `plotProduct.service.js`, `rebuildProductBookingInstallmentsState` was only invoked `if (isCash)`. For non-cash collections, it was skipped, leaving installments and balances in an un-recalculated state. Fixed to always invoke `rebuildProductBookingInstallmentsState(bookingId)` on every collection so pending non-cash collections strictly leave installments as unpaid and balance unchanged.
      3. In `getProductCollections`, `col.status` fallback was hardcoded as `col.status || 'APPROVED'`. Updated to `col.status || (String(col.paymentMode).toLowerCase() === 'cash' ? 'APPROVED' : 'PENDING')`.
      4. In `getProductReceiptById`, a duplicate hardcoded line `status: 'APPROVED'` existed, which overrode provisional status. Updated to return dynamic status.
      5. In `ProductCollectionsPage.jsx`, `handleCollectionSuccess` unconditionally called `navigate('/dashboard/plots/receipts/${receiptId}')` immediately after creation, opening the receipt bill view as if the payment was cleared. Fixed: when collection is `PENDING`, it returns to `/dashboard/plots/collections/products`, displays an informative toast (`Online collection recorded with PENDING approval status. Awaiting authorized ID / manager verification.`), and refreshes the collections table where the record is shown with the yellow `Pending` badge and actionable `Approve`/`Reject` controls for authorized users (`canUpdate` / admin / manager).
  - **Fix & Implementation**:
    - **Model (`PlotProductBooking.js`)**: Added `status` (`'PENDING' | 'APPROVED' | 'REJECTED'`, default: `'APPROVED'`), `approvedBy`, `approvedAt`, and `rejectionReason` to `collectionTransactionSchema`.
    - **Service (`plotProduct.service.js`)**:
      - In `collectProductInstallment`: Cash collections remain auto-approved (`'APPROVED'`), credited to the cashier's user cash ledger, and installments realized immediately. Bank, online/UPI, and cheque collections are set to `'PENDING'`, requiring non-empty `transactionReference` (and 6-digit validation for cheque). Pending collections do NOT credit the ledger and do NOT mark installments as paid until approved.
      - Added `rebuildProductBookingInstallmentsState(bookingId, session)`: Resets installments and applies ONLY `APPROVED` collections chronologically, recalculating `totalPaid`, `remainingAmount`, and setting status `COMPLETED` when paid in full.
      - Added `approveProductCollection(bookingId, receiptNumber, userOrId)`: Sets status to `APPROVED`, records credit entry in bank ledger, runs `rebuildProductBookingInstallmentsState`, and syncs sponsor commissions.
      - Added `rejectProductCollection(bookingId, receiptNumber, rejectionReason, userOrId)`: Sets status to `REJECTED`, reverses any ledger entry, and runs `rebuildProductBookingInstallmentsState`.
      - Updated `getProductCollections`: Includes `status`, `approvedBy`, `approvedAt`, `rejectionReason`, supports `query.status` filter, and calculates KPI totals only on `APPROVED` collections.
      - Updated `getProductReceiptById`: Dynamically returns receipt status.
      - Updated `deleteProductCollection`: Skips pending/rejected collections during rebuild.
    - **Controller & Routes (`plots.controller.js` & `plots.routes.js`)**:
      - Added `approveProductCollection` and `rejectProductCollection` endpoints:
        - `PUT /product-collections/:bookingId/:receiptNumber/approve`
        - `PUT /product-collections/:bookingId/:receiptNumber/reject`
      - Added fallback in generic `approveReceipt` and `rejectReceipt` routes (`/plots/receipts/:id/approve` and `/plots/receipts/:id/reject`) to also handle product receipts seamlessly.
    - **Frontend Forms**:
      - `ProductReceivePaymentForm.jsx`: Enforces required `transactionReference` for non-cash modes with asterisk `*`, regex check for cheques, and displays an informative Maker-Checker Approval banner.
      - `ProductInstallmentCollectModal.jsx`: Enforces required `transactionReference` for non-cash modes with asterisk `*` and client-side validation.
    - **Frontend Table & Modals (`ProductCollectionsPage.jsx`)**:
      - Added Status Filter dropdown (`All Statuses`, `Pending`, `Approved`, `Rejected`).
      - Added Status column with colored badges (`Clock` for Pending, `CheckCircle2` for Approved, `XCircle` for Rejected).
      - Added Approve (`Check`) and Reject (`XCircle`) action buttons for pending collections when user has `canUpdate` permission.
      - Integrated `Modalbox` confirmation modals for approving and rejecting (with rejection reason input).
    - **Receipt Viewer (`ReceiptViewer.jsx`)**: Displays `(PENDING APPROVAL)` indicator if viewing an unapproved receipt bill.

This file records session notes, caveats, and discoveries across active sessions.

- **Granular RBAC Permissions for Kisan/Seller, Plot Purchase, Kisan Payments & Bookings [COMPLETED]**:
  - **Requirement**:
    - Add granular permissions & restrictions for:
      1. **Seller / Kisan Add/Edit/Delete**: Ability to give permission or restrict adding/editing/deleting sellers (`kisan_seller`).
      2. **Plot Purchase**: Dedicated permission for land acquisition agreements and registry deeds (`plot_purchase` at `/dashboard/plots/purchase`).
      3. **Seller / Kisan Payment**: Dedicated action permission to record payments/disbursements to farmers under `kisan_ledger` (Action 2: Create).
      4. **Plot Booking & Investment Booking Agreements**: Dedicated permissions to create booking contracts (`plot_booking, 2` and `investment_booking, 2`).
    - Group and rearrange permissions logically in the permission configuration matrix.
  - **Implementation**:
    - **Permissions Config (`userPermissionsConfig.js`)**: Added `plot_purchase` and `kisan_seller`. Grouped real estate modules into logical enterprise categories: *Land Procurement & Kisans*, *Master Inventory & Channels*, *Bookings & Agreements*, *Collections, Payouts & BI*. Updated presets for all roles.
    - **Backend & Frontend Fallback Protection (`checkpermission.js` & `CheckPermission.jsx`)**: Added backward-compatible fallback: existing users without explicit `plot_purchase` or `kisan_seller` gracefully inherit rights from `plot_inventory` and `kisan_ledger`.
    - **Routes Protected (`plots.routes.js` & `App.jsx`)**:
      - `/kisan-agreements` & `/deeds`: protected with `['plot_purchase', 'plot_inventory']`.
      - `/kisan-agreements/:id/payments`: protected with `['kisan_ledger', 'plot_purchase'], 2` (payment disbursement).
      - `/kisan-sellers`: protected with `['kisan_seller', 'plot_purchase', 'kisan_ledger']` for Create (2), Update (3), Delete (4).
    - **UI Buttons & Forms Guarded**:
      - `PlotPurchasePage.jsx`: "+ New Plot Purchase" button guarded by `canCreatePurchase`.
      - `KisanAgreementsTable.jsx`: "+ Deed", "Pay", "Edit", and "Delete" actions guarded.
      - `RegistryDeedsTable.jsx`: "Edit" and "Delete" deed actions guarded.
      - `KisanSellersTable.jsx`: "+ Add Land Seller", Edit, and Delete kisan guarded.
      - `PlotKisanLedgerPage.jsx`: "+ Add Registry Deed" and "+ Pay Seller" guarded.
      - `ProductSalesTab.jsx`: "+ New Investment Booking" guarded by `canCreate = usePermission(['investment_booking', 'plot_booking'], 2)`.
      - `PlotReports.jsx`: "+ New Booking" guarded by `canCreate = usePermission('plot_booking', 2)`.
      - `AdminUserFormPage.jsx`: Merged fallback permissions so existing users populate checkboxes without undefined states.

- **Customer Return % Columns on Commission Rates Page [COMPLETED]**:
  - **Requirement**: In `/dashboard/my-commission-rates` (`CommissionStructurePage.jsx`), display the customer maturity return percentage for EMI (`112%`, `120%`, etc.) and One-Time (`121%`, `135%`, etc.) right after Tenure.
  - **Constraint**: Do NOT show the internal annual interest rate (% p.a., e.g., `11.286%`, `9.644%`) to sponsor roles.
  - **Implementation**:
    - **Frontend**: Added `Customer Return % (EMI)` and `Customer Return % (One-Time)` columns with styled badge indicators in `CommissionStructurePage.jsx`.
    - **Backend**: Sanitized `getSchemeConfig` in `server/controllers/investment.controller.js` to strip `annualInterestRate`, `rdAnnualInterestRate`, and `fdAnnualInterestRate` for `sponsor` role requests.

- **Voucher Bank Permissions Consolidation (CQ4) [COMPLETED]**:
  - **Issue**: `createVoucher`, `approveVoucher`, and `recordVoucherPayment` in `server/controllers/voucher.js` duplicated 25+ lines of bank permission queries and dynamic `require('../models/user')` calls.
  - **Fix**: Extracted logic into `validateBankDisbursementPermission(userId, userRole, paymentLedger, session)`. Reusable across all disbursement routes with transaction session awareness and zero changes to error codes or responses.

- **Ledger Auto-Sync Optimization & Debouncing (B5 / P2) [COMPLETED]**:
  - **Issue**: `GET /ledger` ran 5 heavy multi-table write-sync loops (`createLedgerForEmployee`, `createLedgerForSponsors`, `createLedgerForKisans`, `createLedgerForUsers`, `createLedgerForBranches`) on every single list request, and `getTreasuryLedgers` / `getMyCashLedger` ran full user table scans on every modal open.
  - **Fix**: Wrapped the 5 sync routines in `syncAllLedgersSafe()` in `server/controllers/ledger.js` with a 5-minute debounce interval and concurrency lock. Added optional `?sync=true` query param to force sync on demand. In `getMyCashLedger`, removed redundant full user table scan since missing cash ledgers are already created on the fly.

- **Dedicated Commission Rates & Policy Page for Business Associates & Partners [COMPLETED]**:
  - **Requirement**:
    - Build a dedicated, separate page (`CommissionStructurePage.jsx`) to display direct commission rates and target/extra incentive policies for Business Associates and Business Partners without exposing the admin Plot Products page.
    - Read-only ("only show, no action perform").
    - Role scoping:
      - Business Associate (`BA-`): Shows ONLY Business Associate commission rates (Direct Fixed % for EMI & One-Time, and BA Target/Extra Incentive slabs & rewards).
      - Business Partner (`BP-`): Shows Business Partner commission rates AND Business Associate commission rates (both direct fixed % and target/extra incentive policies for self and team).
  - **Implementation**:
    - **Frontend**:
      - Created [CommissionStructurePage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/CommissionStructurePage.jsx) featuring 2 tabs:
        1. *Direct Commission (Scheme Rules & Returns Matrix)*: Displays active tenure slabs with BA and BP fixed % breakdown.
        2. *Target & Extra Incentive Policy*: Displays quarterly target collection slabs, additional incentive %, and milestone rewards (with self/team switcher for Business Partners).
      - Registered routes `/dashboard/my-commission-rates`, `/dashboard/commission-structure`, and `/dashboard/plots/commission-structure` in [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx).
      - Added "Commission Rates" navigation link in [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx) and quick-access button on [BusinessDeveloperDashboard.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperDashboard.jsx).
    - **Backend**:
      - Updated [plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js) and [investment.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/investment.routes.js) to allow `sponsor` role read access to `/plots/commission-policy` and `/investments/config`.

- **Investment Booking: Quantity Lock on Custom Dimensions & Inline Total Plot Value [COMPLETED]**:
  - **Requirement**:
    - When custom dimensions are entered (e.g., 30 × 40 = 1,200 Sq.Ft or 20 × 60 = 1,200 Sq.Ft), lock the Quantity stepper and text input so it cannot be manually changed while dimensions are active.
    - Custom Unit Rate (₹) remains fully editable.
    - Display the Total Value (`Quantity × Rate` / `Area × Rate`, e.g., `1,200 Sq.Ft × ₹1,000 = ₹12,00,000`) directly alongside the Quantity and Custom Rate fields in the form in addition to the right-hand summary panel.
  - **Implementation**:
    - **Frontend ([ProductBookingPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx))**:
      - Added `Lock` icon and state guards to Quantity stepper (`-` and `+` buttons disabled with `opacity-60 cursor-not-allowed` when `hasCustomDimensions` is true; `handleQuantityStep` returns early).
      - Set `readOnly={hasCustomDimensions}` and `disabled={hasCustomDimensions}` on quantity input with custom locked styling and "Locked" badge.
      - Added auto-lock informative note explaining that clearing dimensions unlocks manual quantity editing.
      - Custom Unit Rate remains editable as requested.
      - Added an inline 3-column financial control grid displaying **Quantity (Units)**, **Custom Unit Rate (₹)**, and **Total Value (कुल मूल्य)** with full calculation formula breakdown (`1,200 Sq.Ft × ₹1,000` or `1,200 Units × ₹1,000 = ₹12,00,000`).

- **Investment Booking: Dimension & Quantity Inputs Numeric Keypad & Mouse Scroll Protection [COMPLETED]**:
  - **Issue**:
    - Under Product & Dimension Specifications (`/dashboard/plots/investment-booking/new`), the North-South, East-West, Quantity, and Custom Unit Rate input fields used `type="number"`, which accidentally altered values when users scrolled their mouse wheel while hovering over the input.
  - **Fix**:
    - Converted inputs to `type="tel"`, `inputMode="numeric"`, and `pattern="[0-9]*"` in [ProductBookingPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx).
    - Added strict digits-only regex filtering (`replace(/[^0-9]/g, '')`) in `handleCustomDimensionChange` and input change handlers.
    - Added `onWheel={(e) => e.target.blur()}` so mouse wheel scrolling never changes the numeric values.
    - Ensures the numeric keypad is automatically opened on mobile devices.

- **Land Document Attachments: Security Checks & Interactive In-App Preview [COMPLETED]**:
  - **Requirement**:
    - Under Land Documents & Attachments in Plot Purchase Agreement (`/dashboard/plots/purchase`), support all file formats (PDFs and images like JPG, JPEG, PNG, WEBP, GIF, BMP, TIFF, AVIF).
    - Enforce robust multi-layer security checks on file uploads (file size limit, extension whitelist, MIME whitelist, binary magic-byte inspection, filename sanitization, and automatic temp file cleanup).
    - After uploading, allow users to view/preview attached files directly in-app (modal viewer with responsive PDF iframe and high-resolution image viewer), see file thumbnails, replace files, open in a new tab, or download.
  - **Implementation**:
    - **Backend ([plots.controller.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/plots.controller.js))**:
      - Fixed missing imports (`fs`, `path`) which previously risked crash on temp file cleanup.
      - Added `checkDocMagicBytes` checking binary file signatures (`%PDF-`, JPEG `0xFFD8FF`, PNG `\x89PNG`, GIF `GIF87a`/`GIF89a`, BMP `BM`, TIFF `II*.`/`MM.*`, WEBP `RIFF....WEBP`).
      - Validated maximum file size (20MB limit).
      - Sanitized filenames against path traversal attacks.
      - Uploaded to Cloudinary with `resource_type: isPdf ? 'raw' : 'image'` and ensured `.pdf` extension is preserved in `public_id` so raw PDFs serve with correct `Content-Type: application/pdf` and direct browser viewability.
      - Guaranteed cleanup of temporary `./uploads` files in both success and error blocks.
    - **Frontend Components**:
      - Created [DocumentPreviewModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/components/DocumentPreviewModal.jsx) using `Modalbox`: displays responsive PDF iframe viewer or zoomable image container, header with metadata badges (format, size, category), and "Open in new tab" and "Download" buttons.
      - Updated [CreateAgreementModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/components/CreateAgreementModal.jsx) & [EditAgreementModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/components/EditAgreementModal.jsx):
        - Added client-side security checks (20MB max size, extension whitelist).
        - Upgraded upload row to show a rich attachment preview card once uploaded: thumbnail/PDF badge, filename, file size, "View" (opens preview modal), "Replace" (re-select file), and "Open in new window" button.
        - Wired up `DocumentPreviewModal`.
      - Updated [KisanLedgersDrawer.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/purchase/components/KisanLedgersDrawer.jsx):
        - Updated details drawer attachment cards with thumbnail previews, category badges, "Preview" button opening `DocumentPreviewModal`, and external link.

- **Investment Booking: Downpayment Option & Periodic EMI Frequency Selection [COMPLETED]**:
  - **Requirement**:
    - Under the EMI scheme plan in Investment Booking (`/dashboard/plots/investment-booking/new`), provide:
      1. Downpayment options (`PERCENT`, `FLAT`, `SQFT_RATE`) and calculate the remaining amount for EMI installments.
      2. Time in days for downpayment (`downpaymentDays`, default 90 days) with dynamic due date preview helper.
      3. EMI Frequency selection (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`) with periodic installment count and amount calculations (aligned with standard Plot Booking Step 3).
  - **Implementation**:
    - **Schema ([PlotProductBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProductBooking.js))**:
      - Added fields: `downpaymentDays`, `downpaymentMonths`, `emiFrequency` (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`), `installmentCount`, `dpType`, `dpVal`, and `emiPrincipalAmount`.
    - **Backend Services ([plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js))**:
      - `createProductBooking`: Handles `downpaymentAmount`, `downpaymentDays`, `emiFrequency`, `installmentCount`. If `dp > 0`, schedules installment #0 with `status: 'PENDING'` due at `bookingDate + downpaymentDays`. Calculates remaining balance (`totalAmount - dp`) and schedules installments 1..count spaced according to frequency multiplier (Monthly: 1m, Quarterly: 3m, Half-Yearly: 6m, Yearly: 12m).
      - `updateProductBooking`: Reschedules installment #0 and installments 1..count if no installments were paid yet.
    - **Frontend Booking Wizard ([ProductBookingPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx))**:
      - In Step 3 (Payment Plan Scheme & Period), implemented downpayment input card with mode selector (`%`, `Flat ₹`, `₹/Sq.Ft`), input value, calculated DP amount, and remaining balance.
      - Implemented Downpayment Due Period in Days input with live date helper (`Due Date: DD Mon, YYYY`).
      - Implemented EMI Frequency selector (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`), Number of Installments input, calculated Periodic Installment amount, and Total Contract Tenure in months.
      - Updated right-hand Booking Summary sidebar to show Downpayment, remaining balance, and frequency-adjusted installment breakdown.
    - **Installment Collection & Ledgers ([ProductInstallmentCollectModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductInstallmentCollectModal.jsx), [ProductCustomerLedgerModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductCustomerLedgerModal.jsx), [ProductSalesTab.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx))**:
      - Renders installment #0 as `'Downpayment (DP)'` instead of generic `'EMI #0'`.
      - Displays dynamic periodic frequency and downpayment in booking details modal.

- **Investment Booking: Custom Dimension Entry & Automatic Quantity Calculation [COMPLETED]**:
  - **Requirement**:
    - Allow entering custom dimensions like 30 ft North-South and 40 ft East-West in Investment Booking (`/dashboard/plots/investment-booking/new`).
    - Automatically compute total area (`30 × 40 = 1,200 Sq.Ft`) and auto-calculate Quantity (`1,200 units` for 1 Sq.Ft products).
    - Sync total valuation with presetted unit price (e.g. ₹1,000 × 1200 = ₹12,00,000) and sync land sourcing allocated area.
    - Print the dimensions (`30 ft x 40 ft (N/S: 30 ft, E/W: 40 ft)`) and total area (`1,200 Sq.Ft`) on the Investment Booking Certificate, Receipt Voucher, and Agreement.
  - **Implementation**:
    - **Schema & Service**:
      - Updated [PlotProductBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProductBooking.js) to store `northSouth`, `eastWest`, and `totalAreaSqFt` in `dimensionsSnapshot`.
      - Updated [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js) in `createProductBooking`, `updateProductBooking`, and `getProductReceiptById` to resolve custom dimensions and sync total area.
    - **Frontend Booking Form**:
      - In [ProductBookingPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx), added custom dimension inputs for North-South and East-West under Product Specifications.
      - Implemented bidirectional auto-calculation: area computes immediately, sets `quantity`, syncs required land sourcing area, and reflects in live Booking Summary.
    - **Print Viewers**:
      - [BookingCertificateViewer.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/printViewers/BookingCertificateViewer.jsx): Added Dimensions (`30 ft x 40 ft`) alongside Total Area (`1,200 Sq.Ft`).
      - [ReceiptViewer.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/printViewers/ReceiptViewer.jsx): Added dimension label and total area to the product receipt voucher.
      - [ProductAgreementViewer.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/printViewers/ProductAgreementViewer.jsx): Updated Clause 1 to display resolved dimensions and total unit area.

- **Unified Profile Header Design Standard Across All Developer Pages [COMPLETED]**:
  - Standardized the profile header across [ledgerdetailpage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/ledgerdetailpage.jsx), [BusinessDeveloperNetworkPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperNetworkPage.jsx), and [BusinessDeveloperReportPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperReportPage.jsx) to match the clean look of the main Dashboard ([BusinessDeveloperDashboard.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperDashboard.jsx)):
    - **Avatar**: `w-[52px] h-[52px] rounded-full` circular avatar with teal background.
    - **Name & Typography**: `text-xl font-bold text-slate-800 tracking-tight`.
    - **Unified Role Badge**: Compact `px-2 py-0.5 rounded text-[11px] font-semibold border` badge (Title case `Business Partner` in teal, `Business Associate` in blue, `Branch Partner` in purple) replacing inconsistent emojis (`👑`, `👥`) and uppercase blocks.
    - **Subtext Info**: `<ShieldCheck size={14} className="text-slate-400" /> ID: <strong className="text-slate-700">{id}</strong>`, phone, and partner details.

- **Ledger Detail Account Badge Fix ([ledgerdetailpage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/ledgerdetailpage.jsx), [BusinessDeveloperLedgerPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperLedgerPage.jsx)) [COMPLETED]**:
  - **Issue**:
    - When clicking "Commission Ledger" for an Associate (`BA-19/10/2627/004`), the header badge showed "BUSINESS PARTNER ACCOUNT".
  - **Root Cause**:
    - `BusinessDeveloperLedgerPage.jsx` redirected to `/dashboard/ledger/:id` with query param `ledgertype=sponsor`.
    - `ledgerdetailpage.jsx` had a fallback `ledgerType === 'partner' || ledgerType === 'sponsor' ? 'Business Partner Account'`, ignoring `empId` (`BA-...`).
  - **Fix**:
    - In `ledgerdetailpage.jsx`, updated badge logic to inspect `(ledgerType === 'associate' || empId?.startsWith('BA-'))` -> renders `"Business Associate Account"`.
    - In `BusinessDeveloperLedgerPage.jsx`, computed `computedType` (`associate`, `branch_partner`, or `partner`) before navigating to the ledger.

- **Business Associate vs Business Partner Scope & Badge Fix ([BusinessDeveloperNetworkPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperNetworkPage.jsx), [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx)) [COMPLETED]**:
  - **Issue**:
    - When logging in as a Business Associate (`BA-19/10/2627/004`), the Network page showed a `👑 Business Partner` badge instead of `👥 Business Associate`.
    - It showed a "Business Associates (0)" tab and "Filter Associate" controls, even though an Associate does not have subordinate associates.
    - The sidebar labeled the menu "My Network & Customers" instead of "My Customers".
  - **Root Cause**:
    - `BusinessDeveloperNetworkPage.jsx` calculated `isBusinessPartner = !developer.sponsorId`. Because the backend dashboard payload populated `parentSponsor` instead of `sponsorId`, `developer.sponsorId` was `undefined`, causing `!undefined === true` (evaluating every associate as a partner!).
  - **Fixes**:
    - **Accurate Role Evaluation**: Rewrote `isBusinessPartner` in `BusinessDeveloperNetworkPage.jsx` to check `developer.isDeveloperSponsor`, `developer.parentSponsor`, and `developer.sponsorCode` (starts with `BA-` for associate, `BP-` for partner).
    - **Associate View Streamlined**: For associates, automatically hides the "Business Associates" tab and "Filter Associate" controls, defaults directly to "My Customers", and omits the redundant "Business Associate" column.
    - **Dynamic Sidebar Menu**: Updated [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx) to display **"My Customers"** for Associates and **"My Network & Customers"** for Partners.
    - **Auth Payload Enhancement**: In [user.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/user.js), added `isDeveloperSponsor` directly to the `send` payload on sign-in.

- **Associate & Partner Portal Dashboard Fix ("Entry not found" & Blank Profile) [COMPLETED]**:
  - **Issue**:
    - When logging in as a Business Associate or Business Partner (e.g. Anuj Kumar), an error toast "Entry not found" popped up, and the dashboard displayed an empty profile (empty name, "ID: N/A", ₹0 metrics).
  - **Root Causes**:
    1. **Missing Schema Registration**: `plotDeveloper.service.js` populated `closingId` on `PlotSponsorCommission`, but `PlotClosing` model was not imported/registered in that service, triggering `MissingSchemaError: Schema hasn't been registered for model "PlotClosing"`.
    2. **Crashing on Orphan Ledger Entry Deletion**: `syncProductBookingSponsorCommissions` and `syncBookingSponsorCommissions` call `accountingService.deleteLedgerEntry(c.ledgerEntryId)`. If `ledgerEntryId` was already absent or previously cleaned up, `deleteLedgerEntry` threw `Error: Entry not found`. This unhandled rejection broke the entire `getSponsorDashboardStats` endpoint.
  - **Fixes**:
    - **Safe Idempotent Deletion ([accountingService.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/accountingService.js))**: Updated `deleteLedgerEntry` to safely return `null` if the entry is already absent instead of throwing an unhandled exception.
    - **Model Registration ([plotDeveloper.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotDeveloper.service.js))**: Added `const PlotClosing = require('../../models/PlotClosing')` and wrapped `deleteLedgerEntry` in try/catch to safeguard commission sync.
    - **Defensive Frontend Fallback ([BusinessDeveloperDashboard.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/businessDevelopers/BusinessDeveloperDashboard.jsx))**: Merged `user.profile` / session state as a fallback for `developer` so the name and sponsor ID are always rendered.

- **Logout Confirmation Dialog & Unified "Good Feel" Single Sign-In [COMPLETED]**:
  - **Logout Confirmation Button Fix ([sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx))**:
    - Changed logout confirmation modal button text to "Logout" (was previously defaulting to "Delete" via legacy swal call) and set subtitle to "You will be signed out of your current session."
  - **Unified "Good Feel" Login ([Login.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/Login.jsx))**:
    - Streamlined login page to a single sign-in interface without mode switch tabs.
    - Simplified header to brand title "Good Feel" with subtext "Enter your Email, User ID, or Mobile to sign in", completely removing all role-specific terms (staff, associate, partner, admin).
    - Accepts Email, User ID (BA-..., BP-...), or Mobile, with automatic backend detection and routing.

- **User Rename vs Cash Ledger Name Desynchronization Fix [COMPLETED]**:
  - **Issue**:
    - When logging in as Nawraj Singh Nayan (Cashier), the "From Account (Source)" dropdown in Fund Transfers showed `subodh kumar (Cash Ledger)`.
  - **Root Causes**:
    1. **Stale Ledger Name in DB**: The user document (`68aef4129017d8efd4f6a6ca`) was previously named "Subodh Kumar" and later renamed to "Nawraj Singh Nayan". However, in [ledger.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/ledger.js) (`createLedgerForUsers`), the name update condition was `if (primaryLedger.name !== expectedName && !primaryLedger.name.includes('(Cash Ledger)'))`. Because `primaryLedger.name` already included `'(Cash Ledger)'`, it skipped updating the name!
    2. **Missing Sync on User Edit**: [admin.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/admin.js) (`editAdmin`) updated the User collection without synchronizing the linked `user_cash` ledger title.
    3. **Unsafe Fallback**: In [FundTransfersPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/FundTransfersPage.jsx), `activeMyCash` fell back to `treasuryLedgers.cashLedgers[0]`, which could wrongly select another user's cash account if the user ID match failed.
  - **Fixes**:
    - Removed `!primaryLedger.name.includes('(Cash Ledger)')` in `createLedgerForUsers()` so renamed users always sync their cash ledger name.
    - In `editAdmin()`, added automatic synchronization of `Ledger` docs with `assignedUserId: id, ledgerType: 'user_cash'`.
    - Removed the unsafe `treasuryLedgers.cashLedgers[0]` fallback from `activeMyCash` in `FundTransfersPage.jsx`.
    - Synchronized Nawraj's ledger name in the database from `subodh kumar (Cash Ledger)` to `Nawraj singh nayan (Cash Ledger)`.

- **Cash Ledgers Granular Permissions & Fund Transfer Selection Scope [COMPLETED]**:
  - **Requirement**:
    - Provide a granular permission system for Cash Ledgers/Drawers in user editing (`/dashboard/organization/users/:id/edit`).
    - When initiating fund transfers in `/dashboard/ledger/transfers`, users should only see and transfer funds to cash drawers authorized for them.
    - Support "All Cash Accounts", "Selected Cash Accounts Only" (with Select All / Clear All checklist), and "No Cash Transfer Access".
  - **Implementation**:
    - **User Schema & Model ([user.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/user.js))**:
      - Added `cashPermissions: { accessScope: { type: String, enum: ['all', 'selected', 'none'], default: 'all' }, allowedCashLedgerIds: [{ type: ObjectId, ref: 'Ledger' }] }`.
    - **Admin Controller & FirstFetch ([admin.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/admin.js))**:
      - Handled `cashPermissions` parsing and saving in `addAdmin` and `editAdmin`.
      - Populated `cashPermissions.allowedCashLedgerIds` in `getAdmin`, `getAdminById`, and `firstfetch`.
    - **Treasury & Ledger Controller ([ledger.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/ledger.js))**:
      - In `getTreasuryLedgers`: filtered cash drawers by caller's `cashPermissions` (unless `all=true` is requested by superadmin or caller is supreme developer/superadmin with all scope).
    - **Fund Transfer Backend Verification ([fundTransfer.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/fundTransfer.js))**:
      - In `requestTransfer`: verified `cPerm` (`caller.cashPermissions`) when `toLedger.ledgerType === 'user_cash'`, ensuring non-superadmins can only transfer to authorized cash drawers.
    - **User Form Frontend ([AdminUserFormPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/organization/pages/AdminUserFormPage.jsx))**:
      - Added Section 4: "Cash Drawers & Inter-Account Transfer Authority" with scope radio controls, "Select All Cash Ledgers" / "Clear All" buttons, and interactive cash drawer cards with balances.
    - **Fund Transfer Frontend ([FundTransfersPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/FundTransfersPage.jsx))**:
      - Filtered "Recipient Cash Accounts" dropdown by `currentUser?.cashPermissions`, preventing unauthorized cash drawers from appearing.

- **Ledger Submenu "Add Ledger" Redundancy Removal (Option A) [COMPLETED]**:
  - **Requirement**:
    - Remove the confusing "Add Ledger" button on entity-specific ledger pages (Employees, Sellers, Business Associates, Business Partners, Branch Partners).
    - These ledgers are automatically synced reflections of their core domain records.
  - **Implementation**:
    - In [ledgerpagelist.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/ledger/ledgerpagelist.jsx), wrapped the "Add Ledger" button to only render when `category === "all"`.

- **Dedicated Incentive & Closings RBAC Permission (`plot_incentive`) [COMPLETED]**:
  - **Requirement**:
    - Disentangle the Incentive Matrix page (`/dashboard/plots/incentives`) and closing endpoints from `plot_sponsor`.
    - Provide a dedicated, granular permission `plot_incentive: "Incentive Closings & Rewards"` in the RBAC permissions matrix.
  - **Implementation**:
    - **Permissions Config & Presets ([userPermissionsConfig.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/organization/components/admin/userPermissionsConfig.js), [permission.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/utils/permission.js))**:
      - Added `plot_incentive` to `AllPermissionNames`, `MODULE_DISPLAY_NAMES`, and `MODULE_CATEGORIES.realestate`.
      - Configured role presets (`admin`: all [1,2,3,4], `manager`/`accountant`: [1,2,3], `sales`/`auditor`: [1], `cashier`/`hr`: []).
    - **Backend Routes ([plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js))**:
      - Replaced `plot_sponsor` with `plot_incentive` on `/closings/preview`, `POST /closings`, `GET /closings`, `GET /closings/:id`, `PUT /closings/:id`, and `DELETE /closings/:id`.
    - **Frontend Route Guards & Navigation ([App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx), [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx))**:
      - Sidebar "Incentive" menu item now requires `resource: "plot_incentive"`.
      - Route guards for `/dashboard/plots/incentives`, `/dashboard/plots/incentives/new`, `/dashboard/plots/incentives/edit/:id`, and `/dashboard/plots/closings*` now require `plot_incentive`.
    - **Granular Action Controls ([PlotIncentivesPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentivesPage.jsx))**:
      - Added `canCreate`, `canUpdate`, and `canDelete` permission checks on the "Process Target Incentive" button, batch edit button, and batch delete/reverse button.

- **Plot Booking & Investment Booking Strict RBAC Separation & Authorization Fix [COMPLETED]**:
  - **Issues**:
    1. "Investment Booking" was still showing in the sidebar and accessible even when only `plot_booking` was granted (due to an automatic backward-compatibility fallback from `investment_booking` to `plot_booking`).
    2. "Plot Booking" (`/dashboard/plots/booking`) was showing "Not Authorised" when granted `plot_booking` because the booking list component (`PlotReports.jsx`) queries `/plots/reports/bookings`, which was strictly guarded by `plot_reports` instead of `plot_booking`.
  - **Fixes**:
    - **Removed all fallbacks from `investment_booking` to `plot_booking`**:
      - In [CheckPermission.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/utils/CheckPermission.jsx) and [checkpermission.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/middleware/checkpermission.js), removed the fallback block.
      - In [sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx) and [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx), set "Investment Booking" routes to strictly require `investment_booking`.
    - **Authorized Plot Booking Data Access**:
      - In [plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js):
        - Allowed `['plot_reports', 'plot_booking']` on `/reports/:type` so users with `plot_booking` can view the plot bookings and holds list.
        - Allowed `['plot_inventory', 'plot_booking']` on `GET /plots` and `GET /series` so users with `plot_booking` can create new bookings.
        - Separated `/product-bookings*` routes to strictly check `investment_booking`.

- **Plot Incentives & Extra Incentive Period Closing: Brand Theme Alignment [COMPLETED]**:
  - **Requirement**:
    - Remove all purple-based colors from `/dashboard/plots/incentives?tab=extra` and `/dashboard/plots/incentives/new?type=EXTRA_INCENTIVE`.
    - Align both pages with the project's standard Good Nature deep teal (`teal-800`, `teal-700`) and emerald (`emerald-700`, `emerald-800`, `emerald-50`) palette.
  - **Changes**:
    - [PlotIncentivesPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentivesPage.jsx): Replaced purple tabs, period summary badges, table headers, and status badges with emerald/teal classes.
    - [PlotIncentiveProcessPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/incentives/PlotIncentiveProcessPage.jsx): Replaced purple headers, parameter buttons, calendar icons, breakdown preview cards, associate table headers & rows, collection badges, and batch submission buttons with project teal and emerald styles.
    - Verified zero remaining `purple` color classes in the incentives directory.

- **Employee Performance Dropdown: Same-Name Disambiguation Fix [COMPLETED]**:
  - **Issue**:
    - On `/dashboard/performance`, when multiple employees shared the same name (e.g., "Deepak Kumar (Director)" and "Deepak Kumar (Customer Support)"), both entries were highlighted as selected simultaneously.
    - Cause: The dropdown option `value` was generated as `toSlug(empName)` (e.g. `deepak-kumar`) instead of a unique ID. Since both options had the identical string value `deepak-kumar`, `SearchableSelect` marked both as selected.
  - **Fix**:
    - **Frontend ([AttenPerformance.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/attandence/AttenPerformance.jsx))**:
      - `employeeOptions` now assigns each option a unique `value` using `emp.empId || emp.userid?._id || emp._id`.
      - `matchedEmployeeInUrl` checks exact `rawId`, `empDocId`, and `empId` before falling back to slug matching for backward compatibility.
      - `selectedEmployeeValue` maps strictly to the unique ID of the single matched employee so only that employee is highlighted.
      - `fetchPerformanceData` passes the resolved exact unique employee ID to the backend.
    - **Navigation ([employeehelper.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/employee/employeehelper.jsx), [Employe.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/admin/employee/Employe.jsx))**:
      - `onViewAttendance` now passes `row.userid?._id || row._id` directly instead of `row.rawname`.
    - **Backend ([attandence.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/attandence.js))**:
      - Updated `employeeAttandence` to search by `empId` before falling back to regex name matching.

- **Plot Management Submenu: Product Sales Dedicated Page & Clean Separation [COMPLETED]**:
  - **Requirement**:
    - Completely separate the Product Sales & Bookings functionality from the Plot Products catalog page.
    - Remove the 2nd tab ("Product Sales & Bookings") entirely from `/dashboard/plots/products`.
    - Place the dedicated Product Sales functionality exclusively under `/dashboard/plots/product-sales` with its own submenu item "Product Sales" directly below "Bookings" in the sidebar.
  - **Implementation**:
    - **Standalone Page ([ProductSalesPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductSalesPage.jsx))**:
      - Created a dedicated page component specifically rendering `ProductSalesTab` and `ProductCustomerLedgerModal`.
      - Renders clean top header banner with ShoppingCart icon, total booking counts, and full sales/booking actions (New Sale, View Booking, Collection, Passbook Ledger, Allotment Certificate, Settle/Cancel).
    - **Plot Products Page Streamlined ([PlotProductsPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/PlotProductsPage.jsx))**:
      - Completely removed the 2nd tab ("Product Sales & Bookings") from `VALID_TABS`, tab header buttons, and tab rendering.
      - Page now focuses purely on:
        1. **Product Master & Dimensions** (`catalog`)
        2. **Scheme Rules & Returns Matrix** (`schemes`)
        3. **Target & Extra Incentive Policy** (`incentives`)
    - **Sidebar & Routes ([sidebar.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/sidebar.jsx), [App.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/App.jsx))**:
      - Submenu "Product Sales" points directly to `/dashboard/plots/product-sales` rendering `<ProductSalesPage />`.
      - Route is secured with `RoutePermissionGuard` supporting `resource={["plot_booking", "plot_inventory"]}`.

- **Voucher Immediate Disbursement & Approval Lifecycle Fix [COMPLETED]**:
  - **Issue**:
    - When creating a financial voucher with "Disburse Immediately", the voucher was created in `PENDING` status with `paidAmount: 0`. The requested initial payment was discarded or not stored, and when a manager subsequently approved the voucher, it became approved as 100% due (unpaid) or reset already disbursed amounts to due.
  - **Fix & Clarification**:
    - **Voucher Model ([voucher.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/voucher.js))**: Added `initialPayment` to `voucherSchema` so initial requested disbursements are preserved.
    - **Approval Lifecycle ([voucher.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/voucher.js))**:
      - `createVoucher`: Stores `reqInitialPayment` on the voucher.
      - `approveVoucher`: Correctly checks `prevPaid` and calculates `additionalDisburse = Math.max(0, disbNum - prevPaid)`. Never resets already paid vouchers to "all due" and prevents duplicate bank ledger debits.
    - **UI Streamlining ([VoucherList.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/vouchers/VoucherList.jsx))**:
      - Hidden the "Source Payment Account (Cash / Bank) / Disburse Immediately" section in the Create Financial Voucher modal as requested. Vouchers are created cleanly for expense authorization, and disbursements are executed systematically upon Approval or via the designated "Pay" action.

- **Refund & Settlement Disbursement with Corporate Bank & Cash Treasury Authorization [COMPLETED]**:
  - **Requirement**:
    - When returning money / disbursing refund amounts (on `/dashboard/plots/booking/:id/ledger`, `/dashboard/plots/interest-calculator`, and in the product customer ledger modal), implement the exact options and security controls as voucher creation.
    - When online / bank transfer / cheque / UPI mode is selected, show all available corporate bank accounts the caller is authorized to disburse from (with live available balances and account numbers).
    - Enforce corporate bank permissions (`caller.bankPermissions` — `accessScope: 'all' | 'selected' | 'none'`, `allowPayments`, `allowedBankIds`).
    - When cash mode is selected, route through personal custody cash ledger (`myCashLedger`) showing live balance.
    - Ensure double-entry accounting in the treasury ledger (debiting the bank or cash ledger balance so company funds decrease accurately) and generate a valid financial `Voucher` matching the system schema.
  - **Implementation**:
    - **Treasury Helper ([plotRefundHelper.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotRefundHelper.js))**:
      - `resolveAndAuthorizePaymentLedger`: Enforces caller's bank permissions and cash custody constraints.
      - `disburseRefundTransaction`: Generates voucher number (`VCH-FY-XXXX`), creates financial `Voucher` (`status: 'PAID'`), atomically records a `DEBIT` entry in the corporate bank or cash ledger via `accountingService.recordLedgerEntry` to decrease balance, and returns the formatted `paymentEntry`.
    - **Database Schemas ([PlotBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotBooking.js), [PlotProductBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProductBooking.js))**:
      - Added `paymentLedgerId`, `paymentLedgerName`, `bankName`, and `accountNumber` to `refundPayments` subdocuments.
    - **Backend Services ([plotBooking.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotBooking.service.js), [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js))**:
      - Integrated `disburseRefundTransaction` into both immediate cancellation settlements and subsequent refund part-payments.
      - Updated statement formatting in `getBookingLedger` to display `[paymentLedgerName / bankName]`.
    - **Frontend Interfaces**:
      - [PlotBookingLedgerPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/booking/PlotBookingLedgerPage.jsx): Refactored the Disburse Refund Payment modal to use the centralized [Modalbox.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/custommodal/Modalbox.jsx) component (`max-w-lg`) with fixed sticky header and footer, responsive `max-h-[92vh]`, and internal body scrolling so form fields never exceed the viewport. Includes corporate bank account selector, live balance display, balance warning alert, and dynamic reference label for NEFT vs Cheque vs UPI.
      - [PlotInterestCalculator.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/calculator/PlotInterestCalculator.jsx): Added corporate bank account dropdown with live balances for immediate cancellation payouts.
      - [ProductCustomerLedgerModal.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductCustomerLedgerModal.jsx): Added treasury fetching and corporate bank / cash account selection in the product refund part-payment modal.

- **Commission Ledger Reversal on Booking & Product Cancellation [COMPLETED]**:
  - **Requirement**:
    - On the Plot Settlement & Cancellation Calculator page (`/dashboard/plots/interest-calculator`), when cancelling either a regular plot booking or a plot product sale booking, provide an option to reverse distributed commissions.
    - If "Reverse Commission" is chosen:
      - All commission amounts credited to Business Associates, Partners (override / direct), and Branch Partners for that booking must be debited from their respective ledger accounts.
      - Each debit entry must have the exact credited amount and proper narration matching the specific transaction (percentage, collection amount, receipt number, booking number, role).
      - Mark `PlotSponsorCommission` status as `reversed` with `reversedAt` and `reversalLedgerEntryId`.
    - If "Reverse Commission" is unchecked:
      - Beneficiaries retain their credited commission and no debit entries are added to their ledgers.
  - **Implementation**:
    - **Database Schemas**:
      - Updated [PlotSponsorCommission.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotSponsorCommission.js): Added `reversedAt` and `reversalLedgerEntryId` fields.
      - Updated [PlotBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotBooking.js) & [PlotProductBooking.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProductBooking.js): Added `commissionReversed`, `commissionReversalDate`, `commissionReversalCount`, and `commissionReversalAmount`.
    - **Backend Services**:
      - In [plotBooking.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotBooking.service.js) (`processCustomerRefund`) and [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js) (`cancelProductBookingAndRefund`):
        - When `reverseCommission: true`: iterated over all active `PlotSponsorCommission` records for the booking and posted corresponding `DEBIT` entries via `accountingService.recordLedgerEntry` using exact matching amounts and detailed transaction narrations referencing receipt numbers and percentages.
        - Prevented accidental deletion of commissions or entries on cancelled bookings in [plotDeveloper.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotDeveloper.service.js) (`syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`).
      - Added endpoint `GET /plots/bookings/:id/commissions` and `GET /plots/product-bookings/:id/commissions` in [plots.routes.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/router/plots.routes.js) and [plots.controller.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/controllers/plots.controller.js).
    - **Frontend Calculator ([PlotInterestCalculator.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/calculator/PlotInterestCalculator.jsx))**:
      - Added real-time fetch of booking commissions (`bookingCommissions`).
      - Added prominent `Cancel Booking & Settle` trigger button right in the top header action buttons (next to `Print Statement`) and right below the Settlement Parameters strip in an active commission summary banner.
      - Added interactive Commission Reversal control in the cancellation modal with toggle (`Reverse Distributed Commissions`), badge indicating total amount to debit (e.g. `₹21,215.66 to debit`), and collapsible breakdown of each beneficiary, receipt #, rate %, and amount (defaulted to expanded so users immediately see each beneficiary).
      - Updated financial valuation card to display live Commission distribution status.

- **Mandatory Project Assignment for Plot Products & Booking Filter [COMPLETED]**:
  - **Requirement**:
    - Make Project Name mandatory (not optional) when creating or updating Plot Products (`/dashboard/plots/products`).
    - When booking a plot product (`/dashboard/plots/products/book`), choosing the Project Name will show and filter the plot products that belong under that project.
  - **Implementation**:
    - **Frontend Modal ([ProductCatalogTab.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductCatalogTab.jsx))**:
      - Updated label to `Project Name *` with required asterisk.
      - Removed default option `-- All Projects / General Portfolio --` and replaced with required `-- Choose Project * --`.
      - Added frontend submit validation rejecting submission if `!form.projectId`.
    - **Backend Schema & Service ([PlotProduct.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/models/PlotProduct.js), [plotProduct.service.js](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/server/services/plots/plotProduct.service.js))**:
      - Made `projectId` required in the Mongoose schema.
      - Enforced mandatory `resolvedProjectId` validation on both `createProduct` and `updateProduct`.
    - **Product Booking Screen ([ProductBookingPage.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx))**:
      - Made `Project Name *` mandatory on booking creation.
      - Selecting a project actively filters the `Select Plot Product` dropdown to show only products registered under that project (with fallback auto-selection of the first product under that project).
      - Added submission check verifying `form.projectId`.
    - **Quick Sales Modal ([ProductSalesTab.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx))**:
      - Product option labels clearly display `[Project: {projectName}]`.

- **Button Icon Rendering Fix (React 19 Compatibility) [COMPLETED]**:
  - **Issue**:
    - Visiting pages using `<Button startIcon={<Plus size={16} />} />` (e.g. Developer Dashboard) threw `Uncaught Error: Element type is invalid: expected a string or a class/function but got: <Plus />. Check the render method of Button`.
  - **Root Cause**:
    - `Button.jsx` used `typeof StartIcon === 'function' || typeof StartIcon === 'object'` to render `<StartIcon />`. In React 19, an instantiated JSX element is an object, leading to `< <Plus /> />`.
  - **Fix**:
    - Updated [Button.jsx](file:///c:/Users/jai%20kishan/Desktop/Coding/Ems-goodnature/client/src/components/ui/Button.jsx) to check `isValidElement(StartIcon)` / `isValidElement(EndIcon)` first. If already a JSX element, it renders directly; otherwise, it instantiates it as a component (`<StartIcon className={...} />`).

- **Plot Settlement & Cancellation Calculator Layout Realignment [COMPLETED]**:
  - **Enhancement**:
    - Replaced the cramped single-line 12-column grid with a structured **Two-Tier Step-by-Step Layout**:
      - **Tier 1 (Booking Selection)**: Full-width search bar with quick autocomplete suggestions and an active contract pill badge showing the loaded booking number and customer name.
      - **Tier 2 (Settlement Parameters)**: 4 equal, well-balanced columns with consistent label headers, heights, and button states:
        1. **Settlement Action**: `+ Interest Return` vs `- Penalty Deduct`.
        2. **Interest Formula / Basis**: `Simple Interest` vs `Compounding` (or `Percentage (%)` vs `Flat Amount (₹)` in deduction mode).
        3. **Annual Rate / Penalty Value**: Input with unit suffix and scheme slab info.
        4. **Settlement / Cancellation Date**: Date picker aligned to the same grid height.

- **Plot Product Booking Allotment Certificate Layout Redesign [COMPLETED]**:
  - **Requirement**:
    - For plot product booking certificates (`/dashboard/plots/certificates/:id`):
      - Remove internal hierarchy & inventory breakdown: Business Associate, Partner Supervisor, Product Item, Dimensions (N/S/E/W), raw Unit Area & Quantity, Land Stock Reference (agreement numbers, raw allocation strings), and Unit Price Rate.
      - Add / keep clean official allotment fields:
        - `Total Area / कुल रकबा`: formatted cleanly as `${totalArea} Sq.Ft` (e.g. `400 Sq.Ft` without multiplication breakdown or dismil).
        - Dedicated clean land identification fields: `Mauja / मौजा`, `Thana No. / थाना`, `Khata No. / खाता`, `Khesra No. / खेसरा`.
        - For one-time (full payment): Upfront Paid `₹5,000`, Total Valuation `₹5,000`, Payment Status `FULLY SETTLED (100% PAID)`, Amount in Words, and official allotment header.
  - **Implementation**:
    - Updated [BookingCertificateViewer.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/printViewers/BookingCertificateViewer.jsx) for `isProductBooking`:
      - Calculated `unitArea` dynamically from length × width (`dims.north * dims.east`) or `product.areaSqFt`, and computed `totalArea = unitArea * qty`.
      - Replaced internal associate, supervisor, and inventory rows with dedicated rows for Mauja, Thana, Khata, Khesra, and Total Allocated Area.
      - Streamlined financial rows for one-time settlement (100% upfront) vs monthly EMI without displaying internal unit price rates or raw agreement stock references.

- **Downpayment & EMI Receipt Number Display and Removal of "RO-" Prefix [COMPLETED]**:
  - **Requirement**:
    - Show `Receipt No.` column in Downpayment (`/dashboard/plots/collections/downpayment`) and EMI (`/dashboard/plots/collections/emi`) collection lists.
    - Remove `RO` / `RO-` from generated receipt numbers across all collections (Plot DP, Plot EMI, Product Collections).
  - **Root Cause of RO**:
    - In `server/services/plots/plotCollection.service.js` line 438, receipt generation prefix was hardcoded as `RO-REC-PLT-${fyStr}`, producing receipt numbers such as `RO-REC-PLT-2627-00034`.
  - **Resolution**:
    - **Backend**:
      - In [plotCollection.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotCollection.service.js):
        - Changed `receiptPrefix` to `REC-PLT-${fyStr}` (removed `RO-`).
        - Seamlessly inherited sequence from legacy `RO-REC-PLT-${fyStr}` counter so numbering continues without restarts or gaps.
        - Updated `getReceiptById` to support receipt lookups by string with or without `RO-`.
      - Migrated existing documents in MongoDB (`plotreceipts`, `plotinstallments`, `counters`) to remove `RO-` (`REC-PLT-2627-XXXXX`).
    - **Frontend**:
      - In [ReceiptColumns.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/components/ReceiptColumns.jsx):
        - Added dedicated `Receipt No.` column right after `Date`, displaying the formatted receipt number and linking directly to `/dashboard/plots/receipts/:id`.
      - In [InstallmentCollection.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/InstallmentCollection.jsx):
        - Included `r.receiptNumber` in search query filter and updated search input placeholder to `"Search Receipt #, Booking, Plot #, Customer..."`.
      - In [ReceiptViewer.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/printViewers/ReceiptViewer.jsx) & [CollectionModals.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/installments/components/CollectionModals.jsx):
        - Ensured `(receiptNumber || '').replace(/^RO-/, '')` sanitizes any legacy `RO-` display in printable vouchers and action modals.

- **Product Collections Duplicate Entry Fix [COMPLETED]**:
  - **Issue**:
    - On `/dashboard/plots/collections/products` (Product Collections & Receipts), bookings with an initial downpayment showed **two duplicate entries**:
      1. `PRD-DP-PRD-BK-XXXX-XXX` (generated upon booking creation / update and stored in `b.collections`).
      2. `DP-PRD-BK-XXXX-XXX` (synthesized as a fallback downpayment collection).
    - This caused duplicate table rows and doubled KPI totals (e.g. `Total Collected: ₹10,000` instead of `₹5,000` and `Total Bills Issued: 2` instead of `1`).
  - **Root Cause**:
    - In `server/services/plots/plotProduct.service.js` under `getProductCollections(query = {})`:
      - Step 1 loops through `b.collections` and pushes the saved downpayment receipt (`receiptNumber: PRD-DP-${b.bookingNumber}`) and records it in `seenReceipts`.
      - Step 3 (legacy fallback for downpayments) checked `if (b.downPayment > 0 && !seenReceipts.has('DP-${b.bookingNumber}'))`.
      - Because the saved receipt was prefixed with `PRD-DP-` and not `DP-`, `seenReceipts.has('DP-...')` returned `false`, synthesizing a second collection row with `receiptNumber: DP-${b.bookingNumber}`.
      - A matching prefix omission existed in `server/services/plots/plotDeveloper.service.js` during associate commission generation.
  - **Resolution**:
    - In [plotProduct.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotProduct.service.js):
      - In Step 1, guarded against duplicate receipts in `b.collections`: `if (!col.receiptNumber || seenReceipts.has(col.receiptNumber)) continue;`.
      - In Step 3, verified `hasDpCaptured` across both `PRD-DP-` and `DP-` formats, checking `seenReceipts`, existing collections (`c.receiptNumber`, `c.installmentNumbers.includes(0)`, remarks, or full-payment collections). Only synthesizes a fallback downpayment collection if no downpayment receipt exists.
      - In `deleteProductCollection`, updated regex to `receiptNumber.replace(/^(PRD-)?DP-/, '')` so both prefixes locate the booking.
    - In [plotDeveloper.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotDeveloper.service.js):
      - Updated downpayment collection detection to check `hasDpInCollections` before synthesizing a fallback downpayment entry for sponsor commissions.

- **Plot Product View Action Modal Data Enrichment [COMPLETED]**:
  - **Requirement**:
    - In the "View Booking Details" action modal (`Eye` icon on `/dashboard/plots/products?tab=sales`), provide complete, comprehensive data:
      - Selected Scheme Plan name (e.g. `A-24`, `Gold Scheme`, etc.).
      - Contract Period / Tenure in Months and Years (e.g. `24 Months (2.0 Years)`).
      - Payment Scheme Type (`One-Time Full (100% Upfront / F.D.)` vs `Monthly EMI (Recurring / R.D.)`).
      - Return Rates & Maturity Matrix: Annual Return Rate % P.A. (`annualInterestRate`), RD Maturity Return % (`rdMaturityPercent`), FD Maturity Return % (`fdMaturityPercent`).
      - Associate Commission Policies: Business Associate %, Business Partner %, Branch Partner %.
      - Project Master Link: Project Name, code, and portfolio.
      - Land Acquisition Sourcing: All multi-agreement rows with Agreement Number, Mauja, Thana, Khata, Plot (Khesra), and allocated Sq.Ft / Dismil.
      - Financial Breakdown: Total Valuation, Paid Upfront / Monthly EMI, Total Amount Paid, Outstanding Due, Installment Counts, Payment Mode, and Txn/Cheque Ref.
      - Direct modal footer quick actions: Print Certificate, View Ledger, Edit Booking, and Close.
  - **Implementation**:
    - Updated [ProductSalesTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx) viewing modal with `size="4xl"` and dedicated `Scheme Plan, Period / Tenure & Policy Matrix` card, multi-parcel land allocation breakdown, payment details strip, and action footer.
    - Updated [plotProduct.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotProduct.service.js) to populate `projectId` (`name code location`) in both `getAllProductBookings` and `getProductBookingById`.

- **Plot Product Edit Page (Dedicated Full Screen Page instead of Modal) [COMPLETED]**:
  - **Requirement**:
    - When editing a Plot Product Booking from `/dashboard/plots/products?tab=sales`, instead of opening a limited modal box, it must navigate to a full dedicated page (the same form layout as "Sell Plot Product / New Booking").
    - The dedicated edit page must expose ALL options present at the time of a new sale: Customer selection & details, Business Associate auto-link, Project selection, Plot Product & Quantity piece stepper, Unit Price, Dimensions & Area Sq.Ft, Payment Plan (EMI vs One-Time Full), Tenure Months, Commission percentages (BA, BP, Branch), Maturity Returns (RD%, FD%), Annual Interest Rate %, Kisan Land multi-agreement stock allocations, Payment Mode, Transaction Ref, Booking Date, Booking Status, and Remarks.
  - **Implementation**:
    - **Frontend Routing**:
      - Added route `/dashboard/plots/products/edit/:id` in [App.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/App.jsx) protected with `RoutePermissionGuard` (`plot_booking`, action 3).
      - Updated Edit button in [ProductSalesTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx) to navigate to `/dashboard/plots/products/edit/${b._id}`.
      - Removed old `showEditModal` state, handlers, and the `<Modalbox open={showEditModal}>` markup from `ProductSalesTab.jsx`.
    - **Dedicated Page**:
      - Updated [ProductBookingPage.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/ProductBookingPage.jsx) to detect `useParams().id` (`isEditMode`).
      - In edit mode, fetches `GET /plots/product-bookings/:id`, pre-fills all form controls, customer, product, project, scheme returns, commissions, and multi-parcel Kisan Land sourcing rows.
      - Dynamic headers display `Edit Plot Product Booking — PRD-BK-XXXX-XXX` and banner with status and total amount paid.
      - Added Booking Status dropdown (`ACTIVE`, `COMPLETED`, `CANCELLED`) for edit mode in Card 3.
      - Form submission dynamically calls `PUT /plots/product-bookings/:id` in edit mode and redirects back to `/dashboard/plots/products?tab=sales`.
    - **Backend Support**:
      - Updated `updateProductBooking` in [plotProduct.service.js](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/server/services/plots/plotProduct.service.js) to accept and save `projectId`, `projectName`, `planName`, `promoterCommissionPercent`, `developerCommissionPercent`, `bpCommissionPercent`, `branchCommissionPercent`, `rdMaturityPercent`, `fdMaturityPercent`, `annualInterestRate`, and re-allocate `landSourcing` (releasing previous Kisan agreement allocations and booking new parcel allocations).

- **Plot Product Cancellation & Settlement Engine with Scheme Matrix Rate Integration [COMPLETED]**:
  - **Requirement**:
    - Add a **Cancel** action button on `/dashboard/plots/products?tab=sales` in the table actions column for each product booking row.
    - Clicking Cancel opens the cancellation & settlement calculator (`/dashboard/plots/interest-calculator?productBookingId=...`).
    - **Scheme Matrix Rate Auto-Prefill (Image 2)**:
      - The return rate is strictly linked to the Scheme Rules & Returns Matrix (`InvestmentSchemeConfig.schemeSlabs`) configured under `tab=schemes`:
        - Matched by `tenureMonths` (12, 24, 36, 48, 60, 72 months) and payment plan type:
          - If `FULL_PAYMENT` (One-Time / F.D.): applies `fdAnnualInterestRate` (% P.A.) with Compound Annual calculation.
          - If `MONTHLY_INSTALLMENT` (EMI / R.D.): applies `rdAnnualInterestRate` (% P.A.) with Compound Annual calculation.
          - Fallback to `annualInterestRate` stored on the product booking record.
    - **Deduction Mode (- Deduct Penalty)**:
      - Admin can toggle from `+ Interest %` to `- Deduct` (Percentage `%` or Flat `₹`).
      - In deduction mode, interest % is 0, and the deduction penalty is subtracted from total customer deposits to establish the Net Refund Liability.
    - **Cancellation Execution & Audit Trail**:
      - `POST /plots/product-bookings/:id/refund` executes atomic cancellation:
        1. Restores product piece inventory (`PlotProduct.unitsSold -= booking.quantity`).
        2. Restores Kisan land agreement stock allocations in `KisanLandAgreement` and logs `LandStockLedger`.
        3. Reverses sponsor commissions in `PlotSponsorCommission` to `'reversed'`.
        4. Generates initial expense `Voucher` if paid at cancellation, logs `PlotAuditLog`, and sets `status = 'CANCELLED'`.
    - **Ledger Reconciliation & Part-Payments**:
      - `POST /plots/product-bookings/:id/refund-payments` records subsequent part-payment disbursements.
      - Each disbursement logs an expense voucher, debits the running customer ledger, and updates `pendingSettlementBalance`.
      - When all part-payments are complete, the customer ledger hits exactly **₹0.00 Settled**.
      - Updated `ProductCustomerLedgerModal.jsx` to render cancellation banners, breakdown cards, and a "+ Disburse Part Refund" modal.

- **Common Modalbox Component Header Standardization & Clipping Fix [FIXED]**:
  - **Issue**: In `/dashboard/plots/products`, opening the "Create New Plot Product" modal resulted in the title text being horizontally cut in half / clipped at the top of the modal card.
  - **Root Cause**: `Modalbox` (`Modal.jsx`) already rendered its own sticky header containing the close `X` button and `p-6` body padding. `ProductCatalogTab.jsx` did not pass `title`, `subtitle`, or `icon` to `<Modalbox>`, and instead rendered a duplicate nested header inside the scrollable body with an inner `<div className="p-5 md:p-6 bg-white space-y-4">`. This resulted in double padding and caused the inner title to collide with and be clipped under the top border.
  - **Fix**:
    - Enhanced [Modal.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/Modal.jsx) and [Modalbox.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/custommodal/Modalbox.jsx) to natively support the `icon` prop alongside `title` and `subtitle`.
    - Standardized [ProductCatalogTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductCatalogTab.jsx) and [ProductSalesTab.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductSalesTab.jsx) to pass `title`, `subtitle`, and `icon` directly to `<Modalbox>`, removing the redundant nested header divs and duplicate padding.
    - Updated [ProductReceiptModal.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/products/components/ProductReceiptModal.jsx) with `showClose={false}` and `bodyClassName="p-0"` for full-bleed printable receipt layout.

- **Plot Cancellation & Settlement Calculator with Deduction Penalty or Interest Return [COMPLETED]**:
  - **Feature & Requirements**:
    - URL: `/dashboard/plots/interest-calculator`
    - Top settlement mode switcher:
      - **+ Interest % (`INTEREST_RETURN`)**: Calculates accrued simple/compound interest or growth on each deposited payment based on the booking date/receipt date and annual return percentage.
      - **- Deduct (`DEDUCTION_PENALTY`)**: Allows selecting **Percentage (%)** or **Flat Amount (₹)**. When selected, no interest percentage is applied; instead, it deducts the penalty from the total customer deposit and displays the net refund amount.
    - Bottom Action:
      - **"Cancel & Settle Booking"** button opens a confirmation modal detailing total principal deposited, deduction/interest adjustment, and net refund liability payable.
      - On confirm, calls `POST /plots/bookings/:id/refund`, which cancels the booking, releases the plot back to `AVAILABLE` inventory, reverses sponsor commissions, reverses the plot contract consideration in the ledger, and records the initial liability.
  - **Accounting Reconciled in Ledger (`PlotBookingLedgerPage.jsx` & `plotBooking.service.js`)**:
    - **Reversal Entry**: Contract consideration (`Credit: netPlotValue`) cancels the original debit.
    - **Settlement Adjustment Entry**:
      - Deduction mode: `Debit: refundDeduction` (Administrative penalty).
      - Interest return mode: `Credit: refundInterestAmount` (Growth appreciation).
    - **Refund Part-Payments (`POST /plots/bookings/:id/refund-payments`)**:
      - Admin can disburse refund payments in multiple installments over time.
      - Each disbursement creates an expense `Voucher` and logs a `Debit: p.amount` entry in the running ledger.
      - As part-payments are recorded, the running balance decreases towards 0 and reaches exactly **₹0.00 Settled** on final payment.
    - **UI Enhancements in Ledger Page**:
      - Prominent cancellation status banner with a dynamic disbursement progress bar (`totalRefundPaid / netSettlementAmount * 100%`).
      - KPI cards adapt to show: Total Principal Deposited, Cancellation Penalty / Interest Adjustment, Net Refund Liability, Refund Disbursed, and Remaining Settlement Balance.
      - "+ Disburse Refund Payment" modal enables quick payouts with mode, date, and transaction reference.

- **Booking Table Action Buttons 2-Row Alignment [COMPLETED]**:
  - Arranged the 8 action buttons in [`BookingColumns.jsx`](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/reports/components/BookingColumns.jsx) into 2 clean rows:
    - **Row 1 (4 buttons)**: View (`Eye`), Ledger (`BookOpen`), Settlement Calculator (`Calculator`), Certificate/Receipt (`Printer`/`Receipt`).
    - **Row 2 (4 buttons)**: Legal Agreement (`ScrollText`), Edit Contract (`Edit3`), Revision History (`History`), Delete Booking (`Trash2`).
  - Standardized button dimensions to `w-7 h-7` with compact column `minWidth: '150px'`.

- **Scheme Plan Dropdown Selection Display Sync [FIXED]**:
  - **Issue**: On `/dashboard/plots/addbooking` (Step 3) and `/dashboard/plots/booking/edit/:id`, the scheme details (Tenure, BA %, BP %, Branch Partner %) and Buyback badge showed below the dropdown, but the `<select>` dropdown itself showed `-- Choose Mandatory Scheme Plan --`.
  - **Cause**: Scheme slabs without a custom `planName` rendered `<option value="slab-${tenure}">`, but `handleSelectPlan` saved `planName: "A-${tenure}"`, causing a value mismatch in the HTML `<select>`. Additionally, when reaching Step 3 with pre-set `tenureMonths`, `form.planName` was unset, resulting in the select defaulting to the empty placeholder.
  - **Fix**:
    - Introduced canonical slab identifier `getSlabValue(s)` (`s.planName.trim() || 'slab-' + s.tenureMonths`) matching both `<option>` and `handleSelectPlan`.
    - Bound `<select value={currentSelectValue}>` which dynamically resolves the active scheme slab key.
    - Added auto-sync `useEffect` to ensure `form.planName` is populated as soon as `currentSchemeSlab` is active.



- **Branch Partner Incentive & Turnover Missing in Target Incentive Closing [FIXED]**:
  - **Issue**:
    - On `/dashboard/plots/incentives/new?type=TARGET_INCENTIVE`, Business Associates and Business Partners showed their business turnover and target incentives, but Branch Partners showed 0 collections/turnover and `No branch partner collections in this period.`
    - Local DB showed branch overrides because bookings had branch commissions configured, but on the online MongoDB database:
      1. In `server/services/plots/plotDeveloper.service.js` (`syncBookingSponsorCommissions`), `branchFixedPct` was resolved by looking at `matchedSlab.branchRdCommissionPercent ?? 0`. In the online DB, the scheme slabs had `0` configured for branch commission, causing `branchFixedPct` to evaluate to `0`. Consequently, `if ((targetBranchId || targetBranchPartnerId) && branchFixedPct > 0)` evaluated to `false`, and no `BRANCH_OVERRIDE` commission records were created at all when collections were recorded.
      2. In `server/services/plots/plotClosing.service.js`, `const isBranch = c.commissionRole === 'BRANCH_OVERRIDE' || Boolean(c.branchId);` incorrectly conflated regular commissions having a branch attached with branch overrides.
  - **Fix & Core Rules Implemented**:
    - **No Hardcoded 0.5% Fallback**: All hardcoded `0.5%` defaults were removed across `plotDeveloper.service.js`, `plotClosing.service.js`, `plotBooking.service.js`, `plotProduct.service.js`, `plotConfig.service.js`, `ProductBookingPage.jsx`, and `StepTermsAndPayment.jsx`.
    - **Direct Commission Percent**: Strictly comes from `https://demo.goodfeelsd.com/dashboard/plots/products?tab=schemes` (`branchRdCommissionPercent` / `branchFdCommissionPercent`). If 0% is configured, direct instant commission is 0.
    - **Target & Extra Incentive**: Strictly comes from `https://demo.goodfeelsd.com/dashboard/plots/products?tab=incentives` (`CommissionPolicyConfig.resolveSlab(..., 'BRANCH_PARTNER', sp.totalBusiness)`).
    - **Turnover Tracking**: Changed condition `if ((targetBranchId || targetBranchPartnerId) && branchFixedPct > 0)` to `if (targetBranchId || targetBranchPartnerId)`. Even when direct commission percentage is 0%, the `BRANCH_OVERRIDE` `PlotSponsorCommission` document is created with `amount: 0` and `collectionAmount: collectionPrincipal`, guaranteeing that the branch's total business turnover is preserved for target and extra incentive closings.
    - In `server/services/plots/plotClosing.service.js`:
      - Changed `isBranch` to strictly evaluate `c.commissionRole === 'BRANCH_OVERRIDE'`.
      - Populated `branchPartnerId` on `branchId` to display the actual Branch Partner user's name and sponsor code when assigned, falling back cleanly to Branch name and code.

- **Scheme Matrix Routing: Add Booking (Step 3) vs Plot Product Book/Sale Filter [COMPLETED]**:
  - **Requirement**:
    - Allow admin to mark/check a plan in the Scheme Matrix (`/dashboard/plots/products?tab=schemes`).
    - If checked, the plan appears only in **Add Booking (Step 3)** (`/dashboard/plots/addbooking`).
    - If unchecked, the plan appears in **Plot Product Book/Sale** (`/dashboard/plots/products/book`).
  - **Implementation**:
    - Added `showInAddBooking: { type: Boolean, default: false }` to `schemeSlabSchema` in `server/models/InvestmentSchemeConfig.js`.
    - Handled persistence of `showInAddBooking` in `server/services/investment.service.js` (`updateSchemeConfig`).
    - Included `showInAddBooking: Boolean(s.showInAddBooking)` in `plotConfig.service.js` (used by `/plots/rate-config` for regular plot booking) and `plotProduct.service.js` (`getAvailableTenures` for `/plots/products/tenures`).
    - In `ProductSchemeRulesTab.jsx`, added a dedicated "Add Booking (Step 3 Only)" column with checkbox controls next to each plan row and updated table headers and help banner.
    - In `client/src/pages/plots/booking/components/StepTermsAndPayment.jsx`, filtered `schemeSlabs` to show only plans where `Boolean(s.showInAddBooking) === true`, and removed redundant project select input (since project is already chosen on Step 2 with plot).
    - In `client/src/pages/plots/booking/components/BookingSummarySidebar.jsx`, added a dedicated **Project** info row in the right-hand financial summary card.
    - In `client/src/pages/plots/products/ProductBookingPage.jsx`, filtered `tenures` to show plans where `!t.showInAddBooking`.
    - **Mandatory Scheme Plan Validation**: Made `planName` strictly required before booking can proceed or be submitted. Disabled the "Confirm Book Plot" button if `planName` is unselected, displayed a warning banner under the dropdown, and enforced backend validation in `server/services/plots/plotBooking.service.js` to safeguard hierarchy commission calculations (BA, BP, and Branch Partner).

- **Fund Transfer Bank Permission Scoping & Live Role Enforcement [FIXED]**:
  - **Issue**:
    - When a user's role was changed from `admin` to `accountant` and their bank access was revoked (`bankPermissions.accessScope: 'none'`), the user could still see corporate bank transfers (`IDBI -> AXIS BANK` and `AXIS BANK -> Ghanshyam cash`) in `/dashboard/ledger/transfers` and KPI cards still showed bank pending amounts.
    - Cause 1: `server/controllers/fundTransfer.js` evaluated role scoping using `req.user.role` from the JWT token. Because JWT tokens in browser localStorage are stateless, the token maintained `role: 'admin'` until re-login, causing `['superadmin', 'admin', 'developer'].includes(req.user.role)` to evaluate `true` and skip scoping.
    - Cause 2: Unlike `ledger.js` and `voucher.js`, `fundTransfer.js` never checked `bankPermissions`. Even with `bankPermissions.accessScope: 'none'`, all bank transfers were returned.
    - Cause 3: In `FundTransfersPage.jsx`, the Approve/Reject buttons were displayed based on hardcoded `isSuperOrAdmin = ['superadmin', 'admin', 'developer', 'grant'].includes(currentUserRole)` rather than checking granular permissions (`hasPermission(currentUser, 'fund_transfer', 3)`).
  - **Fix**:
    - In `server/controllers/fundTransfer.js`:
      - Created `buildTransferScopeFilter` which queries the fresh user record from MongoDB (`User.findById(userId).select('role permissions bankPermissions')`), instantly enforcing any role or bank permission changes made in the admin panel regardless of stale JWT token contents.
      - Enforced `bankPermissions.accessScope`: if `'none'`, strictly excludes third-party transfers involving corporate banks, while allowing direct participants (where `fromUserId/toUserId` or `fromLedgerId/toLedgerId` is the user's cash ledger) to see and sign off on transfers incoming to or originating from their personal cash drawer.
      - Updated `approveTransfer` to ensure recipient cashiers (`isRecipientUser`) can acknowledge receipt of cash into their drawer without being blocked by source bank payment checks (as the source bank disbursement was already authorized by the initiating administrator).
      - Combined query filters cleanly using `$and` arrays so `search`, `status`, and `ledgerId` do not overwrite role/bank scoping `$or` conditions.
      - Updated `getTransferStats`, `requestTransfer`, `approveTransfer`, `rejectTransfer`, and `cancelTransfer` to check live DB permissions, standard CRUD action numbers (3 for approve, 4 for cancel), and verify bank disbursement/receipt permissions when bank accounts are involved.
    - In `client/src/pages/admin/ledger/FundTransfersPage.jsx`:
      - Replaced `isSuperOrAdmin` with `hasPermission(currentUser, 'fund_transfer', 3)` and `isRecipient` for `canApprove`, `hasPermission(currentUser, 'fund_transfer', 4)` for `canCancel`, and `hasPermission(currentUser, 'fund_transfer', 2)` for initiating transfer requests.
      - Added `'BANK_WITHDRAWAL'` ("Bank Withdrawal to Cash") to `server/models/FundTransfer.js` enum and modal dropdown, renamed `'Cash Handover to Staff'` to `'Cash Transfer'`, and introduced smart auto-detection of transfer mode based on selected source/destination account types.

- **Sponsor Commission Realization for Approved Bank/Online Receipts [FIXED]**:
  - **Issue**:
    - When taking installment, downpayment, or product collections via cash, receipts are immediately `APPROVED` and commissions are credited directly to the sponsor's ledger (Business Associate, Parent Partner, Branch).
    - However, when collections were taken via online/bank (`paymentMode: 'bank_transfer' | 'neft_rtgs' | 'cheque' | 'upi'`), the receipt was initially saved with `status: 'PENDING'`.
    - When `syncBookingSponsorCommissions` ran on the pending receipt, it checked `if (fixedAmt > 0 && receipt.status !== 'PENDING')` before creating the ledger entry, causing `PlotSponsorCommission` documents to be created with `ledgerEntryId: null`.
    - Later, when the admin approved the receipt via `/plots/receipts/:id/approve` (`approveReceipt`), `receipt.status` became `'APPROVED'` and `syncBookingSponsorCommissions` ran again. Because `existingReceiptComms.length > 0` was true, the loop executed `continue;` and skipped creating the ledger entries, leaving `ledgerEntryId: null` forever and never crediting the sponsor's ledger.
  - **Fix**:
    - In `server/services/plots/plotDeveloper.service.js` (`syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`):
      - Added realization handling inside `if (existingReceiptComms.length > 0)`: whenever `!c.ledgerEntryId && receipt.status === 'APPROVED' && Number(c.fixedAmount || c.amount || 0) > 0`, it records the missing ledger entry in the sponsor's ledger (`accountingService.recordLedgerEntry`), assigns `c.ledgerEntryId = entry._id`, adds it to `validEntryIds`, and saves `c`.
    - In `server/services/plots/plotCollection.service.js`:
      - Made bank receipt ledger recording idempotent in `approveReceipt` by verifying `existingBankEntry`.
      - Added cleanup of bank receipt entries in `rejectReceipt` if an approved receipt is later rejected.
    - In `server/services/investment.service.js`:
      - Added `Ledger` import, resolved `ledgerId` for investment collections, and ensured bank/cash ledger entries are recorded idempotently upon collection/approval.

- **HTML Pattern Validation with Indian Comma Separator (`NumberInput`) [FIXED]**:
  - **Issue**:
    - When users filled in forms containing formatted numbers with commas (e.g., `₹ 78,458` in `NumberInput` or `CommissionPolicyMatrix`), submitting the form triggered HTML5 constraint validation: `"Please match the requested format."`.
    - Cause: The inputs were rendered with `pattern="[0-9]*"`, but the formatted display value contains commas (and optional decimal dots).
  - **Fix**:
    - In [NumberInput.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/components/ui/NumberInput.jsx), made `pattern` support commas and decimals (`^[0-9,]*$` or `^[0-9,]*(\.[0-9]*)?$`), and auto-detected decimal allowances when `allowDecimal` or `step="any"` is specified.
    - In [CommissionPolicyMatrix.jsx](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/client/src/pages/plots/seriesMaster/components/CommissionPolicyMatrix.jsx), updated manual table input patterns to `^[0-9,]*$`.

- **Commission Immutability & Historical Ledger Preservation [COMPLETED]**:
  - **Critical Accounting Flaw Discovered**:
    - Previously, in `server/services/plots/plotDeveloper.service.js` (`syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`), every synchronization run executed `PlotSponsorCommission.deleteMany({ bookingId })` and looped over all historical receipts/collections, recalculating commissions for all past transactions using the *current* `InvestmentSchemeConfig` slab percentages.
    - Whenever commission percentages (e.g. Branch Partner, Business Associate, or Business Partner) were modified in `/dashboard/plots/products?tab=schemes` (e.g. from 1.2% to 2.1%), creating any new bill or viewing installments caused all past historical transactions in the ledger to be retroactively recalculated and overwritten with the new rate and amount.
  - **Resolution & Architecture**:
    - Removed destructive `deleteMany` calls from both `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`.
    - Implemented a **non-destructive historical preservation pattern**:
      1. Group existing active commissions by `receiptId` (or `receiptNumber` for products).
      2. If commissions already exist for a receipt (`existingReceiptComms.length > 0`), that receipt has already been billed: its commission percentage (`fixedPercent`), amount, and ledger entry are **permanently locked and immutable**. Past receipts are preserved intact and skipped from new slab rate recalculation.
      3. Only if a receipt's principal collection amount was modified in the UI is the commission amount adjusted proportionally using the *locked* `fixedPercent` stored on that commission record (never new slab rates).
      4. Only **new receipts** lacking commission records enter the dynamic slab resolution logic to calculate rates and amounts from the active `InvestmentSchemeConfig`.
      5. Only orphaned commissions and ledger entries for deleted/rejected receipts are purged.
    - Fixed `deleteProductBooking` in `server/services/plots/plotProduct.service.js` to delete by `productBookingId` instead of `bookingId`.

- **First-Class Branch Entity Commission Ledger & Section 3 Target Slabs [COMPLETED]**:
  - **Problem & Architectural Realignment**:
    - Previously, `addbranch.jsx` offered a dropdown of Business Associates (lowest tier) to assign as "Branch Partner", violating the sales hierarchy (`Branch -> Business Partner -> Business Associate`).
    - Furthermore, branches already have assigned Branch Managers (`Branch.managerIds`). However, assigning personal managers as commission recipients conflates salaried employee payroll (TDS Section 192) with corporate franchise commission overrides (TDS Section 194H), corrupting personal payroll ledgers when multiple managers run a branch.
    - **Solution**: The physical `Branch` itself (`BIHAR SHARIF BRANCH`, `RAJGIR BRANCH`) was promoted to a **first-class ledger account** (`ledgerType: 'branch'`, `branchId`).
  - **Key Implementations**:
    1. **Schema & Models**:
       - `server/models/ledger.js`: Added `branchId: { type: ObjectId, ref: 'Branch' }` and added `'branch'` to `ledgerType` enum.
       - `server/models/PlotSponsorCommission.js`: Added `branchId: { type: ObjectId, ref: 'Branch', default: null }`, made `sponsorId` optional (`required: false`), and registered `'BRANCH_OVERRIDE'` role.
       - `server/models/PlotClosing.js`: Added `branchId` to `sponsorSummarySchema`, made `sponsorId` optional (`required: false`).
       - `server/models/entry.js`: Added `'commission_branch'` to `source` enum.
    2. **Accounting Service (`server/services/accountingService.js`)**:
       - Updated `recordLedgerEntry` to accept `branchId`, find/upsert `Ledger.findOne({ branchId })`, and auto-create the Branch Ledger account with `ledgerType: 'branch'` and `name: '${branch.name} BRANCH'`.
    3. **Plot Sourcing & Automatic Override (`server/services/plots/plotDeveloper.service.js`)**:
       - Updated `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions` to compute 0.5% override directly on collection receipts and credit the `branchId` ledger account.
       - *Caveat & Bugfix*: In `syncBookingSponsorCommissions` and `syncProductBookingSponsorCommissions`, when building `closingTagMap` from `existingComms`, `c.sponsorId` is `null` for pure branch override commission documents (`commissionRole: 'BRANCH_OVERRIDE'`). Added safe entity fallback `(c.sponsorId || c.branchId || '').toString()` to prevent `TypeError: Cannot read properties of null (reading 'toString')` when regenerating installments.
       - Fixed booking resolution so that bookings always record `branchId` and default `branchCommissionPercent: 0.5`.
    4. **Quarterly Incentive Closing (`server/services/plots/plotClosing.service.js`)**:
       - Imported `models/branch` to ensure Mongoose schema registration for `.populate('branchId')`.
       - In `previewPlotClosing`, aggregated `commissionRole === 'BRANCH_OVERRIDE'` by `branchId`, resolved Section 3 slabs (`BRANCH_PARTNER`) for the Branch Entity, and computed Target & Extra slab incentives using the branch's total period collection turnover.
       - In `executePlotClosing` and `editPlotClosing`, recorded incentives directly to the Branch's ledger account.
    5. **Ledger Controller & RBAC Permissions**:
       - `server/controllers/ledger.js`: Auto-creates and populates `branchId` ledgers in `ledger()` list, `visibleLedgers`, and `Entries` (/entries/:id).
       - Added `branch_ledger: "Branch Partner Ledgers"` to `userPermissionsConfig.js` (`AllPermissionNames`, `MODULE_CATEGORIES.finance`, and default role presets).
       - Updated `RoutePermissionGuard.jsx`, `App.jsx`, and `sidebar.jsx` to support multi-permission checks (`resource={["branch_ledger", "sponsor_ledger"]}`).
       - Updated `ledgerpagelist.jsx` to render physical branches with the 🏢 `Building2` icon, `Branch Partner` tag, and direct access to statements and payout vouchers.
       - Replaced the misleading BA dropdown in `addbranch.jsx` with an informative 0.5% Branch Commission notice card and updated `BranchManager.jsx` table & card views.

- **3-Tier Hierarchy (Branch Partner -> Business Partner -> Business Associate) & 0.5% Branch Commission Override [COMPLETED]**:
  - **Context & Architecture**:
    - The sales structure operates in a 3-tier hierarchy:
      1. **Branch / Regional Head (Branch Partner)**: Associated with the physical `Branch` (`branch.branchPartnerId`). Automatically earns a **0.5% Branch Commission override** on every booking collection realized within that branch.
      2. **Business Partner (BP)**: Senior sponsor (`sponsorId = null`), earning direct slab commissions and team differential commissions from downline associates.
      3. **Business Associate (BA)**: Downline sponsor (`sponsorId = partnerId`), earning direct slab commissions on self-sourced bookings.
    - Uses the unified authentication and portal model: Branch Partners log in via the existing sponsor portal (`/dashboard/business-developer`), which automatically detects their Branch Partner status, renders the 🏢 Branch Partner badge, calculates Branch Sales Turnover, and lists all BPs and BAs in that branch as subordinates.
  - **Backend Implementations**:
    - **Models**:
      - `server/models/branch.js`: Added `branchPartnerId: { type: ObjectId, ref: 'user', default: null }`.
      - `server/models/PlotBooking.js`: Added `branchId: { type: ObjectId, ref: 'Branch' }` and `branchPartnerId: { type: ObjectId, ref: 'User' }`.
      - `server/models/PlotProductBooking.js`: Added `branchId` and `branchPartnerId`.
      - `server/models/PlotSponsorCommission.js`: Added `'BRANCH_OVERRIDE'` to `commissionRole.enum`.
    - **Branch Management Controller (`server/controllers/admin.js`)**:
      - Updated `addBranch` and `editBranch` to save `branchPartnerId`, populate `branchPartnerId` in responses, and auto-add the branch to the sponsor's `branchIds`. Also populated `branchPartnerId` in `firstfetch`.
    - **Booking Sourcing & Branch Resolution**:
      - `server/services/plots/plotBooking.service.js` & `plotProduct.service.js`: Resolves branch from booking input, sponsor's `branchIds[0]`, parent sponsor's branch, or physical branch, and automatically pulls `branch.branchPartnerId` onto the booking record.
    - **Commission Calculation & Ledger Posting (`server/services/plots/plotDeveloper.service.js`)**:
      - In `syncBookingSponsorCommissions` & `syncProductBookingSponsorCommissions`: Computes $\text{Branch Override} = \text{Collection Realized} \times 0.5\%$.
      - Automatically creates a double-entry Credit transaction in the Branch Partner's universal ledger (`source: 'commission_branch'`) referencing the booking and collection receipt.
      - Saves an audit record in `PlotSponsorCommission` with `commissionRole: 'BRANCH_OVERRIDE'`.
      - Updated cleanup to preserve `commission_branch` when removing obsolete commission entries.
      - In `getSponsorDashboardStats`: Detects Branch Partner via `Branch.findOne({ branchPartnerId: sponsor._id })`, scopes branch bookings and collections, adds `roleDisplay: "Branch Partner (<Branch Name>)"`, branch sales turnover, and displays all branch BPs & BAs in network.
      - In `getSponsorStatement`: Maps transactions with role label `"Branch Override (0.5%)"`.
      - In `getSponsors`: Added `roleType === 'branch_partner'` filter and returned `isBranchPartner` & `branchPartnerBranch`.
    - **Monthly Target Closing (`server/services/plots/plotClosing.service.js`)**:
      - Detects `isBranch` partner and computes monthly target slabs matching Section 3 Branch Partner targets.
  - **Frontend Implementations**:
    - **Admin Organization (`addbranch.jsx`, `BranchManager.jsx`)**:
      - `addbranch.jsx`: Added Branch Partner selection dropdown using custom portal `Select`, fetching all registered sponsors with formatted badges (`Name (Code) — Role`).
      - `BranchManager.jsx`: Added "Branch Partner (0.5% Override)" table column with avatar & sponsor code, and dedicated override badge pill in grid view cards.
    - **Sponsor Views (`PlotBusinessDevelopers.jsx`, `BusinessDeveloperDashboard.jsx`)**:
      - `PlotBusinessDevelopers.jsx`: Added "🏢 Branch Partner" badge in Designation column and "🏢 Branch Partners" filter tab.
      - `BusinessDeveloperDashboard.jsx`: Displays "🏢 Branch Partner (Branch Name)" badge in profile header.
    - **Ledger Viewing**:
      - Branch Partner override transactions are viewable under `/dashboard/ledger/branch-partners` and individual ledger statements (`/dashboard/ledger/:id`) with real-time balance calculations.
  - **Documentation Updates**:
    - Updated `docs/STRUCTURE.md` with new models, modular plot sub-services, and client components.
    - Updated `docs/ARCHITECTURE.md` with Section 3.E data flow diagram.
    - Updated `docs/PROJECT_CONTEXT.md` Section 3.D with 3-tier hierarchy details.
    - Updated `docs/DECISIONS.md` with Decision #9.
    - Updated `docs/BUSINESS_PARTNER_ASSOCIATE_SPEC.md` with 3-tier hierarchy and commission sequence.

- **Plot Booking Ledger Dedicated Page & Table Action [COMPLETED]**:
  - **Feature**: User requested a dedicated booking ledger accessible directly from the Actions column in the Plot Bookings table (`/dashboard/plots/booking`), rendered as a full page rather than a modal.
  - **Backend**:
    - Created `getBookingLedger(id)` in `server/services/plots/plotBooking.service.js` and exposed via `plotsService.getBookingLedger(id)` in `server/services/plots/index.js`.
    - Implemented `getBookingLedger` controller in `server/controllers/plots.controller.js` and mounted route `GET /plots/bookings/:id/ledger` in `server/router/plots.routes.js`.
    - Calculates real-time running ledger entries: Initial Contract Plot Consideration (Debit), each realized receipt collection (Credit), and any cancellation refunds, alongside full KPI summaries, installments schedule, and customer/plot metadata.
  - **Frontend**:
    - Built `client/src/pages/plots/booking/PlotBookingLedgerPage.jsx` featuring:
      - Back navigation, booking status/scheme badges, and quick action buttons ("Print Statement", "Collect Payment", "View Full Contract").
      - 5 KPI summary cards (Gross Value, Discount, Net Payable Debit, Realized Credit, Outstanding Balance Dr).
      - Amount in words banner using `amountInWords` utility.
      - Tabbed layout: Tab 1 "Financial Statement" (chronological running ledger table with search filter and printable receipts), Tab 2 "Installments Schedule" (due dates, principal, fine, paid amounts), Tab 3 "Allottee & Plot Details" (dimensions, boundaries, master data).
      - Official Print Statement generator formatted for A4 printing with company branding, table of accounts, and signature lines.
    - Wired up routes in `client/src/App.jsx` for `/dashboard/plots/booking/:id/ledger` and `/dashboard/plots/booking/ledger/:id` in both `managementRoutes` and `sponsorRoutes`.
    - Added dedicated emerald `BookOpen` action button in `BookingColumns.jsx` (`Actions` column of `/dashboard/plots/booking`) navigating directly to `/dashboard/plots/booking/${b._id}/ledger`.
    - Added an "Account Ledger" button in the action header of `PlotBookingDetails.jsx` for seamless navigation.

- **Plot Commission Slabs Magnitude Mismatch & Dynamic Range Labels [COMPLETED]**:
  - **Issue**: Slabs configured in Plot Products Policy were typed with 5 zeros (`100000` - `149999`) representing ₹1 Lakh to ₹1.5 Lakh instead of ₹10 Lakhs to ₹15 Lakhs (`1000000` - `1499999`). Consequently, Anuj Kumar's achieved period business of `₹11,00,000.00` (11 Lakhs, 7 digits) exceeded `₹3,00,000` (3 Lakhs), matching the 6th slab (`300000` to `Unlimited` at 2%), and displaying the hardcoded `₹3,00,000+` label.
  - **Fixes**:
    - **Database Policy Correction**: Updated `PLOT_PRODUCT` and `PLOT_SALE` target slabs to the intended 10-Lakhs tier scale (`1 - 9,99,999` @ 1%, `10,00,000 - 14,99,999` @ 1.2%, up to `30,00,000 & Above` @ 2.0%). Under this scale, ₹11,00,000 falls accurately into Slab 2 (`₹10,00,000 - ₹14,99,999`) yielding **1.2%** (`₹13,200.00`), and Mahendra's ₹8,30,000 falls into Slab 1 (`₹1 - ₹9,99,999`) yielding **1.0%** (`₹8,300.00`).
    - **Dynamic Slab Labeling (`server/models/CommissionPolicyConfig.js`)**: Replaced stale template strings with dynamic `formatSlabRange` so labels always reflect the true Indian range format (e.g. `₹10,00,000 - ₹14,99,999` or `₹30,00,000 & Above`).
    - **Centralized Amount in Words Utility (`client/src/utils/numToWord.jsx`)**: Built a robust `amountInWords(num, options)` common helper that converts numbers into proper Title Case Indian currency words (e.g. `1499999` -> `"Fourteen Lakh Ninety Nine Thousand Nine Hundred And Ninety Nine Rupees"`). Integrated below all slab inputs in `CommissionPolicyMatrix.jsx`, `PayLedgerModal.jsx`, and `SetupPayoutModal.jsx`.

- **Universal Commission & Incentive Policy Unification & Legacy System Removal [COMPLETED]**:
  - **Single Commission Architecture**: Removed old/legacy dual commission systems (`PLOT_SALE` vs `INVESTMENT_RD_FD` policy splits).
  - **Direct Commission**: Governed strictly by `/dashboard/plots/products?tab=schemes` (`/investments/config`) defining instant fixed payouts per plan tenure and payment option (RD vs FD) for Business Associates and Business Partners.
  - **Target & Extra Incentive Policy**: Governed strictly by `/dashboard/plots/products?tab=incentives` (`CommissionPolicyMatrix.jsx` / `CommissionPolicyConfig.js`). Configured with exact user-specified slabs:
    - **Business Associate (BA)**:
      - Target Incentive: ₹1-₹1,99,999: 1.0%; ₹2,00,000-₹2,99,999: 1.2%; ₹3,00,000-₹3,99,999: 1.4%; ₹4,00,000-₹4,99,999: 1.6%; ₹5,00,000-₹5,99,999: 1.8%; ₹6,00,000 & Above: 2.0%.
      - Extra Incentive & Rewards: ₹1-₹7,99,999: 0.5% (Motorcycle / Laptop); ₹8,00,000-₹11,99,999: 0.6% (Goa / Thailand Tour); ₹12,00,000-₹15,99,999: 0.7% (Luxury Car / Gold Fund); ₹16,00,000-₹19,99,999: 0.8% (Executive Bonus); ₹20,00,000-₹23,99,999: 0.9% (Leadership Bonus); ₹24,00,000 & Above: 1.0% (Crown Director Club).
    - **Business Partner (BP)**:
      - Target Incentive: ₹1-₹3,99,999: 0.5%; ₹4,00,000-₹5,99,999: 0.6%; ₹6,00,000-₹7,99,999: 0.7%; ₹8,00,000-₹9,99,999: 0.8%; ₹10,00,000-₹11,99,999: 0.9%; ₹12,00,000 & Above: 1.0%.
      - Extra Incentive & Rewards: ₹1-₹15,99,999: 0.25% (Foreign Tour); ₹16,00,000-₹23,99,999: 0.30% (SUV / Luxury Car); ₹24,00,000-₹31,99,999: 0.35% (Flat / Villa Bonus); ₹32,00,000-₹39,99,999: 0.40% (Partner Elite Shield); ₹40,00,000-₹47,99,999: 0.45% (Partner Sovereign Award); ₹48,00,000 & Above: 0.50% (Chairman Circle Partner).
    - **Branch Partner (Regional Head)**:
      - Target Incentive: ₹1-₹7,99,999: 0.5%; ₹8,00,000-₹11,99,999: 0.6%; ₹12,00,000-₹15,99,999: 0.7%; ₹16,00,000-₹19,99,999: 0.8%; ₹20,00,000-₹23,99,999: 0.9%; ₹24,00,000 & Above: 1.0%.
      - Extra Incentive & Rewards: ₹1-₹31,99,999: 0.25% (Branch Product Trophy); ₹32,00,000-₹47,99,999: 0.30% (Branch Star Trophy & Bonus); ₹48,00,000-₹64,99,999: 0.35% (Regional Top Branch Trophy); ₹65,00,000-₹79,99,999: 0.40% (Excellence Shield); ₹80,00,000-₹99,99,999: 0.45% (State Leadership Trophy); ₹1,00,00,000 & Above: 0.50% (National Champion Branch Award).
  - **Closing Aggregation (`plotClosing.service.js`)**: All business sales (both Plot Bookings and Investment RD/FD collections) aggregate together to form the sponsor's total business turnover, and evaluate against this single unified policy.
  - **UI Cleanup**:
    - Removed `Policy Type: [Plot Sale (Standard)] [Investment (RD / FD)]` toggle in `CommissionStructurePage.jsx` and `CommissionPolicyMatrix.jsx`.
    - **Removed Legacy Base Fixed % (1% BP / 2.5% BA)**: Removed the misleading `Base Fixed %` and `Total Effective %` columns and top banner from `CommissionStructurePage.jsx`. The Target Incentive table now strictly displays `Qualifying Collection Range` and `Target Incentive % (At Period Closing)`.
    - Auto-migrated database policies in MongoDB so `fixedCommissionPercent: 0` is set across all roles and target slabs.

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
- **Plot Product Scheme Matrix: Annual Interest Rate, RD Yearly Compounding & Actual Plot Sale Slabs [COMPLETED]**:
  - **Math & Compounding Models (`client/src/utils/schemeInterestCalculator.js`)**:
    - **R.D. (Recurring Deposit) Yearly Compounding**: Implemented formula for monthly installments with annual compounding: $\sum_{k=1}^{M} P \times (1 + r/100)^{(M - k + 1) / 12}$.
    - **F.D. (Fixed Deposit) Standard Compounding**: Standard quarterly compounding $(1 + r/400)^{M/3}$ and annual compounding $(1 + r/100)^{M/12}$.
  - **Backend Model & Services (`InvestmentSchemeConfig.js`, `investment.service.js`, `plotProduct.service.js`)**:
    - Added `planType` (`'INVESTMENT_BUYBACK'` vs `'REGISTRY_SALE'`) and `annualInterestRate` (default 10.5% p.a.) to `schemeSlabSchema`.
    - Changed `rdMaturityPercent` and `fdMaturityPercent` `min: 100` to `min: 0` to officially support Actual Plot Sale (0% customer return, active hierarchy commissions).
    - Preserved `planType`, `annualInterestRate`, and `planName` across `updateSchemeConfig` and `getAvailableTenures()`.
  - **Frontend Matrix UI (`ProductSchemeRulesTab.jsx` & `ProductBookingPage.jsx`)**:
    - Removed `Plan Type` column as requested by user; simplified table to single `+ Add Tenure Slab` button.
    - If Annual Rate or RD/FD return is set to `0`, the row naturally represents an Actual Plot Sale (0% customer return, active hierarchy commissions).
    - Live auto-calculation from Annual Rate (% p.a.) into RD Return % (Yearly Compounding) and FD Return %.
    - Row-level recalculation action (`RotateCcw`) to re-sync returns from Annual Rate at any time.
    - Backend automatically infers `planType: 'REGISTRY_SALE'` when returns are 0, and `'INVESTMENT_BUYBACK'` when returns > 0, ensuring full backwards compatibility without requiring a dedicated input column.
    - Updated `ProductBookingPage.jsx` tenure selection dropdown to clearly distinguish between `Actual Plot Sale (0% Return / Registry)` and `Return: RD X% | FD Y%`.
- **Plot Booking Step 3: Scheme Plan Selector (by Plan Name) & Dynamic Hierarchy Commissions [COMPLETED]**:
  - **Backend Model & Services (`PlotBooking.js`, `plotConfig.service.js`, `plotBooking.service.js`, `plotDeveloper.service.js`)**:
    - Added `planName`, `bpCommissionPercent`, `branchCommissionPercent`, `rdMaturityPercent`, `fdMaturityPercent`, and `annualInterestRate` fields to `PlotBooking` schema.
    - Enhanced `getRateConfig()` in `plotConfig.service.js` to attach `schemeSlabs` from `InvestmentSchemeConfig`.
    - Enhanced `createBookingOrHold` in `plotBooking.service.js` to accept and persist plan name and locked commission rates.
    - Updated `syncBookingSponsorCommissions` in `plotDeveloper.service.js` to use dynamic `baFixedPct`, `bpFixedPct`, and `combinedFixedPct` from the booking's selected plan rather than hardcoded 5%/2%/7%.
  - **Frontend UI (`PlotBooking.jsx`, `StepTermsAndPayment.jsx`, `BookingSummarySidebar.jsx`, `PlotBookingDetails.jsx`)**:
    - Redesigned the Scheme Plan card to a clean, light, seamless styling matching the `PROJECT NAME` card with compact inline commission badges.
- **Plot Product Booking (`/dashboard/plots/products/book`): Scheme Plan Selector & Dynamic Commission Locking [COMPLETED]**:
  - **Backend Model & Services (`PlotProductBooking.js`, `plotProduct.service.js`, `plotDeveloper.service.js`)**:
    - Added `planName`, `promoterCommissionPercent`, `developerCommissionPercent`, `bpCommissionPercent`, `branchCommissionPercent`, `rdMaturityPercent`, `fdMaturityPercent`, and `annualInterestRate` to `PlotProductBooking` schema.
    - Updated `createProductBooking` to store these locked plan rates on booking creation.
    - Updated `syncProductBookingSponsorCommissions` in `plotDeveloper.service.js` to prioritize matching scheme slabs by `booking.planName` first, then `booking.tenureMonths`, and respect custom locked commissions.
  - **Frontend UI (`ProductBookingPage.jsx` & `ProductSalesTab.jsx`)**:
    - Upgraded Card 3 from simple tenure selection to full Scheme Plan & Tenure dropdown uniquely identified by `getPlanKey` (`t._id` or composite key) to prevent value collisions when multiple slabs share the same name (e.g. `A-24`).
    - Kept selector UI minimal and clean without cluttering commission badge strips.
    - Updated right summary card to reflect Scheme Plan Name and Tenure cleanly.
    - Cleaned up duplicate icons on `ProductSalesTab.jsx` action button to use standard `<Plus size={15} />`.
    - Removed redundant manual asterisk from `DateInput` labels in `ProductBookingPage.jsx` to prevent `* *` duplicate asterisk rendering.
    - Cleaned up `BookingCertificateViewer.jsx`: removed "Plot & Fractional Land Development Division" subheader, "Official Product Certificate" badge, and subtitle disclaimer sentence as requested.
    - Fixed Overdue / Late Fine Calculation: Removed erroneous `+ 1` from `diffDays` calculation across backend services (`plotProduct.service.js`, `plotCollection.service.js`) and frontend forms (`ProductReceivePaymentForm.jsx`, `ProductInstallmentCollectModal.jsx`, `ProductCustomerLedgerModal.jsx`, `InstallmentCollection.jsx`). When paying on the exact due date (e.g. 14 Sep for 14 Sep), `diffDays` is now properly `0`, with `0 Days` delay, `₹0` late fine, and status remaining `Pending` / on-time.
    - Redesigned "Live Payment Assessment" banner in `ProductReceivePaymentForm.jsx` from heavy dark gradient to a clean, light card matching the rest of the page.
- **Independent Annual Interest Rates for RD & FD on Same Tenure Matrix [COMPLETED]**:
  - **Requirement**: Allow entering different annual interest rates for R.D. (Recurring Deposit / Monthly EMI) and F.D. (Fixed Deposit / One-Time Full Payment) within the same tenure slab row, and auto-calculate each return percent independently for its respective rate.
  - **Backend Model & Services (`InvestmentSchemeConfig.js`, `investment.service.js`, `plotProduct.service.js`, `plotConfig.service.js`)**:
    - Added `rdAnnualInterestRate` and `fdAnnualInterestRate` to `schemeSlabSchema` (with backwards compatibility fallback to `annualInterestRate`).
    - Updated `updateSchemeConfig`, `getAvailableTenures`, and `getRateConfig` to persist and return both `rdAnnualInterestRate` and `fdAnnualInterestRate`.
  - **Frontend UI (`ProductSchemeRulesTab.jsx`, `ProductBookingPage.jsx`)**:
    - Embedded the **RD Rate (% p.a.)** directly inside the **EMI (R.D.) Scheme** column (`Rate % | Return %`) and the **FD Rate (% p.a.)** directly inside the **One-Time (F.D.) Scheme** column (`Rate % | Return %`), eliminating the redundant standalone Annual Rate column.
    - Editing `rdAnnualInterestRate` inside the RD column auto-calculates `rdMaturityPercent` via Yearly Compounding.
    - Editing `fdAnnualInterestRate` inside the FD column auto-calculates `fdMaturityPercent` via Standard Banking Compounding.
    - Changing `tenureMonths` auto-calculates both returns using their respective independent rates.
    - Updated `ProductBookingPage.jsx` to dynamically assign `annualInterestRate` based on whether the booking is `MONTHLY_INSTALLMENT` (RD rate) or `FULL_PAYMENT` (FD rate).- **Real-Time Indian Numbering Format (INR Comma Notation, e.g. 1,12,529) [COMPLETED]**:
  - **Requirement**: Allow numeric inputs (especially collection slabs in `/dashboard/plots/products?tab=incentives` and shared `NumberInput`) to automatically format numbers in real-time according to the Indian Rupee system (`1,12,529`, `10,00,000`, `19,99,999`) without cursor jumping.
  - **Implementation**:
    - `client/src/utils/numToWord.jsx`:
      - Added `formatIndianNumber(val)`: Formats integers and decimal values using the Indian lakh/crore regex (`\B(?=(\d{2})+(?!\d))`).
      - Added `parseIndianNumber(val)`: Strips commas to return raw numeric strings.
      - Added `handleFormattedNumberInput(e, onChange)`: Cursor-stable input handler that calculates non-comma cursor offset, triggers the state callback with raw value, and restores the cursor using `requestAnimationFrame` and `input.setSelectionRange`.
    - `client/src/components/ui/NumberInput.jsx`:
      - Upgraded with `formatIndian = true` (default) to format values with Indian currency commas in real-time while preserving clean numeric types in callbacks and retaining cursor stability.
    - `client/src/pages/plots/seriesMaster/components/CommissionPolicyMatrix.jsx`:
      - Integrated `formatIndianNumber` and `handleFormattedNumberInput` on Target Slabs (`minAmount`, `maxAmount`) and Extra Campaign Slabs (`minAmount`, `maxAmount`).
- **Branch Partner Incentive Closing & 3-Tier Tables Isolation [COMPLETED]**:
  - **Context**: In `/dashboard/plots/incentives/new` (`PlotIncentiveProcessPage.jsx`), only Business Associates and Business Partners had display tables, omitting Branch Partners.
  - **Resolution**:
    - `client/src/pages/plots/incentives/PlotIncentiveProcessPage.jsx`:
      - Disentangled sponsor categorization into three mutually exclusive tiers:
        - `associateSponsors = previewData.sponsors.filter((s) => !s.isDeveloper && !s.isBranchPartner)`
        - `partnerSponsors = previewData.sponsors.filter((s) => s.isDeveloper && !s.isBranchPartner)`
        - `branchSponsors = previewData.sponsors.filter((s) => s.isBranchPartner)`
      - Added dedicated Section 3 table for **Branch Partners (Branch Franchise & Regional Sales Turnover)** with full expandable collection receipts, slab evaluation, and credit calculations.
    - `server/models/PlotClosing.js`:
      - Added `isBranchPartner: { type: Boolean, default: false }` and `branchBusiness: { type: Number, default: 0 }` to `sponsorSummarySchema`.
    - `server/services/plots/plotClosing.service.js`:
      - Set `entryFixedPct = 0.50` when `sp.isBranchPartner`.
      - Persisted `isBranchPartner` and `branchBusiness` in `createPlotClosing` and `updatePlotClosing`.

- **Fund Transfer Custody Authority & Maker-Checker Separation [COMPLETED]**:
  - **Requirement**:
    - If funds are transferred to a Cashier / User Cash Ledger (e.g. Account A to Cashier B): **ONLY Cashier B** (the receiving drawer holder) is authorized to approve/accept or reject the transfer. Admin or SuperAdmin CANNOT approve cash transfers destined for someone else's drawer.
    - If funds are transferred to a Corporate Bank Account: Only an Admin or SuperAdmin with receipt permissions for that specific bank can approve/accept the deposit.
    - If funds are transferred to an Admin/SuperAdmin's own cash ledger: They can approve because they are the receiving cashier.
    - Upon approval: Full double-entry transaction completes immediately via `accountingService.recordLedgerEntry` (debit on source, credit on destination) and updates running balances on both ledgers.
    - Added `BANK_WITHDRAWAL` ("Bank Withdrawal to Cash") mode and renamed "Cash Handover to Staff" to "Cash Transfer".
  - **Backend**:
    - `server/controllers/fundTransfer.js`:
      - Updated `approveTransfer` and `rejectTransfer` with custody validation:
        - If `isDestCash`: Throws error `Unauthorized. Only the receiving cashier / destination account holder can approve this cash transfer.` if caller is not the recipient cashier.
        - If `isDestBank`: Validates that caller is Superadmin/Dev or an Admin with receipt permission for that bank ledger (`bPerm.allowReceipts !== false`, allowed bank IDs).
    - `server/controllers/approvalController.js`:
      - Updated `getPendingApprovalStats` so `/approvals/pending-stats` only returns pending fund transfers that the logged-in user is actionable to approve (transfers to their own cash drawer, plus corporate bank deposits if they possess bank receipt authority). Prevents Admins from seeing pending badges for transfers destined for other cash drawers.
  - **Frontend**:
    - `client/src/pages/admin/ledger/FundTransfersPage.jsx`:
      - Computed `canApprove`: Strictly requires `isRecipient` for cash drawer destinations, and bank permission for bank destinations.
      - Replaced generic action state with contextual indicator badge (`Awaiting Recipient` or `Awaiting Bank Checker`) for pending non-actionable transfers.

- **Complete Removal of Weekly Return / Money-Back Payout System [COMPLETED]**:
  - **User Clarification**: The project does not use or need weekly return / money-back payouts for plot bookings.
  - **Frontend**:
    - `client/src/pages/plots/reports/components/BookingColumns.jsx`: Removed weekly payout setup button (`CalendarPlus`) and payout ledger button (`Coins`).
    - `client/src/pages/plots/reports/PlotReports.jsx`: Removed `SetupPayoutModal` import, state hooks, and modal rendering.
    - `client/src/pages/plots/reports/components/SetupPayoutModal.jsx`: Replaced with clean no-op component.
    - `client/src/pages/plots/booking/PlotBookingDetails.jsx`: Removed "Payout Ledger" button and unused `Banknote` icon import.
    - `client/src/App.jsx`: Removed `plots/payout-ledger` and `plots/vouchers/:id` (payout voucher print) routes and imports.
    - `client/src/components/Navbar.jsx`: Removed `payout-ledger` breadcrumb title mapping.
  - **Backend**:
    - `server/index.js`: Removed `initPlotPayoutScheduler` import and initialization.
    - `server/cron/plotPayoutScheduler.js`: Converted into a safe no-op.
    - `server/router/plots.routes.js`: Removed `/bookings/:id/payout/initialize`, `/bookings/:id/payout/pay`, `/bookings/:id/payout/ledger`, and `/payout-vouchers/:id` routes.

