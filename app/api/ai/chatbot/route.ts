import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL_NAME =
  process.env.GROQ_CHAT_MODEL ?? "llama3-8b-8192";

const SYSTEM_PROMPT = `
You are **Sadaora GiftBot**, the AI shopping assistant for our marketplace.

• Greet the shopper and politely ask who the gift is for, the occasion,
  interests and budget.
• When enough info is gathered, recommend **3-5** products from our site.
  For each product output **exactly**:
    - **{title}** – one-line reason – [View](/product/{id})
• Ask clarifying questions if details are missing.
• Keep answers concise, friendly and markdown-formatted.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages[] is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    return NextResponse.json(completion, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
