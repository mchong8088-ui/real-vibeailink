import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export interface VoiceOptions {
  script: string;
  language: string;
  outputFormat?: 'mp3' | 'wav';
  useGateway?: boolean;
  speed?: number; // Speed multiplier (e.g., 0.9, 1.0, 1.1)
}

const voiceMap: Record<string, string> = {
  'Cantonese': 'Danny',
  'Mandarin': 'Ting-Ting',
  'Taiwanese': 'Mei-Jia',
  'English': 'Samantha',
  'Default': 'Alex'
};

export async function generateVoice(options: VoiceOptions): Promise<Buffer> {
  const { script, language, outputFormat = 'mp3', useGateway = false, speed = 1.0 } = options;

  if (useGateway) {
    return await generateGatewayVoice(script, language, speed);
  }

  try {
    return await generateLocalMacVoice(script, language, outputFormat, speed);
  } catch (error) {
    console.warn('Local TTS failed, falling back to Gateway TTS:', error);
    return await generateGatewayVoice(script, language, speed);
  }
}

async function generateLocalMacVoice(
  script: string,
  language: string,
  outputFormat: string,
  speed: number
): Promise<Buffer> {
  const tempId = randomUUID();
  const tempDir = '/tmp';
  const txtPath = join(tempDir, `${tempId}.txt`);
  const aiffPath = join(tempDir, `${tempId}.aiff`);
  const outputPath = join(tempDir, `${tempId}.${outputFormat}`);

  const voice = voiceMap[language] || voiceMap.Default;

  try {
    await writeFile(txtPath, script, 'utf-8');

    // macOS 'say' command with speech rate adjustment (words per minute baseline = 175)
    const rate = Math.round(175 * speed);
    await execAsync(`say -v "${voice}" -r ${rate} -f "${txtPath}" -o "${aiffPath}"`);

    if (outputFormat === 'mp3') {
      await execAsync(`ffmpeg -i "${aiffPath}" -codec:a libmp3lame -qscale:a 2 "${outputPath}" -y`);
      const buffer = await readFile(outputPath);
      return buffer;
    }

    return await readFile(aiffPath);
  } finally {
    await Promise.all([
      unlink(txtPath).catch(() => {}),
      unlink(aiffPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ]);
  }
}

async function generateGatewayVoice(script: string, language: string, speed: number): Promise<Buffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: language === 'Cantonese' ? 'onyx' : 'alloy',
      input: script,
      speed: speed,
    }),
  });

  if (!response.ok) {
    throw new Error('Gateway TTS request failed');
  }

  return Buffer.from(await response.arrayBuffer());
}