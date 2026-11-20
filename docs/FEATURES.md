# Features

## Status Definitions

- Planned: Approved but not started
- In progress: Currently being implemented
- Complete: Implemented and validated
- Paused: Intentionally deferred
- Removed: No longer part of the product

## Foundation

### Application Shell

Status: Complete

Includes:

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint + Prettier
- shadcn/ui
- TanStack Query + Zustand
- React Hook Form + Zod
- Vitest + Playwright
- Cross-tool agent configuration

## Product Features

### 1. HEC Institutional Design System & Semantic Status Framework

- **Status:** Complete
- **Purpose:** Provide an authoritative visual hierarchy reflecting HEC Pakistan branding.
- **Components:** `src/components/ui/status-pill.tsx`, `src/app/globals.css`.
- **Details:** Deep HEC Emerald Green (`#064E3B`, `#047857`), Slate canvas (`#F8FAFC`), white elevated cards with `#E2E8F0` borders, tabular numerics for CNICs and dates, and 7 semantic status pills (`Approved`, `Pending`, `In-Process`, `On-Holding`, `Revision`, `Rejected`, `Delayed`).

### 2. Role-Segregated Landing Page Gateway (`/`)

- **Status:** Complete
- **Purpose:** Serve as the unified institutional entrance simulating Keycloak RBAC personas.
- **Routes:** `/`
- **Components:** `src/components/gateway/RoleGateway.tsx`, `src/app/page.tsx`.
- **Features:** 6 interactive Role Access Cards (HEC Manager, HEC Scrutiny, University Controller L1, University Controller L2, HEC Attestation, Dual-Role Staff) with active queue counters, simulated officer personas, and instant workspace launch.

### 3. Role-Specific Executive & Evaluator Dashboard (`/dashboard`)

- **Status:** Complete
- **Purpose:** Role-filtered task workload management, SLA monitoring, and case assessment.
- **Routes:** `/dashboard`, `/dashboard/history`
- **Components:** `PortalHeader`, `PortalSidebar`, `KpiStrip`, `AssessmentChart`, `VolumeDonutChart`, `ApplicationsTable`.
- **Features:**
  - 6-metric KPI strip with tabular numbers and interactive filter toggle.
  - Interactive assessment volume bar chart with range presets (`Today`, `1 Day`, `3 Days`, `5 Days`, `1 Week`, `2 Weeks`, `1 Month`), dynamic date pickers, y-axis grid lines, and hover tooltips.
  - Semi-circle / donut chart displaying `Total App` volume breakdown (`Landed: 40%`, `Pending: 20%`, `Assessed: 30%`, `Rejected: 10%`) alongside `Landed`, `Revised`, `Pending`, and `Rejected` summary counters.
  - Real-time search by candidate name, CNIC, tracking number, degree, and registration number.
  - Dynamic status filtering (`All`, `Pending`, `In-Process`, `On-Holding`, `Revision`, `Approved`, `Rejected`, `Delayed SLA`).
  - Column sorting on Application ID, submission date, and target degree.
  - Multi-role top-bar switcher for `ROLE_DUAL_STAFF` between Scrutiny and Attestation views.
  - Dedicated `/dashboard/history` archive view with audit export capabilities.

### 4. Split-Screen Document Verification & Inspection Workspace (`/applications/[id]`)

