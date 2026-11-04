import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';
import { searchContent } from '@/lib/queries/student';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ results: [] }, { status: 401 });
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await searchContent(q, 12);
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'private, max-age=30' } });
  } catch {
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
