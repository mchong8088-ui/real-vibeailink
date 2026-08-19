import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VoiceInfo {
  name: string;
  language: string;
  gender?: string;
  quality?: string;
}

export async function GET() {
  try {
    // Get all available voices from macOS
    const { stdout } = await execAsync('say -v "?"');
    
    const lines = stdout.split('\n').filter(line => line.trim());
    const voices: VoiceInfo[] = [];
    
    for (const line of lines) {
      // Parse the line - voices are separated by multiple spaces
      // Example: "Aasing (Enhanced)   zh_HK    # 你好，我叫阿成。我講廣東waa2。"
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
        
        // Map language codes
        let language = langCode;
        if (langCode === 'zh_HK') language = 'Cantonese (zh-HK)';
        else if (langCode === 'zh_CN') language = 'Mandarin (zh-CN)';
        else if (langCode === 'zh_TW') language = 'Taiwanese (zh-TW)';
        else if (langCode === 'en_US') language = 'English (US)';
        else if (langCode === 'en_GB') language = 'English (UK)';
        else if (langCode === 'en_AU') language = 'English (Australia)';
        else if (langCode === 'en_IE') language = 'English (Ireland)';
        else if (langCode === 'fr_FR') language = 'French';
        else if (langCode === 'de_DE') language = 'German';
        else if (langCode === 'es_ES') language = 'Spanish';
        else if (langCode === 'it_IT') language = 'Italian';
        else if (langCode === 'ja_JP') language = 'Japanese';
        else if (langCode === 'ko_KR') language = 'Korean';
        
        voices.push({
          name,
          language,
          gender,
          quality
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      voices,
      count: voices.length,
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