import { searchArticles } from '@/app/lib/elasticsearch';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query, limit = 10, page = 1 } = await req.json();

  const skip = (page - 1) * limit;

  try {
    const results = await searchArticles(query, skip, limit);

    return NextResponse.json({
      results,
      totalResults: results.length,
    });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
