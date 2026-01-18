import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';
import {
  getSubscriptionStatus,
  getUsageCount,
  getUsageLimit,
  incrementUsage,
  INSIGHT_FEATURE_KEY,
} from '@/lib/billing';

export const runtime = 'nodejs';

const ENCOURAGEMENT_GENERATION_PROMPT = `You are an encouragement guide helping believers find hope and strength in Scripture.

Generate:
1. Brief, warm encouragement (2-3 sentences)
2. Relevant Scripture reference and text
3. Gentle reflection question (1 sentence)
4. Optional prayer prompt (1 sentence)

TONE: Calm, measured, pastoral, Scripture-grounded
AVOID: Imperatives, divine authority claims, clichés, minimizing struggles
ALWAYS: Cite Scripture, invite reflection, respect emotions

Response format (JSON):
{
  "encouragement": "2-3 sentence encouragement",
  "scriptureReference": "Verse reference",
  "scriptureText": "Full verse text",
  "reflection": "1 sentence reflective question",
  "prayerPrompt": "1 sentence gentle prayer prompt"
}`;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to generate encouragement.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { promptText, context } = body;

    // Check usage limits
    const subscription = await getSubscriptionStatus(userId);
    const usageCount = await getUsageCount(userId, INSIGHT_FEATURE_KEY);
    const usageLimit = getUsageLimit(subscription.isActive);

    if (!subscription.isActive && usageCount >= usageLimit) {
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          message: `You've reached your monthly limit of ${usageLimit} AI requests. Upgrade to continue.`,
        },
        { status: 429 }
      );
    }

    // Validate input
    if (!promptText || typeof promptText !== 'string') {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Prompt text is required.' },
        { status: 400 }
      );
    }

    // Build the user prompt
    let userPrompt = `Generate encouragement for: ${promptText}`;
    if (context) {
      userPrompt += `\n\nAdditional context: ${context}`;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ENCOURAGEMENT_GENERATION_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      throw new Error('No encouragement generated');
    }

    // Parse JSON response
    const parsedResponse = JSON.parse(responseContent);
    const { encouragement, scriptureReference, scriptureText, reflection, prayerPrompt } = parsedResponse;

    if (!encouragement || !scriptureReference || !scriptureText) {
      throw new Error('Invalid encouragement response format');
    }

    // Increment usage
    await incrementUsage(userId, INSIGHT_FEATURE_KEY);

    return NextResponse.json({
      success: true,
      encouragement,
      scriptureReference,
      scriptureText,
      reflection: reflection || null,
      prayerPrompt: prayerPrompt || null,
    });
  } catch (error) {
    console.error('[API] Encouragement generation error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'AI service unavailable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Failed to generate encouragement',
      },
      { status: 500 }
    );
  }
}
