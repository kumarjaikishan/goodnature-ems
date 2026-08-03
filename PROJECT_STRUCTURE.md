# Project Architecture & Conventions Guide (`PROJECT_STRUCTURE.md`)

> **Note for AI Assistants & Developers**: Refer to this guide to understand project layout, centralized utilities, components, and conventions before making changes or adding features.

---

## 1. Project Directory Overview

```
Ems-goodnature/
├── AGENTS.md                  # Project task roadmap & guidelines
├── PROJECT_STRUCTURE.md       # Architectural overview & standards guide (this file)
├── server/                    # Express.js Backend API Server
│   ├── config/                # Database & server configurations
│   ├── controllers/           # Route controller logic
│   ├── cron/                  # Scheduled background tasks (e.g., plot payouts)
│   ├── middleware/            # Auth & request validation middleware
│   ├── models/                # Mongoose database models
│   ├── router/                # Express API routes
│   └── services/              # Business logic & services
└── frontend/                  # React + Vite Frontend Application
    ├── src/
    │   ├── api/               # Endpoint-specific API definitions
    │   ├── components/        # Reusable UI components (Modal, Navbar, Sidebar, etc.)
    │   │   └── custommodal/   # Reusable Modal component (`Modalbox.jsx`)
    │   ├── pages/             # Page views grouped by domain (admin, employee, plots, etc.)
    │   ├── utils/             # Core utilities, API client, hooks, helpers
    │   ├── App.jsx            # Main app router & layout definition
    │   ├── main.jsx           # React entry point
    │   └── index.css          # Global Tailwind CSS & custom styles
    ├── package.json
    └── vite.config.js
```

---

## 2. Centralized API Call System

All network requests **MUST** use the centralized API client or the `useApi` custom React hook. **Do not write ad-hoc fetch or axios calls in page components.**

### A. Core Client: `apiClient` (`frontend/src/utils/apiClient.js`)
* **Base URL**: Set via `import.meta.env.VITE_API_ADDRESS`
* **Authentication**: Automatically attaches `Authorization: Bearer <emstoken>` from `localStorage`.
* **Cookie Support**: Configured with `credentials: "include"` for HttpOnly refresh tokens.
* **Token Refresh**: Automatically handles expired access tokens (`401`) by calling `/refresh` with cookies and retrying queued requests.

```javascript
import { apiClient } from "../utils/apiClient";

// Example Usage:
const data = await apiClient({
  url: "employeelist",        // Endpoint relative to BASE_URL
  method: "GET",              // "GET" | "POST" | "PUT" | "DELETE"
  body: { key: "value" },     // Request body (JSON or FormData)
  params: { page: 1 }         // Query params object
});
```

### B. Custom Hook: `useApi` (`frontend/src/utils/useApi.js`)
Provides managed state (`loading`, `error`, `data`), automated toast notifications, error handling, performance logging, and auto-redirect to `/logout` on auth failure.

```javascript
import { useApi } from "../utils/useApi";

const MyComponent = () => {
  const { request, loading, error } = useApi();

  const fetchData = async () => {
    try {
      const res = await request({ url: "endpoint-name", method: "GET" });
      console.log(res);
    } catch (err) {
      // Handled automatically via toast notifications
    }
  };

  return <button disabled={loading} onClick={fetchData}>Fetch</button>;
};
```

---

## 3. Centralized Modal Component System

Use `Modalbox` (`frontend/src/components/custommodal/Modalbox.jsx`) for all popups and modal dialogs across the application.

* **Path**: `frontend/src/components/custommodal/Modalbox.jsx`
* **Animation**: Framer Motion scale spring effect with React Portal rendering (`document.body`).
* **Scroll Lock**: Automatically locks body scroll with scrollbar-width compensation.
* **CRITICAL SIZING RULE**: The direct child `div` of `<Modalbox>` **MUST** specify an explicit pixel width (e.g. `className="w-[500px] max-w-[90vw] bg-white rounded-2xl p-6"`) to prevent the modal container from shrinking.

```javascript
import Modalbox from "../../components/custommodal/Modalbox";

const [isModalOpen, setIsModalOpen] = useState(false);

<Modalbox open={isModalOpen} onClose={() => setIsModalOpen(false)} shadow={true} outside={true}>
  <div className="p-6 bg-white rounded-2xl w-[550px] max-w-[90vw]">
    <h2 className="text-xl font-bold mb-4">Modal Title</h2>
    <p>Modal Content</p>
    <button onClick={() => setIsModalOpen(false)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
      Close
    </button>
  </div>
</Modalbox>
```

---

## 4. Data Tables (`react-data-table-component`)

Standardized table rendering uses `react-data-table-component`.

* **Library**: `react-data-table-component`
* **Usage Pattern**: Define column configurations with custom cell action buttons (View/Edit/Delete icons via `react-icons`).

```javascript
import DataTable from "react-data-table-component";

const columns = [
  { name: "S.No", selector: (row) => row.sno, sortable: true },
  { name: "Name", selector: (row) => row.name, sortable: true },
  { name: "Action", cell: (row) => row.action }
];

<DataTable
  columns={columns}
  data={dataList}
  pagination
  highlightOnHover
  responsive
/>
```

---

## 5. Styling & Theme Guidelines

* **CSS Framework**: Tailwind CSS v4 (`@tailwindcss/vite` in `frontend/src/index.css`)
* **Strict Light Theme**: All pages and UI components MUST use a clean Light Theme palette. Do NOT use `dark:` utility classes.
  - **Page Container**: `bg-slate-50 min-h-screen p-6`
  - **Cards & Panels**: `bg-white rounded-2xl border border-slate-200 shadow-sm p-6`
  - **Headings**: `text-slate-800 font-bold`
  - **Subtext & Labels**: `text-slate-500 text-sm` / `text-xs font-semibold text-slate-600`
  - **Inputs & Selects**: `bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none`
  - **Primary Action Buttons**: `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition font-medium`
  - **Badges**: Clean pill badges (e.g., `bg-emerald-50 text-emerald-700 border border-emerald-200`, `bg-amber-50 text-amber-700 border border-amber-200`)
* **Icon Set**: `react-icons` (e.g., `react-icons/hi2`, `react-icons/io5`, `react-icons/md`, `lucide-react`)
* **Notifications**: `react-toastify` (`toast.success`, `toast.error`, `toast.warn`).

---

## 6. Route Protection & Permissions

* **ProtectedRoute**: `frontend/src/utils/protectedRoute.jsx` wraps routes requiring authentication.
* **CheckPermission**: `frontend/src/utils/CheckPermission.jsx` handles role/permission conditional rendering.

---

## 7. Developer Cheat Sheet for New Features

When building a new module/feature:
1. **Backend**: Create Mongoose model in `server/models/`, controller in `server/controllers/`, router in `server/router/`, and register route in `server/index.js`.
2. **Frontend Component**: Place page view in `frontend/src/pages/<module>/`.
3. **API Call**: Use `useApi` hook or call `apiClient({ url, method, body })`.
4. **Modals**: Wrap in `<Modalbox open={state} onClose={handler}>`.
5. **Tables**: Wrap list data in `<DataTable columns={cols} data={data} pagination />`.
