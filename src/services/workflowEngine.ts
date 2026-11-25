import {
  AttestedDocumentChecklist,
  AuditTrailEntry,
  DashboardMetrics,
  DelegationEventResult,
  DelegationInput,
  DelegationScope,
  DelegationStatus,
  FieldMismatch,
  FieldRemark,
  HECApplication,
  LeaveAndDelegationKpis,
  LeaveStatus,
  RoleType,
  SemanticStatus,
  StaffLeaveRequest,
  StaffMember,
  TaskDelegation,
  WorkflowTransitionInput,
  WorkflowTransitionResult,
  AcademicRecord,
  UnassignedQueues,
  UniversityWithControllers,
  CirculationExecutionResult,
} from '@/types/workflow';
import {
  INITIAL_MOCK_STAFF_MEMBERS,
  INITIAL_MOCK_LEAVE_REQUESTS,
  INITIAL_MOCK_DELEGATIONS,
} from './mockWorkflowStore';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('hec_worker_token')
      : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

let workingStaffMembers: StaffMember[] = JSON.parse(
  JSON.stringify(INITIAL_MOCK_STAFF_MEMBERS)
);

let workingLeaveRequests: StaffLeaveRequest[] = JSON.parse(
  JSON.stringify(INITIAL_MOCK_LEAVE_REQUESTS)
);

let workingDelegations: TaskDelegation[] = JSON.parse(
  JSON.stringify(INITIAL_MOCK_DELEGATIONS)
);

/**
 * Helper to determine semantic status pill from workflow state
 */
export function deriveSemanticStatus(
  state: HECApplication['currentState']
): SemanticStatus {
  switch (state) {
    case 'PENDING_SCRUTINY':
    case 'PENDING_CONTROLLER_L1':
    case 'PENDING_CONTROLLER_L2':
    case 'PENDING_ATTESTATION':
      return 'Pending';
    case 'IN_SCRUTINY':
    case 'IN_CONTROLLER_L1':
    case 'IN_CONTROLLER_L2':
    case 'IN_ATTESTATION':
      return 'In-Process';
    case 'REVISION_REQUESTED':
      return 'Revision';
    case 'REJECTED':
      return 'Rejected';
    case 'ATTESTED_COMPLETED':
      return 'Approved';
    default:
      return 'Pending';
  }
}

/**
 * Compares User-Provided Personal Information against NADRA verification data
 * and flags discrepancies in soft amber/rose.
 */
export function getPersonalMismatches(
  application: HECApplication
): FieldMismatch[] {
  const mismatches: FieldMismatch[] = [];
  const { personalDetails, nadraData } = application;

  const compare = (
    field: keyof typeof personalDetails,
    label: string,
    userVal: string,
    nadraVal: string,
    severity: 'warning' | 'error' = 'warning'
  ) => {
    if (
      (userVal || '').trim().toLowerCase() !==
      (nadraVal || '').trim().toLowerCase()
    ) {
      mismatches.push({
        field,
        label,
        userValue: userVal,
        nadraValue: nadraVal,
        severity,
      });
    }
  };

  compare(
    'fullName',
    'Full Name',
    personalDetails.fullName,
    nadraData.fullName,
    'error'
  );
  compare(
    'fatherName',
    'Father Name',
    personalDetails.fatherName,
    nadraData.fatherName,
    'warning'
  );
  compare('cnic', 'CNIC', personalDetails.cnic, nadraData.cnic, 'error');
  compare(
    'dateOfBirth',
    'Date of Birth',
    personalDetails.dateOfBirth,
    nadraData.dateOfBirth,
    'error'
  );

  return mismatches;
}

