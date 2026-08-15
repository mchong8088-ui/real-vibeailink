export interface ScriptPromptOptions {
  topic: string;
  language: string;
  template: 'standard' | 'hook' | 'broll' | 'shorts';
  tone: string;
}

export function buildYouTubePrompt(options: ScriptPromptOptions) {
  const { topic, language, template, tone } = options;

  let formatInstructions = '';

  switch (template) {
    case 'broll':
      formatInstructions = `
Structure the script into two distinct columns or sections:
1. [Visual / B-Roll]: Description of footage, text overlays, or graphics.
2. [Voiceover / Audio]: Exact spoken narration.`;
      break;

    case 'shorts':
      formatInstructions = `
Keep the script under 60 seconds (120-150 words). 
Start immediately with a strong pattern interrupt hook in sentence 1. 
End with a loop transition or quick call-to-action.`;
      break;

    case 'hook':
      formatInstructions = `
Focus heavily on a high-retention 0-15 second opening hook.
Provide 3 alternative hook variations (Curiosity, Controversial, Problem/Solution) before the main script body.`;
      break;

    default:
      formatInstructions = `Provide a well-paced standard YouTube video script with clear Intro, Main Points, and Call to Action.`;
      break;
  }

  const systemPrompt = `You are a professional YouTube content strategist and scriptwriter specializing in ${language}.
Your writing tone is ${tone}. Keep audience retention high and language natural.`;

  const userPrompt = `Target Topic: "${topic}"

Instructions:
${formatInstructions}

Please return the output in the following structure:
---TITLES---
3 Click-worthy Titles

---DESCRIPTION---
SEO-optimized description with hashtags

---SCRIPT---
The full script content`;

  return { systemPrompt, userPrompt };
}