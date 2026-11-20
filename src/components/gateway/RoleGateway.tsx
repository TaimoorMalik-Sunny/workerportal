'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  FileCheck2,
  GraduationCap,
  Building2,
  Stamp,
  ArrowLeftRight,
  ChevronRight,
  ShieldCheck,
  Activity,
  Lock,
  Layers,
  Sparkles,
  Building,
  User,
  CheckCircle2,
} from 'lucide-react';
import { ROLE_PROFILES } from '@/config/roles';
import { RoleType } from '@/types/workflow';
import { useAppStore } from '@/store/use-app-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RoleCardMeta {
  role: RoleType;
  slug: string;
  icon: React.ElementType;
  accentBg: string;
  iconColor: string;
  borderColor: string;
  queueCount: number;
  highlightText: string;
}

const ROLE_METAS: RoleCardMeta[] = [
  {
    role: 'ROLE_HEC_MANAGER',
    slug: 'manager',
    icon: Shield,
    accentBg: 'bg-[#13c2b6]/10 text-[#009588]',
    iconColor: 'text-[#009588]',
    borderColor: 'hover:border-[#13c2b6]',
    queueCount: 6,
    highlightText: 'Full Executive Oversight • SLA Diagnostics • All Queues',
  },
  {
    role: 'ROLE_HEC_SCRUTINY',
    slug: 'scrutiny',
    icon: FileCheck2,
    accentBg: 'bg-[#27b2d7]/15 text-[#173e81]',
    iconColor: 'text-[#27b2d7]',
    borderColor: 'hover:border-[#27b2d7]',
    queueCount: 2,
    highlightText: 'NADRA Biometrics • CNIC Inspection • Tier 1 Screening',
  },
  {
    role: 'ROLE_CONTROLLER_L1',
    slug: 'controller-l1',
    icon: GraduationCap,
    accentBg: 'bg-[#fcbb00]/15 text-[#f05100]',
    iconColor: 'text-[#f05100]',
    borderColor: 'hover:border-[#fcbb00]',
    queueCount: 2,
    highlightText: 'University Gazette Verification • Academic Record Scrutiny',
  },
  {
    role: 'ROLE_CONTROLLER_L2',
    slug: 'controller-l2',
    icon: Building2,
    accentBg: 'bg-[#87cbde]/25 text-[#0d2a55]',
    iconColor: 'text-[#0d2a55]',
    borderColor: 'hover:border-[#87cbde]',
    queueCount: 1,
    highlightText:
      'Institutional Controller Sign-Off • Official Escalation to HEC',
  },
  {
    role: 'ROLE_HEC_ATTESTATION',
    slug: 'attestation',
    icon: Stamp,
    accentBg: 'bg-[#13c2b6]/15 text-[#009588]',
    iconColor: 'text-[#13c2b6]',
    borderColor: 'hover:border-[#13c2b6]',
    queueCount: 2,
    highlightText:
      'Tamper-Proof QR Stamp • Final Equivalence Seal • Attestation',
  },
  {
    role: 'ROLE_DUAL_STAFF',
    slug: 'dual-role',
    icon: ArrowLeftRight,
    accentBg: 'bg-[#d8e6ff] text-[#173e81]',
    iconColor: 'text-[#173e81]',
    borderColor: 'hover:border-[#27b2d7]',
    queueCount: 4,
    highlightText: 'Hybrid Clearance Cell • Instant Top-Bar Workspace Switcher',
  },
];

