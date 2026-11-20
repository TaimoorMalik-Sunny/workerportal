'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  History,
  ChevronDown,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { ROLE_PROFILES } from '@/config/roles';
import { DashboardMetrics } from '@/types/workflow';

interface StatusFilterItem {
  id: string;
  label: string;
  count: number;
  badgeClass: string;
}

interface PortalSidebarProps {
  metrics?: DashboardMetrics | null;
}

export function PortalSidebar({ metrics }: PortalSidebarProps) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    activeRole,
    selectedStatusFilter,
    setSelectedStatusFilter,
  } = useAppStore();

  const [applicationsTreeOpen, setApplicationsTreeOpen] = React.useState(true);
  const currentProfile = ROLE_PROFILES[activeRole];

  // Dynamic status filters with live count badges matching active role metrics
  const statusItems: StatusFilterItem[] = React.useMemo(() => {
    return [
      {
        id: 'ALL',
        label: 'All Cases',
        count: metrics?.totalApplications ?? 6,
        badgeClass: 'bg-slate-100 text-slate-700',
      },
      {
        id: 'Approved',
        label: 'Approved',
        count: metrics?.approvedCount ?? 1,
        badgeClass: 'bg-[#13c2b6]/15 text-[#009588]',
      },
      {
        id: 'Pending',
        label: 'Pending',
        count: metrics?.pendingCount ?? 2,
        badgeClass: 'bg-[#fcbb00]/20 text-[#f05100]',
      },
      {
        id: 'In-Process',
        label: 'In-Process',
        count: metrics?.inProcessCount ?? 1,
        badgeClass: 'bg-[#27b2d7]/20 text-[#173e81]',
      },
      {
        id: 'On-Holding',
        label: 'On-Holding',
        count: metrics?.onHoldingCount ?? 1,
        badgeClass: 'bg-[#87cbde]/30 text-[#0d2a55]',
      },
      {
        id: 'Revision',
        label: 'Revision',
        count: metrics?.revisionCount ?? 1,
        badgeClass: 'bg-[#f05100]/15 text-[#f05100]',
      },
      {
        id: 'Rejected',
        label: 'Rejected',
        count: metrics?.rejectedCount ?? 0,
        badgeClass: 'bg-[#e40014]/15 text-[#e40014]',
      },
    ];
  }, [metrics]);

  return (
    <aside
      className={`fixed top-16 z-20 flex h-[calc(100vh-4rem)] w-64 shrink-0 flex-col justify-between border-r border-[#e5e5e5] bg-[#ffffff] transition-transform duration-200 ease-in-out lg:sticky ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Role context badge */}
        <div className="space-y-1 rounded-2xl border border-[#e5e5e5] bg-[#f8fafc] p-3 shadow-2xs">
          <div className="font-orbitron text-[10px] font-bold tracking-wider text-[#666666] uppercase">
            Active Workspace
          </div>
          <div className="font-orbitron truncate text-sm leading-tight font-bold text-[#000000]">
            {currentProfile.title}
          </div>
          <div className="truncate font-mono text-[11px] text-[#666666]">
            {currentProfile.badge}
          </div>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="space-y-1.5">
          <Link
            href="/dashboard"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
              pathname === '/dashboard' && selectedStatusFilter === 'ALL'
                ? 'bg-[#13c2b6] text-white shadow-xs'
                : 'text-[#000000] hover:bg-[#f8fafc]'
            }`}
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span>Dashboard Overview</span>
          </Link>

          {/* HEC Manager Exclusive Workspace Navigation */}
          {activeRole === 'ROLE_HEC_MANAGER' && (
            <div className="space-y-1 pt-2">
              <div className="font-orbitron px-3 pb-1 text-[10px] font-bold tracking-wider text-[#666666] uppercase">
                Manager Workspace
              </div>
              <Link
                href="/dashboard/manager?tab=overview"
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  pathname === '/dashboard/manager'
                    ? 'border border-[#13c2b6] bg-[#13c2b6]/10 text-[#009588]'
                    : 'text-[#000000] hover:bg-[#f8fafc]'
                }`}
              >
                <LayoutDashboard className="size-4 shrink-0 text-[#13c2b6]" />
                <span>Executive Overview</span>
              </Link>
              <Link
                href="/dashboard/manager?tab=leave-delegation"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#000000] transition-all hover:bg-[#f8fafc]"
              >
                <div className="flex items-center gap-3">
                  <Users className="size-4 shrink-0 text-[#27b2d7]" />
                  <span>Leave & Delegation</span>
                </div>
                <span className="font-orbitron rounded-full bg-[#fcbb00]/20 px-2 py-0.5 text-[10px] font-bold text-[#f05100] tabular-nums">
                  3
                </span>
              </Link>
            </div>
          )}

          {/* Applications Collapsible Tree */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setApplicationsTreeOpen(!applicationsTreeOpen)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#000000] transition-colors hover:bg-[#f8fafc]"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="size-4 shrink-0 text-[#13c2b6]" />
                <span className="font-medium">Applications</span>
              </div>
              {applicationsTreeOpen ? (
                <ChevronDown className="size-3.5 text-[#666666]" />
              ) : (
                <ChevronRight className="size-3.5 text-[#666666]" />
              )}
            </button>

            {applicationsTreeOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-[#e5e5e5] pl-3">
                {statusItems.map((item) => {
                  const isActive = selectedStatusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedStatusFilter(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        isActive
                          ? 'border border-[#13c2b6]/40 bg-[#13c2b6]/10 font-bold text-[#009588]'
                          : 'text-[#666666] hover:bg-[#f8fafc] hover:text-[#000000]'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${item.badgeClass}`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Applications History */}
          <Link
            href="/dashboard/history"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
              pathname === '/dashboard/history'
                ? 'bg-[#13c2b6] text-white shadow-xs'
                : 'text-[#000000] hover:bg-[#f8fafc]'
            }`}
          >
            <History className="size-4 shrink-0" />
            <span>Applications History</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Regulatory Disclaimer */}
      <div className="space-y-1 border-t border-[#e5e5e5] bg-[#f8fafc] p-4 text-[11px] text-[#666666]">
        <div className="font-orbitron font-bold text-[#000000]">
          HEC Pakistan v2.4
        </div>
        <div>Degree Attestation System</div>
        <div className="font-orbitron text-[10px] font-bold text-[#009588]">
          Synapark CMMN Mode
        </div>
      </div>
    </aside>
  );
}
