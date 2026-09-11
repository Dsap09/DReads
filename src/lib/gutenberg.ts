/**
 * High-Performance Gutenberg Content Fetcher & Chapter Processor
 */

interface GutenbergCleanData {
  id: string;
  totalChapters: number;
  currentChapter: number;
  chapterTitle: string;
  chapterList: string[];
  contentHtml: string;
  error?: string;
}

// In-Memory LRU Cache for fetched raw book texts (0ms response for cached books)
const rawBookCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRawGutenbergText(id: string): Promise<string> {
  if (rawBookCache.has(id)) {
    return rawBookCache.get(id)!;
  }

  // Prioritize fast CDN cached txt endpoint first
  const urlsToTry = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`
  ];

  let rawText = '';
  for (const targetUrl of urlsToTry) {
    try {
      const res = await fetchWithTimeout(targetUrl, 4000);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 500) {
          rawText = text;
          break;
        }
      }
    } catch (e) {
      // Continue to next URL fallback if timeout or network error occurs
    }
  }

  if (rawText && rawText.length > 500) {
    if (rawBookCache.size >= MAX_CACHE_SIZE) {
      const firstKey = rawBookCache.keys().next().value;
      if (firstKey) rawBookCache.delete(firstKey);
    }
    rawBookCache.set(id, rawText);
  }

  return rawText;
}

export async function getCleanGutenbergChapter(id: string, requestedChapter = 1): Promise<GutenbergCleanData> {
  const rawText = await fetchRawGutenbergText(id);

  if (!rawText || rawText.trim().length === 0) {
    return {
      id,
      totalChapters: 1,
      currentChapter: 1,
      chapterTitle: 'Teks Lengkap',
      chapterList: ['Teks Lengkap'],
      contentHtml: '<p>Maaf, gagal memuat teks buku dari Project Gutenberg. Silakan coba beberapa saat lagi.</p>',
      error: 'Gagal memuat teks buku'
    };
  }

  // 1. Strip License Preamble (Header) & Postamble (Footer)
  let cleanText = rawText;

  const startMatch = rawText.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i)
    || rawText.match(/\*\*\*\s*START OF THIS EBOOK[^\n]*\*\*\*/i);
  
  if (startMatch && startMatch.index !== undefined) {
    cleanText = cleanText.substring(startMatch.index + startMatch[0].length);
  }

  const endMatch = cleanText.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i)
    || cleanText.match(/\*\*\*\s*END OF THIS EBOOK[^\n]*\*\*\*/i);

  if (endMatch && endMatch.index !== undefined) {
    cleanText = cleanText.substring(0, endMatch.index);
  }

  cleanText = cleanText.trim();

  // 2. Chapter Chunking Engine
  const chapterPattern = /(?=(?:\r?\n){2,}\s*(?:CHAPTER|Bab|VOLUME|BOOK|SECTION|PART)\s+[IVXLCDM0-9]+|\b(?:CHAPTER|Bab|VOLUME|BOOK|SECTION|PART)\s+[IVXLCDM0-9]+\b)/gi;
  let chapters = cleanText.split(chapterPattern).filter(ch => ch.trim().length > 0);

  // Fallback: If no explicit chapter headers found, chunk by ~12,000 characters per passage
  if (chapters.length <= 1) {
    const chunkSize = 12000;
    chapters = [];
    for (let i = 0; i < cleanText.length; i += chunkSize) {
      chapters.push(cleanText.substring(i, i + chunkSize));
    }
  }

  const totalChapters = chapters.length || 1;
  const currentChapter = Math.min(totalChapters, Math.max(1, requestedChapter));
  const targetChapterRaw = chapters[currentChapter - 1] || cleanText;

  // Extract Chapter Title line if present
  const firstLine = targetChapterRaw.trim().split('\n')[0] || `Bab ${currentChapter}`;
  const chapterTitle = firstLine.length < 60 ? firstLine.replace(/[\r\n#*]/g, '').trim() : `Bab ${currentChapter}`;

  // Generate chapter titles list for dropdown
  const chapterList = chapters.map((ch, idx) => {
    const line = ch.trim().split('\n')[0] || `Bab ${idx + 1}`;
    const title = line.length < 50 ? line.replace(/[\r\n#*]/g, '').trim() : `Bab ${idx + 1}`;
    return title;
  });

  // 3. Format Chapter Text to Clean HTML Paragraphs
  const formattedHtml = targetChapterRaw
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map(paragraph => {
      const cleanedPara = escapeHtml(paragraph.trim());
      if (!cleanedPara) return '';
      return `<p>${cleanedPara}</p>`;
    })
    .filter(p => p.length > 0)
    .join('\n');

  return {
    id,
    totalChapters,
    currentChapter,
    chapterTitle,
    chapterList,
    contentHtml: formattedHtml
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
