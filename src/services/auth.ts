import { RoleType } from '@/types/workflow';

export interface WorkerUser {
  id: number;
  keycloak_id?: string;
  full_name: string;
  email: string;
  username: string;
  portal: string;
  roles: string[];
  permissions: string[];
  password_change_required: boolean;
  digital_wallet?: string | null;
  wallet_status?: string;
}

export interface WorkerAuthResponse {
  success: boolean;
  message?: string;
  password_change_required?: boolean;
  data?: {
    user: WorkerUser;
    token?: {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      token_type?: string;
    };
    password_change_required?: boolean;
  };
  error?: string;
}

/**
 * Maps backend role slugs to the frontend RoleType for workspace routing.
 */
export function mapRoleSlugToWorkflowRole(roles: string[]): {
  roleType: RoleType;
  targetPath: string;
} {
  const normalized = roles.map((r) => r.toLowerCase());

  const hasScrutiny = normalized.some((r) => r.includes('scrutiny'));
  const hasAttestation = normalized.some((r) => r.includes('attestation'));
  const hasL1 = normalized.some(
    (r) => r.includes('controller-l1') || r.includes('controller_l1')
  );
  const hasL2 = normalized.some(
    (r) => r.includes('controller-l2') || r.includes('controller_l2')
  );
  const hasManager = normalized.some(
    (r) =>
      r.includes('manager') ||
      r.includes('director') ||
      r.includes('evaluator') ||
      r.includes('case-worker')
  );

  // Dual role when user has multiple operational clearance roles
  if ((hasScrutiny && hasAttestation) || (hasL1 && hasL2)) {
    return { roleType: 'ROLE_DUAL_STAFF', targetPath: '/dashboard/dual-role' };
  }

  if (hasScrutiny) {
    return { roleType: 'ROLE_HEC_SCRUTINY', targetPath: '/dashboard/scrutiny' };
  }

  if (hasAttestation) {
    return {
      roleType: 'ROLE_HEC_ATTESTATION',
      targetPath: '/dashboard/attestation',
    };
  }

  if (hasL1) {
    return {
      roleType: 'ROLE_CONTROLLER_L1',
      targetPath: '/dashboard/controller-l1',
    };
  }

  if (hasL2) {
    return {
      roleType: 'ROLE_CONTROLLER_L2',
      targetPath: '/dashboard/controller-l2',
    };
  }

  if (hasManager) {
    return {
      roleType: 'ROLE_HEC_MANAGER',
      targetPath: '/dashboard/manager?tab=overview',
    };
  }

  // Fallback to manager overview
  return {
    roleType: 'ROLE_HEC_MANAGER',
    targetPath: '/dashboard/manager?tab=overview',
  };
}

/**
 * Client cookie helper
 */
export function setClientCookie(name: string, value: string, maxAge = 86400) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

export function clearClientCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/**
 * Login worker via Next.js internal auth API (which validates with Laravel Keycloak service)
 */
export async function loginWorker(
  identifier: string,
  password: string
): Promise<WorkerAuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username: identifier,
      password,
    }),
  });

  const data: WorkerAuthResponse = await res.json();

  if (data.success && data.data) {
    setWorkerSession(data.data.user, data.data.token?.access_token);
  }

  return data;
}

/**
 * Change temporary password on first login
 */
export async function changeWorkerPassword(params: {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
  token?: string;
}): Promise<{ success: boolean; message: string }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ||
    'http://127.0.0.1:8000';

  const token = params.token || getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/api/v1/worker/auth/change-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      current_password: params.currentPassword,
      password: params.password,
      password_confirmation: params.passwordConfirmation,
    }),
  });

  return await res.json();
}

/**
 * Persist worker session to localStorage and cookies
 */
export function setWorkerSession(user: WorkerUser, token?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hec_worker_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('hec_worker_token', token);
      setClientCookie('hec_worker_token', token);
      setClientCookie('hec_auth_token', token);
    }
  }
}

/**
 * Retrieve stored user
 */
export function getStoredUser(): WorkerUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('hec_worker_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkerUser;
  } catch {
    return null;
  }
}

/**
 * Retrieve stored token
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hec_worker_token');
}

/**
 * Log out worker and clear state
 */
export async function logoutWorker() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Continue cleanup even if server call fails
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('hec_worker_user');
    localStorage.removeItem('hec_worker_token');
    clearClientCookie('hec_worker_token');
    clearClientCookie('hec_auth_token');
    window.location.assign('/login');
  }
}

/**
 * Generates random base64url string for PKCE code_verifier.
 */
export function generateRandomString(length = 64): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Calculates SHA-256 base64url hash for PKCE code_challenge.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hash);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return verifier;
}

export function getKeycloakWorkerIssuerUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace(/\/+$/, '') ||
    'http://10.179.1.101:8081';
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'hec-admin';
  return `${baseUrl}/realms/${realm}`;
}

export async function initiateWorkerKeycloakLogin(options?: {
  callbackUrl?: string;
  clientId?: string;
  redirectUri?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const callbackUrl = options?.callbackUrl || '/dashboard';
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);

  document.cookie = `kc_worker_verifier=${encodeURIComponent(verifier)}; path=/; max-age=600; SameSite=Lax`;
  try {
    sessionStorage.setItem('kc_worker_verifier', verifier);
    sessionStorage.setItem('kc_worker_return_url', callbackUrl);
  } catch {
    // ignore
  }

  const issuerUrl = getKeycloakWorkerIssuerUrl();
  const clientId =
    options?.clientId ||
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ||
    'hec-worker-portal';
  const redirectUri =
    options?.redirectUri || `${window.location.origin}/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid profile email roles',
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: encodeURIComponent(callbackUrl),
  });

  window.location.assign(
    `${issuerUrl}/protocol/openid-connect/auth?${params.toString()}`
  );
}

export async function exchangeWorkerCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri?: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  const issuerUrl = getKeycloakWorkerIssuerUrl();
  const clientId =
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'hec-worker-portal';
  const finalRedirectUri =
    redirectUri ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/callback`
      : 'http://localhost:3002/callback');

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: finalRedirectUri,
    code_verifier: codeVerifier,
  });

  try {
    const res = await fetch(`${issuerUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error_description || data.error || 'Token exchange failed',
      };
    }

    return {
      success: true,
      accessToken: data.access_token,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: msg };
  }
}

export async function authenticateWorkerWithToken(
  accessToken: string
): Promise<WorkerAuthResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ||
    'http://127.0.0.1:8000';

  const res = await fetch(`${baseUrl}/api/v1/worker/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });

  const data: WorkerAuthResponse = await res.json();
  if (data.success && data.data) {
    setWorkerSession(data.data.user, accessToken);
  }
  return data;
}
