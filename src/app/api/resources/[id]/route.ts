import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { RESOURCES_BUCKET, SIGNED_URL_TTL_SECONDS } from '@/lib/constants';

/**
 * Issues a SHORT-LIVED signed URL for a private learning resource.
 * Access is decided by RLS: the resource row (and the storage object) are only
 * visible to signed-in users when the resource, its unit and its subject are published.
 * Downloads are additionally gated by learning_resources.allow_download.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noStore = { 'Cache-Control': 'no-store' };

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401, headers: noStore });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: noStore });

  const download = request.nextUrl.searchParams.get('download') === '1';
  const supabase = await createClient();
  const { data: resource } = await supabase
    .from('learning_resources')
    .select('id,storage_path,file_name,mime_type,allow_download')
    .eq('id', id)
    .maybeSingle();
  if (!resource) return NextResponse.json({ error: 'This file is not available.' }, { status: 404, headers: noStore });
  if (download && !resource.allow_download) {
    return NextResponse.json({ error: 'Downloading is not permitted for this file.' }, { status: 403, headers: noStore });
  }

  const { data, error } = await supabase.storage
    .from(RESOURCES_BUCKET)
    .createSignedUrl(resource.storage_path, SIGNED_URL_TTL_SECONDS, download ? { download: resource.file_name } : undefined);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not open this file. Please try again.' }, { status: 502, headers: noStore });
  }
  return NextResponse.json({ url: data.signedUrl, mime: resource.mime_type, expiresIn: SIGNED_URL_TTL_SECONDS }, { headers: noStore });
}
