'use client';

import * as React from 'react';
import { ArrowRightLeft, RotateCcw, Plus, Search } from 'lucide-react';
import { TaskDelegation } from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

interface ActiveDelegationsTableProps {
  delegations: TaskDelegation[];
  onDelegationUpdated: () => void;
  onOpenNewDelegation: () => void;
}

export function ActiveDelegationsTable({
  delegations,
  onDelegationUpdated,
  onOpenNewDelegation,
}: ActiveDelegationsTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isRevoking, setIsRevoking] = React.useState<string | null>(null);

  const filteredDelegations = React.useMemo(() => {
    return delegations.filter((del) => {
      return (
        del.fromUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        del.toUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        del.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        del.roleScope.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [delegations, searchQuery]);

  const handleRevoke = async (del: TaskDelegation) => {
    if (
      !confirm(
        `Are you sure you want to revoke delegation ${del.id}? Tasks will be returned to ${del.fromUserName}.`
      )
    ) {
      return;
    }

    setIsRevoking(del.id);
    try {
      await workflowEngine.revokeDelegation(del.id);
      toast.add({
        title: 'Delegation Revoked',
        description: `Delegation ${del.id} marked as Revoked.`,
        type: 'info',
      });
      onDelegationUpdated();
    } catch (err) {
      console.error(err);
      toast.add({
        title: 'Revoke Failed',
        description: 'Unable to revoke delegation.',
        type: 'error',
      });
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search delegation ID, officer name, role..."
            className="h-9 rounded-xl border-[#e5e5e5] bg-white pl-9 text-xs"
          />
        </div>

        <Button
          size="sm"
          onClick={onOpenNewDelegation}
          className="h-9 gap-1.5 rounded-xl bg-[#13c2b6] text-xs font-semibold text-white shadow-2xs hover:bg-[#0f9f95]"
        >
          <Plus className="size-4" />
          <span>+ Create Task Delegation</span>
        </Button>
      </div>

      {/* Main Delegations Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e5e5e5] bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Delegation ID</th>
                <th className="px-4 py-3">From Officer → To Delegatee</th>
                <th className="px-4 py-3">Role Scope</th>
                <th className="px-4 py-3">Tasks Count</th>
                <th className="px-4 py-3">Validity Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredDelegations.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-xs text-slate-400"
                  >
                    No active task delegations found.
                  </td>
                </tr>
              ) : (
                filteredDelegations.map((del) => {
                  const isActive = del.status === 'Active';

                  return (
                    <tr
                      key={del.id}
                      className="transition-colors hover:bg-cyan-50/20"
                    >
                      {/* 1. Delegation ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900">
                          {del.id}
                        </span>
                        <div className="font-mono text-[10px] text-slate-400">
                          {new Date(del.delegatedAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* 2. From -> To */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {del.fromUserName}
                          </span>
                          <ArrowRightLeft className="size-3 text-[#13c2b6]" />
                          <span className="font-bold text-[#0f766e]">
                            {del.toUserName}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-[10px] text-slate-500">
                          &ldquo;{del.remarks}&rdquo;
                        </p>
                      </td>

                      {/* 3. Role Scope */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-semibold ${
                            del.roleScope === 'ROLE_HEC_SCRUTINY'
                              ? 'border-teal-200 bg-teal-50 text-[#0f766e]'
                              : 'border-cyan-200 bg-cyan-50 text-[#0e7490]'
                          }`}
                        >
                          {del.roleScope === 'ROLE_HEC_SCRUTINY'
                            ? 'HEC Scrutiny'
                            : 'HEC Attestation'}
                        </Badge>
                      </td>

                      {/* 4. Tasks Count */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                          {del.tasksCount} Dossiers
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {del.scopeType === 'ALL_PENDING_ROLE_TASKS'
                            ? 'Full Queue'
                            : del.scopeType === 'SELECTED_APPLICATIONS'
                              ? 'Selective'
                              : 'Date-Bound'}
                        </div>
                      </td>

                      {/* 5. Validity Window */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-slate-700">
                          {del.effectivePeriodText}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            del.status === 'Active'
                              ? 'border-teal-300 bg-teal-50 text-[#0f766e]'
                              : del.status === 'Scheduled'
                                ? 'border-sky-300 bg-sky-50 text-[#0369a1]'
                                : del.status === 'Revoked'
                                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                                  : 'border-slate-300 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {del.status}
                        </Badge>
                      </td>

                      {/* 7. Action */}
                      <td className="px-4 py-3.5 text-right">
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevoke(del)}
                            disabled={isRevoking === del.id}
                            className="h-7 rounded-lg border-slate-200 px-2 text-[11px] text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <RotateCcw className="mr-1 size-3" />
                            <span>
                              {isRevoking === del.id ? 'Revoking...' : 'Revoke'}
                            </span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
