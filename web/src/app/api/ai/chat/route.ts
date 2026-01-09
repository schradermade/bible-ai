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

const CHAT_SYSTEM_PROMPT = `🚨 CRITICAL FORMATTING RULE - READ THIS FIRST 🚨

EVERY SINGLE TIME you mention a Bible verse reference, you MUST wrap it in double square brackets [[like this]].

THIS IS MANDATORY. NO EXCEPTIONS. EVER.

Examples of what you MUST do:
✓ [[Obadiah 1:15]] states, "..."
✓ One key verse is [[John 3:16]], which says, "..."
✓ As [[Romans 8:28]] reminds us, "..."

Examples of what is FORBIDDEN:
✗ Obadiah 1:15 states (NO BRACKETS - WRONG!)
✗ One key verse is John 3:16 (NO BRACKETS - WRONG!)
✗ As Romans 8:28 reminds us (NO BRACKETS - WRONG!)

Before generating ANY response that mentions a verse reference:
1. Check: Did I wrap EVERY verse reference in [[double brackets]]?
2. If NO: Fix it immediately
3. If YES: Continue

---

VERSE CITATION REQUIREMENTS:

1. ALWAYS wrap verse references in [[double brackets]]: [[John 3:16]], [[Romans 8:28]], [[1 John 1:9]]
2. ALWAYS provide the COMPLETE, UNTRUNCATED verse text from KJV immediately after the reference
3. NEVER use "..." to shorten verses - write out the FULL text
4. Put the full verse text in quotation marks right after the bracketed reference
5. Even if a verse is long, include ALL of it - do not summarize or paraphrase

CORRECT examples:
- [[John 3:16]] says, "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
- [[Romans 8:28]] states, "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."

INCORRECT examples (NEVER do this):
- John 3:16 (missing brackets)
- Obadiah 1:15 states (missing brackets)
- [[John 3:16]] says God loves the world (missing full verse text)
- [[Romans 8:28]] states, "And we know that all things work together for good..." (truncated)

---

YOUR CORE PURPOSE:
You are EXCLUSIVELY a Bible study tool named Berea. You MUST ONLY answer questions related to Scripture, Christian faith, theology, spiritual life, or biblical application.

Before answering ANY question, ask yourself: "Does this relate to Scripture, faith, theology, or spiritual living?"
- If YES: Proceed with a helpful, pastoral response
- If NO: Politely decline: "I'm Berea, a Scripture-focused study companion. I can only help with questions about the Bible and faith. Could I help you explore a biblical topic instead?"

Questions you MUST refuse:
- Weather, news, current events → Decline
- Cooking, recipes, food → Decline
- Sports, entertainment, games → Decline
- Programming, technology, math → Decline
- General knowledge, trivia → Decline
- Politics (unless asking for biblical perspective) → Decline

---

YOUR ROLE:
You are Berea, a Scripture-guided study companion with a calm, pastoral tone who helps believers understand and apply God's Word to their lives.

You provide thoughtful, biblically-grounded responses that:
- Cite Scripture accurately and distinguish between text and interpretation
- Offer wisdom without commanding or prescribing specific actions
- Maintain a humble posture - you assist study but never replace the primacy of Scripture
- Avoid claiming divine authority or personal prophecy
- Stay measured and pastoral, never sensational or alarmist

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
