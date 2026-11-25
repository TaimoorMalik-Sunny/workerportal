'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { HECApplication } from '@/types/workflow';
import { useAppStore } from '@/store/use-app-store';
import { StatusPill } from '@/components/ui/status-pill';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApplicationsTableProps {
  applications: HECApplication[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ApplicationsTable({
  applications,
  onRefresh,
  isLoading = false,
}: ApplicationsTableProps) {
  const router = useRouter();
  const { selectedStatusFilter, setSelectedStatusFilter } = useAppStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortField, setSortField] =
    React.useState<keyof HECApplication>('submissionDate');
  const [sortAsc, setSortAsc] = React.useState(false);

  const handleSort = (field: keyof HECApplication) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter applications by search and selected status filter
  const filteredApps = React.useMemo(() => {
    let result = [...applications];

    if (selectedStatusFilter && selectedStatusFilter !== 'ALL') {
      if (selectedStatusFilter === 'Delayed') {
        result = result.filter((app) => app.isDelayed);
      } else {
        result = result.filter(
          (app) =>
            app.semanticStatus.toLowerCase() ===
            selectedStatusFilter.toLowerCase()
        );
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((app) => {
        const studentName = app.personalDetails.fullName.toLowerCase();
        const fatherName = app.personalDetails.fatherName.toLowerCase();
        const cnic = app.personalDetails.cnic.toLowerCase();
        const tracking = app.trackingNumber.toLowerCase();
        const appId = app.id.toLowerCase();
        const regNos = app.academicRecords
          .map((r) => r.registrationNo.toLowerCase())
          .join(' ');
        const degree = app.targetDegreeTitle.toLowerCase();

        return (
          studentName.includes(q) ||
          fatherName.includes(q) ||
          cnic.includes(q) ||
          tracking.includes(q) ||
          appId.includes(q) ||
          regNos.includes(q) ||
          degree.includes(q)
        );
      });
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (sortField === 'submissionDate') {
        const timeA = new Date(a.submissionDate).getTime();
        const timeB = new Date(b.submissionDate).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return 0;
    });

    return result;
  }, [applications, selectedStatusFilter, searchTerm, sortField, sortAsc]);

  const handleRowClick = (id: string) => {
    router.push(`/applications/${id}`);
  };

  return (
    <div className="cega-panel-shadow overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#ffffff]">
      {/* Header controls strip */}
      <div className="flex flex-col items-stretch justify-between gap-3 border-b border-[#e5e5e5] p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#666666]" />
            <Input
              placeholder="Search by student name, CNIC, Reg-No, tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 rounded-[10px] border-[#e5e5e5] bg-[#f8fafc] pl-9 text-xs focus:bg-white focus-visible:ring-[#13c2b6]"
            />
          </div>

          {selectedStatusFilter !== 'ALL' && (
            <Badge
              variant="secondary"
              className="h-8 cursor-pointer gap-1 rounded-[8px] border border-[#13c2b6]/30 bg-[#13c2b6]/10 text-xs font-semibold text-[#009588] hover:bg-[#13c2b6]/20"
              onClick={() => setSelectedStatusFilter('ALL')}
            >
              <span>Filter: {selectedStatusFilter}</span>
              <span className="text-xs text-[#009588]">×</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 gap-1.5 rounded-[10px] border-[#e5e5e5] text-xs font-semibold text-[#000000] hover:bg-[#f8fafc]"
            >
              <RefreshCw
                className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span>Refresh Queue</span>
            </Button>
          )}

          <div className="font-orbitron text-xs font-bold text-[#666666]">
            Showing{' '}
            <span className="font-orbitron font-bold text-[#000000] tabular-nums">
              {filteredApps.length}
            </span>{' '}
            of {applications.length} cases
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#000000]">
          <thead className="border-b border-[#e5e5e5] bg-[#f8fafc] text-[11px] font-bold tracking-wider text-[#666666] uppercase">
            <tr>
              <th
                scope="col"
                className="font-orbitron cursor-pointer px-4 py-3 select-none hover:text-[#000000]"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  <span>Application ID & Tracking</span>
                  <ArrowUpDown className="size-3 text-[#666666]" />
                </div>
              </th>
              <th scope="col" className="font-orbitron px-4 py-3">
                Student Name & CNIC
              </th>
              <th scope="col" className="font-orbitron px-4 py-3">
                Degree & Reg-No
              </th>
              <th scope="col" className="font-orbitron px-4 py-3 text-center">
                Passing Year
              </th>
              <th
                scope="col"
                className="font-orbitron cursor-pointer px-4 py-3 select-none hover:text-[#000000]"
                onClick={() => handleSort('submissionDate')}
              >
                <div className="flex items-center gap-1">
                  <span>Lodged Date</span>
                  <ArrowUpDown className="size-3 text-[#666666]" />
                </div>
              </th>
              <th scope="col" className="font-orbitron px-4 py-3 text-center">
                Review Status
              </th>
              <th scope="col" className="font-orbitron px-4 py-3 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck2 className="size-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">
                      No applications match your criteria
                    </p>
                    <p className="text-xs text-slate-500">
                      Try clearing filters or search query to view all assigned
                      cases.
                    </p>
                    {selectedStatusFilter !== 'ALL' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStatusFilter('ALL')}
                        className="mt-2 text-xs"
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => {
                const targetDegree =
                  app.academicRecords.find((r) =>
                    r.level.startsWith('DEGREE')
                  ) || app.academicRecords[app.academicRecords.length - 1];

                const formattedDate = new Date(
                  app.submissionDate
                ).toLocaleDateString('en-PK', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={app.id}
                    onClick={() => handleRowClick(app.id)}
                    className="group cursor-pointer transition-colors hover:bg-emerald-50/40"
                  >
                    {/* App ID & Tracking */}
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900 transition-colors group-hover:text-[#064E3B]">
                        {app.id}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {app.trackingNumber}
                      </div>
                      {app.isDelayed && (
                        <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-bold text-red-600">
                          <AlertTriangle className="size-3" /> SLA Alert
                        </span>
                      )}
                    </td>

                    {/* Student Name & CNIC */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {app.personalDetails.fullName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {app.personalDetails.cnic}
                      </div>
                      <div className="max-w-[180px] truncate text-[10px] text-slate-400">
                        S/D/O {app.personalDetails.fatherName}
                      </div>
                    </td>

                    {/* Degree & Reg-No */}
                    <td className="px-4 py-3">
                      <div
                        className="line-clamp-1 max-w-[220px] font-medium text-slate-800"
                        title={app.targetDegreeTitle}
                      >
                        {app.targetDegreeTitle}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        Reg: {targetDegree?.registrationNo || 'N/A'}
                      </div>
                      <div className="max-w-[200px] truncate text-[10px] text-slate-400">
                        {targetDegree?.institutionName}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                        <span className="font-semibold text-slate-500">
                          Officer:
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-medium ${app.assignedUserName && !app.assignedUserName.includes('Unassigned') ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-amber-200 bg-amber-50 text-amber-800'}`}
                        >
                          {app.assignedUserName || 'Unassigned Queue'}
                        </span>
                      </div>
                    </td>

                    {/* Passing Year */}
                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700 tabular-nums">
                      {targetDegree?.passingYear || '—'}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                      {formattedDate}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <StatusPill status={app.semanticStatus} />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(app.id);
                        }}
                        className="group/btn h-7 gap-1 rounded-[8px] bg-[#13c2b6] px-3 text-xs font-semibold text-white shadow-2xs hover:bg-[#0fb2a6]"
                      >
                        <span>Review</span>
                        <ChevronRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
