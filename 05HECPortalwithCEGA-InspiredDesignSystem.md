Build the **Higher Education Commission (HEC) Scrutiny & Attestation Portal** in **Next.js (App Router, TypeScript)** with **Tailwind CSS**, **shadcn/ui**, **Lucide React**, and **Zod**, styled strictly using the **CEGA-Inspired Design System** below and powered by a **Synapark BPMN/CMMN Mock Workflow Engine Facade**.

---

### 1. Design System Specification (CEGA-Inspired)

Apply these exact visual tokens, typography, spacing, and component rules across the entire application:

- **Fonts (`next/font/google` + CSS variables):**
  - Headings (`h1`–`h4`): **`Orbitron`**, sans-serif, weight `700` (semi-bold `600` for small headings/labels where specified).
  - Body & UI copy: **`ui-sans-serif`**, sans-serif, with `tabular-nums` on CNICs, dates, registration numbers, counts, and chart figures.
- **Core Palette:**
  - Primary Background (`--color-bg`): `#ffffff`
  - Secondary Surface / Accent Card (`--color-bg-secondary`): `#87cbde` (use softly with light tints or clean `#ffffff` cards + `#e5e5e5` borders so text remains crisp and high-contrast)
  - Primary Accent (`--color-primary`): `#13c2b6` (primary CTAs, active navigation highlights, key interactive accents)
  - Secondary Accent (`--color-secondary`): `#27b2d7` (secondary highlights, hover states, chart accents)
  - Primary Text (`--color-text`): `#000000`
  - Secondary Text (`--color-text-secondary`): `#666666`
  - Borders & Dividers (`--color-border`): `#e5e5e5`
  - Supporting Chart & Status Tokens: `#173e81`, `#0a1630`, `#0d2a55`, `#4f6da5`, `#d8e6ff`, `#009588`, `#f05100`, `#fcbb00`, `#f99c00`, `#e40014`.
- **Spacing & Radii:**
  - Base spacing unit: `12px` grid (`12px`, `24px`, `36px`, `48px` gaps/padding).
  - Cards: `16px`–`18px` border radius (`rounded-2xl`), clean `#e5e5e5` borders, and subtle chromatic shadow `0px 12px 30px rgba(8, 27, 88, 0.08)` on featured/hero/sticky surfaces.
  - Buttons: `8px`–`14px` border radius (`rounded-[10px]` / `rounded-xl`), accessible high-contrast text on `#13c2b6` primary actions, and clean ghost/outlined secondary buttons.
  - Keep a light, clean, airy education & governance UI without unrequested ribbons or clutter.

---

### 2. Role-Segregated Landing Page (`/`)

- Create a clean landing gateway featuring institutional HEC Pakistan branding with `Orbitron` display/heading typography and `#13c2b6` primary actions.
- Include interactive **Role Cards with distinct icons** so clicking any role card opens that role's workspace (simulating Keycloak RBAC & session context):
  1. **HEC Manager** (`ROLE_HEC_MANAGER`) — Oversight across all queues and workflow stages.
  2. **HEC Scrutiny Officer** (`ROLE_HEC_SCRUTINY`) — Initial applicant & NADRA verification and document screening.
  3. **University Controller L1** (`ROLE_CONTROLLER_L1`) — First-tier academic record verification.
  4. **University Controller L2** (`ROLE_CONTROLLER_L2`) — Second-tier university controller sign-off & return to HEC.
  5. **HEC Attestation Officer** (`ROLE_HEC_ATTESTATION`) — Final attestation & verification sign-off.
  6. **Dual-Role User (Scrutiny + Attestation)** — Single user holding both `ROLE_HEC_SCRUTINY` and `ROLE_HEC_ATTESTATION`, with an instant role-switcher in the header to toggle between Scrutiny and Attestation views.

---

### 3. Synapark BPMN/CMMN Mock Workflow Engine Layer (`services/workflowEngine.ts` & `data/mockWorkflowStore.ts`)

