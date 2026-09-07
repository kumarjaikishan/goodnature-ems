# COMPONENT_CATALOG.md — Centralized UI Components & API Guide

This document is the **Mandatory Reference Guide** for all AI sessions and developers before creating or modifying UI pages, modals, tables, loaders, toasts, and API requests.

> [!IMPORTANT]
> **RULE**: Never recreate ad-hoc modals, loaders, toast utilities, or raw axios configurations. Always import and reuse the centralized components cataloged below.

---

## 1. Centralized API & HTTP Communication

### Standard Axios Instance (`client/src/api/axios.js`)
Use this for **all standard REST API requests**. It handles `Authorization: Bearer <token>` automatic header injection and cookie credentials.

```javascript
import api from '../../api/axios'; // Adjust relative path

// GET example
const res = await api.get('/plots/bookings', { params: { status: 'ACTIVE' } });
const bookings = res.data.data;

// POST example
const res = await api.post('/investments/accounts', formData);
toast.success(res.data.message || 'Account created successfully');
```

### Advanced Api Hook (`client/src/utils/useApi.js`)
Use when you need reactive `loading`, `error`, and `data` state bindings along with automatic token refresh on 401:

```javascript
import { useApi } from '../../utils/useApi';

const { request, loading, error } = useApi();
const data = await request({ url: 'plots/customers', method: 'GET' });
```

---

## 2. Reusable Modal & Dialog Components

### A. Centralized Animated Modal (`client/src/components/custommodal/Modalbox.jsx`)
Standard Framer-Motion elastic animated modal with auto scroll-lock and outside click dismissal.

```jsx
import Modalbox from '../../components/custommodal/Modalbox';

const [isOpen, setIsOpen] = useState(false);

<Modalbox open={isOpen} onClose={() => setIsOpen(false)} outside={true} shadow={true}>
  <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4">
    <div className="flex items-center justify-between border-b pb-3">
      <h3 className="text-base font-bold text-slate-800">Modal Title</h3>
      <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
    </div>
    
    <div>Modal content here...</div>

    <div className="flex justify-end gap-2 pt-3 border-t">
      <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
      <button onClick={handleSave} className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl">Save</button>
    </div>
  </div>
</Modalbox>
```

### B. Lightweight Confirm Dialog & Swal (`client/src/utils/confirmDialog.jsx`)
Modern, promise-based confirm dialog built on Sonner. Replaces heavy third-party dialog packages.

```javascript
import { confirmDialog, swal } from '../../utils/confirmDialog';

// Promise pattern
const proceed = await confirmDialog({
  title: 'Delete this Record?',
  text: 'This action cannot be reversed.',
  confirmText: 'Delete Now',
  cancelText: 'Cancel',
  isDanger: true,
});
if (!proceed) return;

// Or classic drop-in swal replacement
swal({
  title: 'Approve Payment?',
  text: 'Confirm approving ₹5,000 collection.',
  buttons: ['Cancel', 'Approve'],
  dangerMode: false,
}).then((proceed) => {
  if (proceed) handleApprove();
});
```

---

## 3. High-Performance DataTable Component

### Centralized Native Table (`client/src/components/common/DataTable.jsx`)
Zero-dependency, high-speed table supporting server-side or client-side pagination, multi-column sorting, row selection, and custom cell renders.

```jsx
import { DataTable } from '../../components/common/DataTable';

const columns = [
  {
    name: 'Account No',
    selector: (row) => row.accountNumber,
    sortable: true,
    cell: (row) => <span className="font-mono font-bold text-teal-800">{row.accountNumber}</span>,
  },
  {
    name: 'Customer',
    selector: (row) => row.customerId?.name,
    sortable: true,
  },
  {
    name: 'Status',
    cell: (row) => (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        {row.status}
      </span>
    ),
  },
];

<DataTable
  columns={columns}
  data={accountList}
  pagination
  paginationPerPage={15}
  highlightOnHover
  progressPending={loading}
/>
```

---

## 4. Standardized Symmetrical Page Loader

### Centralized Loader (`client/src/components/common/PageLoader.jsx`)
Organic, branded Good Nature symmetrical pulse & orbit loader. **Never block the sidebar/navbar**. Always render inside the page content area.

```jsx
import PageLoader from '../../components/common/PageLoader';

if (loading) {
  return (
    <PageLoader
      title="Loading Investments..."
      subtitle="Fetching accounts and slab calculations"
      fullScreen={false}
    />
  );
}
```

---

## 5. Universal Toast Adapter

### Centralized Toast (`client/src/utils/toast.jsx`)
Always use the centralized adapter to keep toast messages consistent across the entire platform.

```javascript
import { toast } from '../../utils/toast';

toast.success('Successfully updated!');
toast.error('Failed to process payment.');
toast.warn('Please select a customer first.');
toast.info('Receipt #2026-001 downloaded.');
```

---

## 6. Design Tokens & Styling Helpers

Always apply the Good Nature design system guidelines:

| Element | Recommended Tailwind Classes |
| :--- | :--- |
| **Primary Action Button** | `px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2` |
| **Secondary Button** | `px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs md:text-sm rounded-xl shadow-xs transition cursor-pointer` |
| **Danger / Cancel Button** | `px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer` |
| **Form Input / Select** | `h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs md:text-sm text-slate-800 transition` |
| **Form Label** | `block text-xs font-semibold text-slate-700 mb-1` |
| **Container Card** | `bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4` |
| **Page Canvas Background** | `p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto` |
