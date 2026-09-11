import type { Book } from './api';

export interface SavedBook extends Book {
  savedAt: number;
  lastReadProgress?: number; // 0 to 100
  lastReadChapter?: string;
  lastReadTimestamp?: number;
}

export interface ReaderSettings {
  theme: 'warm' | 'sepia' | 'dark';
  fontSize: 'sm' | 'md' | 'lg';
}

const LIBRARY_KEY = 'dreads_saved_library_v1';
const PROGRESS_KEY_PREFIX = 'dreads_progress_';
const SETTINGS_KEY = 'dreads_reader_settings_v1';

// --- LIBRARY / BOOKMARKS ---

export function getSavedBooks(): SavedBook[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading saved books:', e);
    return [];
  }
}

export function isBookSaved(bookId: string): boolean {
  const books = getSavedBooks();
  return books.some(b => b.id === bookId);
}

export function saveBook(book: Book): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const books = getSavedBooks();
    if (books.some(b => b.id === book.id)) return true;

    const newBook: SavedBook = {
      ...book,
      savedAt: Date.now()
    };

    books.unshift(newBook);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
    return true;
  } catch (e) {
    console.error('Error saving book:', e);
    return false;
  }
}

export function removeBook(bookId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const books = getSavedBooks().filter(b => b.id !== bookId);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
    return true;
  } catch (e) {
    console.error('Error removing book:', e);
    return false;
  }
}

// --- READING PROGRESS ---

export function saveReadingProgress(bookId: string, progressPercentage: number, scrollPos = 0) {
  if (typeof window === 'undefined') return;
  try {
    const key = `${PROGRESS_KEY_PREFIX}${bookId}`;
    const payload = {
      progress: Math.min(100, Math.max(0, Math.round(progressPercentage))),
      scrollPos,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));

    // Also update saved book if present in library
    const books = getSavedBooks();
    const index = books.findIndex(b => b.id === bookId);
    if (index !== -1) {
      books[index].lastReadProgress = payload.progress;
      books[index].lastReadTimestamp = payload.timestamp;
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
    }
  } catch (e) {
    console.error('Error saving reading progress:', e);
  }
}

export function getReadingProgress(bookId: string): { progress: number; scrollPos: number } {
  if (typeof window === 'undefined') return { progress: 0, scrollPos: 0 };
  try {
    const key = `${PROGRESS_KEY_PREFIX}${bookId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { progress: 0, scrollPos: 0 };
    const data = JSON.parse(raw);
    return {
      progress: data.progress || 0,
      scrollPos: data.scrollPos || 0
    };
  } catch (e) {
    return { progress: 0, scrollPos: 0 };
  }
}

// --- READER SETTINGS ---

export function getReaderSettings(): ReaderSettings {
  if (typeof window === 'undefined') {
    return { theme: 'warm', fontSize: 'md' };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { theme: 'warm', fontSize: 'md' };
    return JSON.parse(raw);
  } catch (e) {
    return { theme: 'warm', fontSize: 'md' };
  }
}

export function saveReaderSettings(settings: Partial<ReaderSettings>): ReaderSettings {
  const current = getReaderSettings();
  const updated: ReaderSettings = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
  return updated;
}
