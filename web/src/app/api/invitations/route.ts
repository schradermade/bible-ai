import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/invitations
 * Get all pending invitations for the current user
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Note: For now, we're not filtering by email since we don't have
    // a user email mapping. In Phase 3, we'll implement email invitations
    // properly with Clerk user data.

    // For now, return empty array (invitations work via shareable links)
    return NextResponse.json({
      success: true,
      invitations: [],
    });
  } catch (error) {
    console.error('[API] Failed to fetch invitations:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
