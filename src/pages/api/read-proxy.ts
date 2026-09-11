import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter missing', { status: 400 });
  }

  // Security check: Only proxy requests to official Gutenberg domains
  try {
    const parsedTarget = new URL(targetUrl);
    const allowedHosts = ['www.gutenberg.org', 'gutenberg.org', 'gutendex.com'];
    if (!allowedHosts.includes(parsedTarget.hostname)) {
      return new Response('Host target not allowed', { status: 403 });
    }

    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new Response(`Failed to fetch content: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'text/html';
    const textContent = await res.text();

    return new Response(textContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=604800, immutable'
      }
    });
  } catch (err: any) {
    return new Response(`Proxy error: ${err.message}`, { status: 500 });
  }
};
