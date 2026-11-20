import { describe, it, expect } from 'vitest';
import {
  FieldRemark,
  RoleType,
  ApplicationWorkflowState,
} from '@/types/workflow';

// Helper matching canEditRemark logic in ConsolidatedCommentsAndActionFooter
export function canEditRemark(
  remark: FieldRemark,
  effectiveRole: RoleType,
  currentState: ApplicationWorkflowState
): boolean {
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
    currentState === 'IN_SCRUTINY'
  ) {
    return true;
  }
  return false;
}

// Helper matching hierarchy grouping
export function groupRemarksByReviewerStage(remarks: FieldRemark[]) {
  const scrutinyRemarks = remarks.filter(
    (r) =>
      r.authorRole === 'ROLE_HEC_SCRUTINY' ||
      [
        'Personal Details',
        'NADRA Verification',
        'SSC Certificate',
        'HSSC Certificate',
        'Degree (14 Year)',
        'Degree (16 Year)',
      ].includes(r.category)
  );

  const controllerL1Remarks = remarks.filter(
    (r) =>
      r.authorRole === 'ROLE_CONTROLLER_L1' ||
      r.category === 'Controller L1 Remarks'
  );

  const controllerL2Remarks = remarks.filter(
    (r) =>
      r.authorRole === 'ROLE_CONTROLLER_L2' ||
      r.category === 'Controller L2 Remarks'
  );

  const attestationRemarks = remarks.filter(
    (r) =>
      r.authorRole === 'ROLE_HEC_ATTESTATION' ||
      r.category === 'Attestation Decision'
  );

  return {
    scrutinyRemarks,
    controllerL1Remarks,
    controllerL2Remarks,
    attestationRemarks,
  };
}

describe('Remarks Hierarchy & Audit Trail Logic', () => {
  const sampleRemarks: FieldRemark[] = [
    {
      id: 'REM-01',
      category: 'Personal Details',
      fieldTitle: 'Father Name',
      claimedValue: 'Haider Ali',
      observedValue: 'Syed Haider Ali',
      comment: 'Minor surname discrepancy against NADRA record',
      severity: 'discrepancy',
      authorRole: 'ROLE_HEC_SCRUTINY',
      authorName: 'Ali Ahmed Qureshi',
      createdAt: '2026-11-01T10:00:00.000Z',
      stage: 'IN_SCRUTINY',
    },
    {
      id: 'REM-02',
      category: 'Degree (16 Year)',
      fieldTitle: 'Credit Hours',
      claimedValue: '134',
      observedValue: '134',
      comment: 'Full credit hours completed as per HEC curriculum guidelines',
      severity: 'info',
      authorRole: 'ROLE_HEC_SCRUTINY',
      authorName: 'Ali Ahmed Qureshi',
      createdAt: '2026-11-01T10:15:00.000Z',
      stage: 'IN_SCRUTINY',
    },
    {
      id: 'REM-03',
      category: 'Controller L1 Remarks',
      fieldTitle: 'University Gazette Verification',
      claimedValue: 'Verified',
      observedValue: 'Gazette Folio # 2022/EE-492',
      comment:
        'Cross-checked with original Examination Gazette. Result verified.',
      severity: 'info',
      authorRole: 'ROLE_CONTROLLER_L1',
      authorName: 'Dr. Tariq Mehmood',
      createdAt: '2026-11-03T11:00:00.000Z',
      stage: 'IN_CONTROLLER_L1',
    },
    {
      id: 'REM-04',
      category: 'Controller L2 Remarks',
      fieldTitle: 'Controller of Examinations Final Endorsement',
      claimedValue: 'Degree Conferred',
      observedValue: 'Convocation Held Fall 2022',
      comment: 'Formal university seal and endorsement confirmed.',
      severity: 'info',
      authorRole: 'ROLE_CONTROLLER_L2',
      authorName: 'Prof. Dr. Munir Alam',
      createdAt: '2026-11-04T15:30:00.000Z',
      stage: 'IN_CONTROLLER_L2',
    },
    {
      id: 'REM-05',
      category: 'Attestation Decision',
      fieldTitle: 'HEC Ticket & QR Code Generation',
      claimedValue: 'Ready For Stamping',
      observedValue: 'Ticket # HEC-2026-QR-9901',
      comment: 'Security barcode and embossed seal approved.',
      severity: 'info',
      authorRole: 'ROLE_HEC_ATTESTATION',
      authorName: 'Muhammad Salman Khan',
      createdAt: '2026-11-05T09:00:00.000Z',
      stage: 'IN_ATTESTATION',
    },
  ];

  it('correctly organizes remarks into hierarchical stages', () => {
    const grouped = groupRemarksByReviewerStage(sampleRemarks);

    expect(grouped.scrutinyRemarks.length).toBe(2);
    expect(grouped.controllerL1Remarks.length).toBe(1);
    expect(grouped.controllerL2Remarks.length).toBe(1);
    expect(grouped.attestationRemarks.length).toBe(1);

    expect(grouped.scrutinyRemarks[0].fieldTitle).toBe('Father Name');
    expect(grouped.controllerL1Remarks[0].fieldTitle).toBe(
      'University Gazette Verification'
    );
    expect(grouped.controllerL2Remarks[0].fieldTitle).toBe(
      'Controller of Examinations Final Endorsement'
    );
    expect(grouped.attestationRemarks[0].fieldTitle).toBe(
      'HEC Ticket & QR Code Generation'
    );
  });

  it('permits HEC Manager to edit any remark across all stages', () => {
    sampleRemarks.forEach((rem) => {
      const allowed = canEditRemark(
        rem,
        'ROLE_HEC_MANAGER',
        'IN_CONTROLLER_L2'
      );
      expect(allowed).toBe(true);
    });
  });

  it('permits the author of the remark to edit their own remark', () => {
    const scrutinyRemark = sampleRemarks[0];
    const allowed = canEditRemark(
      scrutinyRemark,
      'ROLE_HEC_SCRUTINY',
      'IN_SCRUTINY'
    );
    expect(allowed).toBe(true);

    const controllerL1Remark = sampleRemarks[2];
    const controllerAllowed = canEditRemark(
      controllerL1Remark,
      'ROLE_CONTROLLER_L1',
      'IN_CONTROLLER_L1'
    );
    expect(controllerAllowed).toBe(true);
  });

  it('forbids other roles from editing historical remarks from previous stages', () => {
    const scrutinyRemark = sampleRemarks[0];
    // Controller L1 trying to edit Scrutiny remark
    const allowed = canEditRemark(
      scrutinyRemark,
      'ROLE_CONTROLLER_L1',
      'IN_CONTROLLER_L1'
    );
    expect(allowed).toBe(false);

    // Attestation officer trying to edit Controller L1 remark
    const controllerRemark = sampleRemarks[2];
    const attestationAllowed = canEditRemark(
      controllerRemark,
      'ROLE_HEC_ATTESTATION',
      'IN_ATTESTATION'
    );
    expect(attestationAllowed).toBe(false);
  });

  it('identifies discrepancy severity flags for highlighted display', () => {
    const discrepancies = sampleRemarks.filter(
      (r) => r.severity === 'discrepancy'
    );
    expect(discrepancies.length).toBe(1);
    expect(discrepancies[0].fieldTitle).toBe('Father Name');
  });
});
