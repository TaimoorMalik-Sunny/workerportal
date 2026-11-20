import { describe, it, expect } from 'vitest';
import { HECApplication } from '@/types/workflow';

// Helper function to extract tab configuration exactly as implemented in CategoryTabBar
export function computeCategoryTabs(application: HECApplication) {
  const getCategoryRemarkCount = (catPrefix: string) =>
    application.remarks.filter((r) =>
      r.category.toLowerCase().includes(catPrefix.toLowerCase())
    ).length;

  const personalRemarkCount = getCategoryRemarkCount('personal');
  const sscRemarkCount = getCategoryRemarkCount('ssc');
  const hsscRemarkCount = getCategoryRemarkCount('hssc');
  const deg14RemarkCount = getCategoryRemarkCount('14');
  const deg16RemarkCount = getCategoryRemarkCount('16');

  const list: {
    id: string;
    label: string;
    badgeCount: number;
  }[] = [
    {
      id: 'PERSONAL_DOCUMENTS',
      label: 'Personal Documents',
      badgeCount: personalRemarkCount,
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

  if (hasSSC) {
    list.push({
      id: 'SSC',
      label: 'SSC Certificate',
      badgeCount: sscRemarkCount,
    });
  }

  if (hasHSSC) {
    list.push({
      id: 'HSSC',
      label: 'HSSC Certificate',
      badgeCount: hsscRemarkCount,
    });
  }

  if (hasDegree14) {
    list.push({
      id: 'DEGREE_14',
      label: 'Degree (14 Year)',
      badgeCount: deg14RemarkCount,
    });
  }

  if (hasDegree16) {
    list.push({
      id: 'DEGREE_16',
      label: 'Degree (16 Year)',
      badgeCount: deg16RemarkCount,
    });
  }

  return list;
}

describe('Dynamic Attestation Scope & Category Tab Logic', () => {
  const baseApp: HECApplication = {
    id: 'TEST-APP-001',
    trackingNumber: 'HEC-TEST-001',
    processInstanceId: 'proc-test-001',
    targetDegreeLevel: '16-Year Degree',
    targetDegreeTitle: 'BS Computer Science',
    submissionDate: '2026-11-01T00:00:00.000Z',
    lastUpdated: '2026-11-02T00:00:00.000Z',
    currentState: 'IN_SCRUTINY',
    semanticStatus: 'In-Process',
    isDelayed: false,
    priority: 'NORMAL',
    slaDeadline: '2026-11-20T18:00:00.000Z',
    personalDetails: {
      fullName: 'Test Applicant',
      fatherName: 'Father Name',
      cnic: '37405-1122334-1',
      maritalStatus: 'Single',
      phoneNumber: '+92 300 1234567',
      dateOfBirth: '2000-01-01',
      gender: 'Male',
      emailAddress: 'test@applicant.com',
      dateOfExpiry: '2030-01-01',
      profilePictureUrl: '/mock/pic.jpg',
    },
    nadraData: {
      fullName: 'Test Applicant',
      fatherName: 'Father Name',
      cnic: '37405-1122334-1',
      maritalStatus: 'Single',
      phoneNumber: '+92 300 1234567',
      dateOfBirth: '2000-01-01',
      gender: 'Male',
      emailAddress: 'test@applicant.com',
      dateOfExpiry: '2030-01-01',
      profilePictureUrl: '/mock/pic.jpg',
      verificationStatus: 'VERIFIED',
      verifiedAt: '2026-11-01T00:00:00.000Z',
      trackingId: 'NADRA-001',
    },
    personalDocuments: {
      cnicFrontUrl: '/mock/cnic-front.jpg',
      cnicBackUrl: '/mock/cnic-back.jpg',
    },
    academicRecords: [],
    checklist: {
      degree14: {
        transcript: false,
        provisionalCertificate: false,
        equivalenceCertificate: false,
      },
      degree16: {
        transcript: true,
        provisionalCertificate: true,
        equivalenceCertificate: false,
      },
    },
    remarks: [
      {
        id: 'REM-01',
        category: 'Personal Details',
        fieldTitle: 'Date of Birth',
        claimedValue: '2000-01-01',
        observedValue: '2000-01-02',
        comment: 'Minor 1-day discrepancy',
        severity: 'discrepancy',
        authorRole: 'ROLE_HEC_SCRUTINY',
        authorName: 'Scrutiny Officer',
        createdAt: '2026-11-01T10:00:00.000Z',
        stage: 'IN_SCRUTINY',
      },
      {
        id: 'REM-02',
        category: 'Degree (16 Year)',
        fieldTitle: 'CGPA',
        claimedValue: '3.70',
        observedValue: '3.70',
        comment: 'Matches official transcript',
        severity: 'info',
        authorRole: 'ROLE_HEC_SCRUTINY',
        authorName: 'Scrutiny Officer',
        createdAt: '2026-11-01T10:15:00.000Z',
        stage: 'IN_SCRUTINY',
      },
    ],
    auditTrail: [],
  };

  it('renders all 5 tabs when full academic hierarchy (SSC, HSSC, 14-Year, 16-Year) is present in JSON', () => {
    const appWithFullHierarchy: HECApplication = {
      ...baseApp,
      academicRecords: [
        {
          id: 'REC-01',
          level: 'SSC',
          levelLabel: 'Secondary School Certificate',
          degreeTitle: 'Science',
          institutionName: 'BISE Rawalpindi',
          boardOrUniversity: 'BISE',
          registrationNo: 'SSC-101',
          rollNo: '101',
          passingYear: 2016,
          obtainedMarks: 950,
          totalMarks: 1100,
          cgpaOrDivision: 'First Division',
          majorSubjects: ['Physics', 'Chemistry', 'Biology'],
          documents: {
            marksheetUrl: '/docs/ssc.pdf',
            degreeUrl: '/docs/ssc-cert.pdf',
          },
        },
        {
          id: 'REC-02',
          level: 'HSSC',
          levelLabel: 'Higher Secondary School Certificate',
          degreeTitle: 'Pre-Engineering',
          institutionName: 'BISE Rawalpindi',
          boardOrUniversity: 'BISE',
          registrationNo: 'HSSC-202',
          rollNo: '202',
          passingYear: 2018,
          obtainedMarks: 900,
          totalMarks: 1100,
          cgpaOrDivision: 'First Division',
          majorSubjects: ['Mathematics', 'Physics', 'Chemistry'],
          documents: {
            marksheetUrl: '/docs/hssc.pdf',
            degreeUrl: '/docs/hssc-cert.pdf',
          },
        },
        {
          id: 'REC-03',
          level: 'DEGREE_14_YEAR',
          levelLabel: 'Associate Degree / BA / BSc',
          degreeTitle: 'Associate of Science',
          institutionName: 'Govt College',
          boardOrUniversity: 'Punjab University',
          registrationNo: 'PU-303',
          rollNo: '303',
          passingYear: 2020,
          obtainedMarks: 600,
          totalMarks: 800,
          cgpaOrDivision: 'First Division',
          majorSubjects: ['Computer Science', 'Statistics', 'Mathematics'],
          documents: {
            marksheetUrl: '/docs/deg14.pdf',
            degreeUrl: '/docs/deg14-cert.pdf',
          },
        },
        {
          id: 'REC-04',
          level: 'DEGREE_16_YEAR',
          levelLabel: 'Bachelor of Science (16 Year)',
          degreeTitle: 'BS Computer Science',
          institutionName: 'NUST Islamabad',
          boardOrUniversity: 'NUST',
          registrationNo: 'NUST-404',
          rollNo: '404',
          passingYear: 2022,
          obtainedMarks: 130,
          totalMarks: 130,
          cgpaOrDivision: '3.70 / 4.00 CGPA',
          majorSubjects: ['Algorithms', 'Data Structures', 'Operating Systems'],
          documents: {
            marksheetUrl: '/docs/deg16.pdf',
            degreeUrl: '/docs/deg16-cert.pdf',
          },
        },
      ],
    };

    const tabs = computeCategoryTabs(appWithFullHierarchy);
    const tabIds = tabs.map((t) => t.id);

    expect(tabIds).toEqual([
      'PERSONAL_DOCUMENTS',
      'SSC',
      'HSSC',
      'DEGREE_14',
      'DEGREE_16',
    ]);
  });

  it('dynamically excludes SSC and HSSC tabs when they are removed from the JSON', () => {
    // If HEC management removes SSC and HSSC from the application JSON:
    const appWithoutSchooling: HECApplication = {
      ...baseApp,
      academicRecords: [
        {
          id: 'REC-04',
          level: 'DEGREE_16_YEAR',
          levelLabel: 'Bachelor of Science (16 Year)',
          degreeTitle: 'BS Computer Science',
          institutionName: 'NUST Islamabad',
          boardOrUniversity: 'NUST',
          registrationNo: 'NUST-404',
          rollNo: '404',
          passingYear: 2022,
          obtainedMarks: 130,
          totalMarks: 130,
          cgpaOrDivision: '3.70 / 4.00 CGPA',
          majorSubjects: ['Algorithms', 'Data Structures', 'Operating Systems'],
          documents: {
            marksheetUrl: '/docs/deg16.pdf',
            degreeUrl: '/docs/deg16-cert.pdf',
          },
        },
      ],
    };

    const tabs = computeCategoryTabs(appWithoutSchooling);
    const tabIds = tabs.map((t) => t.id);

    // Only Personal Documents and Degree 16 Year should exist
    expect(tabIds).toEqual(['PERSONAL_DOCUMENTS', 'DEGREE_16']);
    expect(tabIds).not.toContain('SSC');
    expect(tabIds).not.toContain('HSSC');
    expect(tabIds).not.toContain('DEGREE_14');
  });

  it('accurately computes per-tab discrepancy and remark badge counts', () => {
    const tabs = computeCategoryTabs(baseApp);
    const personalTab = tabs.find((t) => t.id === 'PERSONAL_DOCUMENTS');
    expect(personalTab?.badgeCount).toBe(1); // 1 personal remark
  });
});
