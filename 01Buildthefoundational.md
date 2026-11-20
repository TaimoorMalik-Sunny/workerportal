Build the foundational Next.js (App Router, TypeScript) frontend for the **Higher Education Commission (HEC) Scrutiny & Attestation Portal**, using **shadcn/ui**, **Tailwind CSS**, and **Lucide React** icons.

### 1. Visual Design System (Education & Governance Theme)

- **Color Palette:** Deep HEC Emerald Green (`#064E3B` / `#047857`) as primary brand color, crisp Slate/Off-White (`#F8FAFC`) canvas background, clean White (`#FFFFFF`) elevated cards with subtle `#E2E8F0` borders, and semantic status pills (Approved: Emerald, Pending: Amber, In-Process: Blue, On-Holding: Purple, Revision: Orange, Rejected: Rose).
- **Typography:** Clean institutional sans-serif (`Inter` / `Plus Jakarta Sans`) with tabular numbers (`tabular-nums`) for CNICs, dates, roll numbers, and metrics.

### 2. Role-Segregated Landing Page (`/`)

- Create a clean, authoritative HEC Portal Gateway landing page with official header branding ("Higher Education Commission, Pakistan — Digital Degree Verification & Attestation Ecosystem").
- Display interactive **Role Access Cards** with distinct icons so any evaluator or user can click to enter their respective portal view immediately (simulating Keycloak RBAC session state):
  1. **HEC Manager** (`ROLE_HEC_MANAGER`) — Global oversight across all queues, SLA bottlenecks, and staff performance.
  2. **HEC Scrutiny Officer** (`ROLE_HEC_SCRUTINY`) — Initial applicant & NADRA verification and document screening.
  3. **University Controller L1** (`ROLE_CONTROLLER_L1`) — First-tier university academic record & transcript verification.
  4. **University Controller L2** (`ROLE_CONTROLLER_L2`) — Final university controller sign-off & escalation back to HEC.
  5. **HEC Attestation Officer** (`ROLE_HEC_ATTESTATION`) — Final HEC stamp, equivalence check, and attestation issuance.
  6. **Dual-Role Staff (Scrutiny + Attestation)** — Demonstrates multi-role user capability with an instant top-bar role switcher between Scrutiny and Attestation workspaces without logging out.

### 3. Decoupled Workflow Engine Facade (`services/workflowEngine.ts`)

- Implement a **Service Adapter / Facade Pattern** that mirrors a **Synapark BPMN/CMMN** human-task workflow engine.
- Create `mockWorkflowStore.ts` pre-populated with realistic Pakistani student applications (e.g., Qasim Ali, Ayesha Noor, Ali Khan) with full NADRA data, academic records (SSC, HSSC, 14-Year Degree, 16-Year BSCE Degree), and existing audit comments.
- Expose async service methods (`getTasksByRole`, `getApplicationById`, `saveFieldRemark`, `transitionApplicationState`) returning structured JSON payloads (`processInstanceId`, `taskId`, `currentState`, `auditTrail[]`) so real Synapark REST endpoints can be swapped in later with zero UI refactoring.
