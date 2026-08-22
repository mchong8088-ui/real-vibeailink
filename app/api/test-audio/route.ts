import { NextResponse } from 'next/server';
import { exec as execCB } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const exec = promisify(execCB);

export async function GET() {
  try {
    const tempTxt = path.join(os.tmpdir(), `test_${Date.now()}.txt`);
    const tempAiff = path.join(os.tmpdir(), `test_${Date.now()}.aiff`);

    await fs.promises.writeFile(tempTxt, '你好', 'utf-8');
    await exec(`say -v "Aasing (Enhanced)" -f "${tempTxt}" -o "${tempAiff}"`);

    const aiffBuffer = await fs.promises.readFile(tempAiff);

    await fs.promises.unlink(tempTxt).catch(() => {});
    await fs.promises.unlink(tempAiff).catch(() => {});

    return new NextResponse(aiffBuffer, {
      headers: { 'Content-Type': 'audio/aiff' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}