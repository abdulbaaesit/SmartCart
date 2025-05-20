import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
const MODEL = process.env.GROQ_MODEL ?? "llama3-8b-8192";

export async function POST(req: NextRequest) {
  const { reviews } = await req.json();

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json({ error: "No reviews provided" }, { status: 400 });
  }

  const text = reviews
    .map((r: any, i: number) => `${i + 1}) ${r.comment.trim()}`)
    .join("  ");

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates concise summaries.",
        },
        {
          role: "user",
          content: `Give a single-sentence summary of these reviews:\n${text}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    const summary =
      completion.choices?.[0]?.message?.content?.trim() ??
      "Unable to generate summary.";

    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Summarization failed" },
      { status: 500 }
    );
  }
}
