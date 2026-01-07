import prisma from "@/lib/prisma";

export const FREE_INSIGHT_LIMIT = 10;
export const PAID_INSIGHT_LIMIT = 100;
export const INSIGHT_FEATURE_KEY = "insight";

type SubscriptionStatus = {
  isActive: boolean;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

export function getBillingPeriodStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getBillingPeriodEnd(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return {
      isActive: false,
      status: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    };
  }

  const isActive = ["active", "trialing"].includes(subscription.status);

  return {
    isActive,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

export async function getUsageCount(userId: string, feature: string) {
  const periodStart = getBillingPeriodStart();
  const record = await prisma.usageCounter.findUnique({
    where: {
      userId_feature_periodStart: {
        userId,
        feature,
        periodStart,
      },
    },
  });

  return record?.count ?? 0;
}

export async function incrementUsage(userId: string, feature: string) {
  const periodStart = getBillingPeriodStart();

  await prisma.usageCounter.upsert({
    where: {
      userId_feature_periodStart: {
        userId,
        feature,
        periodStart,
      },
    },
    update: { count: { increment: 1 } },
    create: { userId, feature, periodStart, count: 1 },
  });
}

export function getUsageLimit(isActiveSubscription: boolean) {
  return isActiveSubscription ? PAID_INSIGHT_LIMIT : FREE_INSIGHT_LIMIT;
}
