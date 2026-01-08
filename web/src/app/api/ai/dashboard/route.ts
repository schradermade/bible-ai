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

type DashboardResponse = {
  insight: {
    title: string;
    mainInsight: string;
    scriptureContext: {
      reference: string;
      text: string;
    };
    application: string;
    deeperTruth: string;
  };
  life: {
    title: string;
    situation: string;
    biblicalPrinciples: Array<{
      reference: string;
      text: string;
    }>;
    practicalWisdom: string;
    encouragement: string;
  };
  prophecy: {
    past: {
      title: string;
      scripture: {
        reference: string;
        text: string;
      };
      context: string;
    };
    present: {
      title: string;
      word: string;
    };
    future: {
      title: string;
      promise: string;
    };
  };
  daily: {
    title: string;
    date: string;
    scripture: {
      reference: string;
      text: string;
    };
    reflection: string;
    prayer: string;
    actionStep: string;
  };
};

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a Scripture-guided study companion providing comprehensive biblical guidance.

Given a user query, provide 4 distinct perspectives in this EXACT order:

1. INSIGHT: Deep theological understanding and biblical truth
   - Provide a clear title
   - Main insight about God's character, biblical truth, or theological principle
   - Include relevant Scripture with reference and text
   - Practical application for the believer
   - A deeper truth to meditate on

2. LIFE: Practical application with relevant scriptures
   - Title describing the life situation
   - Description of the situation or challenge
   - 3-6 biblical principles with scripture references and full text
   - Practical wisdom for applying these principles
   - Encouragement for the journey

3. PROPHECY: Past (fulfilled prophecy), Present (current word), Future (promise)
   - Past: Title, scripture reference and text showing God's faithfulness, historical context
   - Present: Title and a pastoral word for today's season
   - Future: Title and a promise or hope for what's ahead

4. DAILY: Today's devotional with prayer and action step
   - Title for today's reflection
   - Today's date (use current date)
   - Scripture passage with reference and full text
   - Thoughtful reflection connecting Scripture to life
   - A heartfelt prayer
   - One concrete action step

Follow these rules:
- Be calm, measured, and pastoral in tone
- Cite Scripture accurately and distinguish text from interpretation
- Never give commands or prescriptive advice
- Never claim divine authority or personal prophecy
- Avoid sensational or alarmist language
- Always include full Scripture text, not just references
- Keep tone consistent across all 4 sections
- Ensure content is substantive and meaningful, not generic

Return ONLY valid JSON matching the exact structure specified.`;

type NormalizedError = {
  status: number;
  code: string;
  message: string;
};

function normalizeError(error: unknown): NormalizedError {
  if (error && typeof error === 'object') {
    const status =
      'status' in error && typeof error.status === 'number'
        ? error.status
        : 502;
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : 'AI service error.';

    if (status === 429) {
      return { status, code: 'ai_rate_limited', message };
    }

    return {
      status: status >= 400 && status < 600 ? status : 502,
      code: 'ai_service_error',
      message,
    };
  }

  return {
    status: 502,
    code: 'ai_service_error',
    message: 'AI service error.',
  };
}

function buildUserPrompt(query: string) {
  return `User query: ${query}

Provide comprehensive biblical guidance covering all 4 perspectives (Insight, Life, Prophecy, Daily) related to this query.`;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to use AI dashboard.' },
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
  const userPrompt = buildUserPrompt(query);

  const attempt = async () => {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2500,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'dashboard_response',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              insight: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  mainInsight: { type: 'string' },
                  scriptureContext: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      reference: { type: 'string' },
                      text: { type: 'string' },
                    },
                    required: ['reference', 'text'],
                  },
                  application: { type: 'string' },
                  deeperTruth: { type: 'string' },
                },
                required: ['title', 'mainInsight', 'scriptureContext', 'application', 'deeperTruth'],
              },
              life: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  situation: { type: 'string' },
                  biblicalPrinciples: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        reference: { type: 'string' },
                        text: { type: 'string' },
                      },
                      required: ['reference', 'text'],
                    },
                  },
                  practicalWisdom: { type: 'string' },
                  encouragement: { type: 'string' },
                },
                required: ['title', 'situation', 'biblicalPrinciples', 'practicalWisdom', 'encouragement'],
              },
              prophecy: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  past: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      scripture: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          reference: { type: 'string' },
                          text: { type: 'string' },
                        },
                        required: ['reference', 'text'],
                      },
                      context: { type: 'string' },
                    },
                    required: ['title', 'scripture', 'context'],
                  },
                  present: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      word: { type: 'string' },
                    },
                    required: ['title', 'word'],
                  },
                  future: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      promise: { type: 'string' },
                    },
                    required: ['title', 'promise'],
                  },
                },
                required: ['past', 'present', 'future'],
              },
              daily: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  date: { type: 'string' },
                  scripture: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      reference: { type: 'string' },
                      text: { type: 'string' },
                    },
                    required: ['reference', 'text'],
                  },
                  reflection: { type: 'string' },
                  prayer: { type: 'string' },
                  actionStep: { type: 'string' },
                },
                required: ['title', 'date', 'scripture', 'reflection', 'prayer', 'actionStep'],
              },
            },
            required: ['insight', 'life', 'prophecy', 'daily'],
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${userPrompt}\nReturn ONLY valid JSON that matches the schema.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    if (!content) {
      throw new Error('AI response was empty.');
    }
    const raw = content.trim();
    try {
      const parsed = JSON.parse(raw) as DashboardResponse;
      await incrementUsage(userId, INSIGHT_FEATURE_KEY);
      return NextResponse.json(parsed);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('AI response was not valid JSON.');
      }
      const parsed = JSON.parse(match[0]) as DashboardResponse;
      await incrementUsage(userId, INSIGHT_FEATURE_KEY);
      return NextResponse.json(parsed);
    }
  };

  try {
    return await attempt();
  } catch (error) {
    try {
      return await attempt();
    } catch (retryError) {
      const normalized = normalizeError(retryError);
      console.error('AI dashboard error', normalized);
      return NextResponse.json(
        { error: normalized.code, message: normalized.message },
        { status: normalized.status }
      );
    }
  }
}
