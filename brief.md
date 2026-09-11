# 📋 Project Brief: Personal E-Book Reader Platform

## 🎯 Project Overview

Membangun platform baca buku digital pribadi yang **ringan, cepat, dan gratis** untuk di-deploy di Vercel. Platform ini akan mengambil data buku dari berbagai API publik (tanpa database sendiri) dan dapat diakses 24 jam melalui Vercel Hobby Plan.

### Core Requirements
- **Gratis sepenuhnya** (Vercel Hobby Plan + API gratis)
- **Ringan & cepat** (target Lighthouse Performance > 90)
- **Tanpa database** (data dari API eksternal)
- **Akses 24/7** via Vercel deployment

---

## 🏗️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Framework** | Astro | Default zero JavaScript, static rendering, ringan  |
| **Styling** | Tailwind CSS | JIT compilation, hanya CSS yang dipakai |
| **State Management** | nanostores (1KB) | Ringan, simple |
| **Deployment** | Vercel Hobby Plan | Gratis, Edge Network, Serverless Functions |
| **Runtime** | Vercel Edge Runtime | Lebih cepat, berjalan di CDN terdekat  |

---

## 📚 Data Sources (APIs)

### 1. Open Library API (Sumber Utama)
- **Endpoint**: `https://openlibrary.org/search.json?q={query}`
- **Keunggulan**: 40+ juta buku, gratis tanpa API key 
- **Parameter penting**: `fields` untuk membatasi respons, `limit` untuk pagination 
- **Cover images**: `https://covers.openlibrary.org/b/id/{cover_id}-M.jpg` 

### 2. Google Books API (Pelengkap)
- **Endpoint**: `https://www.googleapis.com/books/v1/volumes?q={query}`
- **Filter gratis**: `filter=free-ebooks` untuk buku yang bisa dibaca penuh 
- **Parameter**: `orderBy=newest` untuk buku terbaru 

### 3. Gutendex (Project Gutenberg)
- **Endpoint**: `https://gutendex.com/books`
- **Keunggulan**: Buku domain publik dengan tautan unduhan langsung 
- **Self-hostable**: Bisa di-deploy sendiri dari GitHub 

---

## 🔗 GitHub References

| Repository | Deskripsi | Link |
|------------|-----------|------|
| **Astro** | Framework utama | `github.com/withastro/astro` |
| **Astro Vercel Adapter** | Integrasi Vercel | `github.com/withastro/docs`  |
| **Gutendex** | API Project Gutenberg | `github.com/garethbjohnson/gutendex`  |
| **Open Library** | Source code Open Library | `github.com/internetarchive/openlibrary` |
| **Antigravity Skills** | Skills untuk AI agent | `github.com/dangindev/antigravity-awesome-workspace-skill`  |

---

## ⚡ Performance Targets

| Metrik | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1 detik |
| Largest Contentful Paint (LCP) | < 2 detik |
| Time to Interactive (TTI) | < 2 detik |
| Total Blocking Time (TBT) | < 200ms |
| Bundle Size (JS) | < 50KB (gzipped) |
| Lighthouse Performance | > 90 |

---

## 📁 Project Structure

```
personal-ebook-reader/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Homepage dengan pencarian
│   │   ├── search.astro         # Halaman hasil pencarian
│   │   └── read/[id].astro      # Halaman baca buku
│   ├── components/
│   │   ├── BookCard.astro       # Kartu buku
│   │   ├── SearchBar.astro      # Input pencarian
│   │   └── BookReader.astro     # EPUB reader component
│   ├── lib/
│   │   ├── openlibrary.ts       # Open Library API wrapper
│   │   ├── googlebooks.ts       # Google Books API wrapper
│   │   └── gutendex.ts          # Gutendex API wrapper
│   └── styles/
│       └── global.css           # Tailwind imports
├── api/
│   └── search.ts                # Edge Function untuk proxy API
├── public/
│   └── favicon.svg
├── astro.config.mjs
├── tailwind.config.mjs
├── vercel.json
└── package.json
```

---

## 🛠️ Implementation Plan

### Phase 1: Setup & Configuration
1. Inisialisasi proyek Astro dengan Tailwind
2. Konfigurasi Astro Vercel adapter 
3. Setup `vercel.json` untuk caching headers 

