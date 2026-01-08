import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 }
    );
  }

  try {
    const history = await prisma.savedAiResponse.findMany({
      where: {
        userId,
        feature: 'dashboard',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to most recent 20
      select: {
        id: true,
        prompt: true,
        response: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'failed_to_fetch_history' },
      { status: 500 }
    );
  }
}
