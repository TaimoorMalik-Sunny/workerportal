'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Map slug variants to canonical RoleType
const ROLE_SLUG_MAP: Record<string, RoleType> = {
  manager: 'ROLE_HEC_MANAGER',
  'hec-manager': 'ROLE_HEC_MANAGER',
  ROLE_HEC_MANAGER: 'ROLE_HEC_MANAGER',

  scrutiny: 'ROLE_HEC_SCRUTINY',
  'hec-scrutiny': 'ROLE_HEC_SCRUTINY',
  ROLE_HEC_SCRUTINY: 'ROLE_HEC_SCRUTINY',

  'controller-l1': 'ROLE_CONTROLLER_L1',
  controller1: 'ROLE_CONTROLLER_L1',
  ROLE_CONTROLLER_L1: 'ROLE_CONTROLLER_L1',

  'controller-l2': 'ROLE_CONTROLLER_L2',
  controller2: 'ROLE_CONTROLLER_L2',
  ROLE_CONTROLLER_L2: 'ROLE_CONTROLLER_L2',

  attestation: 'ROLE_HEC_ATTESTATION',
  'hec-attestation': 'ROLE_HEC_ATTESTATION',
  ROLE_HEC_ATTESTATION: 'ROLE_HEC_ATTESTATION',

  'dual-role': 'ROLE_DUAL_STAFF',
  dual: 'ROLE_DUAL_STAFF',
  ROLE_DUAL_STAFF: 'ROLE_DUAL_STAFF',
};

export default function RoleDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const roleSlug = typeof params.role === 'string' ? params.role : '';

  const matchedRole: RoleType =
    ROLE_SLUG_MAP[roleSlug.toLowerCase()] ||
    ROLE_SLUG_MAP[roleSlug] ||
    'ROLE_HEC_SCRUTINY';

  const { activeRole, setActiveRole, dualRoleSubRole } = useAppStore();

  const [applications, setApplications] = React.useState<HECApplication[]>([]);
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // If role is manager, redirect to the rich manager workspace
  React.useEffect(() => {
    if (matchedRole === 'ROLE_HEC_MANAGER') {
      router.replace('/dashboard/manager?tab=overview');
    } else if (matchedRole !== activeRole) {
      setActiveRole(matchedRole);
    }
  }, [matchedRole, activeRole, setActiveRole, router]);

  const effectiveRole: RoleType =
    activeRole === 'ROLE_DUAL_STAFF' ? dualRoleSubRole : activeRole;

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
        console.error('Error fetching role dashboard data:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveRole]);

  const profile = ROLE_PROFILES[effectiveRole] || ROLE_PROFILES[activeRole];

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
      {/* Top Header Bar */}
      <PortalHeader />

      <div className="flex w-full flex-1">
        {/* Left Sidebar Navigation */}
        <PortalSidebar metrics={metrics} />

        {/* Main Dashboard Workspace */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-hidden p-4 sm:p-6 lg:p-8">
          {/* Welcome & Role Context Banner styled with CEGA tokens */}
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
                {profile.department} — {profile.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#e5e5e5] bg-[#f8fafc] px-3.5 py-2 text-right">
                <span className="block text-[11px] font-semibold text-[#666666] uppercase">
                  Logged In As
                </span>
                <span className="font-orbitron text-xs font-bold text-[#000000]">
                  {profile.defaultUser.name}
                </span>
              </div>
            </div>
          </div>

          {/* Top KPI Metrics Strip (6 Cards) */}
          <section aria-label="Status Summary Metrics">
            <KpiStrip metrics={metrics} />
          </section>

          {/* Middle Analytics Grid: Assessment Chart & Volume Donut Chart */}
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
          <section aria-label="Recent Applications Queue">
            <ApplicationsTable
              applications={applications}
              isLoading={isLoading}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
