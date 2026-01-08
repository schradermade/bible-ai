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

// POST - Mark a verse as memorized
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const reference = typeof body.reference === "string" ? body.reference : "";
  const text = typeof body.text === "string" ? body.text : null;

  if (!reference) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Upsert: create if doesn't exist, update memorizedAt if it does
  const memorized = await prisma.memorizedVerse.upsert({
    where: {
      userId_reference: {
        userId,
        reference,
      },
    },
    update: {
      memorizedAt: new Date(),
      text: text || undefined, // Update text if provided
    },
    create: {
      userId,
      reference,
      text,
    },
  });

  return NextResponse.json({ success: true, verse: memorized });
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
