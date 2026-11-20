import {
  AttestedDocumentChecklist,
  AuditTrailEntry,
  DashboardMetrics,
  DelegationEventResult,
  DelegationInput,
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
} from '@/types/workflow';
import {
  INITIAL_MOCK_APPLICATIONS,
  INITIAL_MOCK_STAFF_MEMBERS,
  INITIAL_MOCK_LEAVE_REQUESTS,
  INITIAL_MOCK_DELEGATIONS,
} from './mockWorkflowStore';

// In-memory working store with deep cloning of initial applications
let workingApplications: HECApplication[] = JSON.parse(
  JSON.stringify(INITIAL_MOCK_APPLICATIONS)
);

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
    if (userVal.trim().toLowerCase() !== nadraVal.trim().toLowerCase()) {
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
  compare(
    'maritalStatus',
    'Marital Status',
    personalDetails.maritalStatus,
    nadraData.maritalStatus,
    'warning'
  );
  compare(
    'gender',
    'Gender',
    personalDetails.gender,
    nadraData.gender,
    'error'
  );
  if (personalDetails.dateOfExpiry && nadraData.dateOfExpiry) {
    compare(
      'dateOfExpiry',
      'Date of Expiry',
      personalDetails.dateOfExpiry,
      nadraData.dateOfExpiry,
      'warning'
    );
  }
  if (personalDetails.phoneNumber && nadraData.phoneNumber) {
    compare(
      'phoneNumber',
      'Phone Number',
      personalDetails.phoneNumber,
      nadraData.phoneNumber,
      'warning'
    );
  }
  if (personalDetails.emailAddress && nadraData.emailAddress) {
    compare(
      'emailAddress',
      'Email Address',
      personalDetails.emailAddress,
      nadraData.emailAddress,
      'warning'
    );
  }

  return mismatches;
}

/**
 * Decoupled Workflow Engine Facade
 * Simulates Synapark BPMN/CMMN human-task engine with async REST-ready JSON payloads.
 */
