import { describe, it, expect, beforeEach } from 'vitest';
import {
  workflowEngine,
  getPersonalMismatches,
} from '@/services/workflowEngine';

describe('Workflow Engine Facade (Synapark BPMN Simulation)', () => {
  beforeEach(() => {
    workflowEngine.resetStore();
  });

  it('fetches tasks for HEC Manager (global oversight)', async () => {
    const tasks = await workflowEngine.getTasksByRole('ROLE_HEC_MANAGER');
    expect(tasks.length).toBeGreaterThanOrEqual(21);
  });

  it('filters tasks appropriately for HEC Scrutiny queue', async () => {
    const tasks = await workflowEngine.getTasksByRole('ROLE_HEC_SCRUTINY');
    const validStates = [
      'PENDING_SCRUTINY',
      'IN_SCRUTINY',
      'REVISION_REQUESTED',
      'REJECTED',
    ];
    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach((t) => {
      expect(validStates).toContain(t.currentState);
    });
  });

  it('fetches tasks for University Controller L1', async () => {
    const tasks = await workflowEngine.getTasksByRole('ROLE_CONTROLLER_L1');
    const validStates = ['PENDING_CONTROLLER_L1', 'IN_CONTROLLER_L1'];
    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach((t) => {
      expect(validStates).toContain(t.currentState);
    });
  });

  it('fetches tasks for Controller L2 (Head Controller Endorsement)', async () => {
    const tasks = await workflowEngine.getTasksByRole('ROLE_CONTROLLER_L2');
    const validStates = [
      'PENDING_CONTROLLER_L1',
      'PENDING_CONTROLLER_L2',
      'IN_CONTROLLER_L2',
    ];
    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach((t) => {
      expect(validStates).toContain(t.currentState);
    });
  });

  it('fetches tasks for HEC Attestation Officer (QR & Seal clearance)', async () => {
    const tasks = await workflowEngine.getTasksByRole('ROLE_HEC_ATTESTATION');
    const validStates = [
      'PENDING_ATTESTATION',
      'IN_ATTESTATION',
      'ATTESTED_COMPLETED',
    ];
    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach((t) => {
      expect(validStates).toContain(t.currentState);
    });
  });

  it('identifies delayed applications that breached SLA deadline', async () => {
    const allTasks = await workflowEngine.getTasksByRole('ROLE_HEC_MANAGER');
    const delayedTasks = allTasks.filter((t) => t.isDelayed);
    expect(delayedTasks.length).toBeGreaterThan(0);
    delayedTasks.forEach((t) => {
      expect(t.slaDeadline).toBeDefined();
    });
  });

  it('loads realistic client-ready applications from varied universities', async () => {
    const lumsApp = await workflowEngine.getApplicationById('APP-2026-1301');
    expect(lumsApp).not.toBeNull();
    expect(lumsApp?.personalDetails.fullName).toBe('Fatima Zahra');
    expect(
      lumsApp?.academicRecords.some((r) => r.institutionName.includes('LUMS'))
    ).toBe(true);

    const akuApp = await workflowEngine.getApplicationById('APP-2026-1303');
    expect(akuApp).not.toBeNull();
    expect(akuApp?.personalDetails.fullName).toBe('Dr. Mahnoor Tariq');
    expect(
      akuApp?.academicRecords.some((r) =>
        r.institutionName.includes('Aga Khan')
      )
    ).toBe(true);

    const fjwuApp = await workflowEngine.getApplicationById('APP-2026-1315');
    expect(fjwuApp).not.toBeNull();
    expect(fjwuApp?.personalDetails.fullName).toBe('Mehwish Rauf');
    expect(
      fjwuApp?.academicRecords.some((r) =>
        r.institutionName.includes('Fatima Jinnah')
      )
    ).toBe(true);
  });

  it('retrieves an application by ID and verifies Qasim Ali data structure', async () => {
    const app = await workflowEngine.getApplicationById('APP-2026-0941');
    expect(app).not.toBeNull();
    expect(app?.personalDetails.fullName).toBe('Qasim Ali');
    expect(app?.targetDegreeTitle).toContain('Computer Engineering');
  });

  it('detects personal details mismatch against NADRA for Qasim Ali', async () => {
    const app = await workflowEngine.getApplicationById('APP-2026-0941');
    expect(app).not.toBeNull();
    if (!app) return;

    const mismatches = getPersonalMismatches(app);
    expect(mismatches.length).toBeGreaterThan(0);
    const fatherMismatch = mismatches.find((m) => m.field === 'fatherName');
    expect(fatherMismatch).toBeDefined();
    expect(fatherMismatch?.userValue).toBe('Haider Ali');
    expect(fatherMismatch?.nadraValue).toBe('Syed Haider Ali');
  });

  it('adds and persists a new field-level audit remark', async () => {
    const remark = await workflowEngine.saveFieldRemark('APP-2026-0941', {
      category: 'Degree (16 Year)',
      fieldTitle: 'Major Subjects',
      claimedValue: 'Embedded Systems',
      observedValue: 'Embedded Systems & Robotics',
      comment: 'Specialization verified from academic transcript.',
      severity: 'info',
      authorRole: 'ROLE_HEC_SCRUTINY',
      authorName: 'Ali Ahmed Qureshi',
      stage: 'IN_SCRUTINY',
    });

    expect(remark.id).toBeDefined();
    expect(remark.comment).toBe(
      'Specialization verified from academic transcript.'
    );

    const updated = await workflowEngine.getApplicationById('APP-2026-0941');
    const found = updated?.remarks.find((r) => r.id === remark.id);
    expect(found).toBeDefined();
  });

  it('executes a BPMN state transition and returns structured REST payload', async () => {
    const result = await workflowEngine.transitionApplicationState({
      applicationId: 'APP-2026-0941',
      action: 'APPROVE_AND_FORWARD_L1',
      targetState: 'PENDING_CONTROLLER_L1',
      actorRole: 'ROLE_HEC_SCRUTINY',
      actorName: 'Ali Ahmed Qureshi',
      comments:
        'Identity and pre-checks verified. Forwarding to NUST Controller L1.',
    });

    expect(result.success).toBe(true);
    expect(result.currentState).toBe('PENDING_CONTROLLER_L1');
    expect(result.transitionPayloadPreview.processInstanceId).toBe(
      'synapark-proc-8839102-bsce'
    );
    expect(result.transitionPayloadPreview.bpmNamespace).toBe(
      'pk.gov.hec.attestation.workflow'
    );

    const updated = await workflowEngine.getApplicationById('APP-2026-0941');
    expect(updated?.currentState).toBe('PENDING_CONTROLLER_L1');
  });

  it('calculates dashboard metrics across all queues', async () => {
    const metrics =
      await workflowEngine.getDashboardMetrics('ROLE_HEC_MANAGER');
    expect(metrics.totalApplications).toBeGreaterThanOrEqual(21);
    expect(metrics.volumeBreakdown).toBeDefined();
    expect(metrics.volumeBreakdown.landedPercent).toBeGreaterThanOrEqual(0);
  });

  it('fetches staff directory and pending leave requests', async () => {
    const staff = await workflowEngine.getStaffMembers();
    expect(staff.length).toBeGreaterThanOrEqual(5);

    const leaves = await workflowEngine.getLeaveRequests();
    expect(leaves.length).toBeGreaterThanOrEqual(4);

    const pendingLeaves = leaves.filter((l) => l.status === 'Pending Approval');
    expect(pendingLeaves.length).toBeGreaterThanOrEqual(2);
  });

  it('calculates leave and delegation KPI summary metrics', async () => {
    const kpis = await workflowEngine.getLeaveAndDelegationKpis();
    expect(kpis.pendingLeaveRequests).toBeGreaterThanOrEqual(1);
    expect(kpis.approvedActiveLeaves).toBeGreaterThanOrEqual(1);
    expect(kpis.unassignedAtRiskTasks).toBeGreaterThanOrEqual(10);
  });

  it('updates leave status and switches staff status to ON_LEAVE', async () => {
    const updated = await workflowEngine.updateLeaveStatus(
      'LEV-2026-001',
      'Approved',
      'Approved by Operations Manager'
    );
    expect(updated.status).toBe('Approved');
    expect(updated.managerRemarks).toBe('Approved by Operations Manager');

    const staffList = await workflowEngine.getStaffMembers();
    const officer = staffList.find((s) => s.id === updated.staffId);
    expect(officer?.currentStatus).toBe('ON_LEAVE');
  });

  it('executes role-compatible task delegation with BPMN audit trail', async () => {
    const result = await workflowEngine.delegateTasks({
      fromUserId: 'EMP-8821', // Ali Ahmed Qureshi (Scrutiny)
      toUserId: 'EMP-9402', // Zainab Fatima (Scrutiny)
      roleScope: 'ROLE_HEC_SCRUTINY',
      scopeType: 'ALL_PENDING_ROLE_TASKS',
      applicationIds: [],
      startDate: '2026-11-20',
      endDate: '2026-11-27',
      remarks: 'Covering annual leave scrutiny queue',
      leaveRequestId: 'LEV-2026-001',
    });

    expect(result.success).toBe(true);
    expect(result.delegation.fromUserId).toBe('EMP-8821');
    expect(result.delegation.toUserId).toBe('EMP-9402');
    expect(result.delegation.status).toBe('Active');
    expect(result.engineEventPayload.action).toBe('TASK_DELEGATED');
    expect(result.engineEventPayload.bpmNamespace).toBe(
      'pk.gov.hec.attestation.delegation'
    );

    // Verify affected application audit trail
    const app = await workflowEngine.getApplicationById('APP-2026-0941');
    const delegationAudit = app?.auditTrail.find(
      (a) => a.action === 'TASK_DELEGATED'
    );
    expect(delegationAudit).toBeDefined();
    expect(delegationAudit?.comments).toContain('Ali Ahmed Qureshi');
    expect(delegationAudit?.comments).toContain('Zainab Fatima');
  });

  it('strictly rejects task delegation when delegatee does not hold role capability', async () => {
    // Attempting to delegate Scrutiny task to Usman Tariq (EMP-9051, only holds ROLE_HEC_ATTESTATION)
    await expect(
      workflowEngine.delegateTasks({
        fromUserId: 'EMP-8821', // Scrutiny
        toUserId: 'EMP-9051', // Attestation only
        roleScope: 'ROLE_HEC_SCRUTINY',
        scopeType: 'ALL_PENDING_ROLE_TASKS',
        applicationIds: [],
        startDate: '2026-11-20',
        endDate: '2026-11-27',
        remarks: 'Invalid delegation attempt',
      })
    ).rejects.toThrow(/Role Incompatibility/);
  });

  it('revokes an active task delegation', async () => {
    const delegationsBefore = await workflowEngine.getActiveDelegations();
    const activeDel = delegationsBefore.find((d) => d.status === 'Active');
    expect(activeDel).toBeDefined();
    if (!activeDel) return;

    const revoked = await workflowEngine.revokeDelegation(activeDel.id);
    expect(revoked).toBe(true);

    const delegationsAfter = await workflowEngine.getActiveDelegations();
    const found = delegationsAfter.find((d) => d.id === activeDel.id);
    expect(found?.status).toBe('Revoked');
  });
});