### Phase 2: API Integration (Serverless Functions)
1. Buat Edge Function di `api/search.ts` untuk proxy ke Open Library
2. Implementasi caching header: `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` 
3. Gunakan parameter `fields` untuk membatasi payload respons

### Phase 3: Frontend Development
1. Bangun homepage dengan search bar
2. Buat komponen BookCard untuk menampilkan hasil
3. Implementasi lazy loading untuk gambar sampul
4. Buat halaman baca dengan dynamic import untuk `epub.js`

### Phase 4: Optimization
1. Konfigurasi image optimization Vercel 
2. Terapkan aggressive caching untuk static assets 
3. Uji performa dengan Lighthouse

### Phase 5: Deployment
1. Push ke GitHub repository
2. Connect ke Vercel
3. Set environment variables (jika diperlukan API key)
4. Deploy dan verifikasi

---

## 🚀 Prompt untuk Antigravity

```
Kamu adalah AI coding assistant yang akan membantu membangun platform baca buku pribadi.

## Project Goal
Membangun web app ringan untuk baca buku digital yang:
- Mengambil data dari Open Library API, Google Books API, dan Gutendex
- Di-deploy di Vercel (Hobby Plan) dan dapat diakses 24/7
- Target Lighthouse Performance > 90

## Tech Stack
- Astro (static output mode) dengan Tailwind CSS
- Vercel Edge Functions untuk proxy API
- nanostores untuk state management

## Key Implementation Details

### 1. API Proxy (api/search.ts)
Buat Edge Function yang:
- Menerima query parameter `q`, `source` (openlibrary/googlebooks/gutendex)
- Memanggil API yang sesuai
- Mengembalikan JSON response
- Menambahkan header: `Cache-Control: public, s-maxage=86400`

Contoh Open Library call:
https://openlibrary.org/search.json?q={query}&fields=title,author_name,cover_i,first_publish_year,key&limit=20

### 2. Halaman Utama (index.astro)
- Search bar dengan debounce
- Grid hasil pencarian (BookCard components)
- Lazy loading untuk cover images

### 3. BookCard Component
- Menampilkan: cover, title, author, year
- Cover image: https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
- Gunakan loading="lazy" untuk gambar

### 4. Halaman Baca (read/[id].astro)
- Dynamic import untuk epub.js
- Fetch konten dari Gutendex untuk buku domain publik

### 5. Vercel Configuration
- vercel.json dengan headers untuk static assets:
  Cache-Control: public, max-age=31536000, immutable

## Constraints
- JANGAN gunakan database
- JANGAN gunakan framework berat (React SPA, Next.js full)
- HARUS menggunakan Edge Runtime untuk serverless functions
- HARUS optimal untuk koneksi lambat

## References
- Open Library Search API: https://openlibrary.org/dev/docs/api/search
- Google Books API: https://developers.google.com/books/docs/v1/reference/volumes/list
- Gutendex API: https://gutendex.com/
- Astro Vercel Adapter: https://docs.astro.build/en/guides/integrations-guide/vercel/
```

---

## 📊 Vercel Hobby Plan Limits

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month  |
| Function Invocations | 1 juta/month |
| Function Duration | 60 detik max |
| Blob Storage | 1 GB |

**Tips menghindari bandwidth trap**: Pastikan static assets memiliki cache headers yang benar untuk menghindari origin pull berulang .

---

## ✅ Checklist Sebelum Deploy

- [ ] Semua API calls menggunakan Edge Runtime
- [ ] Cache headers terkonfigurasi di `vercel.json`
- [ ] Gambar menggunakan lazy loading
- [ ] JavaScript bundle < 50KB
- [ ] Lighthouse score > 90
- [ ] Error handling untuk API yang down
- [ ] Responsive design untuk mobile



## Mobile-First Design Requirements

### 🎯 Prinsip Utama Mobile

Karena mayoritas akses dari HP, prioritas berubah:

