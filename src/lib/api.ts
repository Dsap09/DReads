export interface Book {
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

export interface SearchResult {
  books: Book[];
  total: number;
  source: string;
}

/**
 * Fetch books from proxy endpoint /api/search
 */
export async function searchBooks(query: string, source = 'all', page = 1): Promise<SearchResult> {
  if (!query || query.trim() === '') {
    return { books: [], total: 0, source };
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      source,
      page: String(page)
    });

    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`API error HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      books: data.books || [],
      total: data.total || 0,
      source: data.source || source
    };
  } catch (error) {
    console.error('Failed to search books:', error);
    return { books: [], total: 0, source };
  }
}

/**
 * Fetch book details or Gutenberg content for reader
 */
export async function getGutenbergBookContent(gutenbergId: string): Promise<{ title: string; author: string; contentHtml?: string; error?: string }> {
  try {
    const res = await fetch(`https://gutendex.com/books/${gutenbergId}`);
    if (!res.ok) {
      return { title: '', author: '', error: 'Buku tidak ditemukan di Gutendex' };
    }

    const bookData = await res.json();
    const formats = bookData.formats || {};

    // Prioritize HTML format, then plaintext
    const htmlUrl = formats['text/html'] || formats['text/html; charset=utf-8'] || formats['text/html; charset=iso-8859-1'];
    const txtUrl = formats['text/plain'] || formats['text/plain; charset=utf-8'] || formats['text/plain; charset=us-ascii'];

    let contentHtml = '';
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (htmlUrl) {
      const contentRes = await fetch(htmlUrl, { headers: fetchHeaders });
      if (contentRes.ok) {
        contentHtml = await contentRes.text();
      }
    } else if (txtUrl) {
      const contentRes = await fetch(txtUrl, { headers: fetchHeaders });
      if (contentRes.ok) {
        const rawText = await contentRes.text();
        contentHtml = rawText
          .split(/\n\s*\n/)
          .map(paragraph => `<p>${escapeHtml(paragraph.trim())}</p>`)
          .join('\n');
      }
    }

    return {
      title: bookData.title || 'Judul Tidak Diketahui',
      author: bookData.authors?.[0]?.name || 'Penulis Tidak Diketahui',
      contentHtml: contentHtml || '<p>Maaf, format teks penuh tidak tersedia untuk buku ini.</p>'
    };
  } catch (err) {
    console.error('Error fetching Gutenberg book content:', err);
    return { title: '', author: '', error: 'Gagal memuat konten buku. Periksa koneksi internet Anda.' };
  }
}

export interface CleanBookResponse {
  id: string;
  title: string;
  author: string;
  totalChapters: number;
  currentChapter: number;
  chapterTitle: string;
  chapterList: string[];
  contentHtml: string;
  error?: string;
}

/**
 * Fetch clean Gutenberg content chunked per chapter (without license header/footer)
 */
export async function getCleanGutenbergContent(gutenbergId: string, chapter = 1): Promise<CleanBookResponse> {
  try {
    let bookTitle = 'Buku Gutenberg';
    let bookAuthor = 'Penulis Tidak Diketahui';

    try {
      const metaRes = await fetch(`https://gutendex.com/books/${gutenbergId}`);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        bookTitle = metaData.title || bookTitle;
        bookAuthor = (metaData.authors || []).map((a: any) => a.name).join(', ') || bookAuthor;
      }
    } catch (e) {
      // Ignore meta error
    }

    const contentRes = await fetch(`/api/gutenberg-content?id=${gutenbergId}&chapter=${chapter}`);
    if (!contentRes.ok) {
      const fallback = await getGutenbergBookContent(gutenbergId);
      return {
        id: gutenbergId,
        title: fallback.title || bookTitle,
        author: fallback.author || bookAuthor,
        totalChapters: 1,
        currentChapter: 1,
        chapterTitle: 'Teks Lengkap',
        chapterList: ['Teks Lengkap'],
        contentHtml: fallback.contentHtml || '',
        error: fallback.error
      };
    }

    const data = await contentRes.json();

    return {
      id: gutenbergId,
      title: bookTitle,
      author: bookAuthor,
      totalChapters: data.totalChapters || 1,
      currentChapter: data.currentChapter || 1,
      chapterTitle: data.chapterTitle || `Bab ${chapter}`,
      chapterList: data.chapterList || [],
      contentHtml: data.contentHtml || ''
    };
  } catch (err: any) {
    console.error('Error fetching clean Gutenberg content:', err);
    return {
      id: gutenbergId,
      title: 'Buku Gutenberg',
      author: 'Penulis',
      totalChapters: 1,
      currentChapter: 1,
      chapterTitle: 'Teks Lengkap',
      chapterList: [],
      contentHtml: '',
      error: 'Gagal memuat konten buku.'
    };
  }
}



function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
