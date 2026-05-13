import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { image, lang } = await req.json();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = lang === "English" 
      ? "Extract the key financial news from this image. Summarize the impact on specific stocks or markets."
      : "請從這張圖片中提取關鍵財經新聞。總結其對特定股票或市場的影響，並以繁體中文回答。";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Vision processing failed" }), { status: 500 });
  }
}