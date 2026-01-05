// src/app/.well-known/gpc.json/route.ts
import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';

  // Example logic (optional)
  const enabled = true; // or env flag, tenant config, etc.

  return NextResponse.json(
    { gpc: enabled },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Content-Type': 'application/json',
      },
    }
  );
}
