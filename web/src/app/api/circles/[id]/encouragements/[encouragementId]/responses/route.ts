import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

const VALID_SOURCES = ['ai_generated', 'user_custom'];

/**
 * POST /api/circles/[id]/encouragements/[encouragementId]/responses
 * Create a response to an encouragement prompt
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; encouragementId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, encouragementId } = await params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, source, scriptureRef, scriptureText, reflection, prayerPrompt } = body;

    // Validate source
    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: `Source must be one of: ${VALID_SOURCES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Response content is required' },
        { status: 400 }
      );
    }

    if (source === 'user_custom' && content.length > 500) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Custom response must be 500 characters or less',
        },
        { status: 400 }
      );
    }

    // Verify encouragement exists and belongs to this circle
    const encouragement = await prisma.circleEncouragement.findUnique({
      where: { id: encouragementId },
    });

    if (!encouragement) {
      return NextResponse.json(
        { error: 'not_found', message: 'Encouragement prompt not found' },
        { status: 404 }
      );
    }

    if (encouragement.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Encouragement does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Create response
    const response = await prisma.circleEncouragementResponse.create({
      data: {
        encouragementId,
        userId,
        content: content.trim(),
        source,
        scriptureRef: scriptureRef?.trim() || null,
        scriptureText: scriptureText?.trim() || null,
        reflection: reflection?.trim() || null,
        prayerPrompt: prayerPrompt?.trim() || null,
      },
      include: {
        reactions: true,
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('[API] Failed to create encouragement response:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
