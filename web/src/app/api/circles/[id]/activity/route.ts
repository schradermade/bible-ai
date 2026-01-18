import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

type Activity = {
  id: string;
  type: 'reflection' | 'prayer' | 'verse' | 'study_progress';
  userId: string;
  content?: string;
  reference?: string;
  title?: string;
  dayNumber?: number;
  studyPlanId?: string;
  createdAt: Date;
};

/**
 * GET /api/circles/[id]/activity
 * Get activity feed for the circle
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch recent reflections
    const reflections = await prisma.circleDayReflection.findMany({
      where: {
        circleStudyPlan: {
          circleId,
        },
      },
      select: {
        id: true,
        userId: true,
        dayNumber: true,
        content: true,
        createdAt: true,
        circleStudyPlanId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Fetch recent prayers
    const prayers = await prisma.circlePrayerRequest.findMany({
      where: {
        circleId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Fetch recent verses
    const verses = await prisma.circleSharedVerse.findMany({
      where: {
        circleId,
      },
      select: {
        id: true,
        userId: true,
        reference: true,
        note: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Combine and sort activities
    const activities: Activity[] = [
      ...reflections.map((r) => ({
        id: r.id,
        type: 'reflection' as const,
        userId: r.userId,
        content: r.content.substring(0, 100),
        dayNumber: r.dayNumber,
        studyPlanId: r.circleStudyPlanId,
        createdAt: r.createdAt,
      })),
      ...prayers.map((p) => ({
        id: p.id,
        type: 'prayer' as const,
        userId: p.userId,
        title: p.title || undefined,
        content: p.content.substring(0, 100),
        createdAt: p.createdAt,
      })),
      ...verses.map((v) => ({
        id: v.id,
        type: 'verse' as const,
        userId: v.userId,
        reference: v.reference,
        content: v.note?.substring(0, 100),
        createdAt: v.createdAt,
      })),
    ];

    // Sort by date
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Limit results
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
    });
  } catch (error) {
    console.error('[API] Failed to fetch activity:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
