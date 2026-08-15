export async function translateSRTSegments(
  segments: { start: number; end: number; text: string }[],
  targetLanguage: string
) {
  try {
    const textToTranslate = segments.map(s => s.text).join('\n---SEGMENT---\n');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate each subtitle line into ${targetLanguage}. Maintain line order separated by ---SEGMENT---.`
          },
          { role: 'user', content: textToTranslate }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const translatedLines = data.choices[0].message.content.split('\n---SEGMENT---\n');

    return segments.map((seg, idx) => ({
      ...seg,
      text: `${seg.text}\n${translatedLines[idx] || ''}` // Dual-language output
    }));
  } catch (err) {
    console.error('Translation failed:', err);
    return segments;
  }
}