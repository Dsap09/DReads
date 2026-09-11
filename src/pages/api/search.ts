import type { APIRoute } from 'astro';

export const prerender = false;

interface BookResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  coverSmallUrl: string;
  firstPublishYear?: number | string;
  source: 'openlibrary' | 'googlebooks' | 'gutendex';
  downloadUrl?: string;
  formats?: Record<string, string>;
  subjects?: string[];
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const source = url.searchParams.get('source') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1', 10);

  if (!query || query.trim() === '') {
    return new Response(JSON.stringify({ books: [], total: 0 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
  }

  const books: BookResult[] = [];
  let totalCount = 0;

  try {
    // 1. Fetch Open Library (Strict Full-Text Filter)
    if (source === 'all' || source === 'openlibrary') {
      const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&fields=key,title,author_name,cover_i,first_publish_year,ia&limit=20&page=${page}`;
      const olRes = await fetch(olUrl);

      if (olRes.ok) {
        const olData = await olRes.json();

        const olBooks: BookResult[] = (olData.docs || [])
          .filter((item: any) => Array.isArray(item.ia) && item.ia.length > 0)
          .filter((item: any) => {
            const t = (item.title || '').trim();
            if (t.length < 2) return false;
            return !/^(?:Catalog|Journal|Proceedings|Bulletin|Index|Periodical|Annual Report|Official Gazette)/i.test(t);
          })
          .map((item: any) => {
            const coverId = item.cover_i;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';
            const coverSmallUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-S.jpg` : '';
            const keyClean = (item.key || '').replace('/works/', '');
            const iaId = item.ia[0];
            const embedUrl = `https://archive.org/embed/${iaId}?ui=full`;

            return {
              id: `ol:${keyClean}`,
              title: item.title || 'Tanpa Judul',
              author: Array.isArray(item.author_name) ? item.author_name.join(', ') : (item.author_name || 'Penulis Tidak Diketahui'),
              coverUrl,
              coverSmallUrl,
              firstPublishYear: item.firstPublishYear || item.first_publish_year || '-',
              source: 'openlibrary' as const,
              downloadUrl: embedUrl
            };
          });

        totalCount += olBooks.length;
        books.push(...olBooks);
      }
    }



    // 3. Fetch Gutendex (Project Gutenberg - direct read)
    if (source === 'all' || source === 'gutendex') {
      const gutenUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=${page}`;
      const gutenRes = await fetch(gutenUrl);

      if (gutenRes.ok) {
        const gutenData = await gutenRes.json();
        totalCount += gutenData.count || 0;

        const gutenBooks: BookResult[] = (gutenData.results || [])
          .filter((item: any) => item.title && item.title.trim().length > 2)
          .filter((item: any) => {
            const t = (item.title || '').trim();
            // Filter index records or non-book catalog items
            if (/^(?:Project Gutenberg Index|Complete Works Index|Index of the Project Gutenberg)/i.test(t)) return false;
            // Ensure HTML or TXT format exists
            const formats = item.formats || {};
            const hasTextFormat = !!(formats['text/html'] || formats['text/html; charset=utf-8'] || formats['text/plain'] || formats['text/plain; charset=utf-8']);
            return hasTextFormat;
          })
          .map((item: any) => {
            const authors = (item.authors || []).map((a: any) => a.name).join(', ') || 'Penulis Tidak Diketahui';
            const formats = item.formats || {};
            const coverUrl = formats['image/jpeg'] || '';

            return {
              id: `gutenberg:${item.id}`,
              title: item.title || 'Tanpa Judul',
              author: authors,
              coverUrl,
              coverSmallUrl: coverUrl,
              firstPublishYear: 'Domain Publik',
              source: 'gutendex' as const,
              downloadUrl: formats['text/html'] || formats['text/plain'] || '',
              formats,
              subjects: (item.subjects || []).slice(0, 3)
            };
          });

        books.push(...gutenBooks);
      }
    }

    // 4. Fetch Google Books (Free ebooks filter)
    if (source === 'all' || source === 'googlebooks') {
      const startIndex = (page - 1) * 10;
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&filter=free-ebooks&startIndex=${startIndex}&maxResults=10`;
      const gbRes = await fetch(gbUrl);

      if (gbRes.ok) {
        const gbData = await gbRes.json();
        totalCount += gbData.totalItems || 0;

        const gbBooks: BookResult[] = (gbData.items || [])
          .filter((item: any) => item.volumeInfo && item.volumeInfo.title && item.volumeInfo.title.trim().length > 2)
          .filter((item: any) => {
            const info = item.volumeInfo || {};
            const t = (info.title || '').trim();
            if (/^(?:Journal|Magazine|Catalog|Bulletin|Proceedings|Newsletter|Periodical)/i.test(t)) return false;
            if (info.printType && info.printType !== 'BOOK') return false;
            return true;
          })
          .map((item: any) => {
            const info = item.volumeInfo || {};
            const imageLinks = info.imageLinks || {};
            const authors = (info.authors || []).join(', ') || 'Penulis Tidak Diketahui';
            const pubDate = info.publishedDate ? info.publishedDate.substring(0, 4) : '-';

            return {
              id: `gb:${item.id}`,
              title: info.title || 'Tanpa Judul',
              author: authors,
              coverUrl: imageLinks.thumbnail ? imageLinks.thumbnail.replace('http:', 'https:') : '',
              coverSmallUrl: imageLinks.smallThumbnail ? imageLinks.smallThumbnail.replace('http:', 'https:') : '',
              firstPublishYear: pubDate,
              source: 'googlebooks' as const,
              downloadUrl: info.previewLink || info.infoLink || ''
            };
          });

        books.push(...gbBooks);
      }
    }

    return new Response(JSON.stringify({ books, total: totalCount, source }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error', books: [], total: 0 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
