# Good Nature EMS — Unified Frontend Design, Theme & Component System

## 1. Design Vision & Brand Philosophy
The **Good Nature EMS** design system creates a cohesive, modern, and executive user experience across all modules (Employee Management, Attendance, Payroll, and Plot Management).

The theme reflects an organic, trustworthy, and premium identity centered around **Good Nature Emerald & Deep Teal**, replacing fragmented ad-hoc colors (random indigo, blue, purple hues) with a disciplined, harmonious palette.

---

## 2. Color Palette & Design Tokens

### A. Primary Brand Spectrum (Good Nature Teal & Emerald)
| Token Name | Hex Code | Tailwind Equivalent | Use Case |
| :--- | :--- | :--- | :--- |
| `--color-primary-dark` | `#134e4a` | `teal-900` | Sidebar active background, dark contrast headers |
| `--color-primary` | `#0f766e` / `#115e59` | `teal-700` / `teal-800` | Primary buttons, active tabs, header icons, key accents |
| `--color-primary-hover` | `#115e59` | `teal-800` | Hover states for primary interactive elements |
| `--color-primary-focus` | `#0d9488` | `teal-600` | Form input focus ring, radio/checkbox accents |
| `--color-primary-light` | `#f0fdfa` | `teal-50` | Light badge backgrounds, selected row highlights |
| `--color-primary-border` | `#ccfbf1` | `teal-200` | Subtle teal borders, active container dividers |

### B. Semantic & Status Spectrum
| State | Badge BG / Text | Border | Use Case |
| :--- | :--- | :--- | :--- |
| **Success / Active / Present / Paid** | `bg-emerald-50 text-emerald-700` | `border-emerald-200` | Available plots, paid installments, approved leaves |
| **Warning / Pending / Hold / Due** | `bg-amber-50 text-amber-700` | `border-amber-200` | Plots on hold, pending EMIs, overdue balance |
| **Danger / Cancelled / Absent / Error** | `bg-rose-50 text-rose-700` | `border-rose-200` | Cancelled bookings, rejected requests, fines |
| **Info / Neutral / Promoters** | `bg-teal-50 text-teal-700` | `border-teal-200` | Promoter role tags, general notices, info metrics |
| **Executive / Developer Sponsor Override** | `bg-teal-900 text-teal-100` | `border-teal-700` | Direct Developer, Developer override royalties |

### C. Neutral & Surface Foundations
- **Page Background Canvas**: `bg-slate-50` (`#f8fafc`)
- **Card & Modal Surface**: `bg-white` (`#ffffff`) with border `border-slate-200` and soft shadow `shadow-xs` / `shadow-sm`
- **Dividers & Borders**: `border-slate-100` (internal), `border-slate-200` (containers), `border-slate-300` (inputs)
- **Primary Typography**: `text-slate-800` / `text-slate-900`
- **Secondary / Subtitles**: `text-slate-500` / `text-slate-600`
- **Muted / Field Labels**: `text-slate-400` / `text-slate-500` with `font-bold uppercase tracking-wider`

---

## 3. Standardized Symmetric Page Loader Animation
All pages MUST use the unified, symmetric `<PageLoader />` component located at:
`client/src/components/common/PageLoader.jsx`

### Usage Pattern:
```jsx
import PageLoader from '../../components/common/PageLoader';

if (loading) {
  return (
    <PageLoader
      title="Loading Plot Dashboard..."
      subtitle="Fetching real-time inventory & sales records"
      fullScreen={false}
    />
  );
}
```

### Key Visual & Behavioral Rules:
1. **Content Area Isolation (Never Block Sidebar/Navbar)**: Page loaders must ALWAYS render within the page content area (`fullScreen={false}`). The Sidebar and Navigation header must remain visible, interactive, and accessible at all times without full-screen overlays.
2. **Concentric Symmetric Rings**: A counter-rotating outer ring and dashed orbit around a central brand gradient orb.
3. **Radial Soft Glow**: Symmetrical ambient blur in teal/emerald hues.
4. **Harmonious Typography**: Centered, bold title and muted caption.
5. **Staggered Dot Pulse**: Multi-stage indicator dots matching the theme.

---

## 4. Component Standards

### A. Buttons & Actions
- **Primary Action Button**:
  `bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center gap-2 cursor-pointer`
- **Secondary Outline Button**:
  `bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer`
- **Table Row Action Button**:
  `p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer`

### B. Form Inputs & Selects
- **Text Inputs & Selects**:
  `w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition-all placeholder:text-slate-400`
- **Input Labels**:
  `block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider`

### C. Navigation & Tab Switchers
- **Tab Container**: `flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200`
- **Active Tab**: `bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-all`
- **Inactive Tab**: `text-slate-600 hover:text-slate-900 font-medium text-xs px-3.5 py-2 rounded-lg transition-all`

### D. Metric Summary Cards & Stats
- **Card Container**: `bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow flex items-center gap-4`
- **Icon Container**: `p-3 bg-teal-50 text-teal-700 rounded-xl`

---

## 5. Icon Standards
All icons across pages use **Heroicons 2 (`react-icons/hi2`)** for modern, crisp line weights (e.g., `HiOutlineBuildingOffice2`, `HiOutlineCurrencyRupee`, `HiOutlineDocumentText`, `HiOutlineSparkles`, `HiOutlineEye`, `HiOutlineArrowDownTray`).
