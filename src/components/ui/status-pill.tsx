import * as React from 'react';
import { cn } from '@/lib/utils';
import { SemanticStatus } from '@/types/workflow';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  PauseCircle,
  AlertTriangle,
  FileSearch,
} from 'lucide-react';

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: SemanticStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusPill({
  status,
  size = 'md',
  showIcon = true,
  className,
  ...props
}: StatusPillProps) {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent = Clock;

  if (
    norm.includes('approved') ||
    norm.includes('verified') ||
    norm.includes('completed')
  ) {
    colorClasses =
      'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/10';
    IconComponent = CheckCircle2;
  } else if (norm.includes('pending') || norm.includes('awaiting')) {
    colorClasses =
      'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/10';
    IconComponent = Clock;
  } else if (
    norm.includes('process') ||
    norm.includes('progress') ||
    norm.includes('scrutiny')
  ) {
    colorClasses =
      'bg-blue-50 text-blue-800 border-blue-200 ring-1 ring-blue-500/10';
    IconComponent = FileSearch;
  } else if (norm.includes('holding') || norm.includes('hold')) {
    colorClasses =
      'bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-500/10';
    IconComponent = PauseCircle;
  } else if (
    norm.includes('revision') ||
    norm.includes('revised') ||
    norm.includes('clarification')
  ) {
    colorClasses =
      'bg-orange-50 text-orange-800 border-orange-200 ring-1 ring-orange-500/10';
    IconComponent = RotateCcw;
  } else if (norm.includes('reject')) {
    colorClasses =
      'bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-500/10';
    IconComponent = XCircle;
  } else if (norm.includes('delay') || norm.includes('overdue')) {
    colorClasses =
      'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-500/20';
    IconComponent = AlertTriangle;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium shadow-2xs transition-colors select-none',
        sizeClasses,
        colorClasses,
        className
      )}
      {...props}
    >
      {showIcon && <IconComponent className="size-3.5 shrink-0" />}
      <span>{status}</span>
    </span>
  );
}