| Aspek | Prioritas Mobile | Implikasi |
|-------|------------------|-----------|
| **Ukuran sentuh** | Tombol minimal 44x44px | Nyaman dijempol |
| **Thumb zone** | Aksi utama di bawah layar | Navigasi satu tangan |
| **Bandwidth** | Sangat kritis | Data seluler terbatas |
| **Baterai** | Hemat | Hindari animasi berat |
| **Loading** | Instan | Skeleton screen, bukan spinner |

---

## 🎨 Layout Mobile-First

### 1. **Bottom Navigation (Bukan Sidebar)**
Karena jempol lebih mudah menjangkau bawah layar, gunakan bottom nav bar dengan 3-4 item maksimal:

```
┌─────────────────────────┐
│                         │
│      Konten Utama       │
│                         │
│                         │
├─────────────────────────┤
│  🏠    🔍    📚    ⚙️   │  ← Bottom Nav (fixed)
│ Home  Cari  Library Profil│
└─────────────────────────┘
```

### 2. **Sticky Search Bar di Atas**
Search bar harus selalu terlihat saat scroll, tapi dibuat ringkas:

```
┌─────────────────────────┐
│  🔍 Cari judul/penulis  │  ← Sticky, height 56px
├─────────────────────────┤
│                         │
│      Hasil Pencarian    │
│                         │
└─────────────────────────┘
```

### 3. **Grid vs List untuk Hasil Pencarian**
- **List view** (1 kolom) lebih baik untuk mobile karena:
  - Cover lebih besar dan jelas
  - Informasi lebih mudah dibaca
  - Scroll lebih natural
- Tampilkan **cover + judul + penulis + tahun** dalam satu baris horizontal

```
┌─────────────────────────┐
│ ┌────┐ Judul Buku       │
│ │ 📕 │ Penulis · 2023    │
│ └────┘ ★★★★☆            │
├─────────────────────────┤
│ ┌────┐ Judul Buku 2     │
│ │ 📗 │ Penulis · 2022    │
│ └────┘ ★★★☆☆            │
└─────────────────────────┘
```

---

## 📖 Halaman Baca (Reader) di Mobile

Ini bagian paling kritis karena jadi inti pengalaman:

### Layout Reader
```
┌─────────────────────────┐
│ ← Kembali    ⚙️  🔖     │  ← Header minimalis, auto-hide
├─────────────────────────┤
│                         │
│   Teks bacaan...        │
│                         │
│   Lorem ipsum dolor     │
│   sit amet, consectetur │
│   adipiscing elit.      │
│                         │
│                         │
├─────────────────────────┤
│ ████████░░░░░░ 45%      │  ← Progress bar (auto-hide)
└─────────────────────────┘
```

### Fitur Reader Mobile
- **Tap tengah layar**: Toggle UI (sembunyikan header/footer)
- **Swipe kiri/kanan**: Ganti halaman (bukan scroll, lebih natural di HP)
- **Font size**: 3 preset (Kecil, Sedang, Besar) — jangan slider, susah di HP
- **Mode gelap**: Otomatis ikut sistem, plus toggle manual
- **Auto-hide UI**: Sembunyikan setelah 3 detik tidak ada interaksi

---

## ⚡ Optimasi Khusus Mobile

### 1. **Bundle Size Lebih Ketat**
Target JS bundle **< 30KB** (bukan 50KB) karena:
- Koneksi seluler lebih lambat
- CPU HP lebih terbatas
- Parsing JS lebih mahal di mobile

### 2. **Gambar Sampul Optimal**
- Gunakan ukuran **`-S.jpg`** (Small) dari Open Library, bukan `-M` atau `-L` saat di list
- Format WebP otomatis via Vercel Image Optimization
- **Placeholder blur** saat gambar loading (LQIP - Low Quality Image Placeholder)
- Lazy loading + `decoding="async"`

