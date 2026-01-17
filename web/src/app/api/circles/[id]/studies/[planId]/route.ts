import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, canViewProgress } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/studies/[planId]
 * Get details of a specific circle study plan
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; planId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, planId } = params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch circle study plan
    const studyPlan = await prisma.circleStudyPlan.findUnique({
      where: { id: planId },
      include: {
        memberPlans: {
          include: {
            studyPlan: {
              include: {
                days: {
                  orderBy: {
                    dayNumber: 'asc',
                  },
                  select: {
                    id: true,
                    dayNumber: true,
                    title: true,
                    completed: true,
                    completedAt: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            memberPlans: true,
            reflections: true,
          },
        },
      },
    });

    if (!studyPlan) {
      return NextResponse.json(
        { error: 'not_found', message: 'Study plan not found' },
        { status: 404 }
      );
    }

    // Verify study plan belongs to the circle
    if (studyPlan.circleId !== circleId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Study plan does not belong to this circle' },
        { status: 403 }
      );
    }

    // Filter member progress based on privacy settings
    const filteredMemberPlans = await Promise.all(
      studyPlan.memberPlans.map(async (memberPlan) => {
        const canView = await canViewProgress(
          circleId,
          memberPlan.userId,
          userId
        );

        if (!canView && memberPlan.userId !== userId) {
          // Hide progress details for users who haven't enabled sharing
          return {
            ...memberPlan,
            studyPlan: {
              ...memberPlan.studyPlan,
              days: [],
            },
          };
        }

        return memberPlan;
      })
    );

    const filteredStudyPlan = {
      ...studyPlan,
      memberPlans: filteredMemberPlans,
    };

    return NextResponse.json({
      success: true,
      studyPlan: filteredStudyPlan,
    });
  } catch (error) {
    console.error('[API] Failed to fetch circle study plan:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
