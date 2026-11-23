import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ||
      'http://127.0.0.1:8000';

    // Call backend Worker authentication endpoint
    const backendRes = await fetch(`${baseUrl}/api/v1/worker/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            backendRes.status === 403
              ? 'Access Denied'
              : 'Authentication Failed',
          message:
            data.message ||
            (backendRes.status === 403
              ? 'Access denied. You do not have permissions for the Worker Portal.'
              : 'Invalid credentials.'),
        },
        { status: backendRes.status || 401 }
      );
    }

    const token = data.data?.token?.access_token || 'authenticated';
    const maxAge = data.data?.token?.expires_in || 3600;
    const isProd = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      message: data.message || 'Worker login successful',
      data: data.data,
      password_change_required: Boolean(data.password_change_required),
    });

    // Set cookies for Next.js middleware and client requests
    response.cookies.set('hec_worker_token', token, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set('hec_auth_token', token, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message: `Authentication service error: ${message}` },
      { status: 500 }
    );
  }
}