### 3. **Font Loading Strategy**
- Gunakan **system font stack** untuk performa maksimal:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  ```
- Jika pakai font kustom (untuk reader), gunakan `font-display: swap` dan subset hanya karakter Latin

### 4. **Touch Optimization**
- `touch-action: manipulation` untuk hilangkan delay 300ms
- `-webkit-tap-highlight-color: transparent` untuk hilangkan highlight biru
- Gunakan `:active` state, bukan `:hover` (HP tidak punya hover)

### 5. **PWA (Progressive Web App)**
Ini wajib untuk pengalaman mobile yang optimal:
- **Add to Home Screen** — akses seperti app native
- **Service Worker** — cache buku yang sedang dibaca, bisa dibaca offline
- **Manifest.json** — nama, ikon, warna tema
- **Standalone mode** — tanpa address bar browser

```json
{
  "name": "Baca Gratis",
  "short_name": "Baca",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a1a",
  "background_color": "#ffffff",
  "icons": [...]
}
```

### 6. **Hemat Data (Data Saver)**
- Kompresi Brotli otomatis di Vercel
- Batasi hasil pencarian jadi **10-15 item** per load, dengan infinite scroll
- Prefetch hanya halaman berikutnya, bukan semua

---

## 🔄 Revisi Project Structure

```
personal-ebook-reader/
├── src/
│   ├── layouts/
│   │   └── MobileLayout.astro      # Layout utama mobile
│   ├── pages/
│   │   ├── index.astro              # Home + search
│   │   ├── search.astro             # Hasil pencarian
│   │   ├── library.astro            # Buku tersimpan
│   │   ├── read/[id].astro          # Reader mode
│   │   └── offline.astro            # Halaman offline
│   ├── components/
│   │   ├── BottomNav.astro          # Navigasi bawah
│   │   ├── SearchBar.astro          # Sticky search
│   │   ├── BookListItem.astro       # Item list (bukan card)
│   │   ├── ReaderControls.astro     # Kontrol reader
│   │   └── SkeletonLoader.astro     # Loading placeholder
│   ├── lib/
│   │   ├── api.ts                   # Wrapper API
│   │   └── storage.ts               # localStorage wrapper
│   └── styles/
│       └── global.css
├── api/
│   └── search.ts                    # Edge Function
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service Worker
│   └── icons/                       # PWA icons
├── astro.config.mjs
├── tailwind.config.mjs
└── vercel.json
```

---

## 🎯 Target Metrik (Revisi untuk Mobile)

| Metrik | Target Mobile | Catatan |
|--------|---------------|---------|
| FCP (4G) | < 1.5 detik | Lebih longgar dari desktop |
| LCP (4G) | < 2.5 detik | Standar Google |
| TTI | < 3 detik | CPU HP lebih lambat |
| Bundle JS | **< 30KB** | Lebih ketat |
| Lighthouse Mobile | **> 85** | Realistis untuk mobile |
| Total Page Weight | **< 500KB** | Per halaman |

---

## 📝 Tambahan Prompt untuk Antigravity

Tambahkan bagian ini ke prompt sebelumnya:

```
## Mobile-First Requirements (PRIORITAS UTAMA)

Platform ini akan diakses 90% dari HP, jadi WAJIB:

### Layout
- Gunakan Bottom Navigation (fixed di bawah) dengan maksimal 4 item
- Search bar sticky di atas, tinggi maksimal 56px
- Hasil pencarian dalam LIST VIEW (1 kolom), bukan grid
- Touch target minimal 44x44px untuk semua tombol
- Safe area untuk iPhone (env(safe-area-inset-bottom))

### Reader Mode
- Swipe kiri/kanan untuk ganti halaman (bukan scroll)
- Tap tengah untuk toggle UI (auto-hide setelah 3 detik)
- Font size: 3 preset button, bukan slider
- Dark mode otomatis ikut sistem
- Progress bar di bawah, auto-hide

### Performance
- Bundle JS maksimal 30KB (gzipped)
- Gambar sampul pakai ukuran -S.jpg (Small)
- Placeholder blur (LQIP) saat gambar loading
- System font stack, hindari font kustom di UI
- touch-action: manipulation untuk hilangkan delay 300ms

### PWA (Wajib)
- manifest.json dengan display: "standalone"
- Service Worker untuk cache buku yang dibaca
- Add to Home Screen support
- Offline page untuk buku yang sudah di-cache

### Data Saving
- Batasi hasil pencarian 10-15 item, infinite scroll
- Prefetch hanya halaman berikutnya
- Kompresi Brotli (otomatis di Vercel)

### Testing
- Test di Chrome DevTools dengan throttling "Slow 4G"
- Test di HP asli (Android & iOS)
- Lighthouse Mobile score > 85
```
