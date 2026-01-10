import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Fetch all prayers for the user
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const prayers = await prisma.prayerRequest.findMany({
    where: { userId },
    orderBy: [
      { status: 'asc' }, // ongoing first
      { createdAt: 'desc' } // newest first within each status
    ],
  });

  return NextResponse.json({ prayers });
}

// POST - Create a new prayer
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content : "";
    const source = typeof body.source === "string" ? body.source : "manual";
    const sourceReference = typeof body.sourceReference === "string" ? body.sourceReference : null;

    if (!content) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    console.log('[API] Creating prayer:', { content, source, sourceReference, userId });

    const prayer = await prisma.prayerRequest.create({
      data: {
        userId,
        content,
        source,
        sourceReference,
        status: "ongoing",
      },
    });

    console.log('[API] Prayer created successfully:', prayer.id);
    return NextResponse.json({ success: true, prayer });
  } catch (error) {
    console.error('[API] Failed to create prayer:', error);
    return NextResponse.json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// PATCH - Update a prayer (mark as answered/ongoing)
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";

    if (!id || !status) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Verify the prayer belongs to the user
    const existing = await prisma.prayerRequest.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const prayer = await prisma.prayerRequest.update({
      where: { id },
      data: {
        status,
        answeredAt: status === "answered" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, prayer });
  } catch (error) {
    console.error('[API] Failed to update prayer:', error);
    return NextResponse.json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE - Remove a prayer
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Delete only if belongs to user
  await prisma.prayerRequest.deleteMany({
    where: {
      id,
      userId,
    },
  });

  return NextResponse.json({ success: true });
}
