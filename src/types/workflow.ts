/**
 * Types and schemas for the Higher Education Commission (HEC)
 * Scrutiny & Attestation Portal (Synapark BPMN / Keycloak RBAC simulation).
 */

export type RoleType =
  | 'ROLE_HEC_MANAGER'
  | 'ROLE_HEC_SCRUTINY'
  | 'ROLE_CONTROLLER_L1'
  | 'ROLE_CONTROLLER_L2'
  | 'ROLE_HEC_ATTESTATION'
  | 'ROLE_DUAL_STAFF';

export type ApplicationWorkflowState =
  | 'PENDING_SCRUTINY'
  | 'IN_SCRUTINY'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'PENDING_CONTROLLER_L1'
  | 'IN_CONTROLLER_L1'
  | 'PENDING_CONTROLLER_L2'
  | 'IN_CONTROLLER_L2'
  | 'PENDING_ATTESTATION'
  | 'IN_ATTESTATION'
  | 'ATTESTED_COMPLETED';

export type SemanticStatus =
  | 'Approved'
  | 'Pending'
  | 'In-Process'
  | 'On-Holding'
  | 'Revision'
  | 'Rejected'
  | 'Delayed';

export interface RoleProfile {
  id: RoleType;
  title: string;
  shortTitle: string;
  badge: string;
  department: string;
  description: string;
  defaultUser: {
    name: string;
    designation: string;
    avatar: string;
    email: string;
    employeeId: string;
  };
  allowedTransitions: string[];
}

export interface PersonalDetails {
  fullName: string;
  fatherName: string;
  cnic: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  phoneNumber: string;
  secondaryNumber?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  emailAddress: string;
  dateOfExpiry: string;
  profilePictureUrl: string;
}

export interface NadraVerificationData {
  fullName: string;
  fatherName: string;
  cnic: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  phoneNumber: string;
  secondaryNumber?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  emailAddress: string;
  dateOfExpiry: string;
  profilePictureUrl: string;
  verificationStatus: 'VERIFIED' | 'MISMATCH' | 'UNVERIFIED';
  verifiedAt: string;
  trackingId: string;
}

export interface FieldMismatch {
  field: keyof PersonalDetails;
  label: string;
  userValue: string;
  nadraValue: string;
  severity: 'warning' | 'error';
}

export interface AcademicRecord {
  id: string;
  level: 'SSC' | 'HSSC' | 'DEGREE_14_YEAR' | 'DEGREE_16_YEAR';
  levelLabel: string;
  degreeTitle: string;
  institutionName: string;
  boardOrUniversity: string;
  registrationNo: string;
  rollNo: string;
  passingYear: number;
  totalMarks: number;
  obtainedMarks: number;
  cgpaOrDivision: string;
  majorSubjects: string[];
  documents: {
    marksheetUrl: string;
    degreeUrl: string;
    provisionalUrl?: string;
  };
}

export interface FieldRemark {
  id: string;
  category:
    | 'Personal Details'
    | 'NADRA Verification'
    | 'SSC Certificate'
    | 'HSSC Certificate'
    | 'Degree (14 Year)'
    | 'Degree (16 Year)'
    | 'Controller L1 Remarks'
    | 'Controller L2 Remarks'
    | 'Attestation Decision';
  fieldTitle: string;
  claimedValue: string;
  observedValue?: string;
  comment: string;
  severity: 'info' | 'discrepancy' | 'resolved';
  authorRole: RoleType;
  authorName: string;
  createdAt: string;
  stage: ApplicationWorkflowState;
}

export interface AttestedDocumentChecklist {
  degree14: {
    transcript: boolean;
    provisionalCertificate: boolean;
    equivalenceCertificate: boolean;
    remarkDocumentUrl?: string;
  };
  degree16: {
    transcript: boolean;
    provisionalCertificate: boolean;
    equivalenceCertificate: boolean;
    remarkDocumentUrl?: string;
  };
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: RoleType;
  action: string;
  previousState: ApplicationWorkflowState;
  newState: ApplicationWorkflowState;
  comments: string;
  metadata?: Record<string, unknown>;
}

