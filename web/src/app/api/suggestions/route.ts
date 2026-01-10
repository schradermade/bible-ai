import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET /api/suggestions - Generate personalized conversation suggestions
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to get suggestions.' },
      { status: 401 }
    );
  }

  try {
    // Fetch user's last 5 conversations with messages
    const recentConversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Limit messages per conversation to keep context manageable
        },
      },
    });

    // If user has fewer than 2 conversations, return default suggestions
    if (recentConversations.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [
          'How do I deal with anxiety?',
          'What does the Bible say about forgiveness?',
          'Help me understand Romans 8',
        ],
        personalized: false,
      });
    }

    // Build conversation summaries for context
    const conversationSummaries = recentConversations.map((conv, index) => {
      const title = conv.title || 'Untitled conversation';
      const messagePreview = conv.messages
        .slice(0, 3) // First 3 messages to capture the essence
        .map(m => `${m.role}: ${m.content.substring(0, 150)}...`)
        .join('\n');

      return `${index + 1}. ${title}\n${messagePreview}`;
    }).join('\n\n');

    // Generate personalized suggestions using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a thoughtful Bible study assistant helping generate personalized follow-up questions for a user based on their recent conversation history.

Your task is to analyze their recent discussions and suggest 3 engaging questions they might want to explore next. These suggestions should:
- Build naturally on themes from their recent conversations
- Encourage deeper biblical understanding or practical application
- Feel conversational and inviting (not academic or preachy)
- Be concise (under 12 words each)
- Lead to meaningful spiritual growth

Format your response as a JSON array of 3 strings, nothing else.
Example: ["How can I apply grace in difficult relationships?", "What does Scripture say about handling fear?", "Help me understand prayer in the Psalms"]`,
        },
        {
          role: 'user',
          content: `Based on this user's recent Bible study conversations, generate 3 personalized follow-up questions they might want to explore:\n\n${conversationSummaries}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the JSON array from OpenAI
    let suggestions: string[];
    try {
      suggestions = JSON.parse(responseContent);

      // Validate that we got an array of 3 strings
      if (!Array.isArray(suggestions) || suggestions.length !== 3 || !suggestions.every(s => typeof s === 'string')) {
        throw new Error('Invalid format from OpenAI');
      }
    } catch (parseError) {
      console.error('[API] Failed to parse suggestions:', parseError);
      // Fallback to defaults
      return NextResponse.json({
        success: true,
        suggestions: [
          'How do I deal with anxiety?',
          'What does the Bible say about forgiveness?',
          'Help me understand Romans 8',
        ],
        personalized: false,
      });
    }

    return NextResponse.json({
      success: true,
      suggestions,
      personalized: true,
    });

  } catch (error) {
    console.error('[API] Failed to generate suggestions:', error);

    // Return default suggestions on error
    return NextResponse.json({
      success: true,
      suggestions: [
        'How do I deal with anxiety?',
        'What does the Bible say about forgiveness?',
        'Help me understand Romans 8',
      ],
      personalized: false,
    });
  }
}
