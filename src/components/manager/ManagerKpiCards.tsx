'use client';

import * as React from 'react';
import { CalendarClock, CheckCircle, UserX, AlertOctagon } from 'lucide-react';
import { LeaveAndDelegationKpis } from '@/types/workflow';

interface ManagerKpiCardsProps {
  kpis: LeaveAndDelegationKpis | null;
  onFilterClick?: (filterType: string) => void;
}

export function ManagerKpiCards({ kpis, onFilterClick }: ManagerKpiCardsProps) {
  const cards = [
    {
      id: 'pending-leaves',
      title: 'Pending Leave Requests',
      value: kpis?.pendingLeaveRequests ?? 3,
      subtitle: 'Awaiting Manager review & handover clearance',
      icon: CalendarClock,
      accentColor: '#13c2b6',
      badgeBg: 'bg-teal-50 text-[#0f766e]',
      borderColor: 'border-[#13c2b6]/40',
      badgeText: 'Action Required',
    },
    {
      id: 'approved-leaves',
      title: 'Approved Active Leaves',
      value: kpis?.approvedActiveLeaves ?? 2,
      subtitle: 'Staff scheduled or currently out of office',
      icon: CheckCircle,
      accentColor: '#27b2d7',
      badgeBg: 'bg-cyan-50 text-[#0e7490]',
      borderColor: 'border-[#27b2d7]/40',
      badgeText: 'Handover Logged',
    },
    {
      id: 'staff-on-leave',
      title: 'Staff Currently On Leave',
      value: kpis?.staffCurrentlyOnLeave ?? 2,
      subtitle: 'Active out-of-office officers',
      icon: UserX,
      accentColor: '#87cbde',
      badgeBg: 'bg-sky-50 text-[#0369a1]',
      borderColor: 'border-sky-300/40',
      badgeText: 'Capacity Impact',
    },
    {
      id: 'at-risk-tasks',
      title: 'Unassigned / At-Risk Queue Items',
      value: kpis?.unassignedAtRiskTasks ?? 20,
      subtitle: 'Pending scrutiny & attestation dossiers',
      icon: AlertOctagon,
      accentColor: '#f05100',
      badgeBg: 'bg-orange-50 text-[#c2410c]',
      borderColor: 'border-orange-300/40',
      badgeText: 'SLA Watch',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onFilterClick?.(card.id)}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#13c2b6] hover:shadow-[0px_12px_30px_rgba(8,27,88,0.08)]`}
          >
            {/* Top row with icon & status pill */}
            <div className="flex items-center justify-between">
              <div
                className="flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${card.accentColor}18` }}
              >
                <Icon
                  className="size-5 transition-colors"
                  style={{ color: card.accentColor }}
                />
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${card.badgeBg}`}
              >
                {card.badgeText}
              </span>
            </div>

            {/* Metric Number & Label */}
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-orbitron text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                  {card.value}
                </span>
                <span className="font-mono text-xs text-slate-400">cases</span>
              </div>
              <h4 className="font-orbitron text-xs font-bold tracking-wide text-slate-800 uppercase">
                {card.title}
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500">
                {card.subtitle}
              </p>
            </div>

            {/* Bottom accent glow bar */}
            <div
              className="absolute inset-x-0 bottom-0 h-1 transition-all group-hover:h-1.5"
              style={{ backgroundColor: card.accentColor }}
            />
          </div>
        );
      })}
    </div>
  );
}
