# AGENTS.md — Instructions for AI Working on Good Nature EMS

Welcome to the **Good Nature EMS (Employee Attendance & Plot Management System)** codebase.
All AI assistants must adhere to the instructions and guidelines defined here before reading or modifying code.

---

## 1. Mandatory Pre-Flight Checklist

Before making ANY changes or proposing new features:
1. **Read Relevant Documentation First**:
   - [docs/PROJECT_CONTEXT.md](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/docs/PROJECT_CONTEXT.md) — Tech stack, purpose, and system modules.
   - [docs/ARCHITECTURE.md](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/docs/ARCHITECTURE.md) — Component architecture, data flows, auth, timezone, and scheduler details.
   - [docs/RULES.md](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/docs/RULES.md) — Coding conventions, security guidelines, and business constraints.
   - [docs/DECISIONS.md](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/docs/DECISIONS.md) — Immutable decisions and established core design patterns.
   - [docs/TODO.md](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/docs/TODO.md) — Current pending items, technical debt, and known backlog.
   - [memory/SESSION_MEMORY.md](file:///c:/Users/good%20nature/OneDrive/Desktop/CODING/Ems-goodnature/memory/SESSION_MEMORY.md) — Historical bugs, fixes, and gotchas discovered across sessions.

2. **Respect Existing Decisions & Do Not Refactor Unnecessarily**:
   - Do NOT rewrite or restructure existing modules, controllers, or route architectures unless specifically asked.
   - Maintain the established patterns for permissions, timezone handling, SSE events, and controller/service divisions.

3. **Keep Code and Documentation in Sync**:
   - Whenever you implement a new feature, fix a bug, or discover an architectural quirk, update the corresponding `docs/` and `memory/` files.

---

## 2. General AI Workflow

1. **Investigate & Verify**:
   - Locate the exact files and check current logic before making edits.
   - Verify model schemas in `server/models/` and routes in `server/router/`.
2. **Execute Minimum-Diff Changes**:
   - Preserve existing function signatures, comments, and structure.
   - Respect the 4-number CRUD permission standard (`1: Read, 2: Create, 3: Update, 4: Delete`).
   - Respect timezone handling in `server/utils/attendanceTime.js` (UTC dates stored at UTC midnight for attendance, IST calculation in India time).
3. **Record Findings**:
   - Update `memory/SESSION_MEMORY.md` with any newly identified quirks, caveats, or fixes.
   - Update `docs/TODO.md` when completing or identifying new tasks.
