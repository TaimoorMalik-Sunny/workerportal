'use client';

import * as React from 'react';
import { PieChart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DashboardMetrics } from '@/types/workflow';

interface VolumeDonutChartProps {
  metrics: DashboardMetrics | null;
}

export function VolumeDonutChart({ metrics }: VolumeDonutChartProps) {
  const {
    landedPercent = 40,
    pendingPercent = 20,
    assessedPercent = 30,
    rejectedPercent = 10,
  } = metrics?.volumeBreakdown || {};

  const totalApp = metrics?.totalApplications ?? 6;

  // Donut SVG circumference calculation
  // Radius = 54, Circumference = 2 * PI * 54 = ~339.29
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const landedStroke = (landedPercent / 100) * circumference;
  const pendingStroke = (pendingPercent / 100) * circumference;
  const assessedStroke = (assessedPercent / 100) * circumference;
  const rejectedStroke = (rejectedPercent / 100) * circumference;

  const landedOffset = 0;
  const pendingOffset = -landedStroke;
  const assessedOffset = -(landedStroke + pendingStroke);
  const rejectedOffset = -(landedStroke + pendingStroke + assessedStroke);

  return (
    <Card className="cega-panel-shadow flex flex-col justify-between rounded-2xl border-[#e5e5e5] bg-[#ffffff]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-orbitron flex items-center gap-2 text-base font-bold text-[#000000]">
              <PieChart className="size-4 text-[#13c2b6]" />
              Application Volume
            </CardTitle>
            <CardDescription className="text-xs text-[#666666]">
              National case throughput & disposition
            </CardDescription>
          </div>
          <span className="font-orbitron rounded-md border border-[#13c2b6]/30 bg-[#13c2b6]/10 px-2 py-0.5 text-[10px] font-bold text-[#009588]">
            Realtime
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center pt-2">
        <div className="flex flex-col items-center justify-between gap-6 py-2 sm:flex-row">
          {/* Donut SVG */}
          <div className="relative flex size-36 shrink-0 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-[#f8fafc]"
                strokeWidth="14"
                fill="none"
              />
              {/* Landed / In-Process (Sky Blue #27b2d7) */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#27b2d7"
                strokeWidth="14"
                strokeDasharray={`${landedStroke} ${circumference}`}
                strokeDashoffset={landedOffset}
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Pending (Amber #fcbb00) */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#fcbb00"
                strokeWidth="14"
                strokeDasharray={`${pendingStroke} ${circumference}`}
                strokeDashoffset={pendingOffset}
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Assessed / Approved (Teal/Emerald #13c2b6) */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#13c2b6"
                strokeWidth="14"
                strokeDasharray={`${assessedStroke} ${circumference}`}
                strokeDashoffset={assessedOffset}
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Rejected (Red #e40014) */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#e40014"
                strokeWidth="14"
                strokeDasharray={`${rejectedStroke} ${circumference}`}
                strokeDashoffset={rejectedOffset}
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-orbitron text-[10px] font-bold text-[#666666] uppercase">
                Total App
              </span>
              <span className="font-orbitron text-xl font-bold text-[#000000] tabular-nums">
                {totalApp}
              </span>
              <span className="font-orbitron text-[9px] font-bold text-[#13c2b6]">
                100% Active
              </span>
            </div>
          </div>

          {/* Breakdown Percentage Legend */}
          <div className="w-full flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#27b2d7]" />
                <span className="font-medium text-[#000000]">Landed</span>
              </div>
              <div className="font-orbitron font-bold text-[#000000] tabular-nums">
                {landedPercent}%
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#fcbb00]" />
                <span className="font-medium text-[#000000]">Pending</span>
              </div>
              <div className="font-orbitron font-bold text-[#000000] tabular-nums">
                {pendingPercent}%
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#13c2b6]" />
                <span className="font-medium text-[#000000]">Assessed</span>
              </div>
              <div className="font-orbitron font-bold text-[#000000] tabular-nums">
                {assessedPercent}%
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#e40014]" />
                <span className="font-medium text-[#000000]">Rejected</span>
              </div>
              <div className="font-orbitron font-bold text-[#000000] tabular-nums">
                {rejectedPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Volume KPI summary */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-[#e5e5e5] pt-3 text-center">
          <div className="rounded-xl bg-[#f8fafc] p-1.5">
            <div className="text-[10px] text-[#666666]">Landed</div>
            <div className="font-orbitron text-xs font-bold text-[#27b2d7] tabular-nums">
              {Math.max(1, Math.round(totalApp * (landedPercent / 100)))}
            </div>
          </div>
          <div className="rounded-xl bg-[#f8fafc] p-1.5">
            <div className="text-[10px] text-[#666666]">Revised</div>
            <div className="font-orbitron text-xs font-bold text-[#f05100] tabular-nums">
              {metrics?.revisionCount ?? 1}
            </div>
          </div>
          <div className="rounded-xl bg-[#f8fafc] p-1.5">
            <div className="text-[10px] text-[#666666]">Pending</div>
            <div className="font-orbitron text-xs font-bold text-[#fcbb00] tabular-nums">
              {metrics?.pendingCount ?? 2}
            </div>
          </div>
          <div className="rounded-xl bg-[#f8fafc] p-1.5">
            <div className="text-[10px] text-[#666666]">Rejected</div>
            <div className="font-orbitron text-xs font-bold text-[#e40014] tabular-nums">
              {metrics?.rejectedCount ?? 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
