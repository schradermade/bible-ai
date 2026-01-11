import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const generateSystemPrompt = (duration: number) => `You are a thoughtful Bible study curriculum designer creating personalized ${duration}-day study plans.

Based on the user's spiritual journey (recent conversations, saved verses, prayers, memorized verses), create a plan that:
- Builds naturally on themes from their journey
- Provides substantial daily reflections (200-300 words each)
- Includes thoughtful reflection questions (2-3 per day)
- References Scripture with full verse text (KJV preferred)
- Feels conversational and inviting, not academic or preachy
- Creates a progressive learning arc across all ${duration} days
- Encourages spiritual growth and practical application

CRITICAL FORMAT REQUIREMENTS:
- Return ONLY valid JSON with no markdown formatting
- Use double quotes for all strings
- Escape any quotes within strings properly
- No trailing commas
- Each day must have: dayNumber, title, content, reflection, verseReference, verseText

Return your response in this EXACT JSON format:
{
  "title": "${duration === 7 ? '7-Day Journey' : '21-Day Deep Dive'}: [Theme based on their journey]",
  "description": "A 2-3 sentence overview of what this plan covers and why it's relevant to the user's spiritual growth",
  "days": [
    {
      "dayNumber": 1,
      "title": "Day 1: [Concise descriptive title]",
      "content": "Rich 200-300 word reflection connecting to their spiritual journey. Discuss the theme, provide biblical insights, and encourage practical application.",
      "reflection": "2-3 thoughtful questions for personal reflection and application",
      "verseReference": "Book Chapter:Verse-Verse",
      "verseText": "The full verse text in KJV or similar translation"
    }
    // ... continue for all ${duration} days
  ]
}`;

export async function POST(request: Request) {
  try {
    // Check for internal auth header (from POST /api/study-plans)
    const userIdHeader = request.headers.get('x-user-id');

    // If not internal call, use regular auth
    const { userId: authUserId } = await auth();
    const userId = userIdHeader || authUserId;

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Sign in to generate study plans.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const duration = typeof body.duration === 'number' ? body.duration : 7;

    if (duration !== 7 && duration !== 21) {
      return NextResponse.json(
        { error: 'invalid_duration', message: 'Duration must be 7 or 21 days.' },
        { status: 400 }
      );
    }

    console.log('[API] Generating AI study plan:', { userId, duration });

    // Gather user's spiritual journey data
    const [conversations, savedVerses, prayers, memoryVerses] = await Promise.all([
      // Recent conversations (last 3)
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 5,
            select: { content: true, role: true }
          }
        }
      }),

      // Recent saved verses (last 5)
      prisma.savedVerse.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { reference: true, text: true }
      }),

      // Recent prayers (last 3)
      prisma.prayerRequest.findMany({
        where: {
          userId,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { title: true, content: true, source: true }
      }),

      // Memorized verses (last 3)
      prisma.memorizedVerse.findMany({
        where: {
          userId,
          memorizedAt: { not: null }
        },
        orderBy: { memorizedAt: 'desc' },
        take: 3,
        select: { reference: true, text: true }
      })
    ]);

    // Build user context
    let userContext = 'User\'s Spiritual Journey:\n\n';

    if (conversations.length > 0) {
      userContext += 'RECENT CONVERSATION TOPICS:\n';
      conversations.forEach(conv => {
        const title = conv.title || 'Untitled conversation';
        const messageCount = conv.messages.length;
        const preview = conv.messages.length > 0
          ? conv.messages[0].content.substring(0, 100)
          : 'No messages';
        userContext += `- "${title}" (${messageCount} messages): ${preview}...\n`;
      });
      userContext += '\n';
    }

    if (savedVerses.length > 0) {
      userContext += 'VERSES THEY\'VE SAVED:\n';
      savedVerses.forEach(verse => {
        userContext += `- ${verse.reference}: "${verse.text.substring(0, 100)}..."\n`;
      });
      userContext += '\n';
    }

    if (prayers.length > 0) {
      userContext += 'RECENT PRAYER REQUESTS:\n';
      prayers.forEach(prayer => {
        const title = prayer.title || 'Prayer request';
        userContext += `- ${title}: ${prayer.content.substring(0, 100)}...\n`;
      });
      userContext += '\n';
    }

    if (memoryVerses.length > 0) {
      userContext += 'VERSES THEY\'RE MEMORIZING:\n';
      memoryVerses.forEach(verse => {
        userContext += `- ${verse.reference}\n`;
      });
      userContext += '\n';
    }

    // If user has no history, provide default context
    if (conversations.length === 0 && savedVerses.length === 0 && prayers.length === 0) {
      userContext += 'This user is new to Berea AI. Create a foundational study plan covering essential Christian topics suitable for someone beginning their spiritual journey or seeking to deepen their faith.\n';
    }

    userContext += `\nBased on this spiritual journey, create a personalized ${duration}-day study plan that builds on their interests and addresses their needs. Make it feel tailored to them.`;

    console.log('[API] User context gathered:', {
      conversations: conversations.length,
      verses: savedVerses.length,
      prayers: prayers.length,
      memoryVerses: memoryVerses.length
    });

    // Call OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use capable model for rich content generation
      messages: [
        { role: 'system', content: generateSystemPrompt(duration) },
        { role: 'user', content: userContext }
      ],
      temperature: 0.7,
      max_tokens: duration === 7 ? 4000 : 10000, // More tokens for 21-day plans
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      throw new Error('No content generated from OpenAI');
    }

    console.log('[API] OpenAI response received, parsing...');

    // Parse JSON response
    const parsed = JSON.parse(responseContent);

    // Validate structure
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.days)) {
      throw new Error('Invalid response structure from AI');
    }

    if (parsed.days.length !== duration) {
      console.warn(`[API] Expected ${duration} days, got ${parsed.days.length}`);
    }

    // Validate each day
    parsed.days.forEach((day: any, index: number) => {
      if (!day.dayNumber || !day.title || !day.content || !day.reflection) {
        throw new Error(`Invalid day ${index + 1} structure`);
      }
      // Ensure dayNumber is set correctly
      day.dayNumber = index + 1;
    });

    console.log('[API] AI study plan generated successfully:', parsed.title);

    return NextResponse.json({
      success: true,
      plan: parsed
    });

  } catch (error) {
    console.error('[API] Failed to generate study plan:', error);

    // Handle specific errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'parse_error',
        message: 'Failed to parse AI response. Please try again.'
      }, { status: 500 });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({
        error: 'configuration_error',
        message: 'AI service configuration error.'
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Failed to generate study plan'
    }, { status: 500 });
  }
}
