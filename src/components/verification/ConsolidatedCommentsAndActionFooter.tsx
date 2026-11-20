'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
  Send,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileBadge,
  Sparkles,
  RotateCcw,
  Code2,
  Upload,
  Edit3,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  X,
  FileCheck,
  Award,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import {
  HECApplication,
  FieldRemark,
  RoleType,
  ApplicationWorkflowState,
  WorkflowTransitionResult,
  AttestedDocumentChecklist,
} from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { useAppStore } from '@/store/use-app-store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

interface ConsolidatedCommentsAndActionFooterProps {
  application: HECApplication;
  onRemarkUpdated: () => void;
}

interface TabCategoryRemarkGroup {
  id: string;
  tabLabel: string;
  sublabel: string;
  badgeCount: number;
  hasDiscrepancy: boolean;
  remarks: FieldRemark[];
  icon: React.ReactNode;
}

interface WorkflowStageHierarchyGroup {
  stageId: string;
  stageTitle: string;
  stageSubtitle: string;
  roleBadgeText: string;
  roleBadgeColor: string;
  authorDefaultName: string;
  icon: React.ReactNode;
  tabGroups: TabCategoryRemarkGroup[];
  totalRemarks: number;
  hasDiscrepancy: boolean;
}

export function ConsolidatedCommentsAndActionFooter({
  application,
  onRemarkUpdated,
}: ConsolidatedCommentsAndActionFooterProps) {
  const router = useRouter();
  const { activeRole, dualRoleSubRole } = useAppStore();

  const effectiveRole: RoleType =
    activeRole === 'ROLE_DUAL_STAFF' ? dualRoleSubRole : activeRole;

  // Checklist local override state
  const [checklistOverride, setChecklistOverride] =
    React.useState<AttestedDocumentChecklist | null>(null);
  const checklist = checklistOverride ?? application.checklist;

  // Accordion state for workflow stage hierarchy groups
  const [openStages, setOpenStages] = React.useState<Record<string, boolean>>({
    'stage-scrutiny': true,
    'stage-controller-l1': true,
    'stage-controller-l2': true,
    'stage-attestation': true,
  });

  const toggleStage = (stageId: string) => {
    setOpenStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Editing existing remark
  const [editingRemarkId, setEditingRemarkId] = React.useState<string | null>(
    null
  );
  const [editCommentText, setEditCommentText] = React.useState('');

  // Add new remark modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newRemarkCategory, setNewRemarkCategory] =
    React.useState<FieldRemark['category']>('Personal Details');
  const [newRemarkTitle, setNewRemarkTitle] = React.useState('');
  const [newRemarkClaim, setNewRemarkClaim] = React.useState('');
  const [newRemarkObserved, setNewRemarkObserved] = React.useState('');
  const [newRemarkComment, setNewRemarkComment] = React.useState('');

  // Upload remark supporting document modal
  const [uploadRemarkModal, setUploadRemarkModal] = React.useState<{
    isOpen: boolean;
    degree: 'degree14' | 'degree16';
    fileName: string;
    fileNote: string;
  }>({
    isOpen: false,
    degree: 'degree16',
    fileName: '',
    fileNote: '',
  });

  // Transition confirmation modal
  const [pendingTransition, setPendingTransition] = React.useState<{
    action: string;
    targetState: ApplicationWorkflowState;
    title: string;
    description: string;
    isDestructive?: boolean;
    requiresReason?: boolean;
    actionType: 'PASS' | 'REJECT' | 'REVISION' | 'FINAL_ISSUE';
  } | null>(null);
  const [transitionReason, setTransitionReason] = React.useState('');
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // BPMN JSON Payload & Attestation Certificate Receipt modal
  const [payloadPreview, setPayloadPreview] =
    React.useState<WorkflowTransitionResult | null>(null);
  const [viewTab, setViewTab] = React.useState<'RECEIPT' | 'JSON'>('RECEIPT');

  const handleChecklistToggle = async (
    degree: 'degree14' | 'degree16',
    key: 'transcript' | 'provisionalCertificate' | 'equivalenceCertificate'
  ) => {
    const updated: AttestedDocumentChecklist = {
      ...checklist,
      [degree]: {
        ...checklist[degree],
        [key]: !checklist[degree][key],
      },
    };
    setChecklistOverride(updated);
    try {
      await workflowEngine.updateDocumentChecklist(application.id, updated);
      toast.add({
        title: 'Checklist Updated',
        description: `Verified document status updated for ${degree === 'degree14' ? '14-Year' : '16-Year'} Degree.`,
        type: 'info',
      });
    } catch (err) {
      console.error('Failed to update checklist:', err);
    }
  };

  const handleAttachRemarkDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const degree = uploadRemarkModal.degree;
    const documentName =
      uploadRemarkModal.fileName.trim() ||
      `${degree === 'degree14' ? 'Degree14' : 'Degree16'}_Verification_Remark_Docket.pdf`;

    const updated: AttestedDocumentChecklist = {
      ...checklist,
      [degree]: {
        ...checklist[degree],
        remarkDocumentUrl: `/mock-documents/${documentName}`,
      },
    };

    setChecklistOverride(updated);
    await workflowEngine.updateDocumentChecklist(application.id, updated);
    setUploadRemarkModal({
      isOpen: false,
      degree: 'degree16',
      fileName: '',
      fileNote: '',
    });

    toast.add({
      title: 'Supporting Remark Attached',
      description: `Document "${documentName}" attached to ${degree === 'degree14' ? '14-Year' : '16-Year'} checklist.`,
      type: 'success',
    });
  };

  const handleRemoveRemarkDocument = async (
    degree: 'degree14' | 'degree16'
  ) => {
    const updated: AttestedDocumentChecklist = {
      ...checklist,
      [degree]: {
        ...checklist[degree],
        remarkDocumentUrl: undefined,
      },
    };
    setChecklistOverride(updated);
    await workflowEngine.updateDocumentChecklist(application.id, updated);
    toast.add({
      title: 'Document Detached',
      description: `Supporting remark document removed from ${degree === 'degree14' ? '14-Year' : '16-Year'} Degree.`,
      type: 'info',
    });
  };

  const handleSaveInlineEdit = async (remarkId: string) => {
    if (!editCommentText.trim()) return;
    const existing = application.remarks.find((r) => r.id === remarkId);
    if (!existing) return;

    await workflowEngine.saveFieldRemark(application.id, {
      ...existing,
      comment: editCommentText.trim(),
    });

    setEditingRemarkId(null);
    setEditCommentText('');
    onRemarkUpdated();

    toast.add({
      title: 'Remark Updated',
      description: `Observation on "${existing.fieldTitle}" successfully updated.`,
      type: 'success',
    });
  };

  const handleDeleteRemark = async (remarkId: string) => {
    const existing = application.remarks.find((r) => r.id === remarkId);
    await workflowEngine.deleteFieldRemark(application.id, remarkId);
    onRemarkUpdated();

    toast.add({
      title: 'Remark Removed',
      description: existing
        ? `Observation for "${existing.fieldTitle}" removed.`
        : 'Remark removed from dossier.',
      type: 'info',
    });
  };

  const handleCreateNewRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkTitle.trim() || !newRemarkComment.trim()) return;

    await workflowEngine.saveFieldRemark(application.id, {
      category: newRemarkCategory,
      fieldTitle: newRemarkTitle.trim(),
      claimedValue: newRemarkClaim.trim() || 'N/A',
      observedValue: newRemarkObserved.trim() || undefined,
      comment: newRemarkComment.trim(),
      severity: newRemarkObserved.trim() ? 'discrepancy' : 'info',
      authorRole: effectiveRole,
      authorName:
        effectiveRole === 'ROLE_HEC_SCRUTINY'
          ? 'Ali Ahmed Qureshi'
          : effectiveRole === 'ROLE_CONTROLLER_L1'
            ? 'Dr. Tariq Mehmood (L1)'
            : effectiveRole === 'ROLE_CONTROLLER_L2'
              ? 'Prof. Dr. Munir Alam (Controller)'
              : 'Muhammad Salman Khan (Attestation)',
      stage: application.currentState,
    });

    setIsAddModalOpen(false);
    setNewRemarkTitle('');
    setNewRemarkClaim('');
    setNewRemarkObserved('');
    setNewRemarkComment('');
    onRemarkUpdated();

    toast.add({
      title: 'Remark Recorded',
      description: 'New audit observation appended to official comments trail.',
      type: 'success',
    });
  };

  const executeTransition = async () => {
    if (!pendingTransition) return;
    setIsTransitioning(true);

    try {
      const result = await workflowEngine.transitionApplicationState({
        applicationId: application.id,
        action: pendingTransition.action,
        targetState: pendingTransition.targetState,
        actorRole: effectiveRole,
        actorName:
          effectiveRole === 'ROLE_HEC_SCRUTINY'
            ? 'Ali Ahmed Qureshi (Scrutiny Desk)'
            : effectiveRole === 'ROLE_CONTROLLER_L1'
              ? 'Dr. Tariq Mehmood (University Controller L1)'
              : effectiveRole === 'ROLE_CONTROLLER_L2'
                ? 'Prof. Dr. Munir Alam (Controller of Examinations L2)'
                : 'Muhammad Salman Khan (HEC Senior Attestation Officer)',
        comments: transitionReason.trim() || pendingTransition.title,
        rejectionReason: pendingTransition.requiresReason
          ? transitionReason
          : undefined,
        checklistUpdates: checklist,
      });

      setPayloadPreview(result);
      setViewTab(
        pendingTransition.actionType === 'FINAL_ISSUE' ? 'RECEIPT' : 'JSON'
      );
      setPendingTransition(null);
      setTransitionReason('');

      toast.add({
        title: 'BPMN State Transition Executed',
        description: `Case moved from ${result.previousState} to ${result.currentState}.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Transition error:', err);
      toast.add({
        title: 'Transition Failed',
        description:
          'Unable to execute BPMN state transition. Check system logs.',
        type: 'error',
      });
    } finally {
      setIsTransitioning(false);
    }
  };

  // Determine if a remark can be edited by current user
  const canEditRemark = (remark: FieldRemark): boolean => {
    if (effectiveRole === 'ROLE_HEC_MANAGER') return true;
    if (remark.authorRole === effectiveRole) return true;
    if (
      effectiveRole === 'ROLE_HEC_SCRUTINY' &&
      [
        'Personal Details',
        'NADRA Verification',
        'SSC Certificate',
        'HSSC Certificate',
        'Degree (14 Year)',
        'Degree (16 Year)',
      ].includes(remark.category) &&
      application.currentState === 'IN_SCRUTINY'
    ) {
      return true;
    }
    return false;
  };

  const hasSSC = application.academicRecords.some((r) => r.level === 'SSC');
  const hasHSSC = application.academicRecords.some((r) => r.level === 'HSSC');
  const hasDegree14 = application.academicRecords.some(
    (r) => r.level === 'DEGREE_14_YEAR'
  );
  const hasDegree16 = application.academicRecords.some(
    (r) => r.level === 'DEGREE_16_YEAR'
  );

  // Categories available for new remarks, dynamically filtered to match upper active tabs
  const availableRemarkCategories = React.useMemo(() => {
    const list: { value: FieldRemark['category']; label: string }[] = [
      { value: 'Personal Details', label: 'Personal Details' },
      { value: 'NADRA Verification', label: 'NADRA Verification' },
    ];
    if (hasSSC) {
      list.push({
        value: 'SSC Certificate',
        label: 'SSC Certificate (Matriculation)',
      });
    }
    if (hasHSSC) {
      list.push({
        value: 'HSSC Certificate',
        label: 'HSSC Certificate (Intermediate)',
      });
    }
    if (hasDegree14) {
      list.push({
        value: 'Degree (14 Year)',
        label: 'Degree (14 Year - Associate/BA/BSc)',
      });
    }
    if (hasDegree16) {
      list.push({
        value: 'Degree (16 Year)',
        label: 'Degree (16 Year - Target Qualification)',
      });
    }
    list.push(
      {
        value: 'Controller L1 Remarks',
        label: 'Controller L1 Remarks (Gazette/Records)',
      },
      {
        value: 'Controller L2 Remarks',
        label: 'Controller L2 Remarks (Clearance/Endorsement)',
      },
      {
        value: 'Attestation Decision',
        label: 'Attestation Decision (Final Seal & QR)',
      }
    );
    return list;
  }, [hasSSC, hasHSSC, hasDegree14, hasDegree16]);

  // Hierarchical Workflow Stages: Scrutiny (covering all upper tabs in hierarchy) -> Controller L1 -> Controller L2 -> Attestation
  const stageGroups: WorkflowStageHierarchyGroup[] = React.useMemo(() => {
    // 1. Scrutiny Tab Groups (Organized across the whole set of upper available tabs)
    const scrutinyTabGroups: TabCategoryRemarkGroup[] = [
      {
        id: 'scrutiny-personal',
        tabLabel: 'Personal Documents & NADRA Biometrics',
        sublabel:
          'CNIC, identity biometrics, marital, and profile discrepancy remarks',
        icon: <ShieldCheck className="size-4 text-emerald-700" />,
        remarks: application.remarks.filter(
          (r) =>
            (r.category === 'Personal Details' ||
              r.category === 'NADRA Verification') &&
            (r.authorRole === 'ROLE_HEC_SCRUTINY' ||
              r.stage === 'IN_SCRUTINY' ||
              r.stage === 'PENDING_SCRUTINY' ||
              (r.authorRole !== 'ROLE_CONTROLLER_L1' &&
                r.authorRole !== 'ROLE_CONTROLLER_L2' &&
                r.authorRole !== 'ROLE_HEC_ATTESTATION'))
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      },
    ];

    if (
      hasSSC ||
      application.remarks.some((r) => r.category === 'SSC Certificate')
    ) {
      scrutinyTabGroups.push({
        id: 'scrutiny-ssc',
        tabLabel: 'SSC Certificate (Matriculation)',
        sublabel: 'Secondary School Certificate roll number & board remarks',
        icon: <Award className="size-4 text-slate-700" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'SSC Certificate' &&
            (r.authorRole === 'ROLE_HEC_SCRUTINY' ||
              r.stage === 'IN_SCRUTINY' ||
              r.stage === 'PENDING_SCRUTINY' ||
              (r.authorRole !== 'ROLE_CONTROLLER_L1' &&
                r.authorRole !== 'ROLE_CONTROLLER_L2' &&
                r.authorRole !== 'ROLE_HEC_ATTESTATION'))
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    if (
      hasHSSC ||
      application.remarks.some((r) => r.category === 'HSSC Certificate')
    ) {
      scrutinyTabGroups.push({
        id: 'scrutiny-hssc',
        tabLabel: 'HSSC Certificate (Intermediate)',
        sublabel:
          'Higher Secondary School Certificate roll number & marks remarks',
        icon: <BookOpen className="size-4 text-slate-700" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'HSSC Certificate' &&
            (r.authorRole === 'ROLE_HEC_SCRUTINY' ||
              r.stage === 'IN_SCRUTINY' ||
              r.stage === 'PENDING_SCRUTINY' ||
              (r.authorRole !== 'ROLE_CONTROLLER_L1' &&
                r.authorRole !== 'ROLE_CONTROLLER_L2' &&
                r.authorRole !== 'ROLE_HEC_ATTESTATION'))
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    if (
      hasDegree14 ||
      application.remarks.some((r) => r.category === 'Degree (14 Year)')
    ) {
      scrutinyTabGroups.push({
        id: 'scrutiny-degree-14',
        tabLabel: 'Degree (14 Year) Scrutiny',
        sublabel:
          'Associate Degree / BA / BSc credential scrutiny observations',
        icon: <GraduationCap className="size-4 text-slate-700" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Degree (14 Year)' &&
            (r.authorRole === 'ROLE_HEC_SCRUTINY' ||
              r.stage === 'IN_SCRUTINY' ||
              r.stage === 'PENDING_SCRUTINY')
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    if (
      hasDegree16 ||
      application.remarks.some((r) => r.category === 'Degree (16 Year)')
    ) {
      scrutinyTabGroups.push({
        id: 'scrutiny-degree-16',
        tabLabel: 'Degree (16 Year) Scrutiny',
        sublabel:
          'Target undergraduate major subjects, credit hours & CGPA scrutiny',
        icon: <FileCheck className="size-4 text-emerald-700" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Degree (16 Year)' &&
            (r.authorRole === 'ROLE_HEC_SCRUTINY' ||
              r.stage === 'IN_SCRUTINY' ||
              r.stage === 'PENDING_SCRUTINY')
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    // Populate counts & discrepancy flags for scrutiny
    scrutinyTabGroups.forEach((g) => {
      g.badgeCount = g.remarks.length;
      g.hasDiscrepancy = g.remarks.some((r) => r.severity === 'discrepancy');
    });

    const scrutinyTotalRemarks = scrutinyTabGroups.reduce(
      (sum, g) => sum + g.badgeCount,
      0
    );
    const scrutinyHasDiscrepancy = scrutinyTabGroups.some(
      (g) => g.hasDiscrepancy
    );

    // 2. Controller L1 Tab Groups (Organized by upper degree tabs + institutional records)
    const controllerL1TabGroups: TabCategoryRemarkGroup[] = [];

    if (hasDegree14) {
      controllerL1TabGroups.push({
        id: 'l1-degree-14',
        tabLabel: '14-Year Degree Examination Record',
        sublabel:
          'University Gazette match, registration & roll number validation',
        icon: <GraduationCap className="size-4 text-amber-700" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Degree (14 Year)' &&
            r.authorRole === 'ROLE_CONTROLLER_L1'
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    if (hasDegree16) {
      controllerL1TabGroups.push({
        id: 'l1-degree-16',
        tabLabel: '16-Year Degree Examination Record',
        sublabel:
          'University Gazette notification, seat list & transcript match',
        icon: <FileCheck className="size-4 text-amber-700" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Degree (16 Year)' &&
            r.authorRole === 'ROLE_CONTROLLER_L1'
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    controllerL1TabGroups.push({
      id: 'l1-gazette-general',
      tabLabel: 'Controller L1 Verification Observations',
      sublabel:
        'First-tier university examination cell observations & gazette logs',
      icon: <FileBadge className="size-4 text-amber-700" />,
      remarks: application.remarks.filter(
        (r) =>
          r.category === 'Controller L1 Remarks' ||
          (r.authorRole === 'ROLE_CONTROLLER_L1' &&
            r.category !== 'Degree (14 Year)' &&
            r.category !== 'Degree (16 Year)')
      ),
      badgeCount: 0,
      hasDiscrepancy: false,
    });

    controllerL1TabGroups.forEach((g) => {
      g.badgeCount = g.remarks.length;
      g.hasDiscrepancy = g.remarks.some((r) => r.severity === 'discrepancy');
    });

    const l1TotalRemarks = controllerL1TabGroups.reduce(
      (sum, g) => sum + g.badgeCount,
      0
    );
    const l1HasDiscrepancy = controllerL1TabGroups.some(
      (g) => g.hasDiscrepancy
    );

    // 3. Controller L2 Tab Groups (Organized by upper degree tabs + controller clearance)
    const controllerL2TabGroups: TabCategoryRemarkGroup[] = [];

    if (hasDegree14) {
      controllerL2TabGroups.push({
        id: 'l2-degree-14',
        tabLabel: '14-Year Degree Controller Clearance',
        sublabel:
          'Controller of Examinations institutional sign-off & seal clearance',
        icon: <GraduationCap className="size-4 text-[#173e81]" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Degree (14 Year)' &&
            r.authorRole === 'ROLE_CONTROLLER_L2'
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    if (hasDegree16) {
      controllerL2TabGroups.push({
        id: 'l2-degree-16',
        tabLabel: '16-Year Degree Controller Clearance',
        sublabel: 'Controller of Examinations convocation degree clearance',
        icon: <FileCheck className="size-4 text-[#173e81]" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Degree (16 Year)' &&
            r.authorRole === 'ROLE_CONTROLLER_L2'
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      });
    }

    controllerL2TabGroups.push({
      id: 'l2-clearance-general',
      tabLabel: 'Controller L2 Final Sign-Off Remarks',
      sublabel:
        'Controller of Examinations endorsement & clearance for HEC seal',
      icon: <CheckSquare className="size-4 text-[#173e81]" />,
      remarks: application.remarks.filter(
        (r) =>
          r.category === 'Controller L2 Remarks' ||
          (r.authorRole === 'ROLE_CONTROLLER_L2' &&
            r.category !== 'Degree (14 Year)' &&
            r.category !== 'Degree (16 Year)')
      ),
      badgeCount: 0,
      hasDiscrepancy: false,
    });

    controllerL2TabGroups.forEach((g) => {
      g.badgeCount = g.remarks.length;
      g.hasDiscrepancy = g.remarks.some((r) => r.severity === 'discrepancy');
    });

    const l2TotalRemarks = controllerL2TabGroups.reduce(
      (sum, g) => sum + g.badgeCount,
      0
    );
    const l2HasDiscrepancy = controllerL2TabGroups.some(
      (g) => g.hasDiscrepancy
    );

    // 4. HEC Attestation Authority Tab Groups
    const attestationTabGroups: TabCategoryRemarkGroup[] = [
      {
        id: 'attestation-seal-decision',
        tabLabel: 'Final Attestation Decision & QR Issuance',
        sublabel:
          'Physical ticket generation, security hologram, and seal issuance',
        icon: <QrCode className="size-4 text-[#13c2b6]" />,
        remarks: application.remarks.filter(
          (r) =>
            r.category === 'Attestation Decision' ||
            r.authorRole === 'ROLE_HEC_ATTESTATION'
        ),
        badgeCount: 0,
        hasDiscrepancy: false,
      },
    ];

    attestationTabGroups.forEach((g) => {
      g.badgeCount = g.remarks.length;
      g.hasDiscrepancy = g.remarks.some((r) => r.severity === 'discrepancy');
    });

    const attestationTotalRemarks = attestationTabGroups.reduce(
      (sum, g) => sum + g.badgeCount,
      0
    );
    const attestationHasDiscrepancy = attestationTabGroups.some(
      (g) => g.hasDiscrepancy
    );

    return [
      {
        stageId: 'stage-scrutiny',
        stageTitle: 'Stage 1: HEC Scrutiny Review Hierarchy',
        stageSubtitle:
          'Comprehensive document & applicant screening across all active attestation tabs',
        roleBadgeText: 'HEC Scrutiny Officer',
        roleBadgeColor:
          'font-orbitron border border-emerald-500/40 bg-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase',
        authorDefaultName: 'Ali Ahmed Qureshi (Scrutiny Desk)',
        icon: <ShieldCheck className="size-4 text-emerald-400" />,
        tabGroups: scrutinyTabGroups,
        totalRemarks: scrutinyTotalRemarks,
        hasDiscrepancy: scrutinyHasDiscrepancy,
      },
      {
        stageId: 'stage-controller-l1',
        stageTitle: 'Stage 2: University Controller L1 Verification Hierarchy',
        stageSubtitle:
          'University academic gazette, transcript verification, and student seat records',
        roleBadgeText: 'University Controller L1',
        roleBadgeColor:
          'font-orbitron border border-amber-500/40 bg-amber-500/20 text-[10px] font-bold text-amber-300 uppercase',
        authorDefaultName: 'Dr. Tariq Mehmood (Examination Branch L1)',
        icon: <FileBadge className="size-4 text-amber-400" />,
        tabGroups: controllerL1TabGroups,
        totalRemarks: l1TotalRemarks,
        hasDiscrepancy: l1HasDiscrepancy,
      },
      {
        stageId: 'stage-controller-l2',
        stageTitle:
          'Stage 3: University Controller L2 Verification & Endorsement',
        stageSubtitle:
          'Controller of Examinations sign-off, institutional endorsement, and clearance',
        roleBadgeText: 'University Controller L2',
        roleBadgeColor:
          'font-orbitron border border-sky-400/40 bg-sky-500/20 text-[10px] font-bold text-sky-300 uppercase',
        authorDefaultName: 'Prof. Dr. Munir Alam (Controller of Examinations)',
        icon: <CheckSquare className="size-4 text-sky-400" />,
        tabGroups: controllerL2TabGroups,
        totalRemarks: l2TotalRemarks,
        hasDiscrepancy: l2HasDiscrepancy,
      },
      {
        stageId: 'stage-attestation',
        stageTitle: 'Stage 4: HEC Attestation Authority Decision',
        stageSubtitle:
          'Final physical document verification, QR barcode generation, and attestation seal',
        roleBadgeText: 'HEC Attestation Officer',
        roleBadgeColor:
          'font-orbitron border border-[#13c2b6]/40 bg-[#13c2b6]/20 text-[10px] font-bold text-[#13c2b6] uppercase',
        authorDefaultName: 'Muhammad Salman Khan (Attestation Authority)',
        icon: <QrCode className="size-4 text-[#13c2b6]" />,
        tabGroups: attestationTabGroups,
        totalRemarks: attestationTotalRemarks,
        hasDiscrepancy: attestationHasDiscrepancy,
      },
    ];
  }, [application.remarks, hasSSC, hasHSSC, hasDegree14, hasDegree16]);

  // Reusable inline remarks table
  const renderRemarksTable = (
    remarks: FieldRemark[],
    categoryLabel: string
  ) => {
    if (remarks.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-3.5 text-center text-xs text-slate-400">
          No audit observations recorded for {categoryLabel}.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
            <tr>
              <th className="w-1/4 px-4 py-2.5">Field / Title</th>
              <th className="w-1/5 px-4 py-2.5">Claimed Value</th>
              <th className="px-4 py-2.5">Reviewer Observation / Comment</th>
              <th className="w-28 px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {remarks.map((rem) => {
              const isEditing = editingRemarkId === rem.id;
              const editable = canEditRemark(rem);

              return (
                <tr
                  key={rem.id}
                  className={`transition-colors ${
                    rem.severity === 'discrepancy'
                      ? 'bg-amber-50/30 hover:bg-amber-50/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* 1. Title Column */}
                  <td className="px-4 py-3 align-top">
                    <div className="font-bold text-slate-900">
                      {rem.fieldTitle}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                        {rem.category}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        {rem.authorName}
                      </span>
                    </div>
                  </td>

                  {/* 2. Claimed Value Column */}
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block rounded border border-slate-200 bg-slate-100/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
                      {rem.claimedValue}
                    </span>
                  </td>

                  {/* 3. Reviewer Comment Column */}
                  <td className="px-4 py-3 align-top">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          rows={2}
                          className="w-full rounded border border-emerald-500 bg-white p-2 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveInlineEdit(rem.id)}
                            className="h-7 gap-1 rounded-[8px] bg-[#13c2b6] text-[11px] font-semibold text-white hover:bg-[#0fb2a6]"
                          >
                            <Save className="size-3" />
                            <span>Save Remarks</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRemarkId(null);
                              setEditCommentText('');
                            }}
                            className="h-7 text-[11px] text-slate-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="leading-relaxed font-medium text-slate-800">
                            &ldquo;{rem.comment}&rdquo;
                          </p>
                          {rem.observedValue && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-amber-300 bg-amber-50 font-mono text-[10px] text-amber-900"
                            >
                              Observed: {rem.observedValue}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-mono">
                            {new Date(rem.createdAt).toLocaleDateString(
                              'en-PK',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                          <span>• Stage: {rem.stage}</span>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* 4. Action Column */}
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-1">
                      {editable && !isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingRemarkId(rem.id);
                            setEditCommentText(rem.comment);
                          }}
                          className="h-7 gap-1 px-2 text-[11px] font-semibold text-[#009588] hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <Edit3 className="size-3" />
                          <span>Edit</span>
                        </Button>
                      )}

                      {(effectiveRole === 'ROLE_HEC_MANAGER' ||
                        rem.authorRole === effectiveRole) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRemark(rem.id)}
                          className="size-7 text-slate-400 hover:text-rose-600"
                          title="Delete Remark"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* =========================================================================
          SECTION 1: ATTESTED DOCUMENT DETAIL CHECKLIST
          Multi-degree checklist card with 14-Year and 16-Year degree verification
          and optional supporting remark document attachment ("Upload Remark").
         ========================================================================= */}
      <Card className="cega-panel-shadow rounded-2xl border-[#e5e5e5] bg-[#ffffff]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="font-orbitron flex items-center gap-2 text-sm font-bold text-[#000000]">
                <CheckSquare className="size-4 text-[#13c2b6]" />
                Attested Document Detail Checklist
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Official document verification prerequisites per HEC
                Accreditation & Attestation SOPs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-mono text-[10px] font-semibold text-emerald-800"
              >
                HEC SOP 2026
              </Badge>
              <Badge
                variant="outline"
                className="bg-white font-mono text-[10px] text-slate-600"
              >
                Target:{' '}
                <span className="font-bold text-slate-900">
                  {application.targetDegreeLevel}
                </span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className={
            hasDegree14 && hasDegree16
              ? 'grid grid-cols-1 gap-6 pt-5 md:grid-cols-2'
              : 'mx-auto max-w-2xl pt-5'
          }
        >
          {/* Card A: 14 Years Degree Verification */}
          {hasDegree14 && (
            <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-700">
                      14Y
                    </span>
                    <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                      14 Years Degree Verification
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    BA / BSc / Associate
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checklist.degree14.transcript}
                        onChange={() =>
                          handleChecklistToggle('degree14', 'transcript')
                        }
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        Transcript
                      </span>
                    </div>
                    {checklist.degree14.transcript ? (
                      <Badge className="border-emerald-200 bg-emerald-100/70 text-[9px] font-semibold text-emerald-800">
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Pending
                      </span>
                    )}
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checklist.degree14.provisionalCertificate}
                        onChange={() =>
                          handleChecklistToggle(
                            'degree14',
                            'provisionalCertificate'
                          )
                        }
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        Provisional Certificate
                      </span>
                    </div>
                    {checklist.degree14.provisionalCertificate ? (
                      <Badge className="border-emerald-200 bg-emerald-100/70 text-[9px] font-semibold text-emerald-800">
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Pending
                      </span>
                    )}
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checklist.degree14.equivalenceCertificate}
                        onChange={() =>
                          handleChecklistToggle(
                            'degree14',
                            'equivalenceCertificate'
                          )
                        }
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        Equivalence Certificate of HEC
                      </span>
                    </div>
                    {checklist.degree14.equivalenceCertificate ? (
                      <Badge className="border-emerald-200 bg-emerald-100/70 text-[9px] font-semibold text-emerald-800">
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Pending
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Supporting Remark Document Attachment */}
              <div className="border-t border-slate-200 pt-3">
                {checklist.degree14.remarkDocumentUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="size-4 shrink-0 text-emerald-700" />
                      <div className="truncate text-left text-[11px]">
                        <span className="block truncate font-semibold text-slate-800">
                          {checklist.degree14.remarkDocumentUrl.replace(
                            '/mock-documents/',
                            ''
                          )}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">
                          840 KB • Scrutiny Remark Docket
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRemarkDocument('degree14')}
                      className="size-6 text-slate-400 hover:text-rose-600"
                      title="Remove attached remark document"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUploadRemarkModal({
                        isOpen: true,
                        degree: 'degree14',
                        fileName:
                          'Degree14_Equivalence_Scrutiny_Endorsement.pdf',
                        fileNote: '',
                      })
                    }
                    className="h-8 w-full gap-1.5 border-dashed border-slate-300 bg-white text-xs text-slate-700 hover:border-emerald-600 hover:text-emerald-800"
                  >
                    <Upload className="size-3.5" />
                    <span>Upload Remark (14-Year Document)</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Card B: 16 Years Degree Verification (Target Program) */}
          {hasDegree16 && (
            <div className="flex flex-col justify-between space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-[#13c2b6] text-[10px] font-bold text-white">
                      16Y
                    </span>
                    <span className="text-xs font-bold tracking-wider text-[#009588] uppercase">
                      16 Years Degree Verification
                    </span>
                  </div>
                  <Badge className="bg-[#13c2b6] font-mono text-[9px] font-semibold text-white">
                    Target Qualification
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-emerald-200 hover:bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checklist.degree16.transcript}
                        onChange={() =>
                          handleChecklistToggle('degree16', 'transcript')
                        }
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        Official University Transcript
                      </span>
                    </div>
                    {checklist.degree16.transcript ? (
                      <Badge className="border-emerald-300 bg-emerald-100 text-[9px] font-semibold text-emerald-800">
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Pending
                      </span>
                    )}
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-emerald-200 hover:bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checklist.degree16.provisionalCertificate}
                        onChange={() =>
                          handleChecklistToggle(
                            'degree16',
                            'provisionalCertificate'
                          )
                        }
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        Convocation Degree Parchment / Provisional
                      </span>
                    </div>
                    {checklist.degree16.provisionalCertificate ? (
                      <Badge className="border-emerald-300 bg-emerald-100 text-[9px] font-semibold text-emerald-800">
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Pending
                      </span>
                    )}
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-emerald-200 hover:bg-white">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checklist.degree16.equivalenceCertificate}
                        onChange={() =>
                          handleChecklistToggle(
                            'degree16',
                            'equivalenceCertificate'
                          )
                        }
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        Equivalence Certificate of HEC
                      </span>
                    </div>
                    {checklist.degree16.equivalenceCertificate ? (
                      <Badge className="border-emerald-300 bg-emerald-100 text-[9px] font-semibold text-emerald-800">
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Pending
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Supporting Remark Document Attachment */}
              <div className="border-t border-emerald-200/80 pt-3">
                {checklist.degree16.remarkDocumentUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-white p-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileBadge className="size-4 shrink-0 text-emerald-700" />
                      <div className="truncate text-left text-[11px]">
                        <span className="block truncate font-semibold text-slate-800">
                          {checklist.degree16.remarkDocumentUrl.replace(
                            '/mock-documents/',
                            ''
                          )}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">
                          1.4 MB • University Gazette Docket Attached
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRemarkDocument('degree16')}
                      className="size-6 text-slate-400 hover:text-rose-600"
                      title="Remove attached remark document"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUploadRemarkModal({
                        isOpen: true,
                        degree: 'degree16',
                        fileName: 'NUST_BSCE_Gazette_Verification_Docket.pdf',
                        fileNote: '',
                      })
                    }
                    className="h-8 w-full gap-1.5 border-dashed border-[#13c2b6]/40 bg-white text-xs font-semibold text-[#009588] hover:border-[#13c2b6] hover:bg-[#13c2b6]/10"
                  >
                    <Upload className="size-3.5" />
                    <span>Upload Remark (16-Year Supporting Docket)</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {!hasDegree14 && !hasDegree16 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No university degree records attached for physical checklist
              verification. Academic screening handled under stage audit logs.
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          SECTION 2: CONSOLIDATED COMMENTS TRAIL & INLINE EDITING TABLE
          Organized chronologically and grouped by document category with accordion
          headers, count badges, structured table, and inline editing.
         ========================================================================= */}
      <Card className="cega-panel-shadow rounded-2xl border-[#e5e5e5] bg-[#ffffff]">
        <CardHeader className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/50 pb-3 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-orbitron flex items-center gap-2 text-sm font-bold text-[#000000]">
                <MessageSquare className="size-4 text-[#13c2b6]" />
                Consolidated Comments Trail & Inline Verification Log
              </CardTitle>
              <Badge className="bg-[#fcbb00]/20 font-mono text-[10px] font-bold text-[#f05100]">
                {application.remarks.length} Total Remark
                {application.remarks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Hierarchical multi-stage audit trail from HEC Scrutiny, University
              Controllers (L1/L2), and Attestation
            </CardDescription>

            {/* Dynamic Upper Available Tabs Info */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                Attestation Scope Tabs:
              </span>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-700"
              >
                Personal Documents
              </Badge>
              {hasSSC && (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-700"
                >
                  SSC Certificate
                </Badge>
              )}
              {hasHSSC && (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-700"
                >
                  HSSC Certificate
                </Badge>
              )}
              {hasDegree14 && (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-700"
                >
                  Degree (14 Year)
                </Badge>
              )}
              {hasDegree16 && (
                <Badge
                  variant="outline"
                  className="border-[#13c2b6]/40 bg-[#13c2b6]/10 text-[10px] font-semibold text-[#009588]"
                >
                  Degree (16 Year - Target)
                </Badge>
              )}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 shrink-0 gap-1.5 rounded-[8px] bg-[#13c2b6] text-xs font-semibold text-white shadow-2xs hover:bg-[#0fb2a6]"
          >
            <Plus className="size-3.5" />
            <span>+ Add New Remark</span>
          </Button>
        </CardHeader>

        <CardContent className="divide-y divide-[#e5e5e5] p-0">
          {stageGroups.map((stage) => {
            const isOpen = openStages[stage.stageId] ?? true;
            return (
              <div key={stage.stageId} className="overflow-hidden">
                {/* Main Stage Header (e.g. Stage 1: HEC Scrutiny Review Hierarchy) */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.stageId)}
                  className="flex w-full items-center justify-between border-b border-[#13c2b6]/20 bg-[#0a1630] px-5 py-3.5 text-left transition-colors select-none hover:bg-[#0c1e40]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-lg border border-[#13c2b6]/30 bg-[#0d2a55] text-[#13c2b6] shadow-2xs">
                      {isOpen ? (
                        <ChevronUp className="size-4 text-[#13c2b6]" />
                      ) : (
                        <ChevronDown className="size-4 text-[#13c2b6]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-md border border-[#13c2b6]/30 bg-[#0d2a55] shadow-xs">
                        {stage.icon}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-orbitron text-xs font-bold text-white sm:text-sm">
                            {stage.stageTitle}
                          </span>
                          <Badge className={stage.roleBadgeColor}>
                            {stage.roleBadgeText}
                          </Badge>
                          {stage.hasDiscrepancy && (
                            <Badge
                              variant="outline"
                              className="border-amber-400/40 bg-amber-500/20 text-[9px] font-semibold text-amber-300"
                            >
                              Discrepancy Flagged
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          {stage.stageSubtitle} • Desk Lead:{' '}
                          <span className="font-semibold text-white">
                            {stage.authorDefaultName}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] ${
                        stage.totalRemarks > 0
                          ? 'border-[#13c2b6]/40 bg-[#13c2b6]/20 font-bold text-[#13c2b6]'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {stage.totalRemarks} Observation
                      {stage.totalRemarks !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </button>

                {/* When Open: Render Sub-Hierarchy Groups */}
                {isOpen && (
                  <div className="divide-y divide-slate-100 bg-white">
                    {stage.tabGroups.map((tabGroup) => (
                      <div key={tabGroup.id} className="space-y-3 p-4 sm:p-5">
                        {/* Sub-Group Header (e.g. Personal Documents, SSC, HSSC, Degree) */}
                        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-2 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex size-5 items-center justify-center rounded bg-slate-100 text-slate-600">
                              {tabGroup.icon}
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              {tabGroup.tabLabel}
                            </span>
                            <span className="hidden text-[10px] text-slate-400 sm:inline">
                              — {tabGroup.sublabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {tabGroup.hasDiscrepancy && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 bg-amber-50 text-[9px] font-semibold text-amber-800"
                              >
                                Discrepancy
                              </Badge>
                            )}
                            <Badge className="bg-slate-100 font-mono text-[10px] text-slate-700">
                              {tabGroup.badgeCount} Log
                              {tabGroup.badgeCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>

                        {/* Render Table for this Sub-Group */}
                        {renderRemarksTable(
                          tabGroup.remarks,
                          tabGroup.tabLabel
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* =========================================================================
          SECTION 3: ROLE-SPECIFIC WORKFLOW ACTION FOOTER (BPMN STATE TRANSITIONS)
          Dynamic action buttons strictly filtered by active user role.
         ========================================================================= */}
      <div className="cega-panel-shadow space-y-4 rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-[#e5e5e5] pb-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="font-orbitron flex items-center gap-2 text-sm font-bold text-[#000000]">
              <Send className="size-4 text-[#13c2b6]" />
              Role Workflow Action Panel (Synapark BPMN Transitions)
            </h4>
            <p className="text-xs text-[#666666]">
              Permitted state transitions under active session credential:{' '}
              <span className="font-mono font-bold text-[#009588]">
                {effectiveRole}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Current Phase:</span>
            <Badge className="border-emerald-200 bg-emerald-50 font-mono text-xs font-semibold text-emerald-800">
              {application.currentState}
            </Badge>
          </div>
        </div>

        {/* Dynamic Buttons Based on Effective Role */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          {/* A. If Role = HEC Scrutiny */}
          {effectiveRole === 'ROLE_HEC_SCRUTINY' && (
            <>
              {/* Button 1: Revision & Send Back to Student */}
              <Button
                variant="outline"
                onClick={() =>
                  setPendingTransition({
                    action: 'REVISION_REQUESTED',
                    targetState: 'REVISION_REQUESTED',
                    title: 'Return Application to Student for Revision',
                    description:
                      'Routes application back to Student Portal with all accumulated scrutiny discrepancy remarks attached.',
                    requiresReason: true,
                    actionType: 'REVISION',
                  })
                }
                className="h-9 gap-1.5 border-orange-300 bg-white text-xs font-semibold text-orange-800 hover:bg-orange-50"
              >
                <RotateCcw className="size-3.5" />
                <span>Revision & Send Back to Student</span>
              </Button>

              {/* Button 2: Reject Application */}
              <Button
                variant="outline"
                onClick={() =>
                  setPendingTransition({
                    action: 'REJECT_APPLICATION',
                    targetState: 'REJECTED',
                    title: 'Formally Reject Application',
                    description:
                      'Terminates application workflow. A mandatory formal justification is permanently logged into the national registry.',
                    isDestructive: true,
                    requiresReason: true,
                    actionType: 'REJECT',
                  })
                }
                className="h-9 gap-1.5 border-rose-300 bg-white text-xs font-semibold text-rose-800 hover:bg-rose-50"
              >
                <XCircle className="size-3.5" />
                <span>Reject Application</span>
              </Button>

              {/* Button 3: Approve & Forward to Controller L1 */}
              <Button
                onClick={() =>
                  setPendingTransition({
                    action: 'APPROVE_AND_FORWARD_L1',
                    targetState: 'PENDING_CONTROLLER_L1',
                    title:
                      'Approve Scrutiny & Forward to University Controller (L1)',
                    description:
                      'Marks screening complete and dispatches candidate dossier to University Examination Gazette verification queue.',
                    actionType: 'PASS',
                  })
                }
                className="h-9 gap-1.5 rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white shadow-xs hover:bg-[#0fb2a6]"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Approve & Forward to Controller L1</span>
              </Button>
            </>
          )}

          {/* B. If Role = University Controller L1 */}
          {effectiveRole === 'ROLE_CONTROLLER_L1' && (
            <>
              {/* Button 1: Flag Academic Discrepancy & Forward to Controller L2 (Reject) */}
              <Button
                variant="outline"
                onClick={() =>
                  setPendingTransition({
                    action: 'FLAG_DISCREPANCY_FORWARD_L2',
                    targetState: 'PENDING_CONTROLLER_L2',
                    title:
                      'Flag Academic Discrepancy & Forward to Controller L2 (Reject)',
                    description:
                      'L1 notes discrepancies against gazette records. Case routes to Controller L2 for final institutional verdict.',
                    requiresReason: true,
                    actionType: 'REJECT',
                  })
                }
                className="h-9 gap-1.5 rounded-[10px] border-[#fcbb00]/50 bg-white text-xs font-semibold text-[#f05100] hover:bg-[#fcbb00]/10"
              >
                <AlertTriangle className="size-3.5" />
                <span>
                  Flag Academic Discrepancy & Forward to Controller L2 (Reject)
                </span>
              </Button>

              {/* Button 2: Verify & Forward to Controller L2 (Pass) */}
              <Button
                onClick={() =>
                  setPendingTransition({
                    action: 'VERIFY_AND_FORWARD_L2',
                    targetState: 'PENDING_CONTROLLER_L2',
                    title: 'Verify & Forward to Controller L2 (Pass)',
                    description:
                      'Academic transcript matches official university gazette. Dispatches to Controller of Examinations for final institutional endorsement.',
                    actionType: 'PASS',
                  })
                }
                className="h-9 gap-1.5 rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white shadow-xs hover:bg-[#0fb2a6]"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Verify & Forward to Controller L2 (Pass)</span>
              </Button>
            </>
          )}

          {/* C. If Role = University Controller L2 */}
          {effectiveRole === 'ROLE_CONTROLLER_L2' && (
            <Button
              onClick={() =>
                setPendingTransition({
                  action: 'SUBMIT_FINAL_UNIVERSITY_REMARKS',
                  targetState: 'PENDING_ATTESTATION',
                  title: 'Submit Final University Remarks & Return to HEC',
                  description:
                    'Applies university controller signature sign-off and dispatches verified case back to HEC Attestation Section with L1 + L2 academic verification.',
                  actionType: 'PASS',
                })
              }
              className="h-9 gap-1.5 rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white shadow-xs hover:bg-[#0fb2a6]"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Submit Final University Remarks & Return to HEC</span>
            </Button>
          )}

          {/* D. If Role = HEC Attestation or HEC Manager */}
          {(effectiveRole === 'ROLE_HEC_ATTESTATION' ||
            effectiveRole === 'ROLE_HEC_MANAGER') && (
            <>
              {/* Button 1: Return to Scrutiny / Revision */}
              <Button
                variant="outline"
                onClick={() =>
                  setPendingTransition({
                    action: 'RETURN_TO_SCRUTINY',
                    targetState: 'REVISION_REQUESTED',
                    title: 'Return Case to Scrutiny / Revision',
                    description:
                      'Routes case back to initial scrutiny queue for missing documentation or unresolved equivalency requirements.',
                    requiresReason: true,
                    actionType: 'REVISION',
                  })
                }
                className="h-9 gap-1.5 rounded-[10px] border-[#e5e5e5] bg-white text-xs font-semibold text-[#000000] hover:bg-[#f8fafc]"
              >
                <RotateCcw className="size-3.5" />
                <span>Return to Scrutiny / Revision</span>
              </Button>

              {/* Button 2: Final Approve & Issue Attestation */}
              <Button
                onClick={() =>
                  setPendingTransition({
                    action: 'FINAL_APPROVE_AND_ISSUE',
                    targetState: 'ATTESTED_COMPLETED',
                    title: 'Final Approve & Issue Official HEC Attestation',
                    description:
                      'Concludes workflow, marks case COMPLETED, generates permanent HEC Attestation Registration Number, and produces official verification ticket.',
                    actionType: 'FINAL_ISSUE',
                  })
                }
                className="h-9 gap-1.5 rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white shadow-xs hover:bg-[#0fb2a6]"
              >
                <FileBadge className="size-3.5" />
                <span>Final Approve & Issue Attestation</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: TRANSITION CONFIRMATION MODAL
          Summarizes remark count, checklist status, mandatory reason input,
          and prompts for BPMN state transition execution.
         ========================================================================= */}
      <Dialog
        open={!!pendingTransition}
        onOpenChange={() => setPendingTransition(null)}
      >
        <DialogContent className="max-w-lg rounded-2xl border-[#e5e5e5] bg-[#ffffff] text-slate-900">
          <DialogHeader>
            <DialogTitle className="font-orbitron flex items-center gap-2 text-base font-bold text-[#000000]">
              <Sparkles className="size-4 text-[#13c2b6]" />
              {pendingTransition?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#666666]">
              {pendingTransition?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5 rounded-xl border border-[#e5e5e5] bg-[#f8fafc] p-3 font-mono text-[11px]">
              <div className="flex justify-between text-[#666666]">
                <span>Application ID:</span>
                <span className="font-bold text-[#000000]">
                  {application.id}
                </span>
              </div>
              <div className="flex justify-between text-[#666666]">
                <span>Tracking Number:</span>
                <span className="font-bold text-[#009588]">
                  {application.trackingNumber}
                </span>
              </div>
              <div className="flex justify-between text-[#666666]">
                <span>Candidate:</span>
                <span className="font-bold text-[#000000]">
                  {application.personalDetails.fullName}
                </span>
              </div>
              <div className="flex justify-between text-[#666666]">
                <span>Target Degree:</span>
                <span className="truncate font-semibold text-[#000000]">
                  {application.targetDegreeTitle}
                </span>
              </div>
              <div className="flex justify-between text-[#666666]">
                <span>Total Accumulated Remarks:</span>
                <span className="font-bold text-[#f05100]">
                  {application.remarks.length} Observations
                </span>
              </div>
            </div>

            {pendingTransition?.requiresReason && (
              <div className="space-y-1">
                <label className="block font-semibold text-[#000000]">
                  Mandatory Observation / Justification Note:{' '}
                  <span className="text-[#e40014]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="State formal findings for audit trail (e.g. Discrepancy observed between claimed grade points and university gazette register)..."
                  className="w-full rounded-[10px] border border-[#e5e5e5] p-2.5 text-xs text-[#000000] focus:ring-1 focus:ring-[#13c2b6] focus:outline-none"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingTransition(null)}
              className="rounded-[10px] border-[#e5e5e5] text-xs text-[#000000]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={executeTransition}
              disabled={
                isTransitioning ||
                (pendingTransition?.requiresReason && !transitionReason.trim())
              }
              className={`rounded-[10px] text-xs font-semibold text-white ${
                pendingTransition?.isDestructive
                  ? 'bg-[#e40014] hover:bg-rose-700'
                  : 'bg-[#13c2b6] hover:bg-[#0fb2a6]'
              }`}
            >
              {isTransitioning
                ? 'Processing Transition...'
                : 'Confirm BPMN State Transition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: TRANSITION OUTCOME & RECEIPT / BPMN JSON PAYLOAD PREVIEW
          Displays HEC Official Attestation Receipt and Synapark BPMN REST preview.
         ========================================================================= */}
      <Dialog
        open={!!payloadPreview}
        onOpenChange={() => {
          setPayloadPreview(null);
          router.push('/dashboard');
        }}
      >
        <DialogContent className="max-w-2xl border-slate-200 bg-white text-slate-900">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Workflow State Successfully Transited
              </DialogTitle>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewTab('RECEIPT')}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    viewTab === 'RECEIPT'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Verification Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('JSON')}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    viewTab === 'JSON'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Synapark JSON (200 OK)
                </button>
              </div>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              State moved to{' '}
              <span className="font-mono font-bold text-emerald-700">
                {payloadPreview?.currentState}
              </span>
              . Audited by{' '}
              {payloadPreview?.auditTrail[payloadPreview.auditTrail.length - 1]
                ?.authorName ?? effectiveRole}
              .
            </DialogDescription>
          </DialogHeader>

          {/* Tab 1: Official HEC Attestation / Verification Ticket */}
          {viewTab === 'RECEIPT' && (
            <div className="space-y-4 py-2">
              <div className="relative overflow-hidden rounded-xl border border-emerald-300 bg-linear-to-b from-emerald-50/50 to-white p-5 shadow-xs">
                {/* Pakistan & HEC Crest simulation */}
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#13c2b6] text-white shadow-2xs">
                      <FileBadge className="size-6 text-[#fcbb00]" />
                    </div>
                    <div>
                      <h4 className="font-orbitron font-bold text-slate-900">
                        HIGHER EDUCATION COMMISSION, PAKISTAN
                      </h4>
                      <p className="font-mono text-[10px] text-[#009588]">
                        National Academic Degree Attestation & Verification
                        Registry
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[#13c2b6] font-mono text-[10px] text-white">
                    Official Docket
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Attestation Reg No
                    </span>
                    <p className="font-mono font-bold text-emerald-900">
                      HEC-ATT-2026-941829
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Tracking Number
                    </span>
                    <p className="font-mono font-bold text-slate-800">
                      {application.trackingNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Candidate Name
                    </span>
                    <p className="font-bold text-slate-900">
                      {application.personalDetails.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">
                      CNIC / Identity
                    </span>
                    <p className="font-mono font-bold text-slate-800">
                      {application.personalDetails.cnic}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 uppercase">
                      Accredited Qualification
                    </span>
                    <p className="font-semibold text-slate-900">
                      {application.targetDegreeTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded bg-slate-100 text-slate-700">
                      <QrCode className="size-6" />
                    </div>
                    <div className="text-[10px]">
                      <span className="font-bold text-slate-800">
                        Cryptographic Digital Stamp
                      </span>
                      <p className="font-mono text-slate-500">
                        SHA256: 8f4b...91ac verified against HEC Gazette Root
                      </p>
                    </div>
                  </div>
                  <Badge className="border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-800">
                    STATUS: {payloadPreview?.semanticStatus}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs text-slate-700"
                >
                  <Printer className="size-3.5" />
                  <span>Print Attestation Receipt</span>
                </Button>
                <span className="text-[10px] text-slate-400">
                  Logged in HEC National Audit Ledger
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Synapark BPMN Transition Payload JSON (for developer verification) */}
          {viewTab === 'JSON' && (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Code2 className="size-3.5" />
                  REST Endpoint: POST /api/v1/synapark/tasks/transition
                </span>
                <span>Status: 200 OK</span>
              </div>
              <div className="max-h-72 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300">
                <pre>
                  {JSON.stringify(
                    payloadPreview?.transitionPayloadPreview,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button
              size="sm"
              onClick={() => {
                setPayloadPreview(null);
                router.push('/dashboard');
              }}
              className="w-full rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0fb2a6]"
            >
              Return to Role Dashboard Queue →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: ADD NEW REMARK MODAL
          Drawer / dialog allowing reviewer to attach new observations.
         ========================================================================= */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md border-slate-200 bg-white text-slate-900">
          <form onSubmit={handleCreateNewRemark}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900">
                Add Discrepancy or Audit Remark
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Attach a formal observation to this candidate&apos;s credentials
                in the official comments trail
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Target Category
                </label>
                <select
                  value={newRemarkCategory}
                  onChange={(e) =>
                    setNewRemarkCategory(
                      e.target.value as FieldRemark['category']
                    )
                  }
                  className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  {availableRemarkCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Target Field / Title
                </label>
                <Input
                  placeholder="e.g., Full Name, Father Name, Degree Title, Total Marks"
                  value={newRemarkTitle}
                  onChange={(e) => setNewRemarkTitle(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Claimed Value
                  </label>
                  <Input
                    placeholder="e.g. 650"
                    value={newRemarkClaim}
                    onChange={(e) => setNewRemarkClaim(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Observed Value (Optional)
                  </label>
                  <Input
                    placeholder="e.g. 620 on scan"
                    value={newRemarkObserved}
                    onChange={(e) => setNewRemarkObserved(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Reviewer Comment / Observation
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the discrepancy found between database claim and physical/scanned parchment..."
                  value={newRemarkComment}
                  onChange={(e) => setNewRemarkComment(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0fb2a6]"
              >
                Save to Comments Trail
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 4: UPLOAD REMARK SUPPORTING DOCUMENT MODAL
          Allows attaching supporting remark document to 14Y / 16Y checklist.
         ========================================================================= */}
      <Dialog
        open={uploadRemarkModal.isOpen}
        onOpenChange={(open) =>
          setUploadRemarkModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md rounded-2xl border-[#e5e5e5] bg-[#ffffff] text-slate-900">
          <form onSubmit={handleAttachRemarkDocument}>
            <DialogHeader>
              <DialogTitle className="font-orbitron flex items-center gap-2 text-sm font-bold text-[#000000]">
                <Upload className="size-4 text-[#13c2b6]" />
                Attach Supporting Remark Document
              </DialogTitle>
              <DialogDescription className="text-xs text-[#666666]">
                Upload verified gazette excerpt, equivalence memorandum, or
                docket for{' '}
                <span className="font-bold text-[#000000]">
                  {uploadRemarkModal.degree === 'degree14'
                    ? '14-Year Degree'
                    : '16-Year Degree'}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Docket File Name / Identifier
                </label>
                <Input
                  value={uploadRemarkModal.fileName}
                  onChange={(e) =>
                    setUploadRemarkModal((prev) => ({
                      ...prev,
                      fileName: e.target.value,
                    }))
                  }
                  placeholder="e.g. NUST_Gazette_Verification_Docket.pdf"
                  className="h-8 rounded-[8px] font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Officer Endorsement Note
                </label>
                <textarea
                  rows={2}
                  value={uploadRemarkModal.fileNote}
                  onChange={(e) =>
                    setUploadRemarkModal((prev) => ({
                      ...prev,
                      fileNote: e.target.value,
                    }))
                  }
                  placeholder="e.g. Verified against University Examination Gazette Register 2023, page 412."
                  className="w-full rounded-[8px] border border-[#e5e5e5] p-2 text-xs text-[#000000] focus:ring-1 focus:ring-[#13c2b6] focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-dashed border-[#13c2b6]/40 bg-[#13c2b6]/10 p-3 text-center">
                <FileCheck className="mx-auto size-6 text-[#13c2b6]" />
                <p className="mt-1 font-semibold text-[#000000]">
                  Mock File Upload Simulator
                </p>
                <p className="text-[10px] text-[#666666]">
                  Attaches verifiable digital asset into application dossier
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setUploadRemarkModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="rounded-[10px] border-[#e5e5e5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0fb2a6]"
              >
                Attach Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
