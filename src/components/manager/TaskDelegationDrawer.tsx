'use client';

import * as React from 'react';
import {
  ArrowRightLeft,
  AlertTriangle,
  Code2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  StaffMember,
  StaffLeaveRequest,
  HECApplication,
  DelegationEventResult,
} from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { delegationFormSchema } from './delegation-schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

interface TaskDelegationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  initialLeaveRequest?: StaffLeaveRequest | null;
  onDelegationCompleted: () => void;
}

interface FormInnerProps {
  onClose: () => void;
  staffList: StaffMember[];
  initialLeaveRequest?: StaffLeaveRequest | null;
  onDelegationCompleted: () => void;
  onShowEventResult: (result: DelegationEventResult) => void;
}

function TaskDelegationFormContent({
  onClose,
  staffList,
  initialLeaveRequest,
  onDelegationCompleted,
  onShowEventResult,
}: FormInnerProps) {
  // Determine initial role scope
  const initialRoleScope =
    initialLeaveRequest &&
    initialLeaveRequest.staffRoles.includes('ROLE_HEC_ATTESTATION') &&
    !initialLeaveRequest.staffRoles.includes('ROLE_HEC_SCRUTINY')
      ? 'ROLE_HEC_ATTESTATION'
      : 'ROLE_HEC_SCRUTINY';

  // Form states initialized purely
  const [fromUserId, setFromUserId] = React.useState<string>(
    initialLeaveRequest?.staffId || staffList[0]?.id || ''
  );
  const [roleScope, setRoleScope] = React.useState<
    'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION'
  >(initialRoleScope);
  const [selectedToUserId, setSelectedToUserId] = React.useState<string>('');
  const [scopeType, setScopeType] = React.useState<
    'ALL_PENDING_ROLE_TASKS' | 'SELECTED_APPLICATIONS' | 'DATE_BOUND_COVERING'
  >('ALL_PENDING_ROLE_TASKS');
  const [selectedAppIds, setSelectedAppIds] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState<string>(
    initialLeaveRequest?.startDate || '2026-11-20'
  );
  const [endDate, setEndDate] = React.useState<string>(
    initialLeaveRequest?.endDate || '2026-11-27'
  );
  const [remarks, setRemarks] = React.useState<string>(
    initialLeaveRequest
      ? `Delegation covering ${initialLeaveRequest.leaveType} (${initialLeaveRequest.startDate} – ${initialLeaveRequest.endDate}). Handover authorized by HEC Manager.`
      : ''
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Applications list for selective delegation
  const [applications, setApplications] = React.useState<HECApplication[]>([]);

  // Load applications for selection without synchronous setState
  React.useEffect(() => {
    let isMounted = true;
    if (scopeType === 'SELECTED_APPLICATIONS') {
      workflowEngine.getTasksByRole(roleScope).then((apps) => {
        if (isMounted) {
          setApplications(apps);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [scopeType, roleScope]);

  // Current delegating officer
  const fromStaff = React.useMemo(() => {
    return staffList.find((s) => s.id === fromUserId);
  }, [staffList, fromUserId]);

  // Dynamically filtered list of eligible colleagues enforcing role-compatibility
  const eligibleDelegatees = React.useMemo(() => {
    return staffList.filter((staff) => {
      if (staff.id === fromUserId) return false;
      const hasRoleCapability =
        staff.roles.includes(roleScope) ||
        staff.roles.includes('ROLE_DUAL_STAFF');
      return hasRoleCapability;
    });
  }, [staffList, fromUserId, roleScope]);

  // Derive toUserId without needing useEffect
  const toUserId =
    selectedToUserId &&
    eligibleDelegatees.some((d) => d.id === selectedToUserId)
      ? selectedToUserId
      : eligibleDelegatees[0]?.id || '';

  const toggleSelectApp = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId]
    );
  };

  const handleSelectAllApps = () => {
    if (selectedAppIds.length === applications.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(applications.map((a) => a.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = delegationFormSchema.safeParse({
      fromUserId,
      toUserId,
      roleScope,
      scopeType,
      applicationIds:
        scopeType === 'SELECTED_APPLICATIONS' ? selectedAppIds : [],
      startDate,
      endDate,
      remarks,
      leaveRequestId: initialLeaveRequest?.id,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid form';
      setValidationError(firstError);
      return;
    }

    if (scopeType === 'SELECTED_APPLICATIONS' && selectedAppIds.length === 0) {
      setValidationError(
        'Please select at least one application docket to delegate.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await workflowEngine.delegateTasks(validation.data);
      onShowEventResult(result);

      toast.add({
        title: 'Tasks Successfully Delegated',
        description: `Caseload reassigned from ${result.delegation.fromUserName} to ${result.delegation.toUserName}.`,
        type: 'success',
      });

      onDelegationCompleted();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delegate tasks';
      setValidationError(message);
      toast.add({
        title: 'Delegation Failed',
        description: message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-3 text-xs">
      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle className="size-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Officer Handover Banner */}
      {initialLeaveRequest && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-[#0f766e]">
              <Sparkles className="size-4" />
              <span>Triggered by Leave Request: {initialLeaveRequest.id}</span>
            </div>
            <Badge className="bg-[#13c2b6] text-white">
              {initialLeaveRequest.leaveType}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Officer{' '}
            <span className="font-bold text-slate-900">
              {initialLeaveRequest.staffName}
            </span>{' '}
            has {initialLeaveRequest.pendingTasks.totalTasks} pending tasks (
            {initialLeaveRequest.pendingTasks.scrutinyTasks} Scrutiny,{' '}
            {initialLeaveRequest.pendingTasks.attestationTasks} Attestation).
          </p>
        </div>
      )}

      {/* Step 1: Source Officer & Role Scope */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">
            From Officer (Absent / On Leave)
          </label>
          <select
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
            className="w-full rounded-xl border border-[#e5e5e5] bg-white p-2.5 text-xs text-slate-900 focus:border-[#13c2b6] focus:ring-1 focus:ring-[#13c2b6] focus:outline-none"
            required
          >
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.id}) • {staff.designation}
              </option>
            ))}
          </select>
          {fromStaff && (
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <span>Workload:</span>
              <span className="font-bold text-amber-700">
                {fromStaff.activeWorkload.scrutinyTasks} Scrutiny /{' '}
                {fromStaff.activeWorkload.attestationTasks} Attestation
              </span>
            </div>
          )}
        </div>

        {/* Role Scope to Delegate */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">
            Role Queue to Delegate
          </label>
          <select
            value={roleScope}
            onChange={(e) =>
              setRoleScope(
                e.target.value as 'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION'
              )
            }
            className="w-full rounded-xl border border-[#e5e5e5] bg-white p-2.5 text-xs text-slate-900 focus:border-[#13c2b6] focus:ring-1 focus:ring-[#13c2b6] focus:outline-none"
          >
            <option value="ROLE_HEC_SCRUTINY">
              HEC Scrutiny Queue (NADRA, Biometrics & Screening)
            </option>
            <option value="ROLE_HEC_ATTESTATION">
              HEC Attestation Queue (Equivalence & Official Stamp)
            </option>
          </select>
          <p className="text-[10px] text-slate-400">
            Tasks will only be routed to staff holding this respective role.
          </p>
        </div>
      </div>

      {/* Step 2: Target Delegatee (Role-Compatible Filtered) */}
      <div className="space-y-1.5 rounded-xl border border-cyan-100 bg-cyan-50/30 p-3.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-semibold text-slate-800">
            <ShieldCheck className="size-4 text-[#27b2d7]" />
            <span>Assign To Delegatee (Respective Role Colleague)</span>
          </label>
          <span className="font-mono text-[10px] text-slate-500">
            {eligibleDelegatees.length} eligible candidates available
          </span>
        </div>

        {eligibleDelegatees.length === 0 ? (
          <div className="p-3 text-center text-xs text-rose-600">
            No eligible colleague holds role capability &ldquo;{roleScope}
            &rdquo;. Please check staff directory.
          </div>
        ) : (
          <select
            value={toUserId}
            onChange={(e) => setSelectedToUserId(e.target.value)}
            className="w-full rounded-xl border border-[#e5e5e5] bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-[#13c2b6] focus:ring-1 focus:ring-[#13c2b6] focus:outline-none"
            required
          >
            {eligibleDelegatees.map((del) => (
              <option key={del.id} value={del.id}>
                {del.name} ({del.id}) — Active Load:{' '}
                {roleScope === 'ROLE_HEC_SCRUTINY'
                  ? del.activeWorkload.scrutinyTasks
                  : del.activeWorkload.attestationTasks}{' '}
                tasks
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 3: Delegation Scope Selector */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-700">Delegation Scope</label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <label
            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all ${
              scopeType === 'ALL_PENDING_ROLE_TASKS'
                ? 'border-[#13c2b6] bg-teal-50/50 shadow-2xs'
                : 'border-[#e5e5e5] bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                All Pending Tasks
              </span>
              <input
                type="radio"
                name="scopeType"
                checked={scopeType === 'ALL_PENDING_ROLE_TASKS'}
                onChange={() => setScopeType('ALL_PENDING_ROLE_TASKS')}
                className="size-3.5 text-[#13c2b6]"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Bulk transfer all applications in this officer&apos;s queue.
            </p>
          </label>

          <label
            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all ${
              scopeType === 'SELECTED_APPLICATIONS'
                ? 'border-[#13c2b6] bg-teal-50/50 shadow-2xs'
                : 'border-[#e5e5e5] bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Selective Items</span>
              <input
                type="radio"
                name="scopeType"
                checked={scopeType === 'SELECTED_APPLICATIONS'}
                onChange={() => setScopeType('SELECTED_APPLICATIONS')}
                className="size-3.5 text-[#13c2b6]"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Handpick specific candidate dossiers by Application ID.
            </p>
          </label>

          <label
            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all ${
              scopeType === 'DATE_BOUND_COVERING'
                ? 'border-[#13c2b6] bg-teal-50/50 shadow-2xs'
                : 'border-[#e5e5e5] bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Date-Bound Window
              </span>
              <input
                type="radio"
                name="scopeType"
                checked={scopeType === 'DATE_BOUND_COVERING'}
                onChange={() => setScopeType('DATE_BOUND_COVERING')}
                className="size-3.5 text-[#13c2b6]"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Temporary covering window during leave dates.
            </p>
          </label>
        </div>
      </div>

      {/* Sub-view: Selective Applications Checklist Table */}
      {scopeType === 'SELECTED_APPLICATIONS' && (
        <div className="space-y-2 rounded-xl border border-[#e5e5e5] bg-slate-50/60 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Select Dossiers to Delegate ({selectedAppIds.length} chosen)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllApps}
              className="h-6 text-[11px] text-[#13c2b6]"
            >
              {selectedAppIds.length === applications.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>

          {applications.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No active applications found in this queue.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#e5e5e5] bg-white">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-[#e5e5e5] bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="w-8 p-2"></th>
                    <th className="p-2">Application ID</th>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">Target Degree</th>
                    <th className="p-2">SLA Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => toggleSelectApp(app.id)}
                      className="cursor-pointer hover:bg-teal-50/40"
                    >
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAppIds.includes(app.id)}
                          onChange={() => toggleSelectApp(app.id)}
                          className="size-3.5 text-[#13c2b6]"
                        />
                      </td>
                      <td className="p-2 font-mono font-bold text-slate-900">
                        {app.id}
                      </td>
                      <td className="p-2 font-semibold text-slate-800">
                        {app.personalDetails.fullName}
                      </td>
                      <td className="p-2 text-slate-600">
                        {app.targetDegreeTitle}
                      </td>
                      <td className="p-2 font-mono text-[10px] text-amber-700">
                        {new Date(app.slaDeadline).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Effective Period */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">
            Effective From Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-xl border-[#e5e5e5] font-mono text-xs"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">
            Effective To Date (Until Leave Ends)
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-xl border-[#e5e5e5] font-mono text-xs"
            required
          />
        </div>
      </div>

      {/* Step 5: Manager Handover Note */}
      <div className="space-y-1">
        <label className="font-semibold text-slate-700">
          Manager Remarks / Handover Note:{' '}
          <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="State formal reasons for delegation (e.g. Covering urgent engineering scrutiny dossiers during annual leave approved by Operations Director)..."
          className="w-full rounded-xl border border-[#e5e5e5] p-2.5 text-xs text-slate-900 focus:border-[#13c2b6] focus:ring-1 focus:ring-[#13c2b6] focus:outline-none"
          required
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="rounded-xl border-[#e5e5e5] text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="rounded-xl bg-[#13c2b6] text-xs font-semibold text-white shadow-xs hover:bg-[#0f9f95]"
        >
          {isSubmitting ? 'Delegating...' : 'Execute Task Delegation'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskDelegationDrawer({
  isOpen,
  onClose,
  staffList,
  initialLeaveRequest,
  onDelegationCompleted,
}: TaskDelegationDrawerProps) {
  // Synapark BPMN JSON event preview modal
  const [eventResult, setEventResult] =
    React.useState<DelegationEventResult | null>(null);

  return (
    <>
      {/* Main Delegation Drawer / Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl border border-[#e5e5e5] bg-white p-6 text-slate-900 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
          <DialogHeader className="border-b border-[#e5e5e5] pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#13c2b6]">
                  <ArrowRightLeft className="size-5" />
                </div>
                <div>
                  <DialogTitle className="font-orbitron text-base font-bold text-slate-900">
                    Respective Task Delegation & Workload Handover
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Synapark CMMN Dynamic Task Reassignment under Keycloak RBAC
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-[#13c2b6] bg-teal-50 font-mono text-[10px] font-bold text-[#0f766e]"
              >
                ROLE-COMPATIBLE ROUTING
              </Badge>
            </div>
          </DialogHeader>

          {/* Render inner form keyed by leave request ID to reset state cleanly */}
          <TaskDelegationFormContent
            key={initialLeaveRequest?.id || 'new-delegation'}
            onClose={onClose}
            staffList={staffList}
            initialLeaveRequest={initialLeaveRequest}
            onDelegationCompleted={onDelegationCompleted}
            onShowEventResult={(result) => setEventResult(result)}
          />
        </DialogContent>
      </Dialog>

      {/* Sub-Modal: Synapark BPMN/CMMN JSON Event Preview */}
      <Dialog
        open={!!eventResult}
        onOpenChange={() => {
          setEventResult(null);
          onClose();
        }}
      >
        <DialogContent className="max-w-xl rounded-2xl border border-slate-800 bg-slate-950 font-mono text-white shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-teal-400">
                <Code2 className="size-4" />
                <span>Synapark CMMN Event: TASK_DELEGATED (200 OK)</span>
              </DialogTitle>
              <Badge className="bg-teal-500/20 font-mono text-[10px] text-teal-300">
                REST Event Preview
              </Badge>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Task delegation event emitted to Synapark CMMN runtime. Affected
              applications have been reassigned in real time with audit records.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-x-auto rounded-xl border border-slate-800 bg-black/60 p-3 text-[11px] text-teal-300">
            <pre>
              {JSON.stringify(eventResult?.engineEventPayload, null, 2)}
            </pre>
          </div>

          <DialogFooter className="pt-2">
            <Button
              size="sm"
              onClick={() => {
                setEventResult(null);
                onClose();
              }}
              className="w-full rounded-xl bg-[#13c2b6] font-sans text-xs font-semibold text-white hover:bg-[#0f9f95]"
            >
              Close & Return to Manager Portal →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
