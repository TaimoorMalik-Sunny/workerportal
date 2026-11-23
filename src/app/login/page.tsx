'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileCheck2,
  Stamp,
  GraduationCap,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  loginWorker,
  changeWorkerPassword,
  mapRoleSlugToWorkflowRole,
} from '@/services/auth';
import { useAppStore } from '@/store/use-app-store';

function WorkerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const { setActiveRole } = useAppStore();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );

  // First-time password update states
  const [showPasswordChangeModal, setShowPasswordChangeModal] =
    React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pendingToken, setPendingToken] = React.useState<string | undefined>(
    undefined
  );
  const [pendingRoles, setPendingRoles] = React.useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your official ID/email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await loginWorker(username.trim(), password);

      if (!res.success || !res.data) {
        setErrorMessage(
          res.message ||
            res.error ||
            'Authentication failed. Please verify your credentials.'
        );
        setIsLoading(false);
        return;
      }

      const { user, token } = res.data;
      const roles = user.roles || [];

      // Check if password change is required
      if (res.password_change_required) {
        setPendingToken(token?.access_token);
        setPendingRoles(roles);
        setCurrentPassword(password);
        setShowPasswordChangeModal(true);
        setIsLoading(false);
        return;
      }

      // Successful login
      setSuccessMessage(
        'Authentication successful! Loading your operational workspace...'
      );
      const { roleType, targetPath } = mapRoleSlugToWorkflowRole(roles);
      setActiveRole(roleType);

      setTimeout(() => {
        router.push(callbackUrl || targetPath);
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setErrorMessage(`Unable to reach authentication gateway: ${msg}`);
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await changeWorkerPassword({
        currentPassword,
        password: newPassword,
        passwordConfirmation: confirmPassword,
        token: pendingToken,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Failed to update temporary password.');
        setIsLoading(false);
        return;
      }

      setShowPasswordChangeModal(false);
      setSuccessMessage(
        'Password successfully updated! Redirecting to workspace...'
      );

      const { roleType, targetPath } = mapRoleSlugToWorkflowRole(pendingRoles);
      setActiveRole(roleType);

      setTimeout(() => {
        router.push(callbackUrl || targetPath);
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setErrorMessage(`Password change failed: ${msg}`);
      setIsLoading(false);
    }
  };

  const setQuickAccount = (email: string) => {
    setUsername(email);
    setPassword('TestPassword123!');
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#173e81] to-[#0d2a55] p-4 text-slate-100">
      {/* Background Decorative Accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-400 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-blue-600 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* HEC Official Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-teal-300">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            Government of Pakistan &bull; HEC National Gateway
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Worker &amp; Officer Portal
          </h1>
          <p className="mt-1.5 text-xs text-slate-300">
            Degree Scrutiny, Institutional Gazette, and Attestation Operations
          </p>
        </div>

        {/* Card Form */}
        <Card className="border-slate-700/60 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">
              {showPasswordChangeModal
                ? 'Set Permanent Password'
                : 'Sign In to Operations Workspace'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              {showPasswordChangeModal
                ? 'Your account has a temporary password. Please set a new secure password to proceed.'
                : 'Enter your assigned officer credentials to access your verification queue.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2.5 rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                <div className="font-medium">{successMessage}</div>
              </div>
            )}

            {/* Login Form */}
            {!showPasswordChangeModal ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="username"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Official Email / Officer ID
                  </Label>
                  <div className="relative">
                    <User className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g. scrutiny1@test.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-8 text-sm"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-8 pl-8 text-sm"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#173e81] text-white hover:bg-[#0d2a55]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating with Keycloak...
                    </>
                  ) : (
                    <>
                      Access Officer Workspace
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Password Change Form on First Login */
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="newPassword"
                    className="text-xs font-semibold text-slate-700"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-700 text-white hover:bg-teal-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Security Credentials...
                    </>
                  ) : (
                    'Save New Password & Continue'
                  )}
                </Button>
              </form>
            )}

            {/* Quick Testing Accounts */}
            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Quick Officer Switch (Development)
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickAccount('scrutiny1@test.com')}
                  className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-100"
                >
                  <FileCheck2 className="h-3 w-3" /> Scrutiny
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAccount('attestation1@test.com')}
                  className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Stamp className="h-3 w-3" /> Attestation
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAccount('controller1@test.com')}
                  className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
                >
                  <GraduationCap className="h-3 w-3" /> Controller L1
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAccount('controller2@test.com')}
                  className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  <GraduationCap className="h-3 w-3" /> Controller L2
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[11px] text-slate-500">
              <strong className="font-semibold text-slate-700">
                Access Policy:
              </strong>{' '}
              Only operational worker roles can access this portal.
              Administrator accounts must use the Admin Panel, and students must
              use the Student Portal.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function WorkerLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <WorkerLoginForm />
    </React.Suspense>
  );
}
