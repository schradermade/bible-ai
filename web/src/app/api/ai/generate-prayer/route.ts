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

const PRAYER_GENERATION_PROMPT = `You are a prayer guide helping believers craft heartfelt, biblically-grounded prayers.

When given a Bible verse or spiritual context, generate a personal, authentic prayer that:
- Reflects on the Scripture's meaning and applies it to life
- Uses conversational, sincere language (not overly formal or King James style)
- Is 3-5 sentences long (concise but meaningful)
- Addresses God directly in second person (You/Your)
- Includes specific thanksgiving, confession, petition, or praise as appropriate
- Stays humble and genuine - avoid clichés or overly dramatic language

Example style (for John 3:16):
"Father, thank You for loving me so deeply that You gave Your Son for my salvation. Help me to truly grasp the magnitude of this gift and live in the freedom it brings. I believe in Jesus and trust in Your promise of eternal life. May this truth transform how I live each day."

Generate ONE prayer based on the provided verse or context. Make it personal, warm, and Spirit-led.`;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to generate prayers.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { verseReference, verseText, chatContext, source } = body;

    // Check usage limits
    const [subscription, usageCount, usageLimit] = await Promise.all([
      getSubscriptionStatus(userId),
      getUsageCount(userId, INSIGHT_FEATURE_KEY),
      getUsageLimit(userId),
    ]);

    if (!subscription.isSubscribed && usageCount >= usageLimit) {
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          message: `You've reached your monthly limit of ${usageLimit} AI requests. Upgrade to continue.`,
        },
        { status: 429 }
      );
    }

    // Build the user prompt based on source
    let userPrompt = '';
    if (source === 'verse' && verseReference && verseText) {
      userPrompt = `Generate a prayer based on this verse:\n\n${verseReference}: "${verseText}"`;
    } else if (source === 'chat' && chatContext) {
      userPrompt = `Generate a prayer based on this spiritual need or topic:\n\n${chatContext}`;
    } else {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Missing verse or context for prayer generation.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: PRAYER_GENERATION_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.8, // More creative for prayers
      max_tokens: 300,
    });

    const prayer = completion.choices[0]?.message?.content?.trim();

    if (!prayer) {
      throw new Error('No prayer generated');
    }

    // Increment usage
    await incrementUsage(userId, INSIGHT_FEATURE_KEY);

    return NextResponse.json({
      success: true,
      prayer,
      source,
      sourceReference: verseReference || null,
    });
  } catch (error) {
    console.error('[API] Prayer generation error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'AI service unavailable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Failed to generate prayer',
      },
      { status: 500 }
    );
  }
}
