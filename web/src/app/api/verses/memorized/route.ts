import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Fetch all memorized verses for the user
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const memorizedVerses = await prisma.memorizedVerse.findMany({
    where: { userId },
    orderBy: { memorizedAt: 'desc' },
  });

  return NextResponse.json({ verses: memorizedVerses });
}

// POST - Add verse to memory list or mark as memorized
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const reference = typeof body.reference === "string" ? body.reference : "";
    const text = typeof body.text === "string" ? body.text : null;
    const markAsMemorized = typeof body.markAsMemorized === "boolean" ? body.markAsMemorized : false;

    if (!reference) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    console.log('[API] Saving verse:', { reference, text, markAsMemorized, userId });

    // Build update and create objects conditionally
    const updateData: any = {};
    if (text) updateData.text = text;
    if (markAsMemorized) {
      updateData.memorizedAt = new Date();
    } else {
      updateData.memorizedAt = null; // Explicitly set to null when unmarking
    }

    const createData: any = {
      userId,
      reference,
      memorizedAt: markAsMemorized ? new Date() : null, // Explicitly set null if not memorized
    };
    if (text) createData.text = text;

    // Upsert: create if doesn't exist, update if it does
    const memorized = await prisma.memorizedVerse.upsert({
      where: {
        userId_reference: {
          userId,
          reference,
        },
      },
      update: updateData,
      create: createData,
    });

    console.log('[API] Verse saved successfully:', memorized.id);
    return NextResponse.json({ success: true, verse: memorized });
  } catch (error) {
    console.error('[API] Failed to save memorized verse:', error);
    return NextResponse.json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE - Remove a memorized verse
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

  await prisma.memorizedVerse.deleteMany({
    where: {
      userId,
      reference,
    },
  });

  return NextResponse.json({ success: true });
}
