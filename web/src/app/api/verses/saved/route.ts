import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Fetch all saved verses for the user
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const savedVerses = await prisma.savedVerse.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ verses: savedVerses });
}

// POST - Save a verse
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const reference = typeof body.reference === "string" ? body.reference : "";
    const text = typeof body.text === "string" ? body.text : "";

    if (!reference || !text) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    console.log('[API] Saving verse:', { reference, text, userId });

    // Upsert: create if doesn't exist, update if it does
    const savedVerse = await prisma.savedVerse.upsert({
      where: {
        userId_reference: {
          userId,
          reference,
        },
      },
      update: {
        text,
      },
      create: {
        userId,
        reference,
        text,
      },
    });

    console.log('[API] Verse saved successfully:', savedVerse.id);
    return NextResponse.json({ success: true, verse: savedVerse });
  } catch (error) {
    console.error('[API] Failed to save verse:', error);
    return NextResponse.json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE - Remove a saved verse
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const reference = typeof body.reference === "string" ? body.reference : "";

  if (!reference) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  await prisma.savedVerse.deleteMany({
    where: {
      userId,
      reference,
    },
  });

  return NextResponse.json({ success: true });
}
