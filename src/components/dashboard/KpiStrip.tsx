'use client';

import * as React from 'react';
import {
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  FileSearch,
} from 'lucide-react';
import { DashboardMetrics } from '@/types/workflow';
import { useAppStore } from '@/store/use-app-store';
import { Card } from '@/components/ui/card';

interface KpiStripProps {
  metrics: DashboardMetrics | null;
}

export function KpiStrip({ metrics }: KpiStripProps) {
  const { selectedStatusFilter, setSelectedStatusFilter } = useAppStore();

  const cards = [
    {
      id: 'Delayed',
      label: 'Delayed (SLA)',
      count: metrics?.delayedCount ?? 1,
      icon: AlertTriangle,
      colorText: 'text-[#e40014]',
      bgColor: 'bg-[#e40014]/10',
      borderColor: 'border-[#e40014]/30',
      activeRing: 'ring-2 ring-[#e40014] border-[#e40014]',
      subtext: 'Breached SLA deadline',
    },
    {
      id: 'Pending',
      label: 'Pending Queue',
      count: metrics?.pendingCount ?? 2,
      icon: Clock,
      colorText: 'text-[#f05100]',
      bgColor: 'bg-[#fcbb00]/15',
      borderColor: 'border-[#fcbb00]/40',
      activeRing: 'ring-2 ring-[#fcbb00] border-[#fcbb00]',
      subtext: 'Awaiting officer claim',
    },
    {
      id: 'In-Process',
      label: 'In-Process',
      count: metrics?.inProcessCount ?? 1,
      icon: FileSearch,
      colorText: 'text-[#173e81]',
      bgColor: 'bg-[#27b2d7]/15',
      borderColor: 'border-[#27b2d7]/30',
      activeRing: 'ring-2 ring-[#27b2d7] border-[#27b2d7]',
      subtext: 'Under active scrutiny',
    },
    {
      id: 'On-Holding',
      label: 'On-Holding',
      count: metrics?.onHoldingCount ?? 1,
      icon: PauseCircle,
      colorText: 'text-[#0d2a55]',
      bgColor: 'bg-[#87cbde]/25',
      borderColor: 'border-[#87cbde]/40',
      activeRing: 'ring-2 ring-[#87cbde] border-[#87cbde]',
      subtext: 'Escalation / controller hold',
    },
    {
      id: 'Revision',
      label: 'Revision',
      count: metrics?.revisionCount ?? 1,
      icon: RotateCcw,
      colorText: 'text-[#f05100]',
      bgColor: 'bg-[#f05100]/10',
      borderColor: 'border-[#f05100]/30',
      activeRing: 'ring-2 ring-[#f05100] border-[#f05100]',
      subtext: 'Sent back to applicant',
    },
    {
      id: 'Approved',
      label: 'Approved / Attested',
      count: metrics?.approvedCount ?? 1,
      icon: CheckCircle2,
      colorText: 'text-[#009588]',
      bgColor: 'bg-[#13c2b6]/15',
      borderColor: 'border-[#13c2b6]/40',
      activeRing: 'ring-2 ring-[#13c2b6] border-[#13c2b6]',
      subtext: 'Seal embedded & complete',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatusFilter === card.id;

        return (
          <Card
            key={card.id}
            onClick={() =>
              setSelectedStatusFilter(isSelected ? 'ALL' : card.id)
            }
            className={`cega-panel-shadow group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-[#ffffff] p-4.5 transition-all duration-200 hover:-translate-y-1 ${
              card.borderColor
            } ${isSelected ? `${card.activeRing} bg-[#f8fafc] shadow-sm` : 'border-[#e5e5e5]'}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-orbitron truncate text-xs font-bold text-[#000000] group-hover:text-[#13c2b6]">
                {card.label}
              </span>
              <div
                className={`rounded-xl p-2 transition-transform group-hover:scale-105 ${card.bgColor} ${card.colorText}`}
              >
                <Icon className="size-4 shrink-0" />
              </div>
            </div>

            <div className="mt-3.5">
              <div className="flex items-baseline justify-between">
                <div
                  className={`font-orbitron text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${card.colorText}`}
                >
                  {card.count}
                </div>
                {isSelected && (
                  <span className="font-orbitron rounded-md border border-[#13c2b6] bg-[#13c2b6] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-2xs">
                    FILTERED
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] font-medium text-[#666666]">
                {card.subtext}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
