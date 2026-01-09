import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function getOrigin(request: Request) {
  return (
    request.headers.get("origin") ||
    request.headers.get("referer")?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://bereastudy.com"
  );
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const PRICE_ID = process.env.STRIPE_PRICE_ID;

    if (!PRICE_ID) {
      return NextResponse.json(
        { error: "stripe_price_missing" },
        { status: 500 }
      );
    }

    const origin = getOrigin(request);
    if (!origin) {
      return NextResponse.json({ error: "app_url_missing" }, { status: 500 });
    }

    const stripe = getStripe();
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

  const existing = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  let stripeCustomerId = existing?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { clerkUserId: userId },
    });
    stripeCustomerId = customer.id;
  }

  await prisma.userSubscription.upsert({
    where: { userId },
    update: { stripeCustomerId },
    create: {
      userId,
      stripeCustomerId,
      status: "incomplete",
    },
  });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: userId,
      subscription_data: {
        metadata: { clerkUserId: userId },
      },
      success_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: "checkout_failed" },
      { status: 500 }
    );
  }
}
