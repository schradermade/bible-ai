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
    // Use bible-api.com - it's free and doesn't require authentication
    // Format: https://bible-api.com/john+3:16
    const encodedReference = encodeURIComponent(reference.replace(/\s+/g, '+'));
    const response = await fetch(`https://bible-api.com/${encodedReference}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'verse_not_found', message: 'Could not find the verse' },
        { status: 404 }
      );
    }

    const data: BibleAPIResponse = await response.json();

    // Return formatted verse data
    return NextResponse.json({
      reference: data.reference,
      text: data.text.trim(),
      translation: data.translation_name || 'KJV',
    });
  } catch (error) {
    console.error('Bible API error:', error);
    return NextResponse.json(
      { error: 'api_error', message: 'Failed to fetch verse from Bible API' },
      { status: 500 }
    );
  }
}
