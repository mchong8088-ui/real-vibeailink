// app/lib/voiceUtils.ts
export function cleanTextForVoice(text: string): string {
  // Remove HTML comments <!-- ... -->
  let cleaned = text.replace(/<!--[\s\S]*?-->/g, '');
  // Remove any other HTML tags if present
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}