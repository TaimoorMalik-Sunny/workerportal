'use client';

import * as React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Plus,
  Award,
  CreditCard,
  CheckCircle2,
  Move,
  Search,
} from 'lucide-react';
import { AcademicRecord, HECApplication } from '@/types/workflow';
import { DocumentCategoryTab } from './CategoryTabBar';
import { DocumentMagnifier } from './DocumentMagnifier';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DocumentInspectionViewProps {
  application: HECApplication;
  activeTab: DocumentCategoryTab;
  onSaveRemark: (
    fieldTitle: string,
    claimedVal: string,
    comment: string
  ) => Promise<void>;
}

export function DocumentInspectionView({
  application,
  activeTab,
  onSaveRemark,
}: DocumentInspectionViewProps) {
  // Personal Documents Sub-Tab (CNIC vs Other: Nikah/Disability)
  const [personalSubTab, setPersonalSubTab] = React.useState<
    'cnic' | 'other_cert'
  >('cnic');

  // CNIC Viewer State: CNIC Back (Left) & CNIC Front (Right)
  const [cnicZoomBack, setCnicZoomBack] = React.useState(100);
  const [cnicRotateBack, setCnicRotateBack] = React.useState(0);
  const [cnicZoomFront, setCnicZoomFront] = React.useState(100);
  const [cnicRotateFront, setCnicRotateFront] = React.useState(0);

  // Other Certificate State
  const [otherCertZoom, setOtherCertZoom] = React.useState(100);
  const [otherCertRotate, setOtherCertRotate] = React.useState(0);

  // Academic Split Screen State
  const [academicDocSubTab, setAcademicDocSubTab] = React.useState<
    'marksheet' | 'degree' | 'provisional'
  >('marksheet');
  const [academicZoom, setAcademicZoom] = React.useState(100);
  const [academicRotate, setAcademicRotate] = React.useState(0);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = React.useState(false);
  const [loupeZoomLevel, setLoupeZoomLevel] = React.useState(2.5);

  // Inline remark adding state
  const [activeRemarkField, setActiveRemarkField] = React.useState<
    string | null
  >(null);
  const [remarkText, setRemarkText] = React.useState('');
  const [isSubmittingRemark, setIsSubmittingRemark] = React.useState(false);

  // Find corresponding academic record based on tab
  const activeRecord: AcademicRecord | undefined = React.useMemo(() => {
    switch (activeTab) {
      case 'SSC':
        return application.academicRecords.find((r) => r.level === 'SSC');
      case 'HSSC':
        return application.academicRecords.find((r) => r.level === 'HSSC');
      case 'DEGREE_14':
        return application.academicRecords.find(
          (r) => r.level === 'DEGREE_14_YEAR'
        );
      case 'DEGREE_16':
        return application.academicRecords.find(
          (r) => r.level === 'DEGREE_16_YEAR'
        );
      default:
        return undefined;
    }
  }, [activeTab, application.academicRecords]);

  const handleInlineRemarkSubmit = async (
    fieldTitle: string,
    claimedVal: string
  ) => {
    if (!remarkText.trim()) return;
    setIsSubmittingRemark(true);
    try {
      await onSaveRemark(fieldTitle, claimedVal, remarkText.trim());
      setActiveRemarkField(null);
      setRemarkText('');
    } finally {
      setIsSubmittingRemark(false);
    }
  };

  /* =========================================================================
     1. Personal Documents View (CNIC Back Left, CNIC Front Right, Other Certs)
     ========================================================================= */
  if (activeTab === 'PERSONAL_DOCUMENTS') {
    return (
      <div className="space-y-4">
        {/* Header & Sub-Tab Switcher */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-orbitron flex items-center gap-2 text-base font-bold text-[#000000]">
              <CreditCard className="size-4 text-[#13c2b6]" />
              <span>Personal Documents Verification</span>
            </h3>
            <p className="text-xs text-[#666666]">
              High-resolution dual-side scan comparison against NADRA citizen
              repository
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-[10px] border border-[#e5e5e5] bg-white p-0.5 shadow-2xs">
              <Button
                size="sm"
                variant={personalSubTab === 'cnic' ? 'default' : 'ghost'}
                onClick={() => setPersonalSubTab('cnic')}
                className={`h-7 rounded-[8px] px-3 text-xs font-semibold ${
                  personalSubTab === 'cnic'
                    ? 'bg-[#13c2b6] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#000000]'
                }`}
              >
                CNIC (Dual-Side)
              </Button>
              <Button
                size="sm"
                variant={personalSubTab === 'other_cert' ? 'default' : 'ghost'}
                onClick={() => setPersonalSubTab('other_cert')}
                className={`h-7 rounded-[8px] px-3 text-xs font-semibold ${
                  personalSubTab === 'other_cert'
                    ? 'bg-[#13c2b6] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#000000]'
                }`}
              >
                Other: Nikah / Disability Certificate
              </Button>
            </div>
            <Badge className="font-orbitron border-[#13c2b6]/30 bg-[#13c2b6]/10 text-xs font-bold text-[#009588]">
              CNIC: {application.personalDetails.cnic}
            </Badge>
          </div>
        </div>

        {personalSubTab === 'cnic' ? (
          /* Two-column card layout displaying CNIC Back (left) and CNIC Front (right) */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 1. CNIC BACK (LEFT) */}
            <Card className="overflow-hidden border-slate-200 bg-white shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    CNIC Back (Address & Security Chip)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Left Card
                  </Badge>
                </div>

                {/* Interactive Zoom/Rotate & Magnifier Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={isMagnifierActive ? 'default' : 'outline'}
                    className={`h-7 gap-1 px-2 text-[11px] font-semibold transition-all ${
                      isMagnifierActive
                        ? 'border-none bg-[#13c2b6] text-white shadow-xs hover:bg-[#0fb2a6]'
                        : 'border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                    title="Toggle Forensic Loupe Magnifier"
                  >
                    <Search className="size-3" />
                    <span>Loupe: {isMagnifierActive ? 'Active' : 'Off'}</span>
                  </Button>

                  {/* Zoom Intensity Selector (shown when loupe is active) */}
                  {isMagnifierActive && (
                    <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                      {[2, 2.5, 3, 4].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setLoupeZoomLevel(z)}
                          title={`Set Loupe Zoom Intensity to ${z}x`}
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-all ${
                            loupeZoomLevel === z
                              ? 'bg-[#13c2b6] text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {z}x
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() =>
                      setCnicZoomBack((z) => Math.min(220, z + 20))
                    }
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() => setCnicZoomBack((z) => Math.max(60, z - 20))}
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() => setCnicRotateBack((r) => (r + 90) % 360)}
                    title="Rotate 90°"
                  >
                    <RotateCw className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] text-slate-600"
                    onClick={() => {
                      setCnicZoomBack(100);
                      setCnicRotateBack(0);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-slate-900/5 p-4">
                <DocumentMagnifier
                  documentTitle="CNIC Back • Address & EMV Microchip Scan"
                  isExternalActive={isMagnifierActive}
                  zoomLevel={loupeZoomLevel}
                  onZoomChange={setLoupeZoomLevel}
                  previewWidth={320}
                  previewHeight={210}
                >
                  <div
                    style={{
                      transform: `scale(${cnicZoomBack / 100}) rotate(${cnicRotateBack}deg)`,
                      transition: 'transform 0.2s ease-out',
                    }}
                    className="relative w-full max-w-sm cursor-grab overflow-hidden rounded-xl border-2 border-emerald-900/50 bg-gradient-to-br from-slate-900 to-emerald-950 p-5 text-white shadow-lg select-none active:cursor-grabbing"
                  >
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="font-mono text-[9px] text-emerald-300/80 uppercase">
                          Current Address
                        </div>
                        <div className="text-[11px] font-medium text-white/95">
                          House 142, Street 18, Sector G-10/4, Islamabad,
                          Pakistan
                        </div>
                      </div>

                      <div>
                        <div className="font-mono text-[9px] text-emerald-300/80 uppercase">
                          Permanent Address
                        </div>
                        <div className="text-[11px] font-medium text-white/95">
                          Village & Post Office Daultala, Tehsil Gujar Khan,
                          District Rawalpindi
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-emerald-800/60 pt-2 font-mono text-[10px]">
                        <div>
                          <span className="text-emerald-400">Issue: </span>
                          <span>2021-04-15</span>
                        </div>
                        <div>
                          <span className="text-emerald-400">Expiry: </span>
                          <span>
                            {application.personalDetails.dateOfExpiry}
                          </span>
                        </div>
                      </div>

                      {/* Simulated Smart Card Security Microchip */}
                      <div className="flex h-8 items-center justify-between rounded border border-amber-400/40 bg-amber-500/20 px-3 font-mono text-[9px] text-amber-200">
                        <span>EMV SECURITY CHIP</span>
                        <span>PK-NADRA-SECURE-884</span>
                      </div>
                    </div>
                  </div>
                </DocumentMagnifier>
              </CardContent>
            </Card>

            {/* 2. CNIC FRONT (RIGHT) */}
            <Card className="overflow-hidden border-slate-200 bg-white shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    CNIC Front (Identity & Bio-Photo)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Right Card
                  </Badge>
                </div>

                {/* Interactive Zoom/Rotate & Magnifier Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={isMagnifierActive ? 'default' : 'outline'}
                    className={`h-7 gap-1 px-2 text-[11px] font-semibold transition-all ${
                      isMagnifierActive
                        ? 'border-none bg-[#13c2b6] text-white shadow-xs hover:bg-[#0fb2a6]'
                        : 'border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                    title="Toggle Forensic Loupe Magnifier"
                  >
                    <Search className="size-3" />
                    <span>Loupe: {isMagnifierActive ? 'Active' : 'Off'}</span>
                  </Button>

                  {/* Zoom Intensity Selector (shown when loupe is active) */}
                  {isMagnifierActive && (
                    <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                      {[2, 2.5, 3, 4].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setLoupeZoomLevel(z)}
                          title={`Set Loupe Zoom Intensity to ${z}x`}
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-all ${
                            loupeZoomLevel === z
                              ? 'bg-[#13c2b6] text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {z}x
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() =>
                      setCnicZoomFront((z) => Math.min(220, z + 20))
                    }
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() =>
                      setCnicZoomFront((z) => Math.max(60, z - 20))
                    }
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() => setCnicRotateFront((r) => (r + 90) % 360)}
                    title="Rotate 90°"
                  >
                    <RotateCw className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] text-slate-600"
                    onClick={() => {
                      setCnicZoomFront(100);
                      setCnicRotateFront(0);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-slate-900/5 p-4">
                <DocumentMagnifier
                  documentTitle="CNIC Front • Identity & Bio Photo Scan"
                  isExternalActive={isMagnifierActive}
                  zoomLevel={loupeZoomLevel}
                  onZoomChange={setLoupeZoomLevel}
                  previewWidth={320}
                  previewHeight={210}
                >
                  <div
                    style={{
                      transform: `scale(${cnicZoomFront / 100}) rotate(${cnicRotateFront}deg)`,
                      transition: 'transform 0.2s ease-out',
                    }}
                    className="relative w-full max-w-sm cursor-grab overflow-hidden rounded-xl border-2 border-emerald-900/50 bg-gradient-to-br from-emerald-950 to-slate-900 p-5 text-white shadow-lg select-none active:cursor-grabbing"
                  >
                    {/* Government crest simulation */}
                    <div className="flex items-start justify-between border-b border-emerald-700/50 pb-2">
                      <div>
                        <div className="font-mono text-[10px] tracking-widest text-emerald-300 uppercase">
                          Islamic Republic of Pakistan
                        </div>
                        <div className="text-xs font-bold tracking-wide text-white">
                          National Identity Card
                        </div>
                      </div>
                      <div className="rounded bg-emerald-900/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-400">
                        NADRA
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex size-20 flex-col items-center justify-center rounded border border-emerald-500/30 bg-white/10 p-1 text-center shadow-inner">
                        <span className="text-lg font-bold text-emerald-300">
                          {application.personalDetails.fullName
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        <span className="font-mono text-[8px] text-emerald-200/80">
                          Bio Photo
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div>
                          <div className="text-[9px] text-emerald-300/80 uppercase">
                            Name
                          </div>
                          <div className="text-sm font-bold text-white">
                            {application.personalDetails.fullName}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] text-emerald-300/80 uppercase">
                            Father Name
                          </div>
                          <div className="font-semibold text-white/90">
                            {application.personalDetails.fatherName}
                          </div>
                        </div>

                        <div className="flex gap-4 font-mono text-[11px]">
                          <div>
                            <span className="text-[9px] text-emerald-300/80 uppercase">
                              Gender
                            </span>
                            <div className="text-white">
                              {application.personalDetails.gender}
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-emerald-300/80 uppercase">
                              DOB
                            </span>
                            <div className="text-white">
                              {application.personalDetails.dateOfBirth}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-emerald-800/60 pt-2 font-mono text-xs font-bold tracking-wider text-emerald-300">
                      CNIC: {application.personalDetails.cnic}
                    </div>
                  </div>
                </DocumentMagnifier>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Other: Nikah or Disability Certificate View */
          <Card className="overflow-hidden border-slate-200 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="text-xs font-bold text-slate-800">
                Official Supporting Document: Registered Nikah Nama / Nadra
                Verification Slip
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={isMagnifierActive ? 'default' : 'outline'}
                  className={`h-7 gap-1 px-2 text-[11px] font-semibold transition-all ${
                    isMagnifierActive
                      ? 'border-none bg-[#13c2b6] text-white shadow-xs hover:bg-[#0fb2a6]'
                      : 'border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                  title="Toggle Forensic Loupe Magnifier"
                >
                  <Search className="size-3" />
                  <span>Loupe: {isMagnifierActive ? 'Active' : 'Off'}</span>
                </Button>

                {/* Zoom Intensity Selector (shown when loupe is active) */}
                {isMagnifierActive && (
                  <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                    {[2, 2.5, 3, 4].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setLoupeZoomLevel(z)}
                        title={`Set Loupe Zoom Intensity to ${z}x`}
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-all ${
                          loupeZoomLevel === z
                            ? 'bg-[#13c2b6] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setOtherCertZoom((z) => Math.min(220, z + 20))}
                  title="Zoom In"
                >
                  <ZoomIn className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setOtherCertZoom((z) => Math.max(60, z - 20))}
                  title="Zoom Out"
                >
                  <ZoomOut className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setOtherCertRotate((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-slate-600"
                  onClick={() => {
                    setOtherCertZoom(100);
                    setOtherCertRotate(0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>

            <CardContent className="relative flex min-h-[440px] items-center justify-center overflow-hidden bg-slate-900/5 p-6">
              <DocumentMagnifier
                documentTitle="Supporting Certificate • Nikah / Nadra Record"
                isExternalActive={isMagnifierActive}
                zoomLevel={loupeZoomLevel}
                onZoomChange={setLoupeZoomLevel}
                previewWidth={340}
                previewHeight={220}
              >
                <div
                  style={{
                    transform: `scale(${otherCertZoom / 100}) rotate(${otherCertRotate}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                  className="w-full max-w-lg cursor-grab space-y-4 rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md select-none active:cursor-grabbing"
                >
                  <div className="border-b-2 border-slate-900 pb-3 text-center">
                    <div className="font-serif text-xs font-black tracking-widest text-[#0a1630] uppercase">
                      Government of the Punjab / ICT Administration
                    </div>
                    <div className="font-serif text-base font-bold text-slate-900 uppercase">
                      Official Certificate of Marriage Registration (Nikah Nama)
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      Registration No: NK-2024-884102 • Union Council G-10/4,
                      Islamabad
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="font-medium text-slate-500">
                        Groom / Applicant Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {application.personalDetails.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="font-medium text-slate-500">
                        Father Name:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {application.personalDetails.fatherName}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="font-medium text-slate-500">
                        National CNIC:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {application.personalDetails.cnic}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="font-medium text-slate-500">
                        Nikah Khawan / Registrar:
                      </span>
                      <span className="font-semibold text-slate-800">
                        Qari Muhammad Aslam (License # 441)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="size-4" />
                      <span className="font-semibold">
                        Union Council Stamp Verified
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      Verified Date: 2024-06-12
                    </div>
                  </div>
                </div>
              </DocumentMagnifier>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* =========================================================================
     2. Academic Documents (50/50 Split-Screen Inspection View)
     ========================================================================= */
  if (!activeRecord) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">
          No academic qualification record attached for this category.
        </p>
      </div>
    );
  }

  // Structured key-value verification fields matching prompt specifications:
  // Full Name, Father Name, Degree Title, Registration / Roll No, Passing Year, Total Marks, Obtained Marks, CGPA/Division
  const academicFields = [
    { label: 'Full Name', value: application.personalDetails.fullName },
    { label: 'Father Name', value: application.personalDetails.fatherName },
    { label: 'Degree Title', value: activeRecord.degreeTitle },
    {
      label: 'Registration / Roll No',
      value: `${activeRecord.registrationNo} / Roll: ${activeRecord.rollNo}`,
    },
    { label: 'Passing Year', value: String(activeRecord.passingYear) },
    {
      label: 'Total Marks',
      value: String(activeRecord.totalMarks),
    },
    {
      label: 'Obtained Marks',
      value: String(activeRecord.obtainedMarks),
    },
    { label: 'CGPA/Division', value: activeRecord.cgpaOrDivision },
  ];

  return (
    <div
      className={`space-y-4 ${
        isFullScreen ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-6' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-orbitron flex items-center gap-2 text-base font-bold text-[#000000]">
            <Award className="size-4 text-[#13c2b6]" />
            <span>{activeRecord.levelLabel} Verification</span>
          </h3>
          <p className="text-xs text-[#666666]">
            Side-by-side comparative inspection between Claimed Database Values
            (Left) and High-Res Official Scan (Right)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="h-8 gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {isFullScreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
          <span>
            {isFullScreen ? 'Exit Full Screen' : 'Full Screen Compare'}
          </span>
        </Button>
      </div>

      {/* 50/50 Split-Screen Inspection View */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {/* Left Pane: Structured Extracted & Claimed Text Data Table */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-2xs">
          <CardHeader className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Left Pane: Claimed Text Data
              </span>
              <Badge
                variant="outline"
                className="bg-white font-mono text-[10px] font-semibold text-slate-700"
              >
                Key-Value Audit Table
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="divide-y divide-slate-100 p-0 text-xs">
            {academicFields.map((field) => {
              const isEditing = activeRemarkField === field.label;
              const existingRemarks = application.remarks.filter(
                (r) => r.fieldTitle.toLowerCase() === field.label.toLowerCase()
              );

              return (
                <div
                  key={field.label}
                  className={`p-3.5 transition-colors ${
                    existingRemarks.length > 0
                      ? 'bg-amber-50/60'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        {field.label}
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {field.value}
                      </div>

                      {/* Display attached remarks if any */}
                      {existingRemarks.map((rem) => (
                        <div
                          key={rem.id}
                          className="mt-1.5 space-y-0.5 rounded-lg border border-amber-300 bg-amber-100/80 p-2 text-xs font-medium text-amber-950 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                            <span>
                              Remark by {rem.authorName} ({rem.authorRole})
                            </span>
                            <span>
                              {new Date(rem.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>&ldquo;{rem.comment}&rdquo;</div>
                        </div>
                      ))}
                    </div>

                    {/* Inline Add Remark / Flag Toggle */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (isEditing) {
                          setActiveRemarkField(null);
                        } else {
                          setActiveRemarkField(field.label);
                          setRemarkText('');
                        }
                      }}
                      className="h-7 shrink-0 gap-1 border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <Plus className="size-3" />
                      <span>{isEditing ? 'Cancel' : 'Add Remark / Flag'}</span>
                    </Button>
                  </div>

                  {/* Inline Remark Input Toggle Box */}
                  {isEditing && (
                    <div className="mt-2.5 space-y-2 border-t border-slate-200 pt-2.5">
                      <Input
                        placeholder={`Enter observation for ${field.label} (e.g. Total marks on transcript is 620 instead of 650)...`}
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        className="h-8 border-slate-300 bg-white text-xs focus:border-[#13c2b6]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveRemarkField(null)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleInlineRemarkSubmit(field.label, field.value)
                          }
                          disabled={!remarkText.trim() || isSubmittingRemark}
                          className="h-7 rounded-[8px] bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0fb2a6]"
                        >
                          {isSubmittingRemark ? 'Saving...' : 'Save Remark'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Pane: High-Resolution Scanned Document Viewer */}
        <Card className="sticky top-44 overflow-hidden border-slate-200 bg-white shadow-2xs">
          <CardHeader className="space-y-2.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Right Pane: Scanned Document Viewer
              </span>
              {/* Document Sub-tabs: Marksheet / Transcript, Degree Certificate, Provisional Certificate */}
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                <Button
                  size="sm"
                  variant={
                    academicDocSubTab === 'marksheet' ? 'default' : 'ghost'
                  }
                  onClick={() => setAcademicDocSubTab('marksheet')}
                  className={`h-6 px-2 text-[10px] font-semibold ${
                    academicDocSubTab === 'marksheet'
                      ? 'bg-[#13c2b6] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Marksheet / Transcript
                </Button>
                <Button
                  size="sm"
                  variant={academicDocSubTab === 'degree' ? 'default' : 'ghost'}
                  onClick={() => setAcademicDocSubTab('degree')}
                  className={`h-6 px-2 text-[10px] font-semibold ${
                    academicDocSubTab === 'degree'
                      ? 'bg-[#13c2b6] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Degree Certificate
                </Button>
                <Button
                  size="sm"
                  variant={
                    academicDocSubTab === 'provisional' ? 'default' : 'ghost'
                  }
                  onClick={() => setAcademicDocSubTab('provisional')}
                  className={`h-6 px-2 text-[10px] font-semibold ${
                    academicDocSubTab === 'provisional'
                      ? 'bg-[#13c2b6] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Provisional Certificate
                </Button>
              </div>
            </div>

            {/* Canvas Zoom & Rotate Controls */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                <Move className="size-3 text-slate-400" />
                <span>
                  Zoom: {academicZoom}% | Rotation: {academicRotate}°
                </span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={isMagnifierActive ? 'default' : 'outline'}
                  className={`h-7 gap-1 px-2 text-[11px] font-semibold transition-all ${
                    isMagnifierActive
                      ? 'border-none bg-[#13c2b6] text-white shadow-xs hover:bg-[#0fb2a6]'
                      : 'border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                  title="Toggle Forensic Loupe Magnifier"
                >
                  <Search className="size-3" />
                  <span>Loupe: {isMagnifierActive ? 'Active' : 'Off'}</span>
                </Button>

                {/* Zoom Intensity Selector (shown when loupe is active) */}
                {isMagnifierActive && (
                  <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                    {[2, 2.5, 3, 4].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setLoupeZoomLevel(z)}
                        title={`Set Loupe Zoom Intensity to ${z}x`}
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-all ${
                          loupeZoomLevel === z
                            ? 'bg-[#13c2b6] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setAcademicZoom((z) => Math.min(240, z + 20))}
                  title="Zoom In (+)"
                >
                  <ZoomIn className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setAcademicZoom((z) => Math.max(50, z - 20))}
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setAcademicRotate((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-slate-600"
                  onClick={() => {
                    setAcademicZoom(100);
                    setAcademicRotate(0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* High-Resolution Document Canvas */}
          <CardContent className="relative flex min-h-[540px] items-center justify-center overflow-hidden bg-slate-900/5 p-4">
            <DocumentMagnifier
              documentTitle={`${activeRecord.boardOrUniversity} • ${academicDocSubTab === 'marksheet' ? 'Official Transcript' : academicDocSubTab === 'degree' ? 'Degree Certificate' : 'Provisional Certificate'}`}
              isExternalActive={isMagnifierActive}
              zoomLevel={loupeZoomLevel}
              onZoomChange={setLoupeZoomLevel}
              previewWidth={360}
              previewHeight={230}
            >
              <div
                style={{
                  transform: `scale(${academicZoom / 100}) rotate(${academicRotate}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="relative w-full max-w-md cursor-grab space-y-4 rounded-xl border-2 border-slate-300 bg-white p-6 text-slate-800 shadow-md select-none active:cursor-grabbing"
              >
                {/* Official Academic Watermark */}
                <div className="space-y-1 border-b-2 border-slate-900 pb-3 text-center">
                  <div className="font-serif text-xs font-black tracking-widest text-[#0a1630] uppercase">
                    {activeRecord.boardOrUniversity}
                  </div>
                  <div className="font-serif text-sm font-bold text-slate-900 uppercase">
                    {academicDocSubTab === 'marksheet'
                      ? 'Official Transcript & Detailed Marks Certificate'
                      : academicDocSubTab === 'degree'
                        ? 'Certificate of Academic Degree'
                        : 'Provisional Certificate of Completion'}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    Gazette Registration ID: {activeRecord.registrationNo} •
                    Roll: {activeRecord.rollNo}
                  </div>
                </div>

                {/* Student Credential Body */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span className="font-medium text-slate-500">
                      Candidate Name:
                    </span>
                    <span className="font-bold text-slate-900">
                      {application.personalDetails.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span className="font-medium text-slate-500">
                      Father Name:
                    </span>
                    <span className="font-bold text-slate-900">
                      {application.personalDetails.fatherName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span className="font-medium text-slate-500">
                      Target Degree:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {activeRecord.degreeTitle}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span className="font-medium text-slate-500">
                      Passing Year:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeRecord.passingYear}
                    </span>
                  </div>

                  {academicDocSubTab === 'marksheet' ? (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between font-mono text-[11px] font-bold text-slate-800">
                        <span>Total Marks: {activeRecord.totalMarks}</span>
                        <span>Obtained: {activeRecord.obtainedMarks}</span>
                        <span className="text-emerald-700">
                          CGPA: {activeRecord.cgpaOrDivision}
                        </span>
                      </div>

                      <div className="rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[10px]">
                        <div className="font-bold text-slate-700">
                          Core Subjects & Grade Points:
                        </div>
                        <div className="mt-1 space-y-0.5 text-slate-600">
                          {activeRecord.majorSubjects.map((sub) => (
                            <div key={sub} className="flex justify-between">
                              <span>• {sub}</span>
                              <span className="font-semibold text-emerald-800">
                                GRADE A / 4.0
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-emerald-900/20 bg-emerald-50/30 p-3 text-center">
                      <p className="font-serif text-xs text-slate-700 italic">
                        &ldquo;Has successfully completed all academic
                        requirements prescribed by the Syndicate & Academic
                        Council.&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Official Controller Endorsement & QR Stamp */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[10px]">
                  <div className="space-y-0.5">
                    <div className="font-serif font-bold text-slate-800">
                      CONTROLLER OF EXAMINATIONS
                    </div>
                    <div className="font-mono text-emerald-800">
                      Gazette Seal: VERIFIED-PASS
                    </div>
                  </div>

                  <div className="flex size-12 flex-col items-center justify-center rounded border border-slate-300 bg-slate-50 p-1 text-center font-mono text-[8px] font-bold text-slate-700 shadow-2xs">
                    <span>[QR SEAL]</span>
                    <span className="text-[7px] text-emerald-700">VALID</span>
                  </div>
                </div>
              </div>
            </DocumentMagnifier>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
