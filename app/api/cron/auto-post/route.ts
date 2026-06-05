// app/api/cron/auto-post/route.ts
import { NextResponse } from 'next/server';

// This endpoint will be called by Vercel Cron Jobs
export async function GET(req: Request) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Trigger auto-post with default settings
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/social/auto-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'English',
        platforms: ['twitter', 'facebook'],
        testMode: false,
      }),
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled auto-post completed',
      result,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}