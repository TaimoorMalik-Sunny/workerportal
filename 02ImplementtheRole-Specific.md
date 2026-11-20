Implement the **Role-Specific Dashboard & Application Queue** matching the HEC Scrutiny & Attestation dashboard design, dynamically filtered by the active role (`Manager`, `Scrutiny`, `Controller L1`, `Controller L2`, `Attestation`).

### 1. Persistent Shell Layout

- **Top Header Bar:** HEC Pakistan Crest & Title, active portal subtitle, current user greeting (e.g., _"Greeting's Ali Ahmed"_), active Role Badge (with switcher if user holds both Scrutiny & Attestation roles), and quick return to Role Gateway.
- **Left Sidebar Navigation:**
  - `Dashboard` (Active overview)
  - `Applications` (Collapsible sub-tree with live count badges: `Approved`, `Pending`, `In-Process`, `On-Holding`, `Revision`, `Rejected`)
  - `Applications History`

### 2. Dashboard Metrics & Charts Row

- **Top KPI Strip (6 Cards):** Interactive filter cards for `Delayed`, `Pending`, `In-Process`, `On-Holding`, `Revision`, and `Approved` with bold tabular counts.
- **Middle Analytics Grid:**
  - **Scrutiny / Stage Assessment Bar Chart:** Vertical bar chart comparing `Pending`, `In-Process`, `On-Holding`, `Revision`, and `Delayed` counts with quick time-range filters (`Today`, `1 Day`, `3 Days`, `5 Days`, `1 Week`, `2 Weeks`, `1 Month`) and `From / To` date pickers.
  - **Application Volume Donut Chart:** Semi-circle/donut chart displaying `Total App` volume broken down by percentage (`Landed: 40%`, `Pending: 20%`, `Assessed: 30%`, `Rejected: 10%`) alongside `Landed`, `Revised`, `Pending`, and `Rejected` summary counters.

### 3. Recent Applications Data Table

- Full-width searchable, filterable table (`Application ID`, `Student Name`, `Reg-No`, `Passing Year`, `Date`, `Status` badge, and `Action` button).
- Clicking any row or `Action` button navigates directly to the **Application Verification & Action Screen** (`/applications/[id]`).
