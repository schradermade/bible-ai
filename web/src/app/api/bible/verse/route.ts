import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface BibleAPIResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'reference_required', message: 'Bible reference is required' },
      { status: 400 }
    );
  }

  try {
    // Use bible-api.com with KJV (public domain)
    // Format: https://bible-api.com/john+3:16?translation=kjv
    // KJV is public domain - no licensing restrictions
    const encodedReference = encodeURIComponent(reference.replace(/\s+/g, '+'));
    const apiUrl = `https://bible-api.com/${encodedReference}?translation=kjv`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout and cache options for production
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const statusText = response.statusText;
      console.error(`Bible API error: ${response.status} ${statusText} for reference: ${reference}`);
      return NextResponse.json(
        { error: 'verse_not_found', message: `Could not find the verse: ${reference}` },
        { status: 404 }
      );
    }

    const data: BibleAPIResponse = await response.json();

    if (!data.text || data.text.trim().length === 0) {
      console.error(`Bible API returned empty text for reference: ${reference}`);
      return NextResponse.json(
        { error: 'verse_empty', message: 'Verse text is empty' },
        { status: 404 }
      );
    }

    // Return formatted verse data
    return NextResponse.json({
      reference: data.reference,
      text: data.text.trim(),
      translation: data.translation_name || 'KJV',
    });
  } catch (error) {
    console.error('Bible API fetch error:', error);
    return NextResponse.json(
      {
        error: 'api_error',
        message: 'Failed to fetch verse from Bible API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
