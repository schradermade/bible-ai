import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/conversations/[id] - Get a specific conversation with all messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to view conversation.' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'You do not have access to this conversation.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        summary: conversation.summary,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch conversation:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to fetch conversation.' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation (cascade deletes messages)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sign in to delete conversation.' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // First verify the conversation exists and belongs to the user
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found.' },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'You do not have access to this conversation.' },
        { status: 403 }
      );
    }

    // Delete the conversation (messages will be cascade deleted)
    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error) {
    console.error('[API] Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to delete conversation.' },
      { status: 500 }
    );
  }
}
