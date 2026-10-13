# Business Partner & Business Associate Hierarchy: Architectural Analysis & Implementation Specification

## 1. Executive Summary & Core Requirements

In **Good Nature EMS**, real estate operations rely on a two-tier sales hierarchy:
1. **Business Partner (BP)**: High-level sponsor directly attached to the Company (`sponsorId = null`). Identifier starts with `BP-` or `P/` (e.g., `P/2627/001` or `BP-...`).
2. **Business Associate (BA)**: Downline sponsor attached to a specific Business Partner (`sponsorId = partnerId`). Identifier starts with `BA-` or `A/` (e.g., `A/2627/001` or `BA-...`).
3. **Customer**: End customer (`PlotCustomer` / `User`), registered under a Business Associate (`customer.sponsorId = associateId`).

### Requirements:
1. **Business Partner View (when logged in or viewed by Admin)**:
   - **Business Associates Table**: View all Business Associates enrolled under this specific Business Partner.
   - **Customers Under Associates**: View all customers belonging to those Business Associates, with a dedicated **Filter by Business Associate** dropdown ("All Associates" or a specific Associate), showing Customer ID, Name, Contact, Registration Date, Total Bookings, and Total Due.
   - **Customer Bookings & Dues**: View all plot & product bookings in the network with Booking Date, Customer Name/ID, Business Associate, Plot/Project details, Net Value, Paid Amount, and **Outstanding DUE Amount**, with a dedicated **Filter by Business Associate** dropdown and Date filtering.
2. **Business Associate View (when logged in)**:
   - **My Customers**: View only customers directly enrolled under this Business Associate, along with their booking count and total dues.
   - **My Bookings & Dues**: View all plot bookings created under this Business Associate with Booking Date, Customer details, Plot details, Total Value, Paid Amount, and **DUE Amount** (remaining balance).

---

## 2. Data Models & Entity Relationships

```
                  ┌──────────────────────────────┐
                  │       Good Nature EMS        │
                  │          (Company)           │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Business Partner (BP)     │
                  │   User (role: 'sponsor')     │
                  │     sponsorId: null          │
                  │  Code: BP-..., P/2627/001    │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │   Business Associate 1 (BA)  │ │   Business Associate 2 (BA)  │
  │    User (role: 'sponsor')    │ │    User (role: 'sponsor')    │
  │     sponsorId: BP._id        │ │     sponsorId: BP._id        │
  │   Code: BA-..., A/2627/001   │ │   Code: BA-..., A/2627/002   │
  └──────────────┬───────────────┘ └──────────────┬───────────────┘
                 │                                │
                 ▼                                ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │     Plot Customers (C1)      │ │     Plot Customers (C2)      │
  │   PlotCustomer collection    │ │   PlotCustomer collection    │
  │     sponsorId: BA1._id       │ │     sponsorId: BA2._id       │
  └──────────────┬───────────────┘ └──────────────┬───────────────┘
                 │                                │
                 ▼                                ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │        Plot Bookings         │ │        Plot Bookings         │
  │     PlotBooking collection   │ │     PlotBooking collection   │
  │       customerId: C1._id     │ │       customerId: C2._id     │
  │       sponsorId: BA1._id     │ │       sponsorId: BA2._id     │
  │     remainingAmount = DUE    │ │     remainingAmount = DUE    │
  └──────────────────────────────┘ └──────────────────────────────┘
```
