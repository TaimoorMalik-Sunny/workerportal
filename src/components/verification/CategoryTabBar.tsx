'use client';

import * as React from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  FileBadge,
  Sparkles,
} from 'lucide-react';
import { HECApplication } from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type DocumentCategoryTab =
  | 'PERSONAL_DOCUMENTS'
  | 'SSC'
  | 'HSSC'
  | 'DEGREE_14'
  | 'DEGREE_16'
  | 'COMMENTS_TRAIL';

interface CategoryTabBarProps {
  application: HECApplication;
  activeTab: DocumentCategoryTab;
  onTabChange: (tab: DocumentCategoryTab) => void;
}

export function CategoryTabBar({
  application,
  activeTab,
  onTabChange,
}: CategoryTabBarProps) {
  // Count remarks attached to each category
  const getCategoryRemarkCount = (catPrefix: string) =>
    application.remarks.filter((r) =>
      r.category.toLowerCase().includes(catPrefix.toLowerCase())
    ).length;

  const personalRemarkCount = getCategoryRemarkCount('personal');
  const sscRemarkCount = getCategoryRemarkCount('ssc');
  const hsscRemarkCount = getCategoryRemarkCount('hssc');
  const deg14RemarkCount = getCategoryRemarkCount('14');
  const deg16RemarkCount = getCategoryRemarkCount('16');
  const totalRemarksCount = application.remarks.length;

  // Dynamically generate tabs based on what academic records exist in the application JSON
  const tabs = React.useMemo(() => {
    const list: {
      id: DocumentCategoryTab;
      label: string;
      sublabel: string;
      icon: React.ElementType;
      badgeCount: number;
      badgeColor?: string;
    }[] = [
      {
        id: 'PERSONAL_DOCUMENTS',
        label: 'Personal Documents',
        sublabel: 'CNIC / Nikah / Disability',
        icon: ShieldCheck,
        badgeCount: personalRemarkCount,
        badgeColor:
          personalRemarkCount > 0
            ? 'bg-[#fcbb00]/20 text-[#f05100]'
            : 'bg-[#f8fafc] text-[#666666]',
      },
    ];

    const hasSSC = application.academicRecords.some((r) => r.level === 'SSC');
    const hasHSSC = application.academicRecords.some((r) => r.level === 'HSSC');
    const hasDegree14 = application.academicRecords.some(
      (r) => r.level === 'DEGREE_14_YEAR'
    );
    const hasDegree16 = application.academicRecords.some(
      (r) => r.level === 'DEGREE_16_YEAR'
    );

    // Only include SSC tab if present in JSON academicRecords
    if (hasSSC) {
      list.push({
        id: 'SSC',
        label: 'SSC Certificate',
        sublabel: 'Matriculation (10th)',
        icon: Award,
        badgeCount: sscRemarkCount,
        badgeColor:
          sscRemarkCount > 0
            ? 'bg-[#fcbb00]/20 text-[#f05100]'
            : 'bg-[#f8fafc] text-[#666666]',
      });
    }

    // Only include HSSC tab if present in JSON academicRecords
    if (hasHSSC) {
      list.push({
        id: 'HSSC',
        label: 'HSSC Certificate',
        sublabel: 'Intermediate (12th)',
        icon: BookOpen,
        badgeCount: hsscRemarkCount,
        badgeColor:
          hsscRemarkCount > 0
            ? 'bg-[#fcbb00]/20 text-[#f05100]'
            : 'bg-[#f8fafc] text-[#666666]',
      });
    }

    // Only include 14-Year Degree tab if present in JSON academicRecords
    if (hasDegree14) {
      list.push({
        id: 'DEGREE_14',
        label: 'Degree (14 Year)',
        sublabel: 'Associate / BA / BSc',
        icon: GraduationCap,
        badgeCount: deg14RemarkCount,
        badgeColor:
          deg14RemarkCount > 0
            ? 'bg-[#fcbb00]/20 text-[#f05100]'
            : 'bg-[#f8fafc] text-[#666666]',
      });
    }

    // Only include 16-Year Degree tab if present in JSON academicRecords
    if (hasDegree16) {
      list.push({
        id: 'DEGREE_16',
        label: 'Degree (16 Year)',
        sublabel: 'BS / Professional Degree',
        icon: FileBadge,
        badgeCount: deg16RemarkCount,
        badgeColor:
          deg16RemarkCount > 0
            ? 'bg-[#fcbb00]/20 text-[#f05100]'
            : 'bg-[#f8fafc] text-[#666666]',
      });
    }

    return list;
  }, [
    application.academicRecords,
    personalRemarkCount,
    sscRemarkCount,
    hsscRemarkCount,
    deg14RemarkCount,
    deg16RemarkCount,
  ]);

  // If activeTab is no longer present in dynamic tabs, auto-switch to a valid tab
  React.useEffect(() => {
    if (activeTab === 'COMMENTS_TRAIL') return;
    const tabExists = tabs.some((t) => t.id === activeTab);
    if (!tabExists && tabs.length > 0) {
      const targetTab =
        tabs.find((t) => t.id === 'DEGREE_16' || t.id === 'DEGREE_14') ||
        tabs[tabs.length - 1];
      onTabChange(targetTab.id);
    }
  }, [tabs, activeTab, onTabChange]);

  return (
    <div className="space-y-3">
      {/* Dynamic Context Banner: reads targetDegreeLevel directly from application JSON */}
      <div className="cega-panel-shadow flex flex-col items-start justify-between gap-2.5 rounded-2xl border border-[#13c2b6]/30 bg-[#0a1630] px-5 py-3.5 text-xs font-medium text-slate-200 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge className="font-orbitron border-[#13c2b6]/40 bg-[#13c2b6]/20 text-[10px] font-bold text-[#13c2b6] uppercase">
            Attestation Scope
          </Badge>
          <span className="font-orbitron text-sm font-bold text-white">
            This Application is for Attestation of the{' '}
            {application.targetDegreeLevel || 'Target Degree'}
          </span>
          <span className="text-xs text-slate-300">
            • {application.targetDegreeTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <Sparkles className="size-3.5 text-[#fcbb00]" />
          <span>Tracking:</span>
          <span className="font-orbitron font-bold text-white">
            {application.trackingNumber}
          </span>
        </div>
      </div>

      {/* Primary Category Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e5e5] pb-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#13c2b6] text-white shadow-xs'
                    : 'border border-[#e5e5e5] bg-[#ffffff] text-[#000000] hover:border-[#13c2b6]/50 hover:bg-[#f8fafc]'
                }`}
              >
                <Icon
                  className={`size-3.5 ${isActive ? 'text-white' : 'text-[#666666]'}`}
                />
                <span>{tab.label}</span>
                {tab.badgeCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right-aligned Comments Trail Button */}
        <Button
          variant={activeTab === 'COMMENTS_TRAIL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTabChange('COMMENTS_TRAIL')}
          className={`h-9 gap-1.5 rounded-[10px] text-xs font-semibold shadow-2xs transition-all ${
            activeTab === 'COMMENTS_TRAIL'
              ? 'bg-[#13c2b6] text-white hover:bg-[#0fb2a6]'
              : 'border-[#e5e5e5] bg-[#ffffff] text-[#000000] hover:bg-[#f8fafc]'
          }`}
        >
          <MessageSquare className="size-3.5 text-[#f05100]" />
          <span>Comments Trail</span>
          <Badge className="ml-1 h-4 bg-[#f05100] px-1.5 font-mono text-[10px] font-bold text-white">
            {totalRemarksCount}
          </Badge>
        </Button>
      </div>
    </div>
  );
}
