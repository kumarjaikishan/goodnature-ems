# DECISIONS.md — Architectural Decisions & Core Design Choices

This document lists foundational architectural decisions that must not be altered casually without clear requirements and careful review.

---

## 1. Dual-Core System (EMS + Plot Real Estate)
- **Decision**: Keep the Employee Attendance System and the Plot / Real Estate Booking System within the same unified backend and database instance.
- **Rationale**: Sponsors and plot managers frequently overlap with organizational staff, branches, and user management. Unifying them reduces microservice latency and infrastructure maintenance overhead.

## 2. Universal Timezone Normalization (`Asia/Kolkata` with UTC Midnight Storage)
- **Decision**: All attendance days are normalized and stored as UTC midnight representing the calendar date in `Asia/Kolkata` (IST), while server instances run in `TZ=UTC`.
- **Rationale**: Prevents day-boundary shifting issues across daylight saving / local server offsets, ensuring accurate queries for "today's punches" or "monthly attendance sheets".

## 3. Hybrid Permission Model (RBAC + ABAC with Redis Caching)
- **Decision**: Access control combines high-level roles (`superadmin`, `admin`, `manager`, `employee`, `developer`) with a granular resource-to-action permission matrix (`1: Read, 2: Create, 3: Update, 4: Delete`) cached in Redis with a 15-day TTL and Mongo fallback.
- **Rationale**: Allows enterprise customization of manager capabilities per department or branch without modifying backend route logic.

## 4. In-Memory Ring-Buffer for API Performance Observability
- **Decision**: API latency statistics are gathered via an in-memory ring buffer (`MAX_RECORDS_PER_ENDPOINT = 30`) keyed by parameterized route patterns, rather than writing performance telemetry to disk or MongoDB.
- **Rationale**: Eliminates DB write overhead on hot request paths and avoids database lock contention.

## 5. Dedicated Plot Scheduler Separation
- **Decision**: Cron jobs for hold expiry (`plotHoldScheduler.js`) and weekly payouts (`plotPayoutScheduler.js`) are isolated into the `server/cron/` directory and invoked on application startup.
- **Rationale**: Isolates batch business logic from live request processing.