- **Status:** Complete
- **Purpose:** Granular multi-tier document comparison and audit remark capture against official repositories.
- **Routes:** `/applications/[id]`
- **Components:** `StickyPersonalComparison`, `CategoryTabBar`, `DocumentInspectionView`, `ConsolidatedCommentsAndActionFooter`.
- **Features:**
  - **Sticky Top Comparison Header:**
    - Card 1 (User-Provided Information): 10 attributes (`Full Name`, `Father Name`, `CNIC`, `Marital Status`, `Phone Number`, `Secondary Number`, `Date of Birth`, `Gender`, `Email Address`, `Date of Expiry`), Profile Picture on the right, and interactive edit pencil icon on each attribute to attach discrepancy remarks via a dedicated modal.
    - Card 2 (Data From NADRA): Mirrored 10-attribute layout with `"Refresh From NADRA"` action button, NADRA bio-photo on the right, and automatic amber/rose mismatch highlights.
  - **Document Category Navigation Bar:**
    - Primary category tabs with live count badges (`Applicant Details` -> `Personal Documents` with CNIC and Other Certificate switcher, `SSC Certificate`, `HSSC Certificate`, `Degree (14 Year)`, `Degree (16 Year)`).
    - Right-aligned `Comments Trail` button with total remark count badge.
    - Context banner: _"This Application is for Attestation of the 16 Year Degree"_.
  - **Adaptive Document Viewer:**
    - **Personal Documents Mode:** Two-column card layout displaying CNIC Back (left) and CNIC Front (right), each equipped with interactive Zoom In (`+`), Zoom Out (`-`), Reset, and Rotate (`90°`) controls, plus an alternative view for official Marriage (Nikah Nama) or Disability Certificates.
    - **Academic Documents Mode (50/50 Split-Screen):**
      - **Left Pane:** Key-value verification table showing `Full Name`, `Father Name`, `Degree Title`, `Registration / Roll No`, `Passing Year`, `Total Marks`, `Obtained Marks`, and `CGPA/Division`, with an inline **"Add Remark / Flag"** toggle for granular observation capture.
      - **Right Pane:** Interactive document canvas with sub-tabs (`Marksheet / Transcript`, `Degree Certificate`, `Provisional Certificate`), smooth zoom, rotate, pan/drag, and full-screen compare toggle.

### 5. Consolidated Audit Comments Trail & Final Action Screen

- **Status:** Complete
- **Purpose:** Consolidated multi-tier remark auditing, verified document checklist certification, and role-specific Synapark BPMN state transitions.
- **Components:** `src/components/verification/ConsolidatedCommentsAndActionFooter.tsx`.
- **Features:**
  - **Categorized Accordion Review Table:**
    - Organized chronologically and grouped by document category: `Scrutiny Comments`, `SSC Certificate`, `HSSC Certificate`, `Degree (14 Year)`, `Degree (16 Year)`, `Controller L1/L2 Remarks`.
    - Accordion expand/collapse headers with live observation count badges and discrepancy alerts.
    - Structured verification table with columns: `Title`, `Claimed Value`, `Reviewer Comment / Observation` (with comparison tags, author details, role badge, timestamp in `tabular-nums`, and stage badge), and `Action`.
    - Inline remark editing with `Save` and `Cancel` controls for current-stage remarks, alongside an immutable lock badge (`Locked Audit Record`) for previous stages.
    - `+ Add New Remark` modal for appending general observations or discrepancies to the permanent dossier.
  - **Attested Document Detail Checklist:**
    - Multi-degree checklist card for 14 Years Degree (`Transcript`, `Provisional Certificate`, `Equivalence Certificate of HEC`) and 16 Years Degree (`Official University Transcript`, `Convocation Degree Parchment / Provisional`, `Equivalence Certificate of HEC`).
    - Interactive checkbox toggling persisted to `workflowEngine.updateDocumentChecklist`.
    - Dedicated `Upload Remark` supporting document attachment modal with file upload simulation, docket name, officer endorsement notes, and preview/remove controls.
  - **Role-Specific BPMN Workflow Action Footer:**
    - Dynamic state transition buttons strictly governed by `effectiveRole`:
      - **HEC Scrutiny (`ROLE_HEC_SCRUTINY`):** `Revision & Send Back to Student` (mandatory reason), `Reject Application` (mandatory reason), `Approve & Forward to Controller L1`.
      - **University Controller L1 (`ROLE_CONTROLLER_L1`):** `Verify & Forward to Controller L2 (Pass)`, `Flag Academic Discrepancy & Forward to Controller L2 (Reject)`.
      - **University Controller L2 (`ROLE_CONTROLLER_L2`):** `Submit Final University Remarks & Return to HEC`.
      - **HEC Attestation / HEC Manager (`ROLE_HEC_ATTESTATION` or `ROLE_HEC_MANAGER`):** `Return to Scrutiny / Revision`, `Final Approve & Issue Attestation`.
    - Confirmation dialog summarizing application ID, candidate name, target degree, accumulated remarks, and mandatory observation note capture.
    - Dual-view completion modal: Official HEC Attestation Certificate & QR Receipt (with Pakistan crest, registration number, digital QR stamp, print/download action) and Synapark BPMN REST JSON Payload (200 OK) preview.
    - Global toast notifications via `@base-ui/react/toast` on checklist updates, remark saves, and state transitions.