- Build a decoupled **Service Facade** that mimics a **Synapark BPMN/CMMN** human-task orchestration engine using local mock JSON data first, structured so REST API endpoints (`start`, `tasks`, `complete` with JSON process variables) can replace the mock store cleanly later.
- Model the end-to-end human intervention routing:
  - Application lands with **HEC Scrutiny**:
    - If deficiencies exist -> can return to **Student** (`RETURNED_TO_STUDENT` / `Revision`) with remarks.
    - If valid -> forwards to **University Controller L1** (`CONTROLLER_L1_PENDING`).
  - **Controller L1** reviews academic records & activity and forwards to **Controller L2** in **both** pass and reject cases, carrying L1 remarks forward.
  - **Controller L2** adds final university remarks and returns the application back to **HEC** (`RETURNED_TO_HEC` / Attestation & Manager review).
  - Every stage allows users to read prior remarks and add/edit remarks on their stage.

---

### 4. Role Dashboard (`/dashboard/[role]`)

- Persistent top bar with HEC Pakistan title, greeting (e.g., _"Greeting's Ali Ahmed"_), active role badge, dual-role switcher (when applicable), and gateway link.
- Left sidebar with `Dashboard`, collapsible `Applications` (`Approved`, `Pending`, `In-Process`, `On-Holding`, `Revision`, `Rejected` with counts), and `Applications History`.
- Top 6 status summary cards (`Delayed`, `Pending`, `In-Process`, `On-Holding`, `Revision`, `Approved`).
- Analytics section with a stage/assessment bar chart, timeframe pills (`Today`, `1 Day`, `3 Days`, `5 Days`, `1 Week`, `2 Weeks`, `1 Month`), `From / To` date range controls, and an **Application Volume** breakdown (`Landed`, `Revised`, `Pending`, `Rejected`, `Total App`, plus percentage indicators).
- **Recent Applications** table (`Application ID`, `Student Name`, `Reg-No`, `Passing Year`, `Date`, `Status`, `Action`) that opens the application action workspace on click.

---

### 5. Sticky Identity Header & Document Inspection Workspace (`/applications/[id]`)

- **Sticky Dual Comparison Cards (Pinned at Top While Scrolling):**
  - Keep **User-Provided Information** and **Data From NADRA** (with `"Refresh From NADRA"` action and profile photo slots) sticky across the screen as the user scrolls through documents and remarks.
  - Display `Full Name`, `Father Name`, `CNIC`, `Marital Status`, `Phone Number`, `Secondary Number`, `Date of Birth`, `Gender`, `Email Address`, and `Date of Expiry`, with inline discrepancy highlights and field-level comment triggers.
- **Document Tabs & Context Banner:**
  - Banner: _"This Application is for Attestation of the 16 Year Degree"_.
  - Tabs for `Personal Documents` (`CNIC`, `Other: Nikah or Disability Certificate`), `SSC Certificate`, `HSSC Certificate`, `Degree (14 Year)`, `Degree (16 Year)`, and `Comments Trail`.
- **Adaptive Document Views:**
  - **CNIC View:** Two side-by-side cards (CNIC Back & CNIC Front), each with interactive **Zoom In (`+`)**, **Zoom Out (`-`)**, and **Reset** controls.
  - **Academic Document View (`SSC`, `HSSC`, `Degree 14 Year`, `Degree 16 Year`):** Split view with **extracted/claimed text fields on the left** (with inline remarks/editing) and the **scanned document image with zoom-in/out controls on the right**.

---

### 6. End-of-Review Comments Trail, Checklist & Role Actions

- Consolidated remarks table/sections (`Scrutiny Comments`, `SSC Certificate`, `HSSC Certificate`, `Degree (14 Year)`, `Degree (16 Year)`, and Controller/Attestation remarks) showing `Title`, `Title Value`, `Comments`, and inline `Edit` / `Save` actions so each role can review their own and prior remarks.
- **Attested Document Detail** checklist (`14 Years Degree` and `16 Years Degree` items: `Transcript`, `Provisional Certificate`, `Equivalence Certificate of HEC`) plus remark upload/action controls (`Reject`, `Revision & Send Back to Student`, `Forward / Submit`, `Approve`) adapted to the active role and updating the mock workflow state with a JSON payload preview.