export function RoleGateway() {
  const router = useRouter();
  const { setActiveRole, setDualRoleSubRole } = useAppStore();
  const [selectedRole, setSelectedRole] =
    React.useState<RoleType>('ROLE_HEC_MANAGER');

  const handleEnterWorkspace = (role: RoleType, slug?: string) => {
    setActiveRole(role);
    if (role === 'ROLE_DUAL_STAFF') {
      setDualRoleSubRole('ROLE_HEC_SCRUTINY');
    }
    if (role === 'ROLE_HEC_MANAGER') {
      router.push('/dashboard/manager?tab=overview');
    } else {
      router.push(`/dashboard/${slug || role}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
      {/* Official Top National Banner (CEGA Deep Navy & Cyan Accents) */}
      <header className="border-b border-[#173e81]/30 bg-[#0a1630] text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#13c2b6]/30 bg-white/10 p-1.5 shadow-inner">
                <div className="text-center leading-none font-black text-[#13c2b6]">
                  <span className="block text-[10px] tracking-widest text-white/80 uppercase">
                    Govt of
                  </span>
                  <span className="block font-serif text-xs tracking-tight text-white">
                    PAKISTAN
                  </span>
                  <span className="font-orbitron block text-[9px] font-bold tracking-wider text-[#13c2b6]">
                    HEC
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-orbitron text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Higher Education Commission, Pakistan
                  </h1>
                  <Badge
                    variant="outline"
                    className="font-orbitron hidden border-[#13c2b6]/40 bg-[#13c2b6]/20 text-[10px] font-semibold text-[#13c2b6] sm:inline-flex"
                  >
                    Official Portal
                  </Badge>
                </div>
                <p className="text-xs font-medium text-slate-300 sm:text-sm">
                  Digital Degree Verification & Attestation Ecosystem • Synapark
                  BPMN/CMMN Human-Task Gateway
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start rounded-xl border border-white/10 bg-[#0d2a55]/80 px-3.5 py-2 text-xs text-slate-200 md:self-auto">
              <div className="size-2 animate-pulse rounded-full bg-[#13c2b6]" />
              <span className="font-mono text-slate-300">Keycloak RBAC:</span>
              <span className="font-orbitron font-semibold text-white">
                Active Session Simulator
              </span>
            </div>
          </div>
        </div>

        {/* Sub-header System Health Strip */}
        <div className="border-t border-[#173e81]/40 bg-[#0d2a55] px-4 py-1.5 font-mono text-[11px] text-slate-300 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Activity className="size-3 text-[#13c2b6]" />
                <span>Synapark BPMN: Online</span>
              </span>
              <span className="hidden text-slate-500 sm:inline">•</span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <ShieldCheck className="size-3 text-[#27b2d7]" />
                <span>NADRA Bio-Gateway: Connected (42ms)</span>
              </span>
              <span className="hidden text-slate-500 md:inline">•</span>
              <span className="hidden items-center gap-1.5 md:flex">
                <Building className="size-3 text-[#87cbde]" />
                <span>University Gazette Sync: 148 Recognized HEDIs</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#13c2b6]">
                ISO 27001 Certified Security
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <Badge className="font-orbitron mb-3 border-[#13c2b6]/30 bg-[#13c2b6]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#009588] uppercase">
            <Lock className="mr-1 inline size-3 text-[#13c2b6]" /> Evaluator &
            Officer Access Gateway
          </Badge>
          <h2 className="font-orbitron text-2xl font-bold tracking-tight text-[#000000] sm:text-3xl">
            Select Your Active Portal Workspace
          </h2>
          <p className="mt-2 text-sm text-[#666666] sm:text-base">
            Simulate role-based authorization to inspect role-segregated queues,
            live SLA monitors, split-screen document comparison, and BPMN
            workflow state transitions.
          </p>
        </div>

        {/* Role Access Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ROLE_METAS.map((meta) => {
            const profile = ROLE_PROFILES[meta.role];
            const Icon = meta.icon;
            const isSelected = selectedRole === meta.role;

            return (
              <Card
                key={meta.role}
                onClick={() => setSelectedRole(meta.role)}
                className={`cega-panel-shadow relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-[#ffffff] transition-all duration-200 hover:-translate-y-1 ${
                  meta.borderColor
                } ${isSelected ? 'border-[#13c2b6] ring-2 ring-[#13c2b6]' : 'border-[#e5e5e5]'}`}
              >
                {/* Top Accent Strip */}
                <div
                  className={`h-1.5 w-full ${isSelected ? 'bg-[#13c2b6]' : 'bg-[#e5e5e5]'}`}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`rounded-xl p-2.5 ${meta.accentBg} shrink-0`}
                    >
                      <Icon className="size-6" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#e5e5e5] bg-[#f8fafc] font-mono text-[10px] font-semibold text-[#666666]"
                    >
                      {meta.role}
                    </Badge>
                  </div>

                  <CardTitle className="font-orbitron mt-2.5 flex items-center gap-1.5 text-base font-bold text-[#000000]">
                    {profile.shortTitle}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-[#666666]">
                    {profile.department}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-0">
                  <p className="text-xs leading-relaxed text-[#666666]">
                    {profile.description}
                  </p>

                  <div className="space-y-2.5 rounded-xl border border-[#e5e5e5] bg-[#f8fafc] p-3 text-xs">
                    <div className="flex items-center justify-between text-[#666666]">
                      <span className="flex items-center gap-1.5 font-medium text-[#000000]">
                        <User className="size-3.5 text-[#27b2d7]" />
                        Simulated Officer:
                      </span>
                      <span
                        className="max-w-[170px] truncate text-right font-semibold text-[#000000]"
                        title={profile.defaultUser.name}
                      >
                        {profile.defaultUser.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#666666]">
                      <span className="flex items-center gap-1.5 font-medium text-[#000000]">
                        <Layers className="size-3.5 text-[#27b2d7]" />
                        Active Queue Load:
                      </span>
                      <span className="font-orbitron inline-flex items-center gap-1 rounded-md border border-[#13c2b6]/30 bg-[#13c2b6]/10 px-2 py-0.5 text-xs font-bold text-[#009588] tabular-nums">
                        {meta.queueCount} Case
                        {meta.queueCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 border-t border-[#e5e5e5] pt-2 text-[11px] font-medium text-[#666666]">
                      <Sparkles className="size-3 shrink-0 text-[#f99c00]" />
                      <span className="truncate">{meta.highlightText}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnterWorkspace(meta.role, meta.slug);
                      }}
                      className="group h-10 w-full rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white shadow-xs hover:bg-[#0fb2a6]"
                    >
                      <span>Enter as {profile.shortTitle}</span>
                      <ChevronRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Informational Guidance Row */}
        <div className="cega-panel-shadow mt-10 rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl border border-[#13c2b6]/20 bg-[#13c2b6]/10 p-2.5 text-[#13c2b6]">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h4 className="font-orbitron text-sm font-bold text-[#000000]">
                  Multi-Stage Decoupled Workflow Simulation
                </h4>
                <p className="mt-0.5 text-xs text-[#666666]">
                  Every state mutation triggers a simulated Synapark BPMN
                  payload (`processInstanceId`, `taskId`, and `auditTrail`)
                  allowing zero-refactor transition to live backend
                  microservices.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleEnterWorkspace('ROLE_HEC_MANAGER', 'manager')
                }
                className="rounded-[10px] border-[#e5e5e5] text-xs font-semibold text-[#000000] hover:bg-[#f8fafc]"
              >
                Executive Dashboard
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleEnterWorkspace('ROLE_HEC_SCRUTINY', 'scrutiny')
                }
                className="rounded-[10px] bg-[#13c2b6] text-xs font-semibold text-white hover:bg-[#0fb2a6]"
              >
                Scrutiny Queue
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Official Institutional Footer */}
      <footer className="mt-auto border-t border-[#e5e5e5] bg-[#ffffff] py-6 text-xs text-[#666666]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-[#000000]">
              Higher Education Commission (HEC)
            </span>
            <span>• Sector H-9, Islamabad, Pakistan</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-[#666666]">
            <span>Synapark Facade: READY</span>
            <span>•</span>
            <span>NADRA API: MOCK ACTIVE</span>
            <span>•</span>
            <span>App Router v16</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