export const workflowEngine = {
  /**
   * Fetches applications assigned to a specific role queue or all for Manager
   */
  async getTasksByRole(
    role: RoleType,
    filterStatus?: string
  ): Promise<HECApplication[]> {
    // Artificial slight latency to mirror Synapark REST call
    await new Promise((resolve) => setTimeout(resolve, 60));

    let results = [...workingApplications];

    switch (role) {
      case 'ROLE_HEC_MANAGER':
        // Manager has global oversight across all queues
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
        // Dual staff can access scrutiny and attestation cases
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
        (app) => app.semanticStatus.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    return results;
  },

  /**
   * Gets a single application by ID with full applicant, academic, remark, and audit data
   */
  async getApplicationById(
    applicationId: string
  ): Promise<HECApplication | null> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const found = workingApplications.find(
      (app) => app.id === applicationId || app.trackingNumber === applicationId
    );
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Attaches or updates a field-level observation remark
   */
  async saveFieldRemark(
    applicationId: string,
    remarkInput: Omit<FieldRemark, 'id' | 'createdAt'> & { id?: string }
  ): Promise<FieldRemark> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const appIndex = workingApplications.findIndex(
      (app) => app.id === applicationId
    );
    if (appIndex === -1) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const app = workingApplications[appIndex];
    let savedRemark: FieldRemark;

    if (remarkInput.id) {
      // Update existing remark
      const remarkIndex = app.remarks.findIndex((r) => r.id === remarkInput.id);
      if (remarkIndex !== -1) {
        savedRemark = {
          ...app.remarks[remarkIndex],
          ...remarkInput,
        };
        app.remarks[remarkIndex] = savedRemark;
      } else {
        savedRemark = {
          ...remarkInput,
          id: `REM-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        app.remarks.push(savedRemark);
      }
    } else {
      savedRemark = {
        ...remarkInput,
        id: `REM-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      app.remarks.push(savedRemark);
    }

    app.lastUpdated = new Date().toISOString();
    return savedRemark;
  },

  /**
   * Deletes a field remark by ID
   */
  async deleteFieldRemark(
    applicationId: string,
    remarkId: string
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const app = workingApplications.find((a) => a.id === applicationId);
    if (!app) return false;

    const initialLen = app.remarks.length;
    app.remarks = app.remarks.filter((r) => r.id !== remarkId);
    app.lastUpdated = new Date().toISOString();
    return app.remarks.length < initialLen;
  },

  /**
   * Updates attested document checklist flags
   */
  async updateDocumentChecklist(
    applicationId: string,
    checklistUpdates: Partial<AttestedDocumentChecklist>
  ): Promise<AttestedDocumentChecklist> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const app = workingApplications.find((a) => a.id === applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    if (checklistUpdates.degree14) {
      app.checklist.degree14 = {
        ...app.checklist.degree14,
        ...checklistUpdates.degree14,
      };
    }
    if (checklistUpdates.degree16) {
      app.checklist.degree16 = {
        ...app.checklist.degree16,
        ...checklistUpdates.degree16,
      };
    }

    app.lastUpdated = new Date().toISOString();
    return app.checklist;
  },

  /**
   * Executes a Synapark BPMN human-task state transition
   */
  async transitionApplicationState(
    input: WorkflowTransitionInput
  ): Promise<WorkflowTransitionResult> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const appIndex = workingApplications.findIndex(
      (app) => app.id === input.applicationId
    );
    if (appIndex === -1) {
      throw new Error(`Application ${input.applicationId} not found`);
    }

    const app = workingApplications[appIndex];
    const previousState = app.currentState;
    const currentState = input.targetState;
    const semanticStatus = deriveSemanticStatus(currentState);

    // Apply checklist updates if supplied
    if (input.checklistUpdates) {
      if (input.checklistUpdates.degree14) {
        app.checklist.degree14 = {
          ...app.checklist.degree14,
          ...input.checklistUpdates.degree14,
        };
      }
      if (input.checklistUpdates.degree16) {
        app.checklist.degree16 = {
          ...app.checklist.degree16,
          ...input.checklistUpdates.degree16,
        };
      }
    }

    // Generate attestation stamp if final approval
    if (currentState === 'ATTESTED_COMPLETED' && !app.attestationStamp) {
      const year = new Date().getFullYear();
      const randomTicket = Math.floor(10000 + Math.random() * 90000);
      app.attestationStamp = {
        stampNumber: `HEC-ATT-${year}-${randomTicket}`,
        ticketNumber: `TKT-${app.trackingNumber.slice(-7)}-A`,
        issuedAt: new Date().toISOString(),
        officerName: input.actorName,
        qrCodeUrl: `/mock-documents/qr-attestation-${app.id}.png`,
      };
    }

    const auditEntry: AuditTrailEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorName: input.actorName,
      authorRole: input.actorRole,
      action: input.action,
      previousState,
      newState: currentState,
      comments:
        input.comments ||
        input.rejectionReason ||
        `State transitioned to ${currentState} by ${input.actorRole}`,
      metadata: {
        rejectionReason: input.rejectionReason,
      },
    };

    app.currentState = currentState;
    app.semanticStatus = semanticStatus;
    app.lastUpdated = new Date().toISOString();
    app.auditTrail.push(auditEntry);

    // Prepare Synapark REST-ready payload preview
    const transitionPayloadPreview = {
      bpmNamespace: 'pk.gov.hec.attestation.workflow',
      processInstanceId: app.processInstanceId,
      taskId: `task-${Date.now()}`,
      transition: {
        fromState: previousState,
        toState: currentState,
        actionName: input.action,
        executedBy: {
          role: input.actorRole,
          name: input.actorName,
        },
        timestamp: auditEntry.timestamp,
      },
      applicationSummary: {
        id: app.id,
        trackingNumber: app.trackingNumber,
        applicantName: app.personalDetails.fullName,
        cnic: app.personalDetails.cnic,
        targetDegreeTitle: app.targetDegreeTitle,
        totalRemarksAttached: app.remarks.length,
      },
      auditRecord: auditEntry,
    };

    return {
      success: true,
      applicationId: app.id,
      processInstanceId: app.processInstanceId,
      taskId: transitionPayloadPreview.taskId,
      previousState,
      currentState,
      semanticStatus,
      auditTrail: app.auditTrail,
      timestamp: auditEntry.timestamp,
      transitionPayloadPreview,
    };
  },

  /**
   * Refreshes NADRA citizen data (simulating live NADRA API call)
   */
  async refreshFromNadra(applicationId: string): Promise<{
    nadraData: HECApplication['nadraData'];
    mismatches: FieldMismatch[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const app = workingApplications.find((a) => a.id === applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    app.nadraData.verifiedAt = new Date().toISOString();
    app.lastUpdated = new Date().toISOString();

    const mismatches = getPersonalMismatches(app);
    app.nadraData.verificationStatus =
      mismatches.length > 0 ? 'MISMATCH' : 'VERIFIED';

    return {
      nadraData: app.nadraData,
      mismatches,
    };
  },

  /**
   * Calculates dashboard KPI counts and metrics
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
   * Retrieves all HEC scrutiny and attestation staff members
   */
  async getStaffMembers(): Promise<StaffMember[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return JSON.parse(JSON.stringify(workingStaffMembers));
  },

  /**
   * Retrieves all staff leave requests
   */
  async getLeaveRequests(): Promise<StaffLeaveRequest[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return JSON.parse(JSON.stringify(workingLeaveRequests));
  },

  /**
   * Retrieves summary KPI metrics for Manager Leave & Delegation workspace
   */
  async getLeaveAndDelegationKpis(): Promise<LeaveAndDelegationKpis> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const pendingLeaveRequests = workingLeaveRequests.filter(
      (l) => l.status === 'Pending Approval'
    ).length;
    const approvedActiveLeaves = workingLeaveRequests.filter(
      (l) => l.status === 'Approved' || l.status === 'Active On Leave'
    ).length;
    const staffCurrentlyOnLeave = workingStaffMembers.filter(
      (s) => s.currentStatus === 'ON_LEAVE'
    ).length;

    // Calculate unassigned or at-risk pending tasks from staff on leave
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
      unassignedAtRiskTasks: unassignedAtRiskTasks || 20,
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
    await new Promise((resolve) => setTimeout(resolve, 50));
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

    // Update staff status
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
    await new Promise((resolve) => setTimeout(resolve, 30));
    return JSON.parse(JSON.stringify(workingDelegations));
  },

  /**
   * Delegates tasks from an absent/leave officer to an eligible role-compatible colleague
   * and updates applications in real-time with Synapark BPMN audit events.
   */
  async delegateTasks(input: DelegationInput): Promise<DelegationEventResult> {
    await new Promise((resolve) => setTimeout(resolve, 70));

    const fromStaff = workingStaffMembers.find(
      (s) => s.id === input.fromUserId
    );
    if (!fromStaff) {
      throw new Error(`Delegating officer ${input.fromUserId} not found`);
    }

    const toStaff = workingStaffMembers.find((s) => s.id === input.toUserId);
    if (!toStaff) {
      throw new Error(`Delegatee ${input.toUserId} not found`);
    }

    // Role-compatible / respective delegation check
    const isCompatible =
      toStaff.roles.includes(input.roleScope) ||
      toStaff.roles.includes('ROLE_DUAL_STAFF');
    if (!isCompatible) {
      throw new Error(
        `Role Incompatibility: Delegatee "${toStaff.name}" does not possess role capability "${input.roleScope}". Tasks can only be delegated to respective role holders.`
      );
    }

    // Determine applications to reassign
    let targetApplications: HECApplication[] = [];
    if (
      input.scopeType === 'SELECTED_APPLICATIONS' &&
      input.applicationIds.length > 0
    ) {
      targetApplications = workingApplications.filter((a) =>
        input.applicationIds.includes(a.id)
      );
    } else {
      // Reassign all matching applications in that role's stage
      const targetStates =
        input.roleScope === 'ROLE_HEC_SCRUTINY'
          ? ['PENDING_SCRUTINY', 'IN_SCRUTINY']
          : ['PENDING_ATTESTATION', 'IN_ATTESTATION'];

      targetApplications = workingApplications.filter((a) =>
        targetStates.includes(a.currentState)
      );
    }

    const delegationId = `DEL-2026-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const affectedAppIds = targetApplications.map((a) => a.id);

    // Update affected applications with new assignee and audit trail entry
    for (const app of targetApplications) {
      app.assignedUserId = toStaff.id;
      app.assignedUserName = toStaff.name;
      app.lastUpdated = nowIso;

      app.auditTrail.push({
        id: `AUD-DEL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: nowIso,
        authorName: 'HEC Executive Operations Manager (Keycloak Session)',
        authorRole: 'ROLE_HEC_MANAGER',
        action: 'TASK_DELEGATED',
        previousState: app.currentState,
        newState: app.currentState,
        comments: `Task delegated from ${fromStaff.name} to ${toStaff.name} under ${input.roleScope}. Handover note: ${input.remarks}`,
        metadata: {
          delegationId,
          fromUserId: fromStaff.id,
          toUserId: toStaff.id,
          roleScope: input.roleScope,
          effectiveWindow: {
            start: input.startDate,
            end: input.endDate,
          },
        },
      });
    }

    // Update workload counters
    const taskCount =
      affectedAppIds.length ||
      (input.roleScope === 'ROLE_HEC_SCRUTINY' ? 14 : 6);
    if (input.roleScope === 'ROLE_HEC_SCRUTINY') {
      fromStaff.activeWorkload.scrutinyTasks = Math.max(
        0,
        fromStaff.activeWorkload.scrutinyTasks - taskCount
      );
      toStaff.activeWorkload.scrutinyTasks += taskCount;
    } else {
      fromStaff.activeWorkload.attestationTasks = Math.max(
        0,
        fromStaff.activeWorkload.attestationTasks - taskCount
      );
      toStaff.activeWorkload.attestationTasks += taskCount;
    }
    fromStaff.activeWorkload.totalTasks =
      fromStaff.activeWorkload.scrutinyTasks +
      fromStaff.activeWorkload.attestationTasks;
    toStaff.activeWorkload.totalTasks =
      toStaff.activeWorkload.scrutinyTasks +
      toStaff.activeWorkload.attestationTasks;

    // If linked to a leave request, update delegatedTasksCount
    if (input.leaveRequestId) {
      const leave = workingLeaveRequests.find(
        (l) => l.id === input.leaveRequestId
      );
      if (leave) {
        leave.delegatedTasksCount =
          (leave.delegatedTasksCount || 0) + taskCount;
      }
    }

    // Format effective period text
    const startFormatted = new Date(input.startDate).toLocaleDateString(
      'en-PK',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
    const endFormatted = new Date(input.endDate).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newDelegation: TaskDelegation = {
      id: delegationId,
      fromUserId: fromStaff.id,
      fromUserName: fromStaff.name,
      toUserId: toStaff.id,
      toUserName: toStaff.name,
      roleScope: input.roleScope,
      scopeType: input.scopeType,
      applicationIds: affectedAppIds,
      tasksCount: taskCount,
      startDate: input.startDate,
      endDate: input.endDate,
      effectivePeriodText: `${startFormatted} – ${endFormatted}`,
      status: 'Active',
      remarks: input.remarks,
      delegatedAt: nowIso,
      leaveRequestId: input.leaveRequestId,
    };

    workingDelegations.unshift(newDelegation);

    // Prepare Synapark BPMN/CMMN event payload preview
    const engineEventPayload = {
      bpmNamespace: 'pk.gov.hec.attestation.delegation',
      processInstanceId: `synapark-cmmn-proc-delegation-${Date.now()}`,
      taskId: `task-del-${Date.now().toString().slice(-5)}`,
      action: 'TASK_DELEGATED',
      delegationRecord: {
        delegationId: newDelegation.id,
        delegatedFrom: {
          userId: fromStaff.id,
          name: fromStaff.name,
          role: input.roleScope,
        },
        delegatedTo: {
          userId: toStaff.id,
          name: toStaff.name,
          role: input.roleScope,
        },
        roleScope: input.roleScope,
        scopeType: input.scopeType,
        applicationIds: affectedAppIds,
        effectiveWindow: {
          start: input.startDate,
          end: input.endDate,
        },
        managerRemarks: input.remarks,
        timestamp: newDelegation.delegatedAt,
      },
      synaparkMetadata: {
        executedBy: 'ROLE_HEC_MANAGER',
        reassignedQueueSize: newDelegation.tasksCount,
        handoverStatus: 'SYNAPARK_EVENT_EMITTED_200_OK',
        eventAuditHash: `SHA256:d8a2...${Date.now().toString(16)}`,
      },
    };

    return {
      success: true,
      delegation: newDelegation,
      reassignedApplicationIds: affectedAppIds,
      engineEventPayload,
    };
  },

  /**
   * Revokes an active task delegation
   */
  async revokeDelegation(delegationId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const delegation = workingDelegations.find((d) => d.id === delegationId);
    if (!delegation) return false;

    delegation.status = 'Revoked';
    delegation.revokedAt = new Date().toISOString();
    return true;
  },

  /**
   * Resets mock data back to factory defaults
   */
  resetStore(): void {
    workingApplications = JSON.parse(JSON.stringify(INITIAL_MOCK_APPLICATIONS));
    workingStaffMembers = JSON.parse(
      JSON.stringify(INITIAL_MOCK_STAFF_MEMBERS)
    );
    workingLeaveRequests = JSON.parse(
      JSON.stringify(INITIAL_MOCK_LEAVE_REQUESTS)
    );
    workingDelegations = JSON.parse(JSON.stringify(INITIAL_MOCK_DELEGATIONS));
  },
};
