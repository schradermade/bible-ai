import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Mock endpoint for testing subscription UI without Stripe.
 * This toggles between free and plus plans for development/testing purposes.
 * DO NOT use in production.
 */
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  const existing = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  // Toggle between active and inactive
  const isCurrentlyActive =
    existing?.status === "active" || existing?.status === "trialing";

  if (isCurrentlyActive) {
    // Downgrade to free - delete or mark as canceled
    if (existing) {
      await prisma.userSubscription.delete({
        where: { userId },
      });
    }
    return NextResponse.json({ success: true, status: "free" });
  } else {
    // Upgrade to plus - create or update with active status
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        status: "active",
        stripeCustomerId: `mock_customer_${userId}`,
        stripeSubscriptionId: `mock_sub_${userId}`,
        currentPeriodEnd: oneMonthFromNow,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        status: "active",
        stripeCustomerId: `mock_customer_${userId}`,
        stripeSubscriptionId: `mock_sub_${userId}`,
        currentPeriodEnd: oneMonthFromNow,
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({ success: true, status: "plus" });
  }
}
