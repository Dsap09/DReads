import type { APIRoute } from 'astro';
import { getCleanGutenbergChapter } from '../../lib/gutenberg';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const requestedChapter = parseInt(url.searchParams.get('chapter') || '1', 10);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Parameter id diperlukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await getCleanGutenbergChapter(id, requestedChapter);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=604800, immutable'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
