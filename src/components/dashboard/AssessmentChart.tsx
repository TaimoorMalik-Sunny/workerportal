'use client';

import * as React from 'react';
import { Calendar, BarChart3 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardMetrics } from '@/types/workflow';

interface AssessmentChartProps {
  metrics: DashboardMetrics | null;
}

const TIME_RANGES = [
  'Today',
  '1 Day',
  '3 Days',
  '5 Days',
  '1 Week',
  '2 Weeks',
  '1 Month',
];

export function AssessmentChart({ metrics }: AssessmentChartProps) {
  const [activeRange, setActiveRange] = React.useState('1 Week');
  const [fromDate, setFromDate] = React.useState('2026-11-12');
  const [toDate, setToDate] = React.useState('2026-11-19');
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null);

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    const today = new Date('2026-11-19');
    const start = new Date(today);
    switch (range) {
      case 'Today':
        break;
      case '1 Day':
        start.setDate(today.getDate() - 1);
        break;
      case '3 Days':
        start.setDate(today.getDate() - 3);
        break;
      case '5 Days':
        start.setDate(today.getDate() - 5);
        break;
      case '1 Week':
        start.setDate(today.getDate() - 7);
        break;
      case '2 Weeks':
        start.setDate(today.getDate() - 14);
        break;
      case '1 Month':
        start.setMonth(today.getMonth() - 1);
        break;
    }
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  const rangeMultiplier = React.useMemo(() => {
    switch (activeRange) {
      case 'Today':
        return 0.5;
      case '1 Day':
        return 0.7;
      case '3 Days':
        return 0.9;
      case '5 Days':
        return 1.0;
      case '1 Week':
        return 1.0;
      case '2 Weeks':
        return 1.4;
      case '1 Month':
        return 2.1;
      default:
        return 1.0;
    }
  }, [activeRange]);

  const pCount = metrics?.pendingCount ?? 2;
  const iCount = metrics?.inProcessCount ?? 1;
  const oCount = metrics?.onHoldingCount ?? 1;
  const rCount = metrics?.revisionCount ?? 1;
  const dCount = metrics?.delayedCount ?? 1;

  const bars = [
    {
      label: 'Pending',
      stageName: 'Pending Officer Claim',
      count: Math.max(1, Math.round(pCount * rangeMultiplier)),
      color: 'bg-[#fcbb00]',
      textColor: 'text-[#f05100]',
    },
    {
      label: 'In-Process',
      stageName: 'Active Scrutiny & Screening',
      count: Math.max(1, Math.round(iCount * rangeMultiplier)),
      color: 'bg-[#27b2d7]',
      textColor: 'text-[#173e81]',
    },
    {
      label: 'On-Holding',
      stageName: 'Controller / Gazette Hold',
      count: Math.max(0, Math.round(oCount * rangeMultiplier)),
      color: 'bg-[#87cbde]',
      textColor: 'text-[#0d2a55]',
    },
    {
      label: 'Revision',
      stageName: 'Sent Back to Student',
      count: Math.max(0, Math.round(rCount * rangeMultiplier)),
      color: 'bg-[#f05100]',
      textColor: 'text-[#f05100]',
    },
    {
      label: 'Delayed',
      stageName: 'Breached SLA Turnaround',
      count: Math.max(0, Math.round(dCount * rangeMultiplier)),
      color: 'bg-[#e40014]',
      textColor: 'text-[#e40014]',
    },
  ];

  const totalRangeCount = bars.reduce((acc, b) => acc + b.count, 0);
  const maxBarCount = Math.max(...bars.map((b) => b.count), 6);

  return (
    <Card className="cega-panel-shadow rounded-2xl border-[#e5e5e5] bg-[#ffffff]">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-orbitron flex items-center gap-2 text-base font-bold text-[#000000]">
              <BarChart3 className="size-4 text-[#13c2b6]" />
              Scrutiny & Stage Assessment Analytics
            </CardTitle>
            <CardDescription className="text-xs text-[#666666]">
              Comparative volume distribution across operational review stages
            </CardDescription>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-[#f8fafc] px-2.5 py-1.5">
              <Calendar className="size-3 text-[#666666]" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-[11px] text-[#000000] outline-none"
              />
            </div>
            <span className="text-[#666666]">to</span>
            <div className="flex items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-[#f8fafc] px-2.5 py-1.5">
              <Calendar className="size-3 text-[#666666]" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-[11px] text-[#000000] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Time Range Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3">
          {TIME_RANGES.map((range) => (
            <Button
              key={range}
              size="sm"
              variant={activeRange === range ? 'default' : 'outline'}
              onClick={() => handleRangeChange(range)}
              className={`h-7 rounded-[10px] px-3 text-xs font-semibold transition-all ${
                activeRange === range
                  ? 'bg-[#13c2b6] text-white shadow-2xs hover:bg-[#0fb2a6]'
                  : 'border-[#e5e5e5] text-[#666666] hover:bg-[#f8fafc] hover:text-[#000000]'
              }`}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Custom High-Performance CSS Bar Chart with Reference Lines */}
        <div className="space-y-4 pt-2">
          <div className="relative">
            {/* Horizontal Grid Guide Lines */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between font-mono text-[9px] text-[#666666]">
              <div className="border-b border-dashed border-[#e5e5e5] pb-0.5">
                <span>{maxBarCount} cases</span>
              </div>
              <div className="border-b border-dashed border-[#e5e5e5] pb-0.5">
                <span>{Math.round(maxBarCount / 2)} cases</span>
              </div>
              <div className="border-b border-dashed border-[#e5e5e5] pb-0.5">
                <span>0</span>
              </div>
            </div>

            {/* Bars Canvas (Vertical Pillars with count pills on top) */}
            <div className="relative z-10 flex h-48 items-end justify-around gap-2 px-2 pt-4 pb-0 sm:gap-6 sm:px-6">
              {bars.map((bar) => {
                const heightPercent = Math.max(
                  10,
                  Math.round((bar.count / maxBarCount) * 100)
                );
                const isHovered = hoveredBar === bar.label;

                return (
                  <div
                    key={bar.label}
                    onMouseEnter={() => setHoveredBar(bar.label)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="font-orbitron pointer-events-none absolute -top-8 z-30 rounded-lg bg-[#0a1630] px-2.5 py-1 text-center text-[10px] font-bold text-white shadow-md">
                        <span className="tabular-nums">
                          {bar.count} cases ({bar.stageName})
                        </span>
                      </div>
                    )}

                    {/* Numeric Count Floating above each bar */}
                    <div className="mb-2 flex items-center justify-center">
                      <span className="font-orbitron rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 tabular-nums shadow-2xs transition-transform duration-200 group-hover:scale-110">
                        {bar.count}
                      </span>
                    </div>

                    {/* Bar Pillar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[52px] rounded-t-xl transition-all duration-300 ${bar.color} ${
                        isHovered
                          ? 'scale-y-105 opacity-100 shadow-md'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Solid Horizontal Baseline Divider */}
            <div className="h-[2px] w-full bg-[#e5e5e5]" />

            {/* Distinct Stage Status Label Bar with Generous Spacing & High-Contrast Pills */}
            <div className="grid grid-cols-5 gap-2 px-2 pt-4 pb-1 sm:gap-4 sm:px-6">
              {bars.map((bar) => {
                const pillStyles =
                  {
                    Pending:
                      'bg-[#fcbb00]/15 text-[#855000] border-[#fcbb00]/50 hover:bg-[#fcbb00]/25',
                    'In-Process':
                      'bg-[#27b2d7]/15 text-[#0d5975] border-[#27b2d7]/50 hover:bg-[#27b2d7]/25',
                    'On-Holding':
                      'bg-[#87cbde]/25 text-[#0d2a55] border-[#87cbde]/60 hover:bg-[#87cbde]/40',
                    Revision:
                      'bg-[#f05100]/15 text-[#a83800] border-[#f05100]/50 hover:bg-[#f05100]/25',
                    Delayed:
                      'bg-[#e40014]/15 text-[#a6000e] border-[#e40014]/50 hover:bg-[#e40014]/25',
                  }[bar.label] ||
                  'bg-slate-100 text-slate-700 border-slate-300';

                return (
                  <div
                    key={bar.label}
                    className="flex flex-col items-center justify-start text-center"
                  >
                    {/* Status Pill Badge with Padding */}
                    <span
                      className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-center text-[10px] font-bold tracking-wide transition-colors sm:px-3 sm:py-1 sm:text-xs ${pillStyles}`}
                    >
                      {bar.label}
                    </span>

                    {/* Stage Sub-label */}
                    <span className="mt-1 hidden text-[9px] font-medium text-slate-500 sm:block">
                      {bar.stageName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment Summary Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e5e5] pt-4 text-xs text-[#666666]">
            <div>
              Window Assessment Volume:{' '}
              <span className="font-orbitron font-bold text-[#000000]">
                {totalRangeCount} applications
              </span>{' '}
              ({fromDate} to {toDate})
            </div>
            <div className="font-orbitron flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#13c2b6]" />
                Target SLA: 72 hrs
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#e40014]" />
                Delayed: {bars.find((b) => b.label === 'Delayed')?.count || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
