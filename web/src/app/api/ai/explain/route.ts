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

type NormalizedError = {
  status: number;
  code: string;
  message: string;
};

function normalizeError(error: unknown): NormalizedError {
  if (error && typeof error === "object") {
    const status = "status" in error && typeof error.status === "number"
      ? error.status
      : 502;
    const message = "message" in error && typeof error.message === "string"
      ? error.message
      : "AI service error.";

    if (status === 429) {
      return { status, code: "ai_rate_limited", message };
    }

    return { status: status >= 400 && status < 600 ? status : 502, code: "ai_service_error", message };
  }

  return { status: 502, code: "ai_service_error", message: "AI service error." };
}

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

  const attempt = async () => {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 600,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "explain_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              reference: { type: "string" },
              sections: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["title", "content"],
                },
              },
            },
            required: ["reference", "sections"],
          },
        },
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${userPrompt}\nReturn ONLY valid JSON that matches the schema.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    if (!content) {
      throw new Error("AI response was empty.");
    }
    const raw = content.trim();
    try {
      const parsed = JSON.parse(raw) as ExplainResponse;
      return NextResponse.json({
        reference: parsed.reference || reference,
        sections: parsed.sections ?? [],
      });
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("AI response was not valid JSON.");
      }
      const parsed = JSON.parse(match[0]) as ExplainResponse;
      return NextResponse.json({
        reference: parsed.reference || reference,
        sections: parsed.sections ?? [],
      });
    }
  };

  try {
    return await attempt();
  } catch (error) {
    try {
      return await attempt();
    } catch (retryError) {
      const normalized = normalizeError(retryError);
      console.error("AI explain error", normalized);
      return NextResponse.json(
        { error: normalized.code, message: normalized.message },
        { status: normalized.status }
      );
    }
  }
}
