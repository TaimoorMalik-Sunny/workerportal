import { NextResponse, type NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete('hec_worker_token');
  response.cookies.delete('hec_auth_token');

  return response;
}
