'use client';

import * as React from 'react';
import {
  Cpu,
  Building2,
  CheckCircle2,
  ShieldCheck,
  SlidersHorizontal,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  UnassignedQueues,
  UniversityWithControllers,
  CirculationExecutionResult,
} from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ManagerCirculationViewProps {
  onRefreshParent?: () => void;
}

export function ManagerCirculationView({
  onRefreshParent,
}: ManagerCirculationViewProps) {
  const [unassignedQueues, setUnassignedQueues] =
    React.useState<UnassignedQueues>({
      scrutiny: 0,
      controller_l1: 0,
      controller_l2: 0,
      attestation: 0,
      total_unassigned: 0,
    });
  const [universities, setUniversities] = React.useState<
    UniversityWithControllers[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Form states
  const [role, setRole] = React.useState('ROLE_HEC_SCRUTINY');
  const [strategy, setStrategy] = React.useState('EQUAL');
  const [universityId, setUniversityId] = React.useState('');
  const [limit, setLimit] = React.useState('');
  const [feedback, setFeedback] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [lastResult, setLastResult] =
    React.useState<CirculationExecutionResult | null>(null);

  const loadOverview = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await workflowEngine.getWorkloadOverview();
      if (data) {
        if (data.unassigned_queues) setUnassignedQueues(data.unassigned_queues);
        if (data.universities_breakdown)
          setUniversities(data.universities_breakdown);
      }
    } catch (err) {
      console.warn('Failed to fetch workload overview in Worker Portal:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleCirculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    try {
      const result = await workflowEngine.circulateApplications({
        role,
        strategy,
        university_id: universityId || null,
        limit: limit ? Number(limit) : undefined,
      });

      setLastResult(result);
      setFeedback({
        success: true,
        message: result.message || 'Circulation executed successfully.',
      });
      await loadOverview();
      if (onRefreshParent) onRefreshParent();
    } catch (err: unknown) {
      setFeedback({
        success: false,
        message:
          (err instanceof Error ? err.message : '') ||
          'Error executing circulation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5 KPI Cards: Unassigned Queues Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Scrutiny Queue
            </span>
            <Clock className="size-4 text-slate-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900">
            {unassignedQueues.scrutiny}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Awaiting Scrutiny Officer
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Controller L1
            </span>
            <Building2 className="size-4 text-[#13c2b6]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#009588]">
            {unassignedQueues.controller_l1}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Institutional Verification
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Controller L2
            </span>
            <Building2 className="size-4 text-[#27b2d7]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#173e81]">
            {unassignedQueues.controller_l2}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Syndicate / Dean Stage
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Attestation Desk
            </span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-600">
            {unassignedQueues.attestation}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Final QR &amp; Seal Issuance
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase">
              Total Unassigned
            </span>
            <AlertCircle className="size-4 text-amber-600" />
          </div>
          <div className="font-mono text-2xl font-bold text-amber-700">
            {unassignedQueues.total_unassigned}
          </div>
          <p className="mt-1 text-[11px] text-amber-800">
            Pending Auto-Circulation
          </p>
        </div>
      </div>

      {/* Dynamic Circulation Execution Console */}
      <div className="space-y-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[#e5e5e5] pb-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-orbitron flex items-center gap-2 text-sm font-bold text-slate-900">
              <SlidersHorizontal className="size-4 text-[#13c2b6]" />
              DYNAMIC WORKLOAD CIRCULATION CONSOLE
            </h3>
            <p className="text-xs text-slate-500">
              Circulate pending unassigned applications across active role
              officers with multi-tenant university isolation.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOverview}
            disabled={isLoading}
            className="h-8 gap-1.5 rounded-xl border-[#e5e5e5] text-xs font-semibold text-slate-700 hover:border-[#13c2b6]"
          >
            <RefreshCw
              className={`size-3.5 text-[#13c2b6] ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Queues</span>
          </Button>
        </div>

        <form onSubmit={handleCirculate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-bold text-slate-700">
                Target Role / Pipeline Stage
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#13c2b6]"
              >
                <option value="ROLE_HEC_SCRUTINY">
                  HEC Scrutiny (Federal Scrutiny Officers)
                </option>
                <option value="ROLE_CONTROLLER_L1">
                  University Controller L1 (Institutional)
                </option>
                <option value="ROLE_CONTROLLER_L2">
                  University Controller L2 (Institutional)
                </option>
                <option value="ROLE_HEC_ATTESTATION">
                  HEC Attestation (Final QR Signing)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                Circulation Formula
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#13c2b6]"
              >
                <option value="EQUAL">Equally Distribute (Round-Robin)</option>
                <option value="LEAST_LOADED">
                  Least-Loaded First (Balanced Capacity)
                </option>
                <option value="FIFO">FIFO (Oldest Submissions First)</option>
                <option value="LIFO">
                  LIFO (Most Recent Submissions First)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                University Filter
              </label>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#13c2b6]"
              >
                <option value="">
                  All Universities (Strict Institutional Isolation)
                </option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.controllers_count} controllers)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                Batch Limit (Optional)
              </label>
              <Input
                type="number"
                placeholder="All unassigned (or e.g. 10)"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min="1"
                className="mt-1.5 h-9 rounded-xl border-[#e5e5e5] bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-xs text-[#0f766e]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#13c2b6]" />
            <div>
              <span className="font-bold">
                Multi-Tenant Controller Guard Active:
              </span>{' '}
              Applications originating from a university are strictly assigned
              only to designated controllers of that exact institution. Officers
              currently on approved leave are automatically excluded from the
              distribution round.
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {feedback && (
                <span
                  className={`text-xs font-semibold ${
                    feedback.success ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {feedback.success ? '✓ ' : '✗ '}
                  {feedback.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 gap-2 rounded-xl bg-[#13c2b6] text-xs font-bold text-white shadow-2xs hover:bg-[#0f9f95]"
            >
              <Cpu className="size-4" />
              <span>
                {isLoading
                  ? 'Executing Circulation...'
                  : 'Execute Dynamic Circulation'}
              </span>
            </Button>
          </div>
        </form>

        {/* Assignments Result Table */}
        {lastResult &&
          lastResult.assignments &&
          lastResult.assignments.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-[#e5e5e5] pt-4">
              <div className="flex items-center justify-between">
                <span className="font-orbitron text-xs font-bold text-slate-800 uppercase">
                  Circulation Assignments ({lastResult.distributed_count}{' '}
                  Dossiers Distributed)
                </span>
                <Badge className="bg-slate-100 font-mono text-[10px] text-slate-700">
                  Formula: {lastResult.strategy}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5">Application ID</th>
                      <th className="px-3.5 py-2.5">Assigned Officer</th>
                      <th className="px-3.5 py-2.5">Role</th>
                      <th className="px-3.5 py-2.5">Assigned At</th>
                      <th className="px-3.5 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {lastResult.assignments.map(
                      (
                        a: {
                          application_id?: string;
                          application_number?: string;
                          assigned_officer_name?: string;
                          assigned_to_user_name?: string;
                          assigned_role?: string;
                          assigned_at?: string;
                        },
                        i: number
                      ) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="px-3.5 py-2 font-mono font-semibold text-slate-900">
                            {a.application_id || a.application_number}
                          </td>
                          <td className="px-3.5 py-2">
                            <span className="font-semibold text-slate-800">
                              {a.assigned_officer_name ||
                                a.assigned_to_user_name}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-500">
                            {a.assigned_role || role}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-[11px] text-slate-400">
                            {a.assigned_at || 'Just now'}
                          </td>
                          <td className="px-3.5 py-2 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="size-3.5" /> Circulated
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>

      {/* Institutional Controller Deployments Table */}
      <div className="space-y-3 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <div>
            <h3 className="font-orbitron flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building2 className="size-4 text-indigo-600" />
              INSTITUTIONAL CONTROLLER DEPLOYMENTS &amp; BOUNDARIES
            </h3>
            <p className="text-xs text-slate-500">
              Nominated university controllers authorized for institutional
              degree verification.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">University / Institution</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Controllers Count</th>
                <th className="px-4 py-3">Nominated Controllers</th>
                <th className="px-4 py-3 text-right">Isolation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {universities.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {u.short_code}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">
                    {u.controllers_count} officer(s)
                  </td>
                  <td className="px-4 py-3">
                    {u.controllers && u.controllers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {u.controllers.map((c) => (
                          <span
                            key={c.id}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              c.isOnLeave
                                ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {c.name} {c.isOnLeave ? '(On Leave)' : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        No controllers assigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge className="border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                      Isolated
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