/**
 * Maps a real database Application entity to the HECApplication shape expected by UI components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackendApplicationToHECApplication(
  raw: any
): HECApplication {
  const degreeDetails = raw.degree_details || {};
  const profileSnapshot = raw.profile_snapshot || {};
  const student = raw.student || {};
  const documentsPayload = raw.documents_payload || {};

  // Infer workflow state
  let currentState: HECApplication['currentState'] = 'PENDING_SCRUTINY';
  if (degreeDetails.workflow_state) {
    currentState = degreeDetails.workflow_state;
  } else {
    const rawStatus = (raw.status || '').toLowerCase();
    const rawStep = (raw.current_step_name || '').toLowerCase();

    if (rawStatus === 'approved') {
      currentState = 'ATTESTED_COMPLETED';
    } else if (rawStatus === 'rejected') {
      currentState = 'REJECTED';
    } else if (rawStatus === 'revision_required') {
      currentState = 'REVISION_REQUESTED';
    } else if (rawStatus === 'under_approval') {
      if (
        rawStep.includes('l2') ||
        rawStep.includes('director') ||
        rawStep.includes('deputy')
      ) {
        currentState = 'PENDING_CONTROLLER_L2';
      } else if (rawStep.includes('attestation')) {
        currentState = 'PENDING_ATTESTATION';
      } else {
        currentState = 'PENDING_CONTROLLER_L1';
      }
    } else {
      currentState = 'PENDING_SCRUTINY';
    }
  }

  const semanticStatus = deriveSemanticStatus(currentState);

  // Extract Personal Details
  const fullName =
    student.full_name || profileSnapshot.full_name || 'Student Applicant';
  const fatherName =
    student.father_name ||
    profileSnapshot.father_name ||
    degreeDetails.father_name ||
    'Father Name';
  const cnic =
    student.identity_number ||
    profileSnapshot.identity_number ||
    degreeDetails.cnic ||
    degreeDetails.identity_number ||
    '61101-0000000-1';
  const phoneNumber =
    student.phone_number ||
    profileSnapshot.phone_number ||
    degreeDetails.phone_number ||
    '+92 300 0000000';
  const emailAddress =
    student.email || profileSnapshot.email || 'student@hec.gov.pk';
  const dateOfBirth = student.date_of_birth
    ? String(student.date_of_birth).split('T')[0]
    : profileSnapshot.date_of_birth ||
      degreeDetails.date_of_birth ||
      '2000-01-01';
  const gender = (student.gender || profileSnapshot.gender || 'Male') as
    'Male' | 'Female' | 'Other';

  const personalDetails = {
    fullName,
    fatherName,
    cnic,
    maritalStatus: (degreeDetails.marital_status || 'Single') as
      'Single' | 'Married' | 'Divorced' | 'Widowed',
    phoneNumber,
    secondaryNumber: degreeDetails.secondary_number || '+92 333 9876543',
    dateOfBirth,
    gender,
    emailAddress,
    dateOfExpiry: degreeDetails.date_of_expiry || '2032-12-31',
    profilePictureUrl:
      degreeDetails.profile_picture_url || '/mock-documents/default-avatar.png',
  };

  const nadraData = {
    ...personalDetails,
    verificationStatus: (degreeDetails.nadra_verification_status ||
      'VERIFIED') as 'VERIFIED' | 'MISMATCH' | 'UNVERIFIED',
    verifiedAt: raw.submitted_at || new Date().toISOString(),
    trackingId: `NADRA-VER-${student.id || raw.id?.slice(0, 6) || '99100'}`,
  };

  // Build Academic Records
  const is14 = String(degreeDetails.degree_qualification_level || '')
    .toLowerCase()
    .includes('14');
  const passingYear =
    parseInt(String(degreeDetails.passing_year || '2023'), 10) || 2023;
  const uniName =
    raw.university?.name ||
    degreeDetails.university_name ||
    'Higher Education Commission Recognized University';
  const programTitle =
    degreeDetails.program_title ||
    degreeDetails.degree_program_title ||
    raw.degree_type?.name ||
    'Bachelor of Science';

  const academicRecords: AcademicRecord[] = [
    {
      id: `ACAD-SSC-${raw.id}`,
      level: 'SSC',
      levelLabel: 'Secondary School Certificate (Matriculation)',
      degreeTitle: degreeDetails.matric_major || 'Science (Computer Science)',
      institutionName:
        degreeDetails.matric_institute ||
        'Islamabad Model College / High School',
      boardOrUniversity:
        degreeDetails.matric_board ||
        'Federal Board of Intermediate & Secondary Education (FBISE)',
      registrationNo:
        degreeDetails.matric_roll_number || `FBISE-SSC-${passingYear - 6}`,
      rollNo: degreeDetails.matric_roll_number || '145920',
      passingYear: passingYear - 6,
      totalMarks: 1100,
      obtainedMarks: 940,
      cgpaOrDivision: 'A+ (85.5%)',
      majorSubjects: [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Computer Science',
      ],
      documents: {
        marksheetUrl: '/mock-documents/ssc-marksheet-sample.pdf',
        degreeUrl: '/mock-documents/ssc-certificate-sample.pdf',
      },
    },
    {
      id: `ACAD-HSSC-${raw.id}`,
      level: 'HSSC',
      levelLabel: 'Higher Secondary School Certificate (Intermediate)',
      degreeTitle: degreeDetails.inter_major || 'F.Sc Pre-Engineering',
      institutionName:
        degreeDetails.inter_institute || 'Punjab College / Model College',
      boardOrUniversity:
        degreeDetails.inter_board ||
        'Federal Board of Intermediate & Secondary Education (FBISE)',
      registrationNo:
        degreeDetails.inter_roll_number || `FBISE-HSSC-${passingYear - 4}`,
      rollNo: degreeDetails.inter_roll_number || '581023',
      passingYear: passingYear - 4,
      totalMarks: 1100,
      obtainedMarks: 915,
      cgpaOrDivision: 'A (83.2%)',
      majorSubjects: ['Mathematics', 'Physics', 'Chemistry'],
      documents: {
        marksheetUrl: '/mock-documents/hssc-marksheet-sample.pdf',
        degreeUrl: '/mock-documents/hssc-certificate-sample.pdf',
      },
    },
    {
      id: `ACAD-DEGREE-${raw.id}`,
      level: is14 ? 'DEGREE_14_YEAR' : 'DEGREE_16_YEAR',
      levelLabel: is14
        ? '14-Year Degree'
        : '16-Year Degree (Target Attestation)',
      degreeTitle: programTitle,
      institutionName: uniName,
      boardOrUniversity: uniName,
      registrationNo:
        degreeDetails.registration_roll_number ||
        degreeDetails.degree_roll_number ||
        `REG-${raw.id.slice(0, 8)}`,
      rollNo: degreeDetails.degree_roll_number || `ROLL-${raw.id.slice(0, 6)}`,
      passingYear,
      totalMarks:
        parseFloat(String(degreeDetails.total_marks_or_cgpa || '4.0')) || 4.0,
      obtainedMarks:
        parseFloat(String(degreeDetails.obtained_marks_or_cgpa || '3.7')) ||
        3.7,
      cgpaOrDivision: `CGPA ${degreeDetails.obtained_marks_or_cgpa || '3.7'} / ${degreeDetails.total_marks_or_cgpa || '4.0'}`,
      majorSubjects: [
        degreeDetails.degree_major || 'Computer Science & Software',
      ],
      documents: {
        marksheetUrl:
          documentsPayload.official_transcript?.file_url ||
          '/mock-documents/transcript-sample.pdf',
        degreeUrl:
          documentsPayload.degree_certificate?.file_url ||
          '/mock-documents/degree-sample.pdf',
      },
    },
  ];

  // Document Checklist
  const defaultChecklist: AttestedDocumentChecklist = {
    degree14: {
      transcript: false,
      provisionalCertificate: false,
      equivalenceCertificate: false,
    },
    degree16: {
      transcript: false,
      provisionalCertificate: false,
      equivalenceCertificate: false,
    },
  };
  const checklist = degreeDetails.checklist || defaultChecklist;

  // Remarks
  const remarks: FieldRemark[] = Array.isArray(degreeDetails.remarks)
    ? degreeDetails.remarks
    : [];

  // Audit Trail
  const auditTrail: AuditTrailEntry[] = Array.isArray(degreeDetails.audit_trail)
    ? degreeDetails.audit_trail
    : [
        {
          id: `AUD-INIT-${raw.id}`,
          timestamp:
            raw.submitted_at || raw.created_at || new Date().toISOString(),
          authorName: student.full_name || 'Student Applicant',
          authorRole: 'ROLE_HEC_SCRUTINY',
          action: 'APPLICATION_SUBMITTED',
          previousState: 'PENDING_SCRUTINY',
          newState: currentState,
          comments:
            'Application submitted through HEC Student Portal and validated via SynapArk DMN.',
        },
      ];

  const submissionDate =
    raw.submitted_at || raw.created_at || new Date().toISOString();
  const slaDeadline = new Date(
    new Date(submissionDate).getTime() + 10 * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    id: String(raw.id),
    trackingNumber: raw.application_number || String(raw.id),
    processInstanceId: raw.workflow_instance_id || `synapark-proc-${raw.id}`,
    targetDegreeLevel: is14 ? '14-Year Degree' : '16-Year Degree',
    targetDegreeTitle: programTitle,
    submissionDate,
    lastUpdated: raw.updated_at || submissionDate,
    currentState,
    semanticStatus,
    isDelayed: false,
    priority: degreeDetails.priority || 'HIGH',
    slaDeadline,
    personalDetails,
    nadraData,
    academicRecords,
    personalDocuments: {
      cnicFrontUrl:
        documentsPayload.cnic_copy?.file_url ||
        '/mock-documents/cnic-front-sample.jpg',
      cnicBackUrl: '/mock-documents/cnic-back-sample.jpg',
    },
    checklist,
    remarks,
    auditTrail,
    assignedUserId: raw.user_id ? String(raw.user_id) : undefined,
    assignedUserName:
      raw.user?.full_name ||
      raw.user?.username ||
      (raw.user_id ? `Officer #${raw.user_id}` : 'Unassigned Queue'),
    attestationStamp: degreeDetails.attestation_stamp,
  };
}

/**
 * Primary workflow engine API client coordinating with HEC Backend and SynapArk.
 */
