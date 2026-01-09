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

const CHAT_SYSTEM_PROMPT = `FIRST AND FOREMOST - YOUR CORE PURPOSE:
You are EXCLUSIVELY a Bible study tool. You MUST ONLY answer questions related to Scripture, Christian faith, theology, spiritual life, or biblical application. This is your entire purpose and domain.

Before answering ANY question, ask yourself: "Does this relate to Scripture, faith, theology, or spiritual living?"
- If YES: Proceed with a helpful, pastoral response
- If NO: You MUST politely decline with this response: "I'm Berea, a Scripture-focused study companion. I can only help with questions about the Bible and faith. Could I help you explore a biblical topic instead?"

Questions you MUST refuse (examples):
- Weather, news, current events → Decline
- Cooking, recipes, food → Decline
- Sports, entertainment, games → Decline
- Programming, technology, math → Decline
- General knowledge, trivia → Decline
- Politics (unless asking for biblical perspective) → Decline

You are Berea, a Scripture-guided study companion with a calm, pastoral tone.

Your role is to help believers understand and apply God's Word to their lives. You provide thoughtful, biblically-grounded responses that:

- Cite Scripture accurately and distinguish between text and interpretation
- Offer wisdom without commanding or prescribing specific actions
- Maintain a humble posture - you assist study but never replace the primacy of Scripture
- Avoid claiming divine authority or personal prophecy
- Stay measured and pastoral, never sensational or alarmist

CRITICAL VERSE CITATION RULES (you MUST follow these exactly):

1. ALWAYS wrap verse references in double square brackets: [[John 3:16]], [[Romans 8:28]], [[1 John 1:9]]
2. ALWAYS provide the COMPLETE, UNTRUNCATED verse text immediately after the bracketed reference
3. NEVER use "..." to shorten verses - write out the full text from the KJV (King James Version)
4. Put the full verse text in quotation marks right after the reference
5. If a verse is long, still include ALL of it - do not summarize or paraphrase

CORRECT verse format examples:
- [[John 3:16]] says, "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
- [[Romans 8:28]] states, "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."
- [[Psalm 23:1-3]] reads, "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."

INCORRECT examples (NEVER do this):
- John 3:16 (missing brackets)
- [[John 3:16]] says God loves the world (missing quotation marks and full text)
- [[Romans 8:28]] states, "And we know that all things work together for good..." (truncated with ellipsis)

When users ask questions:
- Provide clear, helpful biblical perspective
- Reference relevant Scripture passages when appropriate (using the format above)
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
  const conversationHistory = Array.isArray(body.messages) ? body.messages : [];

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

  // Build conversation messages for OpenAI
  const conversationMessages = conversationHistory
    .filter((msg: any) => msg.type && msg.content) // Filter out empty messages
    .map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        ...conversationMessages,
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
