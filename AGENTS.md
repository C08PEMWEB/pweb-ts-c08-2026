# AGENTS.md

## 1. Ringkasan Proyek
Aplikasi **Sistem Antrian Rumah Sakit Interaktif** murni *front-end* (*native from scratch*) berbasis **TypeScript**, HTML, dan CSS Native (tanpa framework/library JavaScript atau CSS eksternal seperti React, Vue, jQuery, Bootstrap, Tailwind, maupun template). Proyek ini dapat langsung dijalankan menggunakan **Live Server**.

- **Repository**: `pweb-ts-c08-2026`
- **Tujuan**: Memenuhi tugas Praktikum Modul 3 Pemrograman Web (TypeScript & Vibe Coding).
- **Target Deadline**: 13 Oktober 2026 23:59.

---

## 2. Perintah Pengembangan
- **Typecheck**: `npm run typecheck` (menjalankan `tsc --noEmit` untuk verifikasi tipe tanpa menghasilkan output)
- **Build / Kompilasi**: `npm run build` (mengompilasi seluruh file `.ts` di `src/` ke `.js` di `dist/`)
- **Mode Watch**: `npm run watch` (kompilasi otomatis saat file disimpan)
- **Eksekusi Web**: Buka salah satu file `.html` (misal `login.html`, `index.html`) menggunakan ekstensi **Live Server** di VS Code.

---

## 3. Aturan Kode & Standar Kualitas (Guardrails)
1. **TypeScript Strict**: Selalu patuhi `"strict": true` dan `"noUncheckedIndexedAccess": true` di `tsconfig.json`.
2. **Dilarang Keras**:
   - Dilarang memakai tipe `any`.
   - Dilarang memakai `// @ts-ignore`.
   - Hindari *type assertion* (`as ...`) kecuali ada alasan valid yang dijelaskan dalam komentar.
   - Dilarang menginstal atau mengimpor framework/library eksternal (Bootstrap, Tailwind, Axios, jQuery, Lodash, React, Vue, dll.).
3. **Data dari Luar**:
   - Seluruh data dari API eksternal (`dummyjson.com`) dan `localStorage` harus diperlakukan sebagai tipe `unknown` lalu divalidasi strukturnya sebelum digunakan.
4. **Organisasi Modul**:
   - Semua tipe dan kontrak data wajib berada di folder `src/types/` dan diekspor melalui *barrel file* `src/types/index.ts`.
   - Seluruh logika penyimpanan data persisten harus menggunakan fungsi utilitas terpusat di `src/utils/storage.ts`.
   - Gunakan ekstensi `.js` pada *relative import* di file TypeScript (contoh: `import { getServices } from "./utils/storage.js"`).

---

## 4. Pembagian Peran Anggota Tim (3 Orang)

### 👤 Orang 1: Auth & Kiosk Self-Service (Pintu Masuk)
- **Halaman**: `login.html`, `ambil-antrian.html`
- **File Kode**: `src/login.ts`, `src/ambil-antrian.ts`
- **Tanggung Jawab**:
  1. Form login dengan indikator loading state dan visual error handling (`try...catch`).
  2. Integrasi POST login ke API `https://dummyjson.com/auth/login`.
  3. Menyimpan token, role, dan nama depan ke `localStorage` (kunci: `rs_auth_session`).
  4. Auto-redirect sesuai role pengguna:
     - Admin/Moderator $\rightarrow$ `index.html`
     - User biasa $\rightarrow$ `operator.html` atau `ambil-antrian.html`
  5. Halaman Kiosk mandiri: Memilih jenis antrian aktif dan tingkat prioritas (Normal, Lansia, Disabilitas, VIP). Wajib login terlebih dahulu (Revisi Modul 3).
  6. Cetak nomor tiket dengan format `[Kode]-[3 Digit]` (misal: `A-001`).
  7. Pembaruan daftar layanan secara real-time di kiosk tanpa reload halaman.

