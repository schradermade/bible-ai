import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionStatus(userId);
  if (!subscription.isActive) {
    return NextResponse.json(
      {
        error: "subscription_required",
        message: "Upgrade to save insights.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const feature = typeof body.feature === "string" ? body.feature : "";
  const reference = typeof body.reference === "string" ? body.reference : null;
  const prompt = typeof body.prompt === "string" ? body.prompt : null;
  const response = typeof body.response === "string" ? body.response : "";

  if (!feature || !response) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const saved = await prisma.savedAiResponse.create({
    data: {
      userId,
      feature,
      reference,
      prompt,
      response,
    },
  });

  return NextResponse.json({ id: saved.id });
}
