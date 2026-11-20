'use client';

import * as React from 'react';
import { CalendarClock, ArrowRightLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ManagerOverviewCardsProps {
  pendingLeaveCount: number;
  activeDelegationCount: number;
  onNavigateToLeaveTab: () => void;
  onNavigateToDelegationTab: () => void;
}

export function ManagerOverviewCards({
  pendingLeaveCount,
  activeDelegationCount,
  onNavigateToLeaveTab,
  onNavigateToDelegationTab,
}: ManagerOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Quick Action Card 1: Staff Leave Management */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0px_12px_30px_rgba(8,27,88,0.08)] transition-all hover:border-[#13c2b6]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#13c2b6]">
              <CalendarClock className="size-5" />
            </div>
            <Badge className="border-amber-300 bg-amber-50 font-mono text-[10px] font-bold text-amber-900">
              {pendingLeaveCount} Pending Approval
            </Badge>
          </div>

          <div>
            <h3 className="font-orbitron text-sm font-bold tracking-wide text-slate-900 uppercase">
              Staff Leave Management
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Review annual, sick, and duty leave applications submitted by HEC
              Scrutiny and Attestation officers. Enforce SLA safeguards prior to
              approval.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#e5e5e5] pt-3">
          <span className="font-mono text-[11px] text-slate-500">
            Sector H-9 Evaluation Staff
          </span>
          <Button
            size="sm"
            onClick={onNavigateToLeaveTab}
            className="h-8 gap-1 rounded-xl bg-[#13c2b6] px-3 text-xs font-semibold text-white hover:bg-[#0f9f95]"
          >
            <span>Review Leave Requests</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick Action Card 2: Respective Task Delegation */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0px_12px_30px_rgba(8,27,88,0.08)] transition-all hover:border-[#27b2d7]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-[#27b2d7]">
              <ArrowRightLeft className="size-5" />
            </div>
            <Badge className="border-teal-300 bg-teal-50 font-mono text-[10px] font-bold text-[#0f766e]">
              {activeDelegationCount} Active Delegations
            </Badge>
          </div>

          <div>
            <h3 className="font-orbitron text-sm font-bold tracking-wide text-slate-900 uppercase">
              Respective Task Delegation
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Reassign scrutiny and attestation caseloads dynamically to
              role-compatible colleagues with Synapark BPMN/CMMN event audit
              trails.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#e5e5e5] pt-3">
          <span className="font-mono text-[11px] text-slate-500">
            Zero-Backlog Protocol
          </span>
          <Button
            size="sm"
            onClick={onNavigateToDelegationTab}
            className="h-8 gap-1 rounded-xl bg-[#27b2d7] px-3 text-xs font-semibold text-white hover:bg-[#0e7490]"
          >
            <span>Manage Delegations</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