### 👤 Orang 2 (Lead Architect & Core): Admin Dashboard & Master Data (Pengelolaan)
- **Halaman**: `index.html` (Dashboard Admin)
- **File Kode**: `src/admin.ts`, `src/types/*.ts`, `src/utils/storage.ts`, `src/utils/guard.ts`, `css/style.css`
- **Tanggung Jawab**:
  1. Perancangan fondasi tipe data, struktur folder, utilitas storage, dan CSS Design System.
  2. Proteksi Halaman (*Auth Guard* & *Role Guard*): Hanya admin & moderator yang boleh mengakses `index.html`. Jika tidak valid, redirect ke `login.html`.
  3. Navbar: Nama pengguna aktif, badge role, tombol *Reset Antrian*, dan tombol *Keluar* (Logout).
  4. CRUD Master Jenis Antrian:
     - Tambah layanan baru (validasi 1 huruf kapital unik A-Z, nama layanan unik case-insensitive).
     - Toggle status Aktif / Nonaktifkan layanan.
     - Hapus jenis antrian.
  5. Fitur *Reset Antrian*: Mengosongkan seluruh tiket antrian aktif dan mereset counter ke 001.
  6. Form Penerbitan Tiket Manual dari Admin (pilihan layanan aktif dan tingkat prioritas).
  7. Panel Overview Status Antrian Rumah Sakit terkini.

### 👤 Orang 3: Panel Operator, Monitor Layar, & Queue Engine (Eksekusi & Output)
- **Halaman**: `operator.html`, `layar.html`
- **File Kode**: `src/operator.ts`, `src/layar.ts`, `src/utils/queue.ts`, `src/utils/audio.ts`
- **Tanggung Jawab**:
  1. *Priority Queue Engine*: Mengurutkan antrian berdasarkan bobot prioritas (**VIP: 4 > Disabilitas: 3 > Lansia: 2 > Normal: 1**), lalu berdasarkan waktu tiket dibuat (FIFO).
  2. Proteksi Halaman Operator (*Auth Guard*): Wajib login.
  3. Panel Pemanggilan per Layanan:
     - Menampilkan nomor tiket yang sedang dipanggil dan tiket berikutnya.
     - Tombol *Panggil Berikutnya* (selesaikan tiket aktif dan panggil tiket berikutnya).
     - Tombol *Lewati* (tandai tiket sebagai dilewati).
     - Tombol *Selesai* (tutup tiket aktif tanpa memanggil antrian berikutnya).
  4. Halaman Layar Antrian Publik (`layar.html`):
     - Auto-polling setiap 2–3 detik tanpa reload.
     - Kartu informasi nomor dipanggil dan sisa tiket menunggu.
     - Tombol toggle Layar Penuh (HTML5 Fullscreen API).
  5. **Fitur Bonus**: Respon suara pemanggilan antrian otomatis menggunakan Web Speech API (`SpeechSynthesis`).

---

## 5. Struktur Penyimpanan Local Storage
Untuk menjaga konsistensi antar anggota, hanya gunakan kunci dan format berikut:
- **`rs_auth_session`**: Objek `AuthSession` `{ token, role, firstName, username }`
- **`rs_queue_services`**: Array `QueueService[]` `[{ id, code, name, isActive, createdAt }]`
- **`rs_queue_tickets`**: Array `Ticket[]` `[{ id, ticketNumber, sequenceNumber, serviceCode, serviceName, priority, status, createdAt, calledAt, completedAt }]`

---

## 6. Alur Kerja Agentic untuk Tugas Baru
1. **Rencana Sebelum Eksekusi**: Jelaskan perubahan atau file apa yang akan disentuh.
2. **Kesesuaian Tipe**: Jangan pernah mengubah tipe di `src/types/` tanpa kesepakatan bersama, karena tipe tersebut merupakan kontrak bagi Orang 1, Orang 2, dan Orang 3.
3. **Verifikasi Wajib**: Setelah melakukan perubahan kode, selalu jalankan `npm run typecheck` dan `npm run build` untuk memastikan tidak ada error kompilasi TypeScript.

