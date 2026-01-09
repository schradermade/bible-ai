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
    // Use bible-api.com with KJV (default, public domain)
    // Format: https://bible-api.com/john+3:16
    // KJV is public domain - no licensing restrictions
    const encodedReference = encodeURIComponent(reference.replace(/\s+/g, '+'));
    const apiUrl = `https://bible-api.com/${encodedReference}`;

    const response = await fetch(apiUrl);

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
    return NextResponse.json(
      { error: 'api_error', message: 'Failed to fetch verse from Bible API' },
      { status: 500 }
    );
  }
}
