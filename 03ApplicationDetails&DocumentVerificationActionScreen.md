Build the **Application Details & Document Verification Action Screen** with sticky personal comparison cards and dynamic tab switching between Personal Documents and Academic Documents.

### 1. Sticky Top Comparison Header (Persistent Across Scroll)

- Pin two horizontal comparison cards at the top of the workspace (`sticky top-0 z-20` with backdrop blur and subtle shadow) so the officer always sees applicant identity while scrolling through documents below:
  - **Card 1: User-Provided Information:** Displays `Full Name`, `Father Name`, `CNIC`, `Marital Status`, `Phone Number`, `Secondary Number`, `Date of Birth`, `Gender`, `Email Address`, `Date of Expiry`, and `Profile Picture` on the right. Each field includes a small inline **edit/flag pencil icon** allowing the reviewer to attach a field-level discrepancy comment directly to that attribute.
  - **Card 2: Data From NADRA:** Mirrors the exact same grid layout with a `"Refresh From NADRA"` action button and NADRA profile photo. Automatically highlights any field mismatch between User-Provided data and NADRA data in soft amber/rose so discrepancies stand out immediately.

### 2. Document Category Navigation Bar

- Directly below the sticky cards, render primary category tabs with notification count badges:
  - `Applicant Details` -> `Personal Documents` (`CNIC`, `Other: Nikah or Disability Certificate`)
  - `SSC Certificate` (with badge count)
  - `HSSC Certificate` (with badge count)
  - `Degree (14 Year)` (with badge count)
  - `Degree (16 Year)` (with badge count)
  - Right-aligned **`Comments Trail`** button (with total comment count badge) to jump to or open the consolidated review screen.
- Display a clear context banner: _"This Application is for Attestation of the 16 Year Degree"_.

### 3. Adaptive Document Viewer Layout

- **When Personal Documents (`CNIC`) is selected:**
  - Render a two-column card layout displaying **CNIC Back** (left) and **CNIC Front** (right), each equipped with interactive **Zoom In (`+`)**, **Zoom Out (`-`)**, **Reset**, and **Rotate** controls.
- **When Academic Documents (`SSC`, `HSSC`, `Degree 14 Year`, `Degree 16 Year`) are selected:**
  - Switch automatically to a **50/50 Split-Screen Inspection View**:
    - **Left Pane (Structured Extracted & Claimed Text Data):** Clean key-value verification table showing `Full Name`, `Father Name`, `Degree Title` (e.g., `BSCE`), `Registration / Roll No`, `Passing Year`, `Total Marks` (e.g., `650`), `Obtained Marks`, and `CGPA/Division`. Each row has an inline **"Add Remark / Flag"** input toggle so the officer can record granular observations (e.g., _"Total marks on transcript is 620 instead of 650"_).
    - **Right Pane (High-Resolution Scanned Document Viewer):** Interactive document canvas with sub-tabs (`Marksheet / Transcript`, `Degree Certificate`, `Provisional Certificate`), smooth zoom-in/zoom-out controls, pan/drag support, and full-screen toggle so the officer can compare the left-side text side-by-side against the right-side scan.
