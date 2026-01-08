import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function getOrigin(request: Request) {
  const origin = request.headers.get("origin") ||
    request.headers.get("referer")?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://bereastudy.com";

  console.log('[Checkout] Origin:', origin);
  return origin;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log('[Checkout] Error: No userId');
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.log('[Checkout] UserId:', userId);

    const PRICE_ID = process.env.STRIPE_PRICE_ID;

    if (!PRICE_ID) {
      console.log('[Checkout] Error: STRIPE_PRICE_ID not set');
      return NextResponse.json(
        { error: "stripe_price_missing" },
        { status: 500 }
      );
    }

    console.log('[Checkout] Price ID:', PRICE_ID);

    const origin = getOrigin(request);
    if (!origin) {
      console.log('[Checkout] Error: Could not determine origin');
      return NextResponse.json({ error: "app_url_missing" }, { status: 500 });
    }

    const stripe = getStripe();
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    console.log('[Checkout] User email:', email);

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

    console.log('[Checkout] Session created:', session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      {
        error: "checkout_failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
