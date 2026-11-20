'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, FileSearch } from 'lucide-react';
import { PortalHeader } from '@/components/layout/PortalHeader';
import { StickyPersonalComparison } from '@/components/verification/StickyPersonalComparison';
import {
  CategoryTabBar,
  DocumentCategoryTab,
} from '@/components/verification/CategoryTabBar';
import { DocumentInspectionView } from '@/components/verification/DocumentInspectionView';
import { ConsolidatedCommentsAndActionFooter } from '@/components/verification/ConsolidatedCommentsAndActionFooter';
import { HECApplication } from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { activeRole } = useAppStore();

  const [application, setApplication] = React.useState<HECApplication | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] =
    React.useState<DocumentCategoryTab>('DEGREE_16');
  const [isRefreshingNadra, setIsRefreshingNadra] = React.useState(false);

  const loadApplication = React.useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await workflowEngine.getApplicationById(params.id);
      setApplication(data);
    } catch (err) {
      console.error('Failed to load application:', err);
    }
  }, [params.id]);

  React.useEffect(() => {
    let isMounted = true;
    if (!params.id) return;

    workflowEngine
      .getApplicationById(params.id)
      .then((data) => {
        if (isMounted) {
          setApplication(data);
          setIsLoading(false);

          // Dynamically default to the highest target academic degree present in JSON
          if (data) {
            const hasDeg16 = data.academicRecords.some(
              (r) => r.level === 'DEGREE_16_YEAR'
            );
            const hasDeg14 = data.academicRecords.some(
              (r) => r.level === 'DEGREE_14_YEAR'
            );
            if (hasDeg16) {
              setActiveTab('DEGREE_16');
            } else if (hasDeg14) {
              setActiveTab('DEGREE_14');
            } else if (data.academicRecords.length > 0) {
              const first = data.academicRecords[0].level;
              setActiveTab(
                first === 'SSC'
                  ? 'SSC'
                  : first === 'HSSC'
                    ? 'HSSC'
                    : 'PERSONAL_DOCUMENTS'
              );
            } else {
              setActiveTab('PERSONAL_DOCUMENTS');
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load application:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleNadraRefresh = async () => {
    if (!application) return;
    setIsRefreshingNadra(true);
    try {
      await workflowEngine.refreshFromNadra(application.id);
      await loadApplication();
    } finally {
      setIsRefreshingNadra(false);
    }
  };

  const handleInlineRemarkSave = async (
    fieldTitle: string,
    claimedVal: string,
    comment: string
  ) => {
    if (!application) return;
    await workflowEngine.saveFieldRemark(application.id, {
      category:
        activeTab === 'SSC'
          ? 'SSC Certificate'
          : activeTab === 'HSSC'
            ? 'HSSC Certificate'
            : activeTab === 'DEGREE_14'
              ? 'Degree (14 Year)'
              : activeTab === 'DEGREE_16'
                ? 'Degree (16 Year)'
                : 'Personal Details',
      fieldTitle,
      claimedValue: claimedVal,
      comment,
      severity: 'discrepancy',
      authorRole: activeRole,
      authorName: 'Active Reviewer',
      stage: application.currentState,
    });
    await loadApplication();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
        <PortalHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <RefreshCw className="size-8 animate-spin text-[#13c2b6]" />
          <p className="text-sm font-medium text-[#666666]">
            Retrieving candidate dossier from Synapark human-task store...
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
        <PortalHeader />
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <FileSearch className="size-12 text-[#666666]" />
          <h2 className="font-orbitron text-xl font-bold text-[#000000]">
            Application Not Found
          </h2>
          <p className="text-xs text-[#666666]">
            No active application matches identifier &ldquo;{params.id}&rdquo;
            in the current workflow database.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0fb2a6]"
          >
            Return to Dashboard Queue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
      {/* Top Header Bar */}
      <PortalHeader />

      {/* Sticky Personal Comparison Cards (Persistent Across Scroll) */}
      <StickyPersonalComparison
        application={application}
        onAddRemark={(field, claim, comment) => {
          handleInlineRemarkSave(
            field,
            claim,
            comment || `Observation flagged on ${field}: Claimed "${claim}"`
          );
        }}
        onNadraRefresh={handleNadraRefresh}
        isRefreshingNadra={isRefreshingNadra}
      />

      {/* Main Workspace Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Link & Header Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] transition-colors hover:text-[#13c2b6]"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Queue</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">
              Case Status:
            </span>
            <StatusPill status={application.semanticStatus} />
          </div>
        </div>

        {/* Document Category Navigation Bar */}
        <CategoryTabBar
          application={application}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Adaptive Document Viewer & Verification Workspace */}
        {activeTab === 'COMMENTS_TRAIL' ? (
          <ConsolidatedCommentsAndActionFooter
            application={application}
            onRemarkUpdated={loadApplication}
          />
        ) : (
          <div className="space-y-8">
            <DocumentInspectionView
              application={application}
              activeTab={activeTab}
              onSaveRemark={handleInlineRemarkSave}
            />

            {/* Quick access to Comments Trail & Action panel */}
            <div className="border-t border-slate-200 pt-4">
              <ConsolidatedCommentsAndActionFooter
                application={application}
                onRemarkUpdated={loadApplication}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
