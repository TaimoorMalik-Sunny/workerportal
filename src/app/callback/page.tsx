'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  exchangeWorkerCodeForToken,
  authenticateWorkerWithToken,
  mapRoleSlugToWorkflowRole,
} from '@/services/auth';
import { useAppStore } from '@/store/use-app-store';

function WorkerCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const urlError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const { setActiveRole } = useAppStore();

  const [status, setStatus] = React.useState<
    'processing' | 'success' | 'error'
  >('processing');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (urlError) {
      setStatus('error');
      setErrorMessage(
        errorDescription || urlError || 'Authentication error from Keycloak.'
      );
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received from Keycloak.');
      return;
    }

    const processAuth = async () => {
      try {
        // Retrieve code verifier from sessionStorage or cookie
        let verifier = sessionStorage.getItem('kc_worker_verifier');
        if (!verifier) {
          const match = document.cookie.match(
            /(?:^|; )kc_worker_verifier=([^;]*)/
          );
          verifier = match ? decodeURIComponent(match[1]) : '';
        }

        if (!verifier) {
          throw new Error(
            'Authentication session expired or code verifier missing. Please try logging in again.'
          );
        }

        // 1. Exchange authorization code with Keycloak
        const tokenRes = await exchangeWorkerCodeForToken(code, verifier);
        if (!tokenRes.success || !tokenRes.accessToken) {
          throw new Error(
            tokenRes.error ||
              'Failed to exchange authorization code for tokens.'
          );
        }

        // 2. Validate token with backend and fetch worker user info
        const authRes = await authenticateWorkerWithToken(tokenRes.accessToken);
        if (!authRes.success || !authRes.data) {
          throw new Error(
            authRes.message ||
              authRes.error ||
              'Access denied. Your account is not authorized for the Worker Portal.'
          );
        }

        const roles = authRes.data.user.roles || [];
        const { roleType, targetPath } = mapRoleSlugToWorkflowRole(roles);
        setActiveRole(roleType);

        setStatus('success');

        // Resolve return URL
        let destination = targetPath;
        if (state) {
          try {
            const decodedState = decodeURIComponent(state);
            if (
              decodedState.startsWith('/') &&
              !decodedState.startsWith('//')
            ) {
              destination = decodedState;
            }
          } catch {
            // fallback to mapped targetPath
          }
        }

        // Clean up verifier
        sessionStorage.removeItem('kc_worker_verifier');
        sessionStorage.removeItem('kc_worker_return_url');
        document.cookie =
          'kc_worker_verifier=; path=/; max-age=0; SameSite=Lax';

        setTimeout(() => {
          router.push(destination);
          router.refresh();
        }, 800);
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Authentication failed.'
        );
      }
    };

    processAuth();
  }, [code, state, urlError, errorDescription, router, setActiveRole]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070e1e] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#173e81]/40 bg-[#0c1a38]/90 p-8 text-center shadow-2xl backdrop-blur-md">
        {status === 'processing' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto size-10 animate-spin text-amber-400" />
            <h2 className="text-lg font-bold">
              Authenticating with Keycloak IAM
            </h2>
            <p className="text-xs text-slate-400">
              Verifying your credentials and establishing your security
              clearance...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
            <h2 className="text-lg font-bold text-emerald-400">
              Authentication Verified!
            </h2>
            <p className="text-xs text-slate-300">
              Redirecting to your authorized HEC worker workspace...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="mx-auto size-10 text-rose-400" />
            <h2 className="text-lg font-bold text-rose-400">
              Authentication Failed
            </h2>
            <p className="text-xs leading-relaxed text-slate-300">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkerCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070e1e] text-white">
          <Loader2 className="size-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <WorkerCallbackContent />
    </React.Suspense>
  );
}
