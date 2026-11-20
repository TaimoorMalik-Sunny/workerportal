'use client';

import * as React from 'react';
import {
  User,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Calendar,
  Phone,
  Mail,
  Heart,
  Clock,
  Sparkles,
} from 'lucide-react';
import { HECApplication } from '@/types/workflow';
import { getPersonalMismatches } from '@/services/workflowEngine';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StickyPersonalComparisonProps {
  application: HECApplication;
  onAddRemark: (
    fieldTitle: string,
    claimedValue: string,
    observedValue?: string
  ) => void;
  onNadraRefresh: () => void;
  isRefreshingNadra?: boolean;
}

interface ActiveFieldRemarkDialog {
  fieldTitle: string;
  claimedValue: string;
  observedValue?: string;
}

export function StickyPersonalComparison({
  application,
  onAddRemark,
  onNadraRefresh,
  isRefreshingNadra = false,
}: StickyPersonalComparisonProps) {
  const mismatches = React.useMemo(
    () => getPersonalMismatches(application),
    [application]
  );

  const [activeRemarkModal, setActiveRemarkModal] =
    React.useState<ActiveFieldRemarkDialog | null>(null);
  const [remarkComment, setRemarkComment] = React.useState('');

  const isFieldMismatched = (field: string) =>
    mismatches.some((m) => m.field === field);

  const { personalDetails, nadraData } = application;

  const handleOpenRemarkDialog = (
    fieldTitle: string,
    claimedValue: string,
    observedValue?: string
  ) => {
    setActiveRemarkModal({
      fieldTitle,
      claimedValue,
      observedValue,
    });
    setRemarkComment(
      observedValue && observedValue !== claimedValue
        ? `Discrepancy: User claimed "${claimedValue}", but NADRA citizen repository reports "${observedValue}".`
        : ''
    );
  };

  const handleSaveRemarkDialog = () => {
    if (!activeRemarkModal || !remarkComment.trim()) return;
    onAddRemark(
      activeRemarkModal.fieldTitle,
      activeRemarkModal.claimedValue,
      remarkComment.trim()
    );
    setActiveRemarkModal(null);
    setRemarkComment('');
  };

  return (
    <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md transition-all sm:px-6">
      <div className="mx-auto max-w-7xl space-y-2.5">
        {/* Discrepancy Warning Banner if mismatches exist */}
        {mismatches.length > 0 && (
          <div className="flex flex-col items-start justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-900 shadow-2xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              <span>
                <strong>NADRA Identity Discrepancy Flagged:</strong>{' '}
                {mismatches.length} attribute mismatch
                {mismatches.length > 1 ? 'es' : ''} detected between applicant
                claim and official citizen records (
                {mismatches.map((m) => m.label).join(', ')}).
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-100 font-mono text-[10px] font-bold text-amber-900"
            >
              Scrutiny Review Required
            </Badge>
          </div>
        )}

        {/* 2 Horizontal Comparison Cards Grid */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          {/* =========================================================================
              CARD 1: User-Provided Information (With Profile Photo on the Right)
              ========================================================================= */}
          <Card className="flex flex-col justify-between border border-slate-200 bg-white p-3.5 shadow-2xs">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <User className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                  1. User-Provided Information
                </h4>
              </div>
              <Badge
                variant="secondary"
                className="bg-slate-100 font-mono text-[10px] font-semibold text-slate-700"
              >
                Applicant Claim
              </Badge>
            </div>

            {/* Content: Grid with Profile Picture on the Right */}
            <div className="mt-2.5 flex items-start justify-between gap-3">
              {/* 10 Attribute Grid */}
              <div className="grid flex-1 grid-cols-2 gap-x-2.5 gap-y-1.5 text-xs sm:grid-cols-3">
                {/* 1. Full Name */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('fullName')
                      ? 'border border-amber-300 bg-amber-50/80 ring-1 ring-amber-400/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>Full Name</span>
                    <button
                      type="button"
                      title="Attach field discrepancy remark"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'Full Name',
                          personalDetails.fullName,
                          nadraData.fullName
                        )
                      }
                      className="text-slate-400 transition-colors hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div
                    className="truncate font-bold text-slate-900"
                    title={personalDetails.fullName}
                  >
                    {personalDetails.fullName}
                  </div>
                </div>

                {/* 2. Father Name */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('fatherName')
                      ? 'border border-amber-300 bg-amber-50/80 ring-1 ring-amber-400/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      Father Name
                      {isFieldMismatched('fatherName') && (
                        <AlertTriangle className="size-2.5 text-amber-600" />
                      )}
                    </span>
                    <button
                      type="button"
                      title="Attach field discrepancy remark"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'Father Name',
                          personalDetails.fatherName,
                          nadraData.fatherName
                        )
                      }
                      className="text-slate-400 transition-colors hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div
                    className={`truncate font-bold ${
                      isFieldMismatched('fatherName')
                        ? 'font-black text-amber-950'
                        : 'text-slate-900'
                    }`}
                    title={personalDetails.fatherName}
                  >
                    {personalDetails.fatherName}
                  </div>
                </div>

                {/* 3. CNIC */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('cnic')
                      ? 'border border-amber-300 bg-amber-50/80 ring-1 ring-amber-400/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>CNIC</span>
                    <button
                      type="button"
                      title="Attach field discrepancy remark"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'CNIC',
                          personalDetails.cnic,
                          nadraData.cnic
                        )
                      }
                      className="text-slate-400 transition-colors hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div className="font-mono font-bold text-slate-900 tabular-nums">
                    {personalDetails.cnic}
                  </div>
                </div>

                {/* 4. Marital Status */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('maritalStatus')
                      ? 'border border-amber-300 bg-amber-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart className="size-2.5" /> Marital Status
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'Marital Status',
                          personalDetails.maritalStatus,
                          nadraData.maritalStatus
                        )
                      }
                      className="text-slate-400 hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div className="font-semibold text-slate-800">
                    {personalDetails.maritalStatus}
                  </div>
                </div>

                {/* 5. Phone Number */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('phoneNumber')
                      ? 'border border-amber-300 bg-amber-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="size-2.5" /> Phone
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'Phone Number',
                          personalDetails.phoneNumber,
                          nadraData.phoneNumber
                        )
                      }
                      className="text-slate-400 hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div className="truncate font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                    {personalDetails.phoneNumber}
                  </div>
                </div>

                {/* 6. Secondary Number */}
                <div className="rounded p-1 hover:bg-slate-50">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>Secondary No</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'Secondary Number',
                          personalDetails.secondaryNumber || 'None'
                        )
                      }
                      className="text-slate-400 hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div className="truncate font-mono text-[11px] font-medium text-slate-700 tabular-nums">
                    {personalDetails.secondaryNumber || '—'}
                  </div>
                </div>

                {/* 7. Date of Birth & Gender */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('dateOfBirth') ||
                    isFieldMismatched('gender')
                      ? 'border border-amber-300 bg-amber-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-2.5" /> DOB & Gender
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'DOB & Gender',
                          `${personalDetails.dateOfBirth} (${personalDetails.gender})`,
                          `${nadraData.dateOfBirth} (${nadraData.gender})`
                        )
                      }
                      className="text-slate-400 hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-slate-900 tabular-nums">
                    {personalDetails.dateOfBirth} ({personalDetails.gender[0]})
                  </div>
                </div>

                {/* 8. Email Address */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('emailAddress')
                      ? 'border border-amber-300 bg-amber-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="size-2.5" /> Email
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'Email Address',
                          personalDetails.emailAddress,
                          nadraData.emailAddress
                        )
                      }
                      className="text-slate-400 hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div
                    className="truncate text-[11px] font-semibold text-slate-800"
                    title={personalDetails.emailAddress}
                  >
                    {personalDetails.emailAddress}
                  </div>
                </div>

                {/* 9. Date of Expiry */}
                <div
                  className={`rounded p-1 transition-colors ${
                    isFieldMismatched('dateOfExpiry')
                      ? 'border border-amber-300 bg-amber-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="size-2.5" /> CNIC Expiry
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRemarkDialog(
                          'CNIC Expiry',
                          personalDetails.dateOfExpiry,
                          nadraData.dateOfExpiry
                        )
                      }
                      className="text-slate-400 hover:text-[#064E3B]"
                    >
                      <Edit3 className="size-2.5" />
                    </button>
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                    {personalDetails.dateOfExpiry}
                  </div>
                </div>
              </div>

              {/* 10. Profile Picture on the RIGHT */}
              <div className="flex size-18 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-50 p-1 text-center shadow-2xs">
                <div className="flex size-11 items-center justify-center rounded-md bg-[#064E3B] text-sm font-bold text-white shadow-inner">
                  {personalDetails.fullName.slice(0, 2).toUpperCase()}
                </div>
                <span className="mt-1 font-mono text-[8px] font-bold text-slate-500 uppercase">
                  User Photo
                </span>
              </div>
            </div>
          </Card>

          {/* =========================================================================
              CARD 2: Data From NADRA (Mirrored Grid with Profile Photo on the Right)
              ========================================================================= */}
          <Card className="flex flex-col justify-between border border-emerald-200 bg-emerald-50/20 p-3.5 shadow-2xs">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100 text-[#064E3B]">
                  <ShieldCheck className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold tracking-wide text-[#064E3B] uppercase">
                  2. Official Data From NADRA
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNadraRefresh}
                  disabled={isRefreshingNadra}
                  className="h-6 gap-1 border-emerald-300 bg-white px-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  <RefreshCw
                    className={`size-3 ${isRefreshingNadra ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh From NADRA</span>
                </Button>
                <Badge
                  className={`font-mono text-[10px] font-bold ${
                    nadraData.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {nadraData.verificationStatus}
                </Badge>
              </div>
            </div>

            {/* Content: Mirrored Grid with NADRA Profile Photo on the Right */}
            <div className="mt-2.5 flex items-start justify-between gap-3">
              {/* 10 Attribute Mirrored Grid */}
              <div className="grid flex-1 grid-cols-2 gap-x-2.5 gap-y-1.5 text-xs sm:grid-cols-3">
                {/* 1. Full Name */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    Full Name (NADRA)
                  </div>
                  <div
                    className="truncate font-bold text-slate-900"
                    title={nadraData.fullName}
                  >
                    {nadraData.fullName}
                  </div>
                </div>

                {/* 2. Father Name (Highlighted if mismatch) */}
                <div
                  className={`rounded p-1 ${
                    isFieldMismatched('fatherName')
                      ? 'border border-amber-300 bg-amber-100/90 font-bold text-amber-950'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <span>Father Name (NADRA)</span>
                    {isFieldMismatched('fatherName') && (
                      <span className="font-mono text-[9px] font-bold text-amber-700 uppercase">
                        (Mismatch)
                      </span>
                    )}
                  </div>
                  <div
                    className="truncate font-bold"
                    title={nadraData.fatherName}
                  >
                    {nadraData.fatherName}
                  </div>
                </div>

                {/* 3. CNIC */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    CNIC (Citizen Record)
                  </div>
                  <div className="font-mono font-bold text-slate-900 tabular-nums">
                    {nadraData.cnic}
                  </div>
                </div>

                {/* 4. Marital Status */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    Marital Status
                  </div>
                  <div className="font-semibold text-slate-800">
                    {nadraData.maritalStatus}
                  </div>
                </div>

                {/* 5. Phone Number */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    Registered Mobile
                  </div>
                  <div className="truncate font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                    {nadraData.phoneNumber}
                  </div>
                </div>

                {/* 6. Secondary Number */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    Secondary Mobile
                  </div>
                  <div className="truncate font-mono text-[11px] font-medium text-slate-700 tabular-nums">
                    {nadraData.secondaryNumber || '—'}
                  </div>
                </div>

                {/* 7. Date of Birth & Gender */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    DOB & Gender (NADRA)
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                    {nadraData.dateOfBirth} ({nadraData.gender[0]})
                  </div>
                </div>

                {/* 8. Email Address */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    NADRA Linked Email
                  </div>
                  <div
                    className="truncate text-[11px] font-semibold text-slate-800"
                    title={nadraData.emailAddress}
                  >
                    {nadraData.emailAddress}
                  </div>
                </div>

                {/* 9. Date of Expiry */}
                <div className="rounded p-1">
                  <div className="text-[10px] font-medium text-slate-400">
                    Biometric Expiry
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                    {nadraData.dateOfExpiry}
                  </div>
                </div>
              </div>

              {/* 10. NADRA Profile Photo on the RIGHT */}
              <div className="flex size-18 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-emerald-300 bg-emerald-100/70 p-1 text-center shadow-2xs">
                <div className="flex size-11 items-center justify-center rounded-md bg-emerald-700 text-white shadow-inner">
                  <ShieldCheck className="size-6 text-emerald-100" />
                </div>
                <span className="mt-1 font-mono text-[8px] font-bold text-emerald-900 uppercase">
                  NADRA Bio
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Field-Level Discrepancy Remark Dialog */}
      <Dialog
        open={!!activeRemarkModal}
        onOpenChange={(open) => !open && setActiveRemarkModal(null)}
      >
        <DialogContent className="max-w-md border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkles className="size-4 text-emerald-600" />
              <span>Attach Observation: {activeRemarkModal?.fieldTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record a field-level discrepancy remark against candidate personal
              credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Field:</span>
                <span className="font-bold text-slate-900">
                  {activeRemarkModal?.fieldTitle}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>User Claimed Value:</span>
                <span className="font-bold text-slate-900">
                  {activeRemarkModal?.claimedValue}
                </span>
              </div>
              {activeRemarkModal?.observedValue && (
                <div className="flex justify-between text-slate-600">
                  <span>NADRA Repository Value:</span>
                  <span className="font-bold text-amber-700">
                    {activeRemarkModal.observedValue}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                Officer Discrepancy Comment:
              </label>
              <Input
                placeholder="Enter detailed scrutiny observation..."
                value={remarkComment}
                onChange={(e) => setRemarkComment(e.target.value)}
                className="h-9 border-slate-300 text-xs focus:border-[#064E3B]"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveRemarkModal(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRemarkDialog}
              disabled={!remarkComment.trim()}
              className="bg-[#064E3B] text-xs font-semibold text-white hover:bg-[#047857]"
            >
              Attach Observation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
