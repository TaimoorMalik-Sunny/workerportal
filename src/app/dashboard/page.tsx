'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalHeader } from '@/components/layout/PortalHeader';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { AssessmentChart } from '@/components/dashboard/AssessmentChart';
import { VolumeDonutChart } from '@/components/dashboard/VolumeDonutChart';
import { ApplicationsTable } from '@/components/dashboard/ApplicationsTable';
import { useAppStore } from '@/store/use-app-store';
import { ROLE_PROFILES } from '@/config/roles';
import { RoleType, HECApplication, DashboardMetrics } from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { Badge } from '@/components/ui/badge';

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlRole = searchParams.get('role') as RoleType | null;

  const { activeRole, setActiveRole, dualRoleSubRole } = useAppStore();

  const [applications, setApplications] = React.useState<HECApplication[]>([]);
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Sync role from query parameter if present
  React.useEffect(() => {
    if (urlRole && ROLE_PROFILES[urlRole] && urlRole !== activeRole) {
      setActiveRole(urlRole);
    }
  }, [urlRole, activeRole, setActiveRole]);

  // Determine effective operational role (accounts for dual-role sub-switcher)
  const effectiveRole: RoleType =
    activeRole === 'ROLE_DUAL_STAFF' ? dualRoleSubRole : activeRole;

  const loadData = React.useCallback(async () => {
    try {
      const [apps, kpis] = await Promise.all([
        workflowEngine.getTasksByRole(effectiveRole),
        workflowEngine.getDashboardMetrics(effectiveRole),
      ]);
      setApplications(apps);
      setMetrics(kpis);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, [effectiveRole]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      workflowEngine.getTasksByRole(effectiveRole),
      workflowEngine.getDashboardMetrics(effectiveRole),
    ])
      .then(([apps, kpis]) => {
        if (isMounted) {
          setApplications(apps);
          setMetrics(kpis);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveRole]);

  const profile = ROLE_PROFILES[activeRole];

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
      {/* Top Header Bar */}
      <PortalHeader />

      <div className="flex w-full flex-1">
        {/* Left Sidebar Navigation */}
        <PortalSidebar metrics={metrics} />

        {/* Main Dashboard Workspace */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-hidden p-4 sm:p-6 lg:p-8">
          {/* Welcome & Role Context Banner */}
          <div className="cega-panel-shadow flex flex-col justify-between gap-4 rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-6 md:flex-row md:items-center">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="font-orbitron text-2xl font-bold tracking-tight text-[#000000] sm:text-3xl">
                  {profile.title}
                </h1>
                <Badge className="border-[#13c2b6]/30 bg-[#13c2b6]/10 font-mono text-[11px] font-semibold text-[#009588]">
                  {profile.badge}
                </Badge>
              </div>
              <p className="text-sm font-medium text-[#666666]">
                {profile.department} • Unified National Attestation Queue
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[#e5e5e5] bg-[#f8fafc] p-3 text-xs">
              <div className="font-orbitron flex size-9 items-center justify-center rounded-xl border border-[#13c2b6]/40 bg-[#13c2b6]/20 text-xs font-bold text-[#009588]">
                {profile.defaultUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <div className="font-orbitron leading-tight font-bold text-[#000000]">
                  {profile.defaultUser.name}
                </div>
                <div className="font-mono text-[11px] leading-tight text-[#666666]">
                  {profile.defaultUser.designation}
                </div>
              </div>
            </div>
          </div>

          {/* Top KPI Strip (6 Cards) */}
          <section aria-label="Status Summary Metrics">
            <KpiStrip metrics={metrics} />
          </section>

          {/* Middle Analytics Grid (Bar Chart & Volume Donut) */}
          <section
            aria-label="Application Volume & Analytics"
            className="grid grid-cols-1 gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-8">
              <AssessmentChart metrics={metrics} />
            </div>
            <div className="lg:col-span-4">
              <VolumeDonutChart metrics={metrics} />
            </div>
          </section>

          {/* Recent Applications Data Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-orbitron text-base font-bold text-[#000000]">
                  Recent Applications Queue
                </h3>
                <p className="text-xs text-[#666666]">
                  Click any student record to launch the Document Verification &
                  Audit workspace
                </p>
              </div>
            </div>

            <ApplicationsTable
              applications={applications}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
          <PortalHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm font-medium text-slate-600">
              Loading HEC Dashboard...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
