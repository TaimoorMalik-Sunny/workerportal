'use client';

import * as React from 'react';
import {
  CheckCircle2,
  ArrowRightLeft,
  Search,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { StaffLeaveRequest } from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

interface StaffLeaveTableProps {
  leaveRequests: StaffLeaveRequest[];
  onLeaveUpdated: () => void;
  onOpenDelegationForLeave: (leave: StaffLeaveRequest) => void;
}

export function StaffLeaveTable({
  leaveRequests,
  onLeaveUpdated,
  onOpenDelegationForLeave,
}: StaffLeaveTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  // Approval with delegation prompt modal
  const [approvalPromptLeave, setApprovalPromptLeave] =
    React.useState<StaffLeaveRequest | null>(null);
  const [rejectPromptLeave, setRejectPromptLeave] =
    React.useState<StaffLeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Filter requests
  const filteredRequests = React.useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesSearch =
        req.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, searchQuery, statusFilter]);

  const handleInitiateApprove = (req: StaffLeaveRequest) => {
    if (req.pendingTasks.totalTasks > 0) {
      // Officer has pending tasks: prompt manager to delegate
      setApprovalPromptLeave(req);
    } else {
      // No pending tasks, approve directly
      executeApproveLeave(req, false);
    }
  };

  const executeApproveLeave = async (
    req: StaffLeaveRequest,
    openDelegation: boolean
  ) => {
    setIsProcessing(true);
    try {
      await workflowEngine.updateLeaveStatus(
        req.id,
        'Approved',
        'Approved by HEC Operations Manager.'
      );
      toast.add({
        title: 'Leave Approved',
        description: `Leave request for ${req.staffName} (${req.leaveType}) approved.`,
        type: 'success',
      });
      onLeaveUpdated();
      setApprovalPromptLeave(null);

      if (openDelegation) {
        onOpenDelegationForLeave(req);
      }
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Approval Failed',
        description: 'Unable to update leave status.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeRejectLeave = async () => {
    if (!rejectPromptLeave) return;
    setIsProcessing(true);
    try {
      await workflowEngine.updateLeaveStatus(
        rejectPromptLeave.id,
        'Rejected',
        rejectReason.trim() || 'Leave request declined due to queue workload.'
      );
      toast.add({
        title: 'Leave Request Rejected',
        description: `Request for ${rejectPromptLeave.staffName} has been declined.`,
        type: 'info',
      });
      onLeaveUpdated();
      setRejectPromptLeave(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Rejection Failed',
        description: 'Unable to update leave status.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Filter & Search Controls */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officer, EMP ID, leave type..."
            className="h-9 rounded-xl border-[#e5e5e5] bg-white pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            'ALL',
            'Pending Approval',
            'Approved',
            'Active On Leave',
            'Rejected',
          ].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-[#13c2b6] text-white shadow-2xs'
                  : 'border border-[#e5e5e5] bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? 'All Requests' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leave Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e5e5e5] bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Staff Name & ID</th>
                <th className="px-4 py-3">Assigned Role(s)</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Leave Window</th>
                <th className="px-4 py-3">Pending Tasks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-xs text-slate-400"
                  >
                    No staff leave requests match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const hasTasks = req.pendingTasks.totalTasks > 0;
                  const isPending = req.status === 'Pending Approval';

                  return (
                    <tr
                      key={req.id}
                      className="transition-colors hover:bg-teal-50/20"
                    >
                      {/* 1. Staff Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-mono text-xs font-bold text-[#13c2b6]">
                            {req.staffName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {req.staffName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {req.staffId} • {req.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Assigned Role(s) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {req.staffRoles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={`text-[9px] font-semibold ${
                                role === 'ROLE_HEC_SCRUTINY'
                                  ? 'border-teal-200 bg-teal-50 text-[#0f766e]'
                                  : role === 'ROLE_HEC_ATTESTATION'
                                    ? 'border-cyan-200 bg-cyan-50 text-[#0e7490]'
                                    : 'border-purple-200 bg-purple-50 text-purple-700'
                              }`}
                            >
                              {role === 'ROLE_HEC_SCRUTINY'
                                ? 'HEC Scrutiny'
                                : role === 'ROLE_HEC_ATTESTATION'
                                  ? 'HEC Attestation'
                                  : 'Scrutiny + Attestation'}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      {/* 3. Leave Type */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">
                          {req.leaveType}
                        </span>
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-[10px] text-slate-500">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      </td>

                      {/* 4. Leave Window */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-medium text-slate-800 tabular-nums">
                          {new Date(req.startDate).toLocaleDateString('en-PK', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          –{' '}
                          {new Date(req.endDate).toLocaleDateString('en-PK', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <Badge
                          variant="outline"
                          className="mt-0.5 border-slate-200 bg-slate-50 font-mono text-[9px] text-slate-600 tabular-nums"
                        >
                          {req.totalDays} Days Window
                        </Badge>
                      </td>

                      {/* 5. Pending Assigned Tasks Count */}
                      <td className="px-4 py-3.5">
                        {hasTasks ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-700 tabular-nums">
                              <AlertTriangle className="size-3 text-amber-500" />
                              {req.pendingTasks.totalTasks} Tasks At Risk
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              {req.pendingTasks.scrutinyTasks > 0 && (
                                <span className="rounded bg-teal-50 px-1 py-0.5 text-[#0f766e]">
                                  {req.pendingTasks.scrutinyTasks} Scrutiny
                                </span>
                              )}
                              {req.pendingTasks.attestationTasks > 0 && (
                                <span className="rounded bg-cyan-50 px-1 py-0.5 text-[#0e7490]">
                                  {req.pendingTasks.attestationTasks}{' '}
                                  Attestation
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>Queue Clear (0)</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Leave Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            req.status === 'Pending Approval'
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : req.status === 'Approved'
                                ? 'border-teal-300 bg-teal-50 text-[#0f766e]'
                                : req.status === 'Active On Leave'
                                  ? 'border-sky-300 bg-sky-50 text-[#0369a1]'
                                  : 'border-rose-300 bg-rose-50 text-rose-800'
                          }`}
                        >
                          {req.status}
                        </Badge>
                      </td>

                      {/* 7. Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleInitiateApprove(req)}
                                className="h-7 rounded-lg bg-[#13c2b6] px-2.5 text-[11px] font-semibold text-white shadow-2xs hover:bg-[#0f9f95]"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectPromptLeave(req)}
                                className="h-7 rounded-lg border-rose-200 px-2 text-[11px] text-rose-700 hover:bg-rose-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Quick Delegation CTA */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenDelegationForLeave(req)}
                            className="h-7 gap-1 rounded-lg border-[#27b2d7] bg-white px-2.5 text-[11px] font-semibold text-[#0e7490] hover:bg-cyan-50"
                            title="Open Respective Task Delegation Drawer"
                          >
                            <ArrowRightLeft className="size-3 text-[#27b2d7]" />
                            <span>Delegate</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Approval Prompt with Task Delegation Warning */}
      <Dialog
        open={!!approvalPromptLeave}
        onOpenChange={() => setApprovalPromptLeave(null)}
      >
        <DialogContent className="max-w-md rounded-2xl border border-[#e5e5e5] bg-white text-slate-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-orbitron flex items-center gap-2 text-sm font-bold text-slate-900">
              <AlertTriangle className="size-4 text-amber-500" />
              <span>Pending Tasks Detected — Action Advised</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Officer{' '}
              <span className="font-bold text-slate-900">
                {approvalPromptLeave?.staffName}
              </span>{' '}
              currently has{' '}
              <span className="font-bold text-amber-700">
                {approvalPromptLeave?.pendingTasks.totalTasks} active
                applications
              </span>{' '}
              assigned in queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-slate-700">
              <p className="font-semibold text-amber-900">
                HEC SLA Compliance Notice:
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                Approving this leave without task handover may result in SLA
                breaches. To ensure continuous student service, we recommend
                delegating these tasks to a role-compatible colleague.
              </p>
            </div>

            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 font-mono text-[11px]">
              <span>Scrutiny Dossiers:</span>
              <span className="font-bold text-teal-800">
                {approvalPromptLeave?.pendingTasks.scrutinyTasks}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 font-mono text-[11px]">
              <span>Attestation Dossiers:</span>
              <span className="font-bold text-cyan-800">
                {approvalPromptLeave?.pendingTasks.attestationTasks}
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() =>
                approvalPromptLeave &&
                executeApproveLeave(approvalPromptLeave, false)
              }
              className="rounded-xl text-xs text-slate-600"
            >
              Approve Without Delegation
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={() =>
                approvalPromptLeave &&
                executeApproveLeave(approvalPromptLeave, true)
              }
              className="gap-1.5 rounded-xl bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0f9f95]"
            >
              <ArrowRightLeft className="size-3.5" />
              <span>Approve & Delegate Tasks Now</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Reject Reason Modal */}
      <Dialog
        open={!!rejectPromptLeave}
        onOpenChange={() => setRejectPromptLeave(null)}
      >
        <DialogContent className="max-w-md rounded-2xl border border-[#e5e5e5] bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="font-orbitron flex items-center gap-2 text-sm font-bold text-slate-900">
              <XCircle className="size-4 text-rose-500" />
              <span>Decline Leave Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Provide formal operational justification for declining leave for{' '}
              {rejectPromptLeave?.staffName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <label className="font-semibold text-slate-700">
              Manager Reason / Operational Note:
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical backlog during convocation peak season; leave deferred until next week..."
              className="w-full rounded-xl border border-[#e5e5e5] p-2.5 text-xs text-slate-900 focus:border-[#13c2b6] focus:outline-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectPromptLeave(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={executeRejectLeave}
              disabled={isProcessing}
              className="rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
