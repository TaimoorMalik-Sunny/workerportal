import { RoleProfile, RoleType } from '@/types/workflow';

export const ROLE_PROFILES: Record<RoleType, RoleProfile> = {
  ROLE_HEC_MANAGER: {
    id: 'ROLE_HEC_MANAGER',
    title: 'HEC Manager (Executive Oversight)',
    shortTitle: 'HEC Manager',
    badge: 'Executive Oversight',
    department: 'Directorate of Degree Attestation & Accreditation',
    description:
      'Global oversight across all queues, SLA bottlenecks, national compliance, and staff performance metrics.',
    defaultUser: {
      name: 'Dr. Tariq Mahmood',
      designation: 'Director General (A&A), HEC Islamabad',
      avatar: '/avatars/tariq.jpg',
      email: 'tariq.mahmood@hec.gov.pk',
      employeeId: 'HEC-EXEC-0104',
    },
    allowedTransitions: [
      'RETURN_TO_SCRUTINY',
      'ESCALATE_TO_BOARD',
      'FORCE_REASSESSMENT',
    ],
  },
  ROLE_HEC_SCRUTINY: {
    id: 'ROLE_HEC_SCRUTINY',
    title: 'HEC Scrutiny Officer',
    shortTitle: 'Scrutiny Officer',
    badge: 'Tier 1 Screening',
    department: 'Initial Screening & Identity Verification Section',
    description:
      'Initial applicant & NADRA verification, CNIC biometric match, document completeness, and eligibility assessment.',
    defaultUser: {
      name: 'Ali Ahmed Qureshi',
      designation: 'Senior Scrutiny Officer, HEC Islamabad',
      avatar: '/avatars/ali.jpg',
      email: 'a.qureshi@hec.gov.pk',
      employeeId: 'HEC-SCR-4091',
    },
    allowedTransitions: [
      'REVISION_REQUESTED',
      'REJECTED',
      'PENDING_CONTROLLER_L1',
    ],
  },
  ROLE_CONTROLLER_L1: {
    id: 'ROLE_CONTROLLER_L1',
    title: 'University Controller of Examinations (Tier 1)',
    shortTitle: 'Controller L1',
    badge: 'University Tier 1',
    department: 'University Examination Branch — Academic Records Cell',
    description:
      'First-tier university institutional verification against official gazette, transcripts, and registration database.',
    defaultUser: {
      name: 'Prof. Junaid Iqbal',
      designation: 'Deputy Controller Examinations (NUST/QAU Cell)',
      avatar: '/avatars/junaid.jpg',
      email: 'controller.l1@nust.edu.pk',
      employeeId: 'UNI-NUST-L1-88',
    },
    allowedTransitions: ['PENDING_CONTROLLER_L2'],
  },
  ROLE_CONTROLLER_L2: {
    id: 'ROLE_CONTROLLER_L2',
    title: 'University Controller of Examinations (Tier 2 / Sign-off)',
    shortTitle: 'Controller L2',
    badge: 'University Final Sign-off',
    department: 'Office of the Controller of Examinations',
    description:
      'Final university controller sign-off, signature verification, and formal institutional escalation back to HEC.',
    defaultUser: {
      name: 'Dr. Shahzad Akhtar',
      designation: 'Controller of Examinations (Sign-Off Authority)',
      avatar: '/avatars/shahzad.jpg',
      email: 'controller.exams@nust.edu.pk',
      employeeId: 'UNI-NUST-L2-01',
    },
    allowedTransitions: ['PENDING_ATTESTATION'],
  },
  ROLE_HEC_ATTESTATION: {
    id: 'ROLE_HEC_ATTESTATION',
    title: 'HEC Attestation Officer',
    shortTitle: 'Attestation Officer',
    badge: 'Final HEC Stamp',
    department: 'Attestation & Equivalency Issuance Section',
    description:
      'Final HEC stamp, security seal embedding, QR-code ticket generation, equivalence check, and attestation issuance.',
    defaultUser: {
      name: 'Engr. Saima Rauf',
      designation: 'Principal Attestation Officer, HEC Islamabad',
      avatar: '/avatars/saima.jpg',
      email: 's.rauf@hec.gov.pk',
      employeeId: 'HEC-ATT-5521',
    },
    allowedTransitions: ['ATTESTED_COMPLETED', 'REVISION_REQUESTED'],
  },
  ROLE_DUAL_STAFF: {
    id: 'ROLE_DUAL_STAFF',
    title: 'Dual-Role Staff (Scrutiny + Attestation)',
    shortTitle: 'Dual-Role Staff',
    badge: 'Multi-Role Staff',
    department: 'HEC Operations Taskforce — Hybrid Clearance Cell',
    description:
      'Demonstrates multi-role user capability with an instant top-bar role switcher between Scrutiny and Attestation workspaces.',
    defaultUser: {
      name: 'Zeeshan Haider',
      designation: 'Lead Verification Specialist (Dual Authorized)',
      avatar: '/avatars/zeeshan.jpg',
      email: 'z.haider@hec.gov.pk',
      employeeId: 'HEC-HYB-9022',
    },
    allowedTransitions: [
      'PENDING_CONTROLLER_L1',
      'ATTESTED_COMPLETED',
      'REVISION_REQUESTED',
      'REJECTED',
    ],
  },
};
