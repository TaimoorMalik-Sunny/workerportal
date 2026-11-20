Implement the **Consolidated Comments Trail & Final Action Screen** (matching the 3rd screen design) where each role reviews all accumulated field-level remarks, verifies attested document checkboxes, and executes role-specific BPMN state transitions.

### 1. Consolidated Comments Trail & Inline Editing Table

- Organize all remarks chronologically and grouped by document category (`Scrutiny Comments`, `SSC Certificate`, `HSSC Certificate`, `Degree (14 Year)`, `Degree (16 Year)`, `Controller L1/L2 Remarks`) with accordion expand/collapse headers showing comment counts.
- Render a structured verification table with columns:
  - `Title` (e.g., _Full Name_, _Father Name_, _Degree Title_, _Total Marks_)
  - `Claimed Value` (e.g., _Qasim Ali_, _BSCE_, _650_)
  - `Reviewer Comment / Observation` (e.g., _"Father Haider Ali — This Data is validated and correct"_, _"Total marks is 620"_)
  - `Action` (`Edit Remarks` inline input + `Save` button, plus an `+ Add New Remark` modal/drawer for general observations).
- Users can view remarks from previous stages (read-only audit trail with role badge & timestamp) and edit/manage their own current-stage remarks before submitting.

### 2. Attested Document Detail Checklist

- Render the structured multi-degree checklist card:
  - **14 Years Degree:** Checkboxes for `Transcript`, `Provisional Certificate`, `Equivalence Certificate of HEC`.
  - **16 Years Degree:** Checkboxes for `Transcript`, `Provisional Certificate`, `Equivalence Certificate of HEC`.
- Allow the active reviewer (Scrutiny, Controller L1/L2, or Attestation) to toggle verified items and attach an optional supporting remark document (`Upload Remark`).

### 3. Role-Specific Workflow Action Footer (BPMN State Transitions)

- Render dynamic action buttons at the bottom of the screen based strictly on the logged-in user's active role:
  - **If Role = HEC Scrutiny:**
    - `Revision & Send Back to Student` (Routes back to Student Portal with all Scrutiny comments attached)
    - `Reject Application` (Requires mandatory rejection reason)
    - `Approve & Forward to Controller L1` (Routes application to University Controller L1 queue)
  - **If Role = University Controller L1:**
    - `Verify & Forward to Controller L2 (Pass)`
    - `Flag Academic Discrepancy & Forward to Controller L2 (Reject)` _(Note: L1 always routes to L2 in both pass and reject cases with L1 remarks attached)_
  - **If Role = University Controller L2:**
    - `Submit Final University Remarks & Return to HEC` (Routes back to HEC Attestation queue with L1 + L2 academic verification sign-off)
  - **If Role = HEC Attestation / HEC Manager:**
    - `Return to Scrutiny / Revision`
    - `Final Approve & Issue Attestation` (Marks case `COMPLETED` and generates mock attestation verification receipt)
- On clicking any transition button, display a confirmation modal summarizing the remarks count, update the mock BPMN state in `workflowEngine.ts`, show a toast notification with the generated JSON transition payload preview (for developer verification), and redirect cleanly back to the role dashboard.
