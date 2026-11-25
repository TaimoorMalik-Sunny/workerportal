'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { PortalHeader } from '@/components/layout/PortalHeader';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { AssessmentChart } from '@/components/dashboard/AssessmentChart';
import { VolumeDonutChart } from '@/components/dashboard/VolumeDonutChart';
import { ApplicationsTable } from '@/components/dashboard/ApplicationsTable';
import { ManagerKpiCards } from '@/components/manager/ManagerKpiCards';
import { StaffLeaveTable } from '@/components/manager/StaffLeaveTable';
import { ActiveDelegationsTable } from '@/components/manager/ActiveDelegationsTable';
import { TaskDelegationDrawer } from '@/components/manager/TaskDelegationDrawer';
import { ManagerOverviewCards } from '@/components/manager/ManagerOverviewCards';
import { ManagerCirculationView } from '@/components/manager/ManagerCirculationView';
import { useAppStore } from '@/store/use-app-store';
import {
  DashboardMetrics,
  HECApplication,
  StaffLeaveRequest,
  StaffMember,
  TaskDelegation,
  LeaveAndDelegationKpis,
} from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function ManagerWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const { setActiveRole } = useAppStore();

  // Primary tab state directly derived from URL query param
  const activeTab: 'overview' | 'leave-delegation' | 'circulation' =
    urlTab === 'leave-delegation'
      ? 'leave-delegation'
      : urlTab === 'circulation'
        ? 'circulation'
        : 'overview';

  // Sub-tab state under 'leave-delegation': 'leaves' | 'delegations'
  const [subTab, setSubTab] = React.useState<'leaves' | 'delegations'>(
    'leaves'
  );

  // Data state
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = React.useState<HECApplication[]>([]);
  const [leaveRequests, setLeaveRequests] = React.useState<StaffLeaveRequest[]>(
    []
  );
  const [delegations, setDelegations] = React.useState<TaskDelegation[]>([]);
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([]);
  const [leaveKpis, setLeaveKpis] =
    React.useState<LeaveAndDelegationKpis | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Delegation Drawer state
  const [isDelegationOpen, setIsDelegationOpen] = React.useState(false);
  const [delegationInitialLeave, setDelegationInitialLeave] =
    React.useState<StaffLeaveRequest | null>(null);

  // Ensure active role is HEC Manager
  React.useEffect(() => {
    setActiveRole('ROLE_HEC_MANAGER');
  }, [setActiveRole]);

  const loadAllData = React.useCallback(async () => {
    try {
      const [kpis, apps, leaves, dels, staff, lKpis] = await Promise.all([
        workflowEngine.getDashboardMetrics('ROLE_HEC_MANAGER'),
        workflowEngine.getTasksByRole('ROLE_HEC_MANAGER'),
        workflowEngine.getLeaveRequests(),
        workflowEngine.getActiveDelegations(),
        workflowEngine.getStaffMembers(),
        workflowEngine.getLeaveAndDelegationKpis(),
      ]);
      setMetrics(kpis);
      setApplications(apps);
      setLeaveRequests(leaves);
      setDelegations(dels);
      setStaffMembers(staff);
      setLeaveKpis(lKpis);
    } catch (err) {
      console.error('Failed to load manager workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      workflowEngine.getDashboardMetrics('ROLE_HEC_MANAGER'),
      workflowEngine.getTasksByRole('ROLE_HEC_MANAGER'),
      workflowEngine.getLeaveRequests(),
      workflowEngine.getActiveDelegations(),
      workflowEngine.getStaffMembers(),
      workflowEngine.getLeaveAndDelegationKpis(),
    ])
      .then(([kpis, apps, leaves, dels, staff, lKpis]) => {
        if (isMounted) {
          setMetrics(kpis);
          setApplications(apps);
          setLeaveRequests(leaves);
          setDelegations(dels);
          setStaffMembers(staff);
          setLeaveKpis(lKpis);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load manager workspace data:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwitchTab = (
    tab: 'overview' | 'leave-delegation' | 'circulation'
  ) => {
    router.replace(`/dashboard/manager?tab=${tab}`);
  };

  const handleOpenDelegationForLeave = (leave: StaffLeaveRequest) => {
    setDelegationInitialLeave(leave);
    setIsDelegationOpen(true);
  };

  const handleOpenNewDelegation = () => {
    setDelegationInitialLeave(null);
    setIsDelegationOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-slate-900">
      {/* Top Header Bar */}
      <PortalHeader />

      <div className="flex w-full flex-1">
        {/* Left Sidebar Navigation */}
        <PortalSidebar metrics={metrics} />

        {/* Main Manager Workspace Body */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-hidden p-4 sm:p-6 lg:p-8">
          {/* Executive Header Banner */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0px_12px_30px_rgba(8,27,88,0.08)] sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-[#13c2b6]">
                  <Shield className="size-5" />
                </div>
                <h1 className="font-orbitron text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  HEC OPERATIONS MANAGER WORKSPACE
                </h1>
                <Badge className="border-[#13c2b6] bg-teal-50 font-mono text-[10px] font-bold text-[#0f766e]">
                  KEYCLOAK RBAC: ROLE_HEC_MANAGER
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                National Scrutiny, University Gazette Attestation Oversight &
                Staff Delegation Governance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllData}
                disabled={isLoading}
                className="h-8 gap-1.5 rounded-xl border-[#e5e5e5] text-xs font-semibold text-slate-700 hover:border-[#13c2b6]"
              >
                <RefreshCw
                  className={`size-3.5 text-[#13c2b6] ${isLoading ? 'animate-spin' : ''}`}
                />
                <span>Sync Runtime</span>
              </Button>
            </div>
          </div>

          {/* CEGA Navigation Tabs: Overview vs Leave & Delegation */}
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSwitchTab('overview')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#13c2b6] text-white shadow-2xs'
                    : 'border border-transparent text-slate-600 hover:border-[#e5e5e5] hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="size-4" />
                <span className="font-orbitron">Overview & SLA Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('leave-delegation')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'leave-delegation'
                    ? 'bg-[#13c2b6] text-white shadow-2xs'
                    : 'border border-transparent text-slate-600 hover:border-[#e5e5e5] hover:bg-slate-50'
                }`}
              >
                <Users className="size-4" />
                <span className="font-orbitron">Leave & Task Delegation</span>
                <Badge
                  className={`ml-1 font-mono text-[10px] font-bold ${
                    activeTab === 'leave-delegation'
                      ? 'bg-white text-[#0f766e]'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {leaveKpis?.pendingLeaveRequests ?? 3}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('circulation')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'circulation'
                    ? 'bg-[#13c2b6] text-white shadow-2xs'
                    : 'border border-transparent text-slate-600 hover:border-[#e5e5e5] hover:bg-slate-50'
                }`}
              >
                <Cpu className="size-4" />
                <span className="font-orbitron">
                  Queue Circulation & Balancing
                </span>
              </button>
            </div>

            {activeTab === 'leave-delegation' && (
              <Button
                size="sm"
                onClick={handleOpenNewDelegation}
                className="h-8 gap-1.5 rounded-xl bg-[#27b2d7] text-xs font-semibold text-white shadow-2xs hover:bg-[#0e7490]"
              >
                <ArrowRightLeft className="size-3.5" />
                <span>+ Delegate Tasks</span>
              </Button>
            )}
          </div>

          {/* =========================================================================
              VIEW 1: MANAGER OVERVIEW (Existing Metrics + Quick Action Cards)
             ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Action Cards Linking to Leave & Delegation */}
              <ManagerOverviewCards
                pendingLeaveCount={leaveKpis?.pendingLeaveRequests ?? 3}
                activeDelegationCount={
                  delegations.filter((d) => d.status === 'Active').length
                }
                onNavigateToLeaveTab={() => {
                  handleSwitchTab('leave-delegation');
                  setSubTab('leaves');
                }}
                onNavigateToDelegationTab={() => {
                  handleSwitchTab('leave-delegation');
                  setSubTab('delegations');
                }}
              />

              {/* Top 6 KPI Strip */}
              {metrics && <KpiStrip metrics={metrics} />}

              {/* Middle Analytics Grid (Bar Chart & Volume Donut) */}
              {metrics && (
                <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AssessmentChart metrics={metrics} />
                  </div>
                  <div className="lg:col-span-1">
                    <VolumeDonutChart metrics={metrics} />
                  </div>
                </div>
              )}

              {/* Recent Applications Queue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-orbitron text-sm font-bold text-slate-900">
                      National Applications Workload Queue
                    </h3>
                    <p className="text-xs text-slate-500">
                      All ongoing scrutiny, controller, and attestation dossiers
                    </p>
                  </div>
                </div>

                <ApplicationsTable
                  applications={applications}
                  onRefresh={loadAllData}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: STAFF LEAVE MANAGEMENT & RESPECTIVE TASK DELEGATION
             ========================================================================= */}
          {activeTab === 'leave-delegation' && (
            <div className="space-y-6">
              {/* CEGA Summary KPI Cards */}
              <ManagerKpiCards
                kpis={leaveKpis}
                onFilterClick={(type) => {
                  if (
                    type === 'pending-leaves' ||
                    type === 'approved-leaves' ||
                    type === 'staff-on-leave'
                  ) {
                    setSubTab('leaves');
                  } else {
                    setSubTab('delegations');
                  }
                }}
              />

              {/* Sub-Tabs: Staff Leave Requests vs Active & Respective Task Delegation */}
              <div className="space-y-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0px_12px_30px_rgba(8,27,88,0.08)]">
                <div className="flex flex-col justify-between gap-3 border-b border-[#e5e5e5] pb-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSubTab('leaves')}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        subTab === 'leaves'
                          ? 'bg-[#13c2b6] text-white shadow-2xs'
                          : 'border border-[#e5e5e5] bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Staff Leave Requests</span>
                      <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px]">
                        {leaveRequests.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubTab('delegations')}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        subTab === 'delegations'
                          ? 'bg-[#27b2d7] text-white shadow-2xs'
                          : 'border border-[#e5e5e5] bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Active & Respective Task Delegation</span>
                      <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px]">
                        {delegations.length}
                      </span>
                    </button>
                  </div>

                  <p className="font-mono text-[11px] text-slate-500">
                    Synapark CMMN Task Delegation Active
                  </p>
                </div>

                {/* Sub-Tab 1: Staff Leave Requests Table */}
                {subTab === 'leaves' && (
                  <StaffLeaveTable
                    leaveRequests={leaveRequests}
                    onLeaveUpdated={loadAllData}
                    onOpenDelegationForLeave={handleOpenDelegationForLeave}
                  />
                )}

                {/* Sub-Tab 2: Active Delegations Table */}
                {subTab === 'delegations' && (
                  <ActiveDelegationsTable
                    delegations={delegations}
                    onDelegationUpdated={loadAllData}
                    onOpenNewDelegation={handleOpenNewDelegation}
                  />
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: DYNAMIC APPLICATION CIRCULATION & WORKLOAD BALANCING
             ========================================================================= */}
          {activeTab === 'circulation' && (
            <ManagerCirculationView onRefreshParent={loadAllData} />
          )}

          {/* Respective Task Delegation Drawer / Modal */}
          <TaskDelegationDrawer
            isOpen={isDelegationOpen}
            onClose={() => {
              setIsDelegationOpen(false);
              setDelegationInitialLeave(null);
            }}
            staffList={staffMembers}
            initialLeaveRequest={delegationInitialLeave}
            onDelegationCompleted={() => {
              loadAllData();
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-slate-900">
          <PortalHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="font-orbitron text-sm font-bold text-slate-700">
              Loading HEC Manager Workspace...
            </p>
          </div>
        </div>
      }
    >
      <ManagerWorkspaceContent />
    </React.Suspense>
  );
}
