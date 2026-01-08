import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getSubscriptionStatus,
  getUsageCount,
  getUsageLimit,
  INSIGHT_FEATURE_KEY,
} from '@/lib/billing';

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
    const subscription = await getSubscriptionStatus(userId);
    const usageCount = await getUsageCount(userId, INSIGHT_FEATURE_KEY);
    const usageLimit = getUsageLimit(subscription.isActive);
    const remaining = Math.max(0, usageLimit - usageCount);

    return NextResponse.json({
      used: usageCount,
      limit: usageLimit,
      remaining,
      isSubscribed: subscription.isActive,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'failed_to_fetch_usage' },
      { status: 500 }
    );
  }
}
