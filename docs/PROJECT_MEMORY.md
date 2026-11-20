# Project Memory

Last updated: 2026-11-19

## Product

Name: Higher Education Commission (HEC) Degree Scrutiny & Attestation Portal
Purpose: Enterprise Next.js App Router application providing a role-segregated portal for digital degree scrutiny, university academic record verification, and official HEC attestation.
Primary users: HEC Managers, HEC Scrutiny Officers, University Controllers (L1 & L2), and HEC Attestation Officers.

## Current Stack

- Next.js with the App Router (v16.4.6 with Turbopack)
- React 19
- TypeScript (strict mode, no `any`)
- Tailwind CSS v4 with HEC Emerald Green institutional design system
- ESLint + Prettier
- TanStack Query
- Zustand (with persistence for role states and filters)
- React Hook Form + Zod
- shadcn/ui (primitives on `@base-ui/react`)
- Vitest + Playwright
- Lucide React icons
- yarn
- Source code under `src/`

## Current Architecture

- Routes and layouts live under `src/app/`:
  - `/`: Authoritative HEC Portal Gateway with Keycloak RBAC simulation and 6 interactive Role Access Cards.
  - `/dashboard`: Role-segregated workload overview, 6-card KPI strip, Assessment bar chart, Volume donut chart, and real-time searchable/sortable applications table.
  - `/dashboard/[role]`: Dynamic role dashboard route supporting both slugs (`scrutiny`, `controller-l1`, `controller-l2`, `attestation`, `dual-role`, `manager`) and canonical role enum identifiers.
  - `/dashboard/manager`: Dedicated HEC Manager workspace featuring Executive Overview and Staff Leave & Respective Task Delegation sub-views.
  - `/dashboard/history`: Permanent national attestation history, archived verified degree records, and audit log exports.
  - `/applications/[id]`: Split-screen verification workspace with persistent sticky applicant vs NADRA comparison, category tab navigation (CNIC, SSC, HSSC, 14-Yr Degree, 16-Yr Degree, Comments Trail), document inspector with zoom/rotation, inline remark capture, and Synapark BPMN state transition modal.
  - `/api/health`: JSON health check route handler.
- Core domain models and services:
  - `src/types/workflow.ts`: Strong domain types for roles, states, applications, NADRA biometrics, academic records, and transition payloads.
  - `src/config/roles.ts`: Detailed profiles and default users for all 6 roles.
  - `src/services/mockWorkflowStore.ts` & `src/data/mockWorkflowStore.ts`: In-memory realistic Pakistani student dossiers with full audit trails.
  - `src/services/workflowEngine.ts`: Decoupled Synapark BPMN/CMMN service facade (`getTasksByRole`, `getApplicationById`, `saveFieldRemark`, `transitionApplicationState`, `refreshFromNadra`, `getDashboardMetrics`).
  - `src/store/use-app-store.ts`: Zustand store for RBAC state (`activeRole`, `dualRoleSubRole`, `selectedStatusFilter`, `sidebarOpen`).
- Shared components live under `src/components/`.

## Current Conventions

- Server Components are the default; `"use client"` is applied only where interactivity or browser APIs are required.
- Strict TypeScript with domain models; no `any`.
- Suspense boundaries wrap client components utilizing `useSearchParams()`.
- HEC visual design system: Emerald Green (`#064E3B`, `#047857`), Slate/Off-White canvas (`#F8FAFC`), white elevated cards, and semantic status pills (`Approved`, `Pending`, `In-Process`, `On-Holding`, `Revision`, `Rejected`, `Delayed`).
- External input and transition payloads are validated before mutation.
- The `@/*` alias maps to `src/*`.

## Current Status

### Completed