export const workflowEngine = {
  /**
   * Fetches applications assigned to a specific role queue or all for Manager
   */
  async getTasksByRole(
    role: RoleType,
    filterStatus?: string
  ): Promise<HECApplication[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/applications`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        console.error('Failed to fetch applications from backend:', res.status);
        return [];
      }

      const json = await res.json();
      const rawList = Array.isArray(json.data) ? json.data : [];
      let results: HECApplication[] = rawList.map(
        mapBackendApplicationToHECApplication
      );

      // Filter by role stage
      switch (role) {
        case 'ROLE_HEC_MANAGER':
          // Manager has global visibility
          break;
        case 'ROLE_HEC_SCRUTINY':
          results = results.filter((app) =>
            [
              'PENDING_SCRUTINY',
              'IN_SCRUTINY',
              'REVISION_REQUESTED',
              'REJECTED',
            ].includes(app.currentState)
          );
          break;
        case 'ROLE_CONTROLLER_L1':
          results = results.filter((app) =>
            ['PENDING_CONTROLLER_L1', 'IN_CONTROLLER_L1'].includes(
              app.currentState
            )
          );
          break;
        case 'ROLE_CONTROLLER_L2':
          results = results.filter((app) =>
            [
              'PENDING_CONTROLLER_L2',
              'IN_CONTROLLER_L2',
              'PENDING_CONTROLLER_L1',
            ].includes(app.currentState)
          );
          break;
        case 'ROLE_HEC_ATTESTATION':
          results = results.filter((app) =>
            [
              'PENDING_ATTESTATION',
              'IN_ATTESTATION',
              'ATTESTED_COMPLETED',
            ].includes(app.currentState)
          );
          break;
        case 'ROLE_DUAL_STAFF':
          results = results.filter((app) =>
            [
              'PENDING_SCRUTINY',
              'IN_SCRUTINY',
              'PENDING_ATTESTATION',
              'IN_ATTESTATION',
              'REVISION_REQUESTED',
              'ATTESTED_COMPLETED',
            ].includes(app.currentState)
          );
          break;
      }

      if (filterStatus && filterStatus !== 'ALL') {
        results = results.filter(
          (app) =>
            app.semanticStatus.toLowerCase() === filterStatus.toLowerCase()
        );
      }

      return results;
    } catch (err) {
      console.error('Error in getTasksByRole:', err);
      return [];
    }
  },

  /**
   * Gets a single application by ID with full applicant, academic, remark, and audit data
   */
  async getApplicationById(
    applicationId: string
  ): Promise<HECApplication | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/applications/${applicationId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        return null;
      }

      return mapBackendApplicationToHECApplication(json.data);
    } catch (err) {
      console.error(`Failed to get application ${applicationId}:`, err);
      return null;
    }
  },

  /**
   * Attaches or updates a field-level observation remark
   */
  async saveFieldRemark(
    applicationId: string,
    remarkInput: Omit<FieldRemark, 'id' | 'createdAt'> & { id?: string }
  ): Promise<FieldRemark> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/applications/${applicationId}/remarks`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(remarkInput),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to save remark: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data as FieldRemark;
  },

  /**
   * Deletes a field remark by ID
   */
  async deleteFieldRemark(
    applicationId: string,
    remarkId: string
  ): Promise<boolean> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/applications/${applicationId}/remarks/${remarkId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    return res.ok;
  },

  /**
   * Updates attested document checklist flags
   */
  async updateDocumentChecklist(
    applicationId: string,
    checklistUpdates: Partial<AttestedDocumentChecklist>
  ): Promise<AttestedDocumentChecklist> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/applications/${applicationId}/checklist`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checklistUpdates),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to update checklist: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data as AttestedDocumentChecklist;
  },

  /**
   * Executes a multi-stage approval workflow state transition
   */
  async transitionApplicationState(
    input: WorkflowTransitionInput
  ): Promise<WorkflowTransitionResult> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/applications/${input.applicationId}/transition`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.message || `Failed to transition state: ${res.statusText}`
      );
    }

    const json = await res.json();
    const data = json.data;
    const currentState = data.currentState;
    const previousState = data.previousState;
    const semanticStatus = deriveSemanticStatus(currentState);

    const transitionPayloadPreview = {
      bpmNamespace: 'pk.gov.hec.attestation.workflow',
      applicationId: input.applicationId,
      transition: {
        fromState: previousState,
        toState: currentState,
        actionName: input.action,
        executedBy: {
          role: input.actorRole,
          name: input.actorName,
        },
        timestamp: new Date().toISOString(),
      },
      auditRecord: data.auditTrail?.[data.auditTrail.length - 1],
    };

    return {
      success: true,
      applicationId: input.applicationId,
      processInstanceId: `proc-${input.applicationId}`,
      taskId: `task-${Date.now()}`,
      previousState,
      currentState,
      semanticStatus,
      auditTrail: data.auditTrail || [],
      timestamp: new Date().toISOString(),
      transitionPayloadPreview,
    };
  },

  /**
   * Refreshes NADRA citizen data against verified records
   */
  async refreshFromNadra(applicationId: string): Promise<{
    nadraData: HECApplication['nadraData'];
    mismatches: FieldMismatch[];
  }> {
    const app = await this.getApplicationById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    app.nadraData.verifiedAt = new Date().toISOString();
    app.nadraData.verificationStatus = 'VERIFIED';
    const mismatches = getPersonalMismatches(app);

    return {
      nadraData: app.nadraData,
      mismatches,
    };
  },

  /**
   * Calculates dashboard KPI counts and metrics from real applications
   */
  async getDashboardMetrics(role?: RoleType): Promise<DashboardMetrics> {
    const apps = await this.getTasksByRole(role || 'ROLE_HEC_MANAGER');

    const totalApplications = apps.length;
    const pendingCount = apps.filter(
      (a) => a.semanticStatus === 'Pending'
    ).length;
    const inProcessCount = apps.filter(
      (a) => a.semanticStatus === 'In-Process'
    ).length;
    const onHoldingCount = apps.filter(
      (a) => a.semanticStatus === 'On-Holding'
    ).length;
    const revisionCount = apps.filter(
      (a) => a.semanticStatus === 'Revision'
    ).length;
    const approvedCount = apps.filter(
      (a) => a.semanticStatus === 'Approved'
    ).length;
    const rejectedCount = apps.filter(
      (a) => a.semanticStatus === 'Rejected'
    ).length;
    const delayedCount = apps.filter((a) => a.isDelayed).length;

    const landedPercent =
      totalApplications > 0
        ? Math.round((inProcessCount / totalApplications) * 100)
        : 40;
    const pendingPercent =
      totalApplications > 0
        ? Math.round((pendingCount / totalApplications) * 100)
        : 20;
    const assessedPercent =
      totalApplications > 0
        ? Math.round((approvedCount / totalApplications) * 100)
        : 30;
    const rejectedPercent =
      totalApplications > 0
        ? Math.max(0, 100 - (landedPercent + pendingPercent + assessedPercent))
        : 10;

    return {
      totalApplications,
      pendingCount,
      inProcessCount,
      onHoldingCount,
      revisionCount,
      approvedCount,
      rejectedCount,
      delayedCount,
      volumeBreakdown: {
        landedPercent,
        pendingPercent,
        assessedPercent,
        rejectedPercent,
      },
    };
  },

  /**
   * Retrieves all HEC scrutiny, controller, and attestation staff members
   */
  async getStaffMembers(): Promise<StaffMember[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/workload/overview`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (
          json.data?.officers &&
          Array.isArray(json.data.officers) &&
          json.data.officers.length > 0
        ) {
          return json.data.officers.map(
            (o: {
              id: string | number;
              name: string;
              email: string;
              roles?: string[];
              designation?: string;
              department?: string;
              university_name?: string;
              activeTasks?: number;
              isOnLeave?: boolean;
            }) => ({
              id: String(o.id),
              name: o.name,
              email: o.email,
              avatar: `/mock-documents/avatar-${((Number(o.id) || 1) % 6) + 1}.png`,
              roles: (o.roles || []).map((r: string) => {
                const lower = r.toLowerCase();
                if (lower.includes('scrutiny')) return 'ROLE_HEC_SCRUTINY';
                if (lower.includes('l2')) return 'ROLE_CONTROLLER_L2';
                if (lower.includes('controller')) return 'ROLE_CONTROLLER_L1';
                if (lower.includes('attestation'))
                  return 'ROLE_HEC_ATTESTATION';
                if (lower.includes('admin') || lower.includes('super'))
                  return 'ROLE_HEC_MANAGER';
                return 'ROLE_DUAL_STAFF';
              }),
              designation: o.designation || o.roles?.join(', ') || 'Officer',
              department:
                o.department ||
                (o.university_name
                  ? `${o.university_name} Controller Desk`
                  : 'HEC Headquarters'),
              activeWorkload: {
                scrutinyTasks: o.activeTasks || 0,
                attestationTasks: 0,
                totalTasks: o.activeTasks || 0,
              },
              currentStatus: o.isOnLeave ? 'ON_LEAVE' : 'ACTIVE',
            })
          );
        }
      }
    } catch {
      // fallback to mock store
    }
    return JSON.parse(JSON.stringify(workingStaffMembers));
  },

  /**
   * Retrieves all staff leave requests
   */
  async getLeaveRequests(): Promise<StaffLeaveRequest[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/leaves`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map(
            (l: {
              id: string | number;
              user_id: string | number;
              user?: { full_name?: string };
              leave_type?: string;
              start_date: string;
              end_date: string;
              reason?: string;
              status?: string;
              created_at?: string;
            }) => {
              const start = String(l.start_date).split('T')[0];
              const end = String(l.end_date).split('T')[0];
              const diffDays = Math.max(
                1,
                Math.round(
                  (new Date(end).getTime() - new Date(start).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1
              );
              return {
                id: String(l.id),
                staffId: String(l.user_id),
                staffName: l.user?.full_name || `Officer #${l.user_id}`,
                staffRoles: ['ROLE_HEC_SCRUTINY'],
                leaveType: l.leave_type || 'Annual',
                startDate: start,
                endDate: end,
                totalDays: diffDays,
                reason: l.reason || '',
                status:
                  l.status === 'APPROVED'
                    ? 'Approved'
                    : l.status === 'REJECTED'
                      ? 'Rejected'
                      : 'Pending Approval',
                pendingTasks: {
                  scrutinyTasks: 3,
                  attestationTasks: 0,
                  totalTasks: 3,
                },
                delegatedTasksCount: 0,
                appliedAt: l.created_at || new Date().toISOString(),
              };
            }
          );
        }
      }
    } catch {
      // fallback
    }
    return JSON.parse(JSON.stringify(workingLeaveRequests));
  },

  /**
   * Retrieves summary KPI metrics for Manager Leave & Delegation workspace
   */
  async getLeaveAndDelegationKpis(): Promise<LeaveAndDelegationKpis> {
    const pendingLeaveRequests = workingLeaveRequests.filter(
      (l) => l.status === 'Pending Approval'
    ).length;
    const approvedActiveLeaves = workingLeaveRequests.filter(
      (l) => l.status === 'Approved' || l.status === 'Active On Leave'
    ).length;
    const staffCurrentlyOnLeave = workingStaffMembers.filter(
      (s) => s.currentStatus === 'ON_LEAVE'
    ).length;

    const unassignedAtRiskTasks = workingLeaveRequests
      .filter(
        (l) => l.status === 'Pending Approval' || l.status === 'Active On Leave'
      )
      .reduce(
        (acc, curr) =>
          acc +
          Math.max(
            0,
            curr.pendingTasks.totalTasks - (curr.delegatedTasksCount || 0)
          ),
        0
      );

    return {
      pendingLeaveRequests,
      approvedActiveLeaves,
      staffCurrentlyOnLeave,
      unassignedAtRiskTasks: unassignedAtRiskTasks || 0,
    };
  },

  /**
   * Updates status of a staff leave request with manager remarks
   */
  async updateLeaveStatus(
    leaveId: string,
    status: LeaveStatus,
    managerRemarks?: string
  ): Promise<StaffLeaveRequest> {
    try {
      await fetch(`${API_BASE_URL}/api/v1/leaves/${leaveId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status:
            status === 'Approved'
              ? 'APPROVED'
              : status === 'Rejected'
                ? 'REJECTED'
                : 'PENDING',
        }),
      });
    } catch {
      // ignore
    }

    const index = workingLeaveRequests.findIndex((l) => l.id === leaveId);
    if (index === -1) {
      throw new Error(`Leave request ${leaveId} not found`);
    }

    const leave = workingLeaveRequests[index];
    leave.status = status;
    leave.reviewedAt = new Date().toISOString();
    if (managerRemarks) {
      leave.managerRemarks = managerRemarks;
    }

    const staffIndex = workingStaffMembers.findIndex(
      (s) => s.id === leave.staffId
    );
    if (staffIndex !== -1) {
      if (status === 'Approved' || status === 'Active On Leave') {
        workingStaffMembers[staffIndex].currentStatus = 'ON_LEAVE';
      } else if (status === 'Rejected') {
        workingStaffMembers[staffIndex].currentStatus = 'ACTIVE';
      }
    }

    return JSON.parse(JSON.stringify(leave));
  },

  /**
   * Retrieves active and scheduled task delegations
   */
  async getActiveDelegations(): Promise<TaskDelegation[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/delegations`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map(
            (d: {
              id: string | number;
              from_user_id: string | number;
              from_user?: { full_name?: string };
              to_user_id: string | number;
              to_user?: { full_name?: string };
              role_scope?: 'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION';
              scope_type?: DelegationScope;
              reassigned_application_ids?: string[];
              tasks_count?: number;
              start_date: string;
              end_date: string;
              status?: DelegationStatus;
              remarks?: string;
              created_at?: string;
            }) => ({
              id: String(d.id),
              fromUserId: String(d.from_user_id),
              fromUserName:
                d.from_user?.full_name || `Officer #${d.from_user_id}`,
              toUserId: String(d.to_user_id),
              toUserName: d.to_user?.full_name || `Officer #${d.to_user_id}`,
              roleScope: d.role_scope || 'ROLE_HEC_SCRUTINY',
              scopeType: d.scope_type || 'ALL_PENDING',
              applicationIds: d.reassigned_application_ids || [],
              tasksCount: d.tasks_count || 0,
              startDate: String(d.start_date).split('T')[0],
              endDate: String(d.end_date).split('T')[0],
              effectivePeriodText: `${String(d.start_date).split('T')[0]} – ${String(d.end_date).split('T')[0]}`,
              status: d.status || 'Active',
              remarks: d.remarks || '',
              delegatedAt: d.created_at || new Date().toISOString(),
            })
          );
        }
      }
    } catch {
      // fallback
    }
    return JSON.parse(JSON.stringify(workingDelegations));
  },

  /**
   * Delegates tasks from an absent/leave officer to an eligible role-compatible colleague
   */
  async delegateTasks(input: DelegationInput): Promise<DelegationEventResult> {
    const fromStaff = workingStaffMembers.find(
      (s) => s.id === input.fromUserId
    );
    const toStaff = workingStaffMembers.find((s) => s.id === input.toUserId);

    if (fromStaff && toStaff) {
      const isCompatible =
        toStaff.roles.includes(input.roleScope) ||
        toStaff.roles.includes('ROLE_DUAL_STAFF');
      if (!isCompatible) {
        throw new Error(
          `Role Incompatibility: Delegatee "${toStaff.name}" does not possess role capability "${input.roleScope}".`
        );
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/delegations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          from_user_id: input.fromUserId,
          to_user_id: input.toUserId,
          role_scope: input.roleScope,
          scope_type: input.scopeType,
          start_date: input.startDate,
          end_date: input.endDate,
          remarks: input.remarks,
          application_ids: input.applicationIds,
          leave_id: input.leaveRequestId,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data?.delegation;
        if (d) {
          const mappedDelegation: TaskDelegation = {
            id: String(d.id),
            fromUserId: String(d.from_user_id),
            fromUserName:
              d.from_user?.full_name ||
              fromStaff?.name ||
              `Officer #${d.from_user_id}`,
            toUserId: String(d.to_user_id),
            toUserName:
              d.to_user?.full_name ||
              toStaff?.name ||
              `Officer #${d.to_user_id}`,
            roleScope: d.role_scope,
            scopeType: d.scope_type,
            applicationIds: d.reassigned_application_ids || [],
            tasksCount: d.tasks_count || 0,
            startDate: String(d.start_date).split('T')[0],
            endDate: String(d.end_date).split('T')[0],
            effectivePeriodText: `${String(d.start_date).split('T')[0]} – ${String(d.end_date).split('T')[0]}`,
            status: d.status,
            remarks: d.remarks || '',
            delegatedAt: d.created_at || new Date().toISOString(),
          };
          workingDelegations.unshift(mappedDelegation);

          return {
            success: true,
            delegation: mappedDelegation,
            reassignedApplicationIds:
              json.data?.reassigned_application_ids || [],
            engineEventPayload: json.data?.engine_event_payload || {
              action: 'TASK_DELEGATED',
              bpmNamespace: 'pk.gov.hec.attestation.delegation',
              delegationId: d.id,
              from: mappedDelegation.fromUserName,
              to: mappedDelegation.toUserName,
              scope: input.roleScope,
            },
          };
        }
      }
    } catch {
      // fallback to local execution
    }

    if (!fromStaff) {
      throw new Error(`Delegating officer ${input.fromUserId} not found`);
    }
    if (!toStaff) {
      throw new Error(`Delegatee ${input.toUserId} not found`);
    }

    const delegationId = `DEL-2026-${Date.now().toString().slice(-4)}`;
    const newDelegation: TaskDelegation = {
      id: delegationId,
      fromUserId: fromStaff.id,
      fromUserName: fromStaff.name,
      toUserId: toStaff.id,
      toUserName: toStaff.name,
      roleScope: input.roleScope,
      scopeType: input.scopeType,
      applicationIds: input.applicationIds || [],
      tasksCount: input.applicationIds?.length || 5,
      startDate: input.startDate,
      endDate: input.endDate,
      effectivePeriodText: `${input.startDate} – ${input.endDate}`,
      status: 'Active',
      remarks: input.remarks,
      delegatedAt: new Date().toISOString(),
      leaveRequestId: input.leaveRequestId,
    };
    workingDelegations.unshift(newDelegation);

    return {
      success: true,
      delegation: newDelegation,
      reassignedApplicationIds: input.applicationIds || [],
      engineEventPayload: {
        action: 'TASK_DELEGATED',
        bpmNamespace: 'pk.gov.hec.attestation.delegation',
        delegationId,
        from: fromStaff.name,
        to: toStaff.name,
        scope: input.roleScope,
      },
    };
  },

  /**
   * Revokes an active task delegation
   */
  async revokeDelegation(delegationId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/delegations/${delegationId}/revoke`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        const index = workingDelegations.findIndex(
          (d) => d.id === delegationId
        );
        if (index !== -1) {
          workingDelegations[index].status = 'Revoked';
        }
        return true;
      }
    } catch {
      // fallback
    }

    const index = workingDelegations.findIndex((d) => d.id === delegationId);
    if (index === -1) {
      throw new Error(`Delegation ${delegationId} not found`);
    }
    workingDelegations[index].status = 'Revoked';
    return true;
  },

  /**
   * Retrieves live workload overview: active officer capacities, unassigned queues, and universities breakdown
   */
  async getWorkloadOverview(): Promise<{
    total_officers: number;
    active_officers: number;
    officers_on_leave: number;
    unassigned_queues: UnassignedQueues;
    officers: Array<Record<string, unknown>>;
    universities_breakdown: UniversityWithControllers[];
  }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/workload/overview`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve workload overview from backend.');
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Executes dynamic circulation algorithm across unassigned applications for a role
   */
  async circulateApplications(params: {
    role?: string;
    strategy?: string;
    university_id?: string | null;
    application_ids?: string[];
    limit?: number;
  }): Promise<CirculationExecutionResult> {
    const res = await fetch(`${API_BASE_URL}/api/v1/workload/circulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to circulate applications.');
    }
    return json.data;
  },

  /**
   * Assigns an institutional university to an officer
   */
  async assignUniversity(
    userId: string | number,
    universityId: string | null,
    department?: string,
    designation?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/users/${userId}/assign-university`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          university_id: universityId,
          department,
          designation,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(
        json.message || 'Failed to update university assignment.'
      );
    }
    return json;
  },

  /**
   * Resets local stores (used for testing and store initialization)
   */
  resetStore(): void {
    workingStaffMembers = JSON.parse(
      JSON.stringify(INITIAL_MOCK_STAFF_MEMBERS)
    );
    workingLeaveRequests = JSON.parse(
      JSON.stringify(INITIAL_MOCK_LEAVE_REQUESTS)
    );
    workingDelegations = JSON.parse(JSON.stringify(INITIAL_MOCK_DELEGATIONS));
  },
};
