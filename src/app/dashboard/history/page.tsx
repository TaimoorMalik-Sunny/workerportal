'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  ChevronRight,
  ShieldCheck,
  Award,
  Calendar,
  Download,
  Building,
  RefreshCw,
} from 'lucide-react';
import { PortalHeader } from '@/components/layout/PortalHeader';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
import { workflowEngine } from '@/services/workflowEngine';
import { HECApplication, DashboardMetrics } from '@/types/workflow';
import { useAppStore } from '@/store/use-app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Card } from '@/components/ui/card';

export default function DashboardHistoryPage() {
  const router = useRouter();
  const { activeRole } = useAppStore();
  const [applications, setApplications] = React.useState<HECApplication[]>([]);
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      workflowEngine.getTasksByRole('ROLE_HEC_MANAGER'),
      workflowEngine.getDashboardMetrics(activeRole),
    ])
      .then(([apps, kpis]) => {
        if (isMounted) {
          setApplications(apps);
          setMetrics(kpis);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching history:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeRole]);

  // Filter archived & historical cases
  const filteredCases = React.useMemo(() => {
    if (!searchTerm.trim()) return applications;
    const q = searchTerm.toLowerCase();
    return applications.filter((app) => {
      return (
        app.id.toLowerCase().includes(q) ||
        app.trackingNumber.toLowerCase().includes(q) ||
        app.personalDetails.fullName.toLowerCase().includes(q) ||
        app.personalDetails.cnic.toLowerCase().includes(q) ||
        app.targetDegreeTitle.toLowerCase().includes(q)
      );
    });
  }, [applications, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
      <PortalHeader />

      <div className="flex w-full flex-1">
        <PortalSidebar metrics={metrics} />

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-hidden p-4 sm:p-6 lg:p-8">
          {/* Header Banner */}
          <div className="cega-panel-shadow flex flex-col justify-between gap-4 rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-6 md:flex-row md:items-center">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <History className="size-5 text-[#13c2b6]" />
                <h1 className="font-orbitron text-xl font-bold tracking-tight text-[#000000] sm:text-2xl">
                  Applications History & National Archives
                </h1>
                <Badge className="border-[#13c2b6]/30 bg-[#13c2b6]/10 font-mono text-[11px] font-semibold text-[#009588]">
                  Audit Trail
                </Badge>
              </div>
              <p className="text-xs font-medium text-[#666666] sm:text-sm">
                Permanent repository of attested degrees, controller gazette
                approvals, and issued QR verification tickets
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-[10px] border-[#e5e5e5] text-xs font-semibold text-[#000000] hover:bg-[#f8fafc]"
              >
                <Download className="size-3.5" />
                <span>Export Audit Log</span>
              </Button>
            </div>
          </div>

          {/* Historical Overview KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="cega-panel-shadow rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-4.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
                <Award className="size-4 text-[#13c2b6]" />
                <span className="font-orbitron">Total Attested</span>
              </div>
              <div className="font-orbitron mt-2 text-2xl font-bold text-[#000000] tabular-nums">
                1,428
              </div>
              <p className="font-orbitron text-[10px] font-bold text-[#009588]">
                Official stamps embedded
              </p>
            </Card>

            <Card className="cega-panel-shadow rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-4.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
                <ShieldCheck className="size-4 text-[#27b2d7]" />
                <span className="font-orbitron">NADRA Verified</span>
              </div>
              <div className="font-orbitron mt-2 text-2xl font-bold text-[#000000] tabular-nums">
                100%
              </div>
              <p className="font-orbitron text-[10px] font-bold text-[#173e81]">
                Zero biometric bypasses
              </p>
            </Card>

            <Card className="cega-panel-shadow rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-4.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
                <Building className="size-4 text-[#87cbde]" />
                <span className="font-orbitron">Universities Linked</span>
              </div>
              <div className="font-orbitron mt-2 text-2xl font-bold text-[#000000] tabular-nums">
                148
              </div>
              <p className="font-orbitron text-[10px] font-bold text-[#0d2a55]">
                HEDI Gazette Integration
              </p>
            </Card>

            <Card className="cega-panel-shadow rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-4.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
                <Calendar className="size-4 text-[#fcbb00]" />
                <span className="font-orbitron">Avg SLA Time</span>
              </div>
              <div className="font-orbitron mt-2 text-2xl font-bold text-[#000000] tabular-nums">
                2.4 Days
              </div>
              <p className="font-orbitron text-[10px] font-bold text-[#f05100]">
                Under 48-72h standard
              </p>
            </Card>
          </div>

          {/* Historical Table */}
          <div className="cega-panel-shadow overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#ffffff]">
            <div className="flex flex-col items-stretch justify-between gap-3 border-b border-[#e5e5e5] p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#666666]" />
                <Input
                  placeholder="Filter archived cases by name, CNIC, tracking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 rounded-[10px] border-[#e5e5e5] bg-[#f8fafc] pl-9 text-xs focus:bg-white focus-visible:ring-[#13c2b6]"
                />
              </div>

              <div className="font-orbitron text-xs font-bold text-[#666666]">
                Showing{' '}
                <span className="font-orbitron font-bold text-[#000000] tabular-nums">
                  {filteredCases.length}
                </span>{' '}
                archived records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Case ID & Reg Number</th>
                    <th className="px-4 py-3">Student Name & CNIC</th>
                    <th className="px-4 py-3">Degree & University</th>
                    <th className="px-4 py-3 text-center">Passing Year</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="size-6 animate-spin text-[#064E3B]" />
                          <p className="font-semibold text-slate-700">
                            Loading archived records...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-500"
                      >
                        No historical records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((app) => {
                      const degree =
                        app.academicRecords[app.academicRecords.length - 1];
                      return (
                        <tr
                          key={app.id}
                          onClick={() => router.push(`/applications/${app.id}`)}
                          className="group cursor-pointer transition-colors hover:bg-emerald-50/40"
                        >
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-slate-900 group-hover:text-[#064E3B]">
                              {app.id}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {app.trackingNumber}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {app.personalDetails.fullName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {app.personalDetails.cnic}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {app.targetDegreeTitle}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {degree?.institutionName}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                            {degree?.passingYear || '2023'}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <StatusPill status={app.semanticStatus} />
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 rounded-[8px] px-2 text-xs font-semibold text-[#009588] hover:bg-[#13c2b6]/10"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="size-3.5" />
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
        </main>
      </div>
    </div>
  );
}