- Foundational Next.js App Router initialization with Turbopack and strict TypeScript.
- Institutional HEC visual design system and semantic StatusPill component.
- Interactive Role-Segregated Landing Page Gateway (`/`) with 6 Keycloak RBAC simulation cards.
- Multi-role support with instant top-bar switcher for Dual-Role Staff (`ROLE_DUAL_STAFF`).
- Role-specific dashboard queue (`/dashboard`) with KPI strip, assessment timeline, volume donut chart, and searchable/sortable applications table.
- Split-screen verification workspace (`/applications/[id]`) with persistent sticky personal comparison, mismatch detection against NADRA, multi-document tab navigation, inline field remark flags, and BPMN workflow transition modal with reason capture.
- Consolidated Comments Trail & Final Action Screen (`ConsolidatedCommentsAndActionFooter.tsx`) featuring category accordions (`Scrutiny Comments`, `SSC`, `HSSC`, `Degree 14Y`, `Degree 16Y`, `Controller Remarks`), structured inline editing verification table, 14Y/16Y attested document checklist with `Upload Remark` supporting docket attachment, role-specific BPMN transitions with mandatory reason validation, and dual-view completion modal (Official HEC Attestation Certificate Receipt + Synapark REST JSON payload).
- Decoupled Workflow Engine Facade (`workflowEngine.ts` and `mockWorkflowStore.ts`) simulating Synapark BPMN human-task endpoints with full test coverage (16/16 tests passing).
- HEC Manager Staff Leave Management & Respective Task Delegation (`/dashboard/manager`) styled with the CEGA-Inspired Design System (`Orbitron` headings, `#13c2b6` primary accent, `#27b2d7` secondary accent, `#87cbde` subtle surface accents, `#e5e5e5` borders, chromatic shadow `0px 12px 30px rgba(8, 27, 88, 0.08)`):
  - 4 summary KPI cards (`Pending Leave Requests`, `Approved Active Leaves`, `Staff Currently On Leave`, `Unassigned / At-Risk Queue Items`).
  - Searchable Staff Leave Requests table with approval prompt triggering task delegation, rejection reason capture, and direct delegate actions.
  - Active & Respective Task Delegation table with live status badges and one-click revocation.
  - Role-compatible Task Delegation drawer/modal with dynamic delegatee filtering (workload counts and role matching), bulk queue or selective application checklist, Zod validation, audit trail logging, and Synapark CMMN REST JSON event preview.
- Clean code quality validation (`yarn run check` and `yarn build` pass with zero errors).
- Stage Assessment Analytics Chart spacing enhancement (`AssessmentChart.tsx`): decoupled bar canvas from status labels, floating tabular count badges, dedicated responsive 5-column status pill footer with generous padding preventing visual overlap.
- Realistic client-ready application dataset expanded to 21 total dossiers across prestigious Pakistani institutions (LUMS, FAST, Aga Khan, UET Peshawar, QAU, COMSATS, PU, Dow, Kinnaird, GIKI, BZU, Karachi University, Preston, IBA Karachi, FJWU).
- Unit & integration test suite expanded to 36 tests across 7 test suites (`workflowEngine.test.ts`, `categoryTabLogic.test.ts`, `remarksHierarchy.test.ts`, `assessmentAnalytics.test.ts`, `documentMagnifier.test.ts`, `health-api.test.ts`, `example.test.ts`) validating 100% test pass rate.
- Document Forensic Optical Loupe Magnifier (`DocumentMagnifier.tsx`): Completely decoupled from document surfaces via a dedicated React Portal rendering into an external Picture-in-Picture Forensic Inspection HUD (`fixed right-6 bottom-6 z-50`). Documents remain 100% unobstructed with zero overlay popups inside document cards. On the document, only an unobtrusive rectangular reticle lens tracks the focal point. Includes 3 synchronized ways to adjust Zoom Intensity (`2x`, `2.5x`, `3x`, `4x`): (1) in-header toolbar switcher pills, (2) interactive buttons directly in the corner HUD header, and (3) mouse wheel scrolling over the document, with hover grace period preventing premature closure.
- Adaptive checklist alignment: "Attested Document Detail Checklist" automatically switches between centered alignment (`mx-auto max-w-2xl`) when a single degree document is present and side-by-side (`grid md:grid-cols-2`) when dual degrees are verified.
- CEGA dark theme synchronization: Accordion step headings in "Consolidated Comments Trail & Inline Verification Log" now feature dark institutional styling matching the Attestation Scope banner (`bg-[#0a1630]`, `#13c2b6` border accents, `Orbitron` typography, and high-contrast status pills).

### In Progress

- Backend integration readiness (swapping Synapark REST endpoints and NADRA live biometrics gateway).

### Planned

- PDF generation for official HEC Attestation Certificate with embedded QR code.
- WebSocket / SSE push notifications for real-time queue synchronization.

## Known Issues

None recorded.

## External Services

- Simulated Synapark BPMN Human-Task Engine (Facade)
- Simulated NADRA Citizen Bio-Gateway (Facade)
- Simulated Higher Education Degree Institutions Gazette Registry (148 Recognized HEDIs)

## Active Decisions Needed

- Product scope
- Authentication requirements
- Data storage requirements
- Deployment environments
- Testing strategy beyond the initial baseline

## Maintenance

Update this file whenever the current state changes. Historical reasoning belongs in `DECISIONS.md`, not here.
