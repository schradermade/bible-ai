import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getBillingPeriodEnd,
  getBillingPeriodStart,
  getSubscriptionStatus,
  getUsageCount,
  getUsageLimit,
  INSIGHT_FEATURE_KEY,
} from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionStatus(userId);
  const usageCount = await getUsageCount(userId, INSIGHT_FEATURE_KEY);
  const usageLimit = getUsageLimit(subscription.isActive);

  return NextResponse.json({
    isActive: subscription.isActive,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    usageCount,
    usageLimit,
    periodStart: getBillingPeriodStart().toISOString(),
    periodEnd: getBillingPeriodEnd().toISOString(),
  });
}
