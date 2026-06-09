// app/api/facebook/share/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, message, link, reportId, symbol } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Facebook access token' },
        { status: 400 }
      );
    }

    if (!message && !link) {
      return NextResponse.json(
        { error: 'Either message or link is required' },
        { status: 400 }
      );
    }

    // 準備發送到 Facebook 的參數
    const params: any = {
      access_token: accessToken,
    };

    if (message) {
      params.message = message;
    }

    if (link) {
      params.link = link;
    }

    // 可選：添加圖片
    // params.picture = 'https://vibeailink.com/og-image.png';

    // 呼叫 Facebook Graph API
    const response = await fetch('https://graph.facebook.com/v19.0/me/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Facebook API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to post to Facebook' },
        { status: response.status }
      );
    }

    console.log('✅ Facebook post successful:', data);

    // 記錄分享紀錄到你的資料庫（可選）
    // await saveShareRecord({ userId, reportId, symbol, postId: data.id });

    return NextResponse.json({
      success: true,
      postId: data.id,
      message: 'Successfully shared to Facebook',
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}