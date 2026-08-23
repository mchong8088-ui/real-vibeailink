// /app/api/voices/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VoiceInfo {
  name: string;
  language: string;
  gender?: string;
  quality?: string;
  provider?: 'macos' | 'edge';
}

// Microsoft Edge TTS voices
const EDGE_VOICES: VoiceInfo[] = [
  // Cantonese (Hong Kong)
  { name: 'zh-HK-WanLungNeural', language: 'Cantonese (zh-HK) - WanLung', gender: 'Male', quality: 'Premium', provider: 'edge' },
  { name: 'zh-HK-HiuMaanNeural', language: 'Cantonese (zh-HK) - HiuMaan', gender: 'Female', quality: 'Premium', provider: 'edge' },
  { name: 'zh-HK-HiuGaaiNeural', language: 'Cantonese (zh-HK) - HiuGaai', gender: 'Female', quality: 'Premium', provider: 'edge' },
  
  // Mandarin (Taiwan)
  { name: 'zh-TW-HsiaoYuNeural', language: 'Mandarin (zh-TW) - HsiaoYu', gender: 'Female', quality: 'Premium', provider: 'edge' },
  { name: 'zh-TW-YunJheNeural', language: 'Mandarin (zh-TW) - YunJhe', gender: 'Male', quality: 'Premium', provider: 'edge' },
  { name: 'zh-TW-HsiaoChenNeural', language: 'Mandarin (zh-TW) - HsiaoChen', gender: 'Female', quality: 'Premium', provider: 'edge' },
  
  // Mandarin (Mainland China)
  { name: 'zh-CN-XiaoxiaoNeural', language: 'Mandarin (zh-CN) - Xiaoxiao', gender: 'Female', quality: 'Premium', provider: 'edge' },
  { name: 'zh-CN-YunyangNeural', language: 'Mandarin (zh-CN) - Yunyang', gender: 'Male', quality: 'Premium', provider: 'edge' },
  { name: 'zh-CN-YunyeNeural', language: 'Mandarin (zh-CN) - Yunye', gender: 'Female', quality: 'Premium', provider: 'edge' },
  
  // English (US)
  { name: 'en-US-JennyNeural', language: 'English (US) - Jenny', gender: 'Female', quality: 'Premium', provider: 'edge' },
  { name: 'en-US-GuyNeural', language: 'English (US) - Guy', gender: 'Male', quality: 'Premium', provider: 'edge' },
  { name: 'en-US-AriaNeural', language: 'English (US) - Aria', gender: 'Female', quality: 'Premium', provider: 'edge' },
];

export async function GET() {
  try {
    // Get macOS voices
    let macVoices: VoiceInfo[] = [];
    try {
      const { stdout } = await execAsync('say -v "?"');
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split(/\s{2,}/).filter(p => p.trim());
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const langCode = parts[1]?.trim() || '';
          
          let gender = 'Unknown';
          let quality = 'Standard';
          
          if (line.includes('#')) {
            const comment = line.split('#')[1] || '';
            if (comment.toLowerCase().includes('male')) gender = 'Male';
            if (comment.toLowerCase().includes('female')) gender = 'Female';
            if (comment.toLowerCase().includes('premium')) quality = 'Premium';
            if (comment.toLowerCase().includes('enhanced')) quality = 'Enhanced';
          }
          
          let language = langCode;
          if (langCode === 'zh_HK') language = 'Cantonese (zh-HK)';
          else if (langCode === 'zh_CN') language = 'Mandarin (zh-CN)';
          else if (langCode === 'zh_TW') language = 'Taiwanese (zh-TW)';
          else if (langCode === 'en_US') language = 'English (US)';
          else if (langCode === 'en_GB') language = 'English (UK)';
          
          macVoices.push({
            name,
            language,
            gender,
            quality,
            provider: 'macos'
          });
        }
      }
    } catch (error) {
      console.error('Error getting macOS voices:', error);
    }

    // Combine macOS voices with Edge voices
    const allVoices = [...macVoices, ...EDGE_VOICES];
    
    return NextResponse.json({
      success: true,
      voices: allVoices,
      count: allVoices.length,
      providers: {
        macos: macVoices.length,
        edge: EDGE_VOICES.length
      }
    });
    
  } catch (error: any) {
    console.error('Error getting voices:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      voices: []
    }, { status: 500 });
  }
}