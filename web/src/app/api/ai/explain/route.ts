import { NextResponse } from "next/server";
import OpenAI from "openai";

type ExplainResponse = {
  reference: string;
  sections: { title: string; content: string }[];
};

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a Scripture-guided study companion. Follow these rules:
- Be calm, measured, and pastoral in tone.
- Cite Scripture and distinguish text from interpretation.
- Never give commands or prescriptive advice.
- Never claim divine authority or personal prophecy.
- Avoid sensational or alarmist language.
Return JSON with keys: reference, sections (array of {title, content}).`;

function buildUserPrompt(reference: string, question?: string) {
  const lines = [
    `Passage: ${reference}`,
    question ? `User question: ${question}` : "User question: (none)",
    "Provide: 1) What the text clearly says 2) Context to consider 3) Reflection question.",
  ];

  return lines.join("\n");
}

export async function POST(request: Request) {
  const body = await request.json();
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!reference) {
    return NextResponse.json(
      { error: "reference_required" },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "ai_unavailable" },
      { status: 503 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userPrompt = buildUserPrompt(reference, question || undefined);

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(content) as ExplainResponse;
    return NextResponse.json({
      reference: parsed.reference || reference,
      sections: parsed.sections ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "ai_invalid_response" },
      { status: 502 }
    );
  }
}