export interface HECApplication {
  id: string;
  trackingNumber: string;
  processInstanceId: string;
  targetDegreeLevel: '14-Year Degree' | '16-Year Degree';
  targetDegreeTitle: string;
  submissionDate: string;
  lastUpdated: string;
  currentState: ApplicationWorkflowState;
  semanticStatus: SemanticStatus;
  isDelayed: boolean;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  slaDeadline: string;
  personalDetails: PersonalDetails;
  nadraData: NadraVerificationData;
  academicRecords: AcademicRecord[];
  personalDocuments: {
    cnicFrontUrl: string;
    cnicBackUrl: string;
    nikahOrDisabilityCertificateUrl?: string;
  };
  checklist: AttestedDocumentChecklist;
  remarks: FieldRemark[];
  auditTrail: AuditTrailEntry[];
  assignedUserId?: string;
  assignedUserName?: string;
  attestationStamp?: {
    stampNumber: string;
    ticketNumber: string;
    issuedAt: string;
    officerName: string;
    qrCodeUrl: string;
  };
}

export interface WorkflowTransitionInput {
  applicationId: string;
  action: string;
  targetState: ApplicationWorkflowState;
  actorRole: RoleType;
  actorName: string;
  comments: string;
  rejectionReason?: string;
  checklistUpdates?: Partial<AttestedDocumentChecklist>;
}

export interface WorkflowTransitionResult {
  success: boolean;
  applicationId: string;
  processInstanceId: string;
  taskId: string;
  previousState: ApplicationWorkflowState;
  currentState: ApplicationWorkflowState;
  semanticStatus: SemanticStatus;
  auditTrail: AuditTrailEntry[];
  timestamp: string;
  transitionPayloadPreview: Record<string, unknown>;
}

export interface DashboardMetrics {
  totalApplications: number;
  pendingCount: number;
  inProcessCount: number;
  onHoldingCount: number;
  revisionCount: number;
  approvedCount: number;
  rejectedCount: number;
  delayedCount: number;
  volumeBreakdown: {
    landedPercent: number;
    pendingPercent: number;
    assessedPercent: number;
    rejectedPercent: number;
  };
}

export type LeaveType =
  | 'Annual Leave'
  | 'Medical / Sick Leave'
  | 'Casual / Emergency Leave'
  | 'Official Duty';

export type LeaveStatus =
  'Pending Approval' | 'Approved' | 'Rejected' | 'Active On Leave';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roles: RoleType[];
  designation: string;
  department: string;
  activeWorkload: {
    scrutinyTasks: number;
    attestationTasks: number;
    totalTasks: number;
  };
  currentStatus: 'ACTIVE' | 'ON_LEAVE' | 'PARTIAL_DELEGATED';
}

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffRoles: RoleType[];
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  pendingTasks: {
    scrutinyTasks: number;
    attestationTasks: number;
    totalTasks: number;
  };
  delegatedTasksCount: number;
  managerRemarks?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export type DelegationScope =
  'ALL_PENDING_ROLE_TASKS' | 'SELECTED_APPLICATIONS' | 'DATE_BOUND_COVERING';

export type DelegationStatus = 'Active' | 'Scheduled' | 'Completed' | 'Revoked';

export interface TaskDelegation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  roleScope: 'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION';
  scopeType: DelegationScope;
  applicationIds: string[];
  tasksCount: number;
  startDate: string;
  endDate: string;
  effectivePeriodText: string;
  status: DelegationStatus;
  remarks: string;
  delegatedAt: string;
  revokedAt?: string;
  leaveRequestId?: string;
}

export interface DelegationInput {
  fromUserId: string;
  toUserId: string;
  roleScope: 'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION';
  scopeType: DelegationScope;
  applicationIds: string[];
  startDate: string;
  endDate: string;
  remarks: string;
  leaveRequestId?: string;
}

export interface DelegationEventResult {
  success: boolean;
  delegation: TaskDelegation;
  reassignedApplicationIds: string[];
  engineEventPayload: Record<string, unknown>;
}

export interface LeaveAndDelegationKpis {
  pendingLeaveRequests: number;
  approvedActiveLeaves: number;
  staffCurrentlyOnLeave: number;
  unassignedAtRiskTasks: number;
}
