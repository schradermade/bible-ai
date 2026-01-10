import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/conversations - List all conversations for the user
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to view conversations.' },
      { status: 401 }
    );
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    // Format response with message count
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv._count.messages,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error('[API] Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to fetch conversations.' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to create a conversation.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { title } = body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || null,
      },
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to create conversation.' },
      { status: 500 }
    );
  }
}