### 6. Decoupled Workflow Engine Facade

- **Status:** Complete
- **Purpose:** Decouple UI state management from backend microservices, allowing zero-refactor swap with real Synapark BPMN/CMMN REST endpoints.
- **Modules:** `src/services/workflowEngine.ts`, `src/services/mockWorkflowStore.ts`, `src/types/workflow.ts`.
- **Validation:** 14 unit tests in `tests/unit/workflowEngine.test.ts` covering role-task filtering, discrepancy detection, remark persistence, state transitions, leave management, role-compatible delegation, and delegation revocation.

### 7. HEC Manager Staff Leave Management & Respective Task Delegation

- **Status:** Complete
- **Purpose:** Allow HEC Managers (`ROLE_HEC_MANAGER`) to manage officer absences, approve or reject leave requests, and orchestrate role-compatible task delegation across Scrutiny and Attestation queues without breaking SLA compliance.
- **Routes:** `/dashboard/manager`
- **Components:**
  - `src/app/dashboard/manager/page.tsx`
  - `src/components/manager/ManagerKpiCards.tsx`
  - `src/components/manager/ManagerOverviewCards.tsx`
  - `src/components/manager/StaffLeaveTable.tsx`
  - `src/components/manager/TaskDelegationDrawer.tsx`
  - `src/components/manager/ActiveDelegationsTable.tsx`
  - `src/components/manager/delegation-schema.ts`
- **Features:**
  - **CEGA-Inspired Design System:** Orbitron bold headings (`weight 700`), `#13c2b6` primary accent, `#27b2d7` secondary accent, `#87cbde` subtle surface accents, `#e5e5e5` borders, chromatic shadow `0px 12px 30px rgba(8, 27, 88, 0.08)`, and tabular numbers on metrics and dates.
  - **Executive Navigation & Overview:** HEC Manager exclusive sidebar items (`Executive Overview` and `Leave & Delegation`), dual-tab layout (`Overview` and `Leave & Delegation`), and overview quick-action cards.
  - **4 Summary KPI Cards:** Real-time counters for `Pending Leave Requests`, `Approved Active Leaves`, `Staff Currently On Leave`, and `Unassigned / At-Risk Queue Items`.
  - **Staff Leave Requests Management:**
    - Searchable table displaying Staff Name & ID, Assigned Roles, Leave Type (Annual, Medical, Casual, Official Duty), Leave Window with total days in tabular numbers, Pending Task Counts, and Status pills.
    - Approval flow with immediate prompt modal to trigger task delegation for officers with pending queue items.
    - Rejection dialog with mandatory reason capture.
    - One-click delegation shortcut button per staff row.
  - **Respective Task Delegation Drawer & Form:**
    - Strict role-compatibility filtering: Scrutiny tasks can only be delegated to officers with `ROLE_HEC_SCRUTINY` (or dual role); Attestation tasks only to `ROLE_HEC_ATTESTATION` (or dual role); dual-role staff queues can be delegated independently.
    - Live workload display next to candidate delegatees (e.g., `5 active tasks`).
    - Scope toggle: All Pending Tasks (bulk queue reassignment) vs Selective Applications (interactive checkbox list with Application ID, student name, degree, and SLA status).
    - Form validated using Zod with start and end dates and mandatory Manager remarks.
    - Real-time application reassignment and audit trail event logging (`action: "TASK_DELEGATED"`).
    - Synapark CMMN JSON event preview modal showcasing the REST 200 OK event payload.
  - **Active Delegations Table:**
    - Audit log of all active delegations with Delegation ID, Delegator -> Delegatee, Role Scope, Task Count, Validity Window, Status, and immediate one-click revocation.
