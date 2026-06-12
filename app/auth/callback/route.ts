// app/auth/callback/route.ts
// AUTH TEMPORARILY DISABLED FOR TESTING
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Simply redirect to home page without any auth processing
  console.log('🔐 Auth callback hit but auth is temporarily disabled');
  
  // Just redirect to home page
  return NextResponse.redirect(new URL('/', request.url));
}