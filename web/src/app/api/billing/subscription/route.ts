import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type Action = "cancel" | "resume";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;

  if (!action || !["cancel", "resume"].includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const subscriptionRecord = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscriptionRecord?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "subscription_not_found" },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const updated = await stripe.subscriptions.update(
    subscriptionRecord.stripeSubscriptionId,
    {
      cancel_at_period_end: action === "cancel",
    }
  );

  const priceId = updated.items.data[0]?.price?.id ?? null;
  const currentPeriodEnd = updated.current_period_end
    ? new Date(updated.current_period_end * 1000)
    : null;

  await prisma.userSubscription.update({
    where: { userId },
    data: {
      status: updated.status,
      priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    },
  });

  return NextResponse.json({
    status: updated.status,
    cancelAtPeriodEnd: updated.cancel_at_period_end,
    currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
  });
}
