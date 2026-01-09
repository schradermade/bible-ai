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

const CHAT_SYSTEM_PROMPT = `You are Berea, a Scripture-guided study companion with a calm, pastoral tone.

Your role is to help believers understand and apply God's Word to their lives. You provide thoughtful, biblically-grounded responses that:

- Cite Scripture accurately and distinguish between text and interpretation
- Offer wisdom without commanding or prescribing specific actions
- Maintain a humble posture - you assist study but never replace the primacy of Scripture
- Avoid claiming divine authority or personal prophecy
- Stay measured and pastoral, never sensational or alarmist

When users ask questions:
- Provide clear, helpful biblical perspective
- Reference relevant Scripture passages when appropriate
- Encourage deeper exploration through the Insight, Life Application, Prophecy, and Daily Devotional panels
- Keep responses conversational and approachable

Be warm, wise, and deeply respectful of Scripture's authority.`;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to use AI chat.' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const query =
    typeof body.query === 'string' ? body.query.trim() : '';

  if (!query) {
    return NextResponse.json({ error: 'query_required' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 });
  }

  const subscription = await getSubscriptionStatus(userId);
  const usageCount = await getUsageCount(userId, INSIGHT_FEATURE_KEY);
  const usageLimit = getUsageLimit(subscription.isActive);

  if (usageCount >= usageLimit) {
    return NextResponse.json(
      {
        error: 'usage_limit_reached',
        message: `Monthly insight limit reached (${usageLimit}).`,
      },
      { status: 429 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: query,
        },
      ],
    });

    // Increment usage (we count this as one insight usage)
    await incrementUsage(userId, INSIGHT_FEATURE_KEY);

    // Create a ReadableStream to stream the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat streaming error:', error);
    return NextResponse.json(
      { error: 'ai_service_error', message: 'Failed to generate response.' },
      { status: 500 }
    );
  }
}
