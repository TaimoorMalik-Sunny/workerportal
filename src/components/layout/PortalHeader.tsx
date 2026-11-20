'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Stamp,
  ChevronDown,
  LogOut,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { ROLE_PROFILES } from '@/config/roles';
import { RoleType } from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PortalHeader() {
  const router = useRouter();
  const {
    activeRole,
    setActiveRole,
    dualRoleSubRole,
    setDualRoleSubRole,
    toggleSidebar,
  } = useAppStore();

  const currentProfile = ROLE_PROFILES[activeRole];

  const handleRoleSelect = (role: RoleType) => {
    setActiveRole(role);
    if (role === 'ROLE_HEC_MANAGER') {
      router.push('/dashboard/manager?tab=overview');
    } else {
      router.push(`/dashboard?role=${role}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#173e81]/30 bg-[#0a1630] text-white shadow-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu Toggle & HEC Branding */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-white hover:bg-[#173e81] lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="size-5" />
          </Button>

          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#13c2b6]/30 bg-white/10 text-xs font-bold text-[#13c2b6] shadow-inner transition-colors group-hover:bg-white/20">
              <span className="font-orbitron text-[11px] font-bold tracking-tight text-[#13c2b6]">
                HEC
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="font-orbitron block text-sm leading-tight font-bold tracking-tight text-white">
                Higher Education Commission
              </span>
              <span className="block text-[11px] leading-tight font-medium text-slate-300">
                Degree Scrutiny & Attestation Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Dual-Role Switcher (Visible when user holds Dual-Role Staff) */}
        {activeRole === 'ROLE_DUAL_STAFF' && (
          <div className="flex items-center gap-1 rounded-xl border border-[#173e81] bg-[#0d2a55] p-1 shadow-inner">
            <span className="hidden px-2 font-mono text-[11px] text-slate-300 md:inline">
              Workspace Switcher:
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDualRoleSubRole('ROLE_HEC_SCRUTINY')}
              className={`h-7 rounded-[8px] px-2.5 text-xs font-semibold transition-all ${
                dualRoleSubRole === 'ROLE_HEC_SCRUTINY'
                  ? 'bg-[#13c2b6] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-[#173e81] hover:text-white'
              }`}
            >
              <FileCheck2 className="mr-1 size-3.5" />
              Scrutiny View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDualRoleSubRole('ROLE_HEC_ATTESTATION')}
              className={`h-7 rounded-[8px] px-2.5 text-xs font-semibold transition-all ${
                dualRoleSubRole === 'ROLE_HEC_ATTESTATION'
                  ? 'bg-[#13c2b6] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-[#173e81] hover:text-white'
              }`}
            >
              <Stamp className="mr-1 size-3.5" />
              Attestation View
            </Button>
          </div>
        )}

        {/* Right: User Greeting, Role Switcher Dropdown, Gateway Return */}
        <div className="flex items-center gap-3">
          {/* User Greeting matching prompt spec: "Greeting's {Name}" */}
          <div className="hidden text-right xl:block">
            <p className="text-xs font-medium text-slate-300">
              Greeting&apos;s,{' '}
              <span className="font-orbitron font-bold text-white">
                {currentProfile.defaultUser.name}
              </span>
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              {currentProfile.defaultUser.designation} •{' '}
              {currentProfile.defaultUser.employeeId}
            </p>
          </div>

          {/* Active Role Badge & Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#173e81] bg-[#0d2a55] px-3 text-xs font-medium text-white shadow-xs hover:bg-[#173e81]">
              <div className="size-2 rounded-full bg-[#13c2b6]" />
              <span className="font-orbitron max-w-[130px] truncate text-xs font-bold sm:max-w-none">
                {currentProfile.shortTitle}
              </span>
              <ChevronDown className="size-3.5 text-[#13c2b6]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 border-[#e5e5e5] bg-[#ffffff] text-slate-900 shadow-lg"
            >
              <DropdownMenuLabel className="font-orbitron text-xs font-bold tracking-wider text-[#666666] uppercase">
                Simulated Keycloak Roles
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(ROLE_PROFILES) as RoleType[]).map((r) => {
                const p = ROLE_PROFILES[r];
                const isSelected = activeRole === r;
                return (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => handleRoleSelect(r)}
                    className={`flex cursor-pointer items-center justify-between px-2.5 py-2 text-xs ${
                      isSelected
                        ? 'bg-[#13c2b6]/10 font-semibold text-[#009588]'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="font-orbitron text-xs font-bold text-[#000000]">
                        {p.shortTitle}
                      </div>
                      <div className="font-mono text-[10px] text-[#666666]">
                        {r}
                      </div>
                    </div>
                    {isSelected && (
                      <Badge className="bg-[#13c2b6] text-[10px] font-bold text-white">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/')}
                className="flex cursor-pointer items-center justify-between py-2 text-xs text-[#666666]"
              >
                <span>Return to Role Gateway</span>
                <ExternalLink className="size-3.5 text-slate-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Exit to Gateway */}
          <Link
            href="/"
            title="Switch Persona / Exit to Gateway"
            className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-[#173e81] hover:text-white"
          >
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
