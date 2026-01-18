import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import {
  getSubscriptionStatus,
  getUsageCount,
  getUsageLimit,
  incrementUsage,
  INSIGHT_FEATURE_KEY,
} from '@/lib/billing';

export const runtime = 'nodejs';

const TOPIC_LABELS: Record<string, string> = {
  faith_doubt: 'Faith & Doubt',
  relationships: 'Relationships',
  purpose: 'Purpose',
  prayer: 'Prayer',
  scripture_study: 'Scripture Study',
  spiritual_growth: 'Spiritual Growth',
  forgiveness: 'Forgiveness',
  hope_healing: 'Hope & Healing',
};

const SEASON_LABELS: Record<string, string> = {
  seeking: 'Seeking answers',
  growing: 'Growing deeper',
  struggling: 'Struggling with doubt',
  celebrating: 'Celebrating breakthrough',
  distant: 'Feeling distant',
  serving: 'Ready to serve',
};

const PACE_LABELS: Record<string, string> = {
  light: 'Light (5-10 min daily)',
  moderate: 'Moderate (15-20 min daily)',
  deep: 'Deep (25-30 min daily)',
};

function buildCollaborativeStudyPrompt(
  intentions: any[],
  duration: number
): string {
  // Aggregate topics
  const topicCounts: Record<string, number> = {};
  intentions.forEach((intention) => {
    const topics = JSON.parse(intention.selectedTopics);
    topics.forEach((topic: string) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const sortedTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([topic, count]) => `${TOPIC_LABELS[topic]} (${count} members)`);

  // Average depth level
  const avgDepth =
    intentions.reduce((sum, i) => sum + i.depthLevel, 0) / intentions.length;

  // Aggregate seasons
  const seasonCounts: Record<string, number> = {};
  intentions.forEach((intention) => {
    seasonCounts[intention.currentSeason] =
      (seasonCounts[intention.currentSeason] || 0) + 1;
  });

  const sortedSeasons = Object.entries(seasonCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([season, count]) => `${SEASON_LABELS[season]} (${count} members)`);

  // Aggregate pace
  const paceCounts: Record<string, number> = {};
  intentions.forEach((intention) => {
    paceCounts[intention.studyPace] = (paceCounts[intention.studyPace] || 0) + 1;
  });

  const mostCommonPace = Object.entries(paceCounts).sort(
    ([, a], [, b]) => b - a
  )[0][0];

  // Collect heart questions
  const heartQuestions = intentions
    .filter((i) => i.heartQuestion)
    .map((i) => `"${i.heartQuestion}"`);

  const prompt = `You are a pastoral study designer creating a personalized Bible study for a small group.

COLLECTIVE GROUP INPUT:
- Group Size: ${intentions.length} members
- Top Topics: ${sortedTopics.join(', ')}
- Average Depth Preference: Level ${Math.round(avgDepth)}/10 (1=foundational, 10=deep theological)
- Spiritual Seasons Represented: ${sortedSeasons.join(', ')}
- Preferred Pace: ${PACE_LABELS[mostCommonPace]}
${heartQuestions.length > 0 ? `- Heart Questions from Members:\n  ${heartQuestions.join('\n  ')}` : ''}

REQUIREMENTS:
1. Create a cohesive ${duration}-day study that addresses the group's collective journey
2. Balance multiple topics proportionally - weave in the top 2-3 topics throughout the study
3. Honor the emotional/spiritual seasons represented - acknowledge both struggles and celebrations
4. Calibrate daily content length to match the group's pace preference:
   - Light: 300-400 words per day
   - Moderate: 400-600 words per day
   - Deep: 600-800 words per day
5. Incorporate heart questions as recurring thematic threads throughout the study
6. Match theological depth to the group's average preference (Level ${Math.round(avgDepth)}/10)

OUTPUT FORMAT (valid JSON only):
{
  "title": "Study title that reflects the group's collective themes (6-8 words)",
  "description": "2-3 sentences describing what this study will explore and why it matters for this group's journey",
  "days": [
    {
      "dayNumber": 1,
      "title": "Compelling day title (4-6 words)",
      "content": "Main teaching content - pastoral, warm, Scripture-grounded. Match the word count to the group's pace preference.",
      "reflection": "2-3 thoughtful reflection questions that encourage personal application",
      "prayer": "A short prayer prompt (2-3 sentences) that ties the day's teaching to conversation with God",
      "verseReference": "Book Chapter:Verse",
      "verseText": "Full verse text from ESV or similar translation"
    }
  ]
}

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Include exactly ${duration} days in the days array
- Every day must have all fields: dayNumber, title, content, reflection, prayer, verseReference, verseText
- Use diverse Scripture passages - don't repeat the same verses
- Ensure day numbers are sequential from 1 to ${duration}

TONE: Calm, pastoral, Scripture-grounded, inclusive of diverse perspectives, warm and encouraging
AVOID: Forcing consensus, minimizing struggles, one-size-fits-all advice, overly dramatic language, clichés`;

  return prompt;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { circleId, duration } = body;

    // Validate duration
    if (![7, 21].includes(duration)) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Duration must be 7 or 21 days' },
        { status: 400 }
      );
    }

    // Verify circle exists and user is creator
    const circle = await prisma.studyCircle.findUnique({
      where: { id: circleId },
      include: {
        members: true,
      },
    });

    if (!circle) {
      return NextResponse.json(
        { error: 'not_found', message: 'Circle not found' },
        { status: 404 }
      );
    }

    if (circle.createdBy !== userId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Only the circle creator can generate studies',
        },
        { status: 403 }
      );
    }

    // Check for active study
    const activeStudy = await prisma.circleStudyPlan.findFirst({
      where: {
        circleId,
        status: 'active',
      },
    });

    if (activeStudy) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Circle already has an active study',
        },
        { status: 403 }
      );
    }

    // Fetch all intentions
    const intentions = await prisma.circleStudyIntention.findMany({
      where: { circleId },
    });

    // Validate minimum submissions
    const totalMembers = circle.members.length;
    const minSubmissions = Math.max(2, Math.ceil(totalMembers * 0.5));

    if (intentions.length < minSubmissions) {
      return NextResponse.json(
        {
          error: 'insufficient_data',
          message: `Need at least ${minSubmissions} member submissions to generate a study`,
        },
        { status: 400 }
      );
    }

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

    // Build prompt
    const prompt = buildCollaborativeStudyPrompt(intentions, duration);

    // Call OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: duration === 7 ? 4000 : 12000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      throw new Error('No study generated');
    }

    // Parse JSON response
    const parsedResponse = JSON.parse(responseContent);
    const { title, description, days } = parsedResponse;

    if (!title || !description || !Array.isArray(days) || days.length !== duration) {
      console.error('Invalid study response:', parsedResponse);
      throw new Error('Invalid study response format');
    }

    // Validate each day has required fields
    for (const day of days) {
      if (
        !day.dayNumber ||
        !day.title ||
        !day.content ||
        !day.reflection ||
        !day.prayer ||
        !day.verseReference ||
        !day.verseText
      ) {
        console.error('Invalid day format:', day);
        throw new Error('Invalid day format in study');
      }
    }

    // Increment usage
    await incrementUsage(userId, INSIGHT_FEATURE_KEY);

    return NextResponse.json({
      success: true,
      study: {
        title,
        description,
        duration,
        days,
      },
    });
  } catch (error) {
    console.error('[API] Collaborative study generation error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'AI service unavailable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Failed to generate study',
      },
      { status: 500 }
    );
  }
}
