# 🏥 Sistem Antrian Rumah Sakit (Native TypeScript)

Aplikasi **Sistem Antrian Rumah Sakit Interaktif** murni *front-end* (*native from scratch*) berbasis **TypeScript**, HTML, dan CSS Native tanpa dependensi atau framework eksternal (tanpa React, Vue, jQuery, Bootstrap, Tailwind, maupun template).

Proyek ini dibangun untuk memenuhi penugasan **Praktikum Modul 3 Pemrograman Web (TypeScript & Vibe Coding)**.

---

## 🔑 Kredensial Akun Uji Coba & Hak Akses (DummyJSON)

Gunakan akun resmi dari [dummyjson.com/users](https://dummyjson.com/users) untuk login di `login.html`:

| Role di Sistem | Username | Password | Halaman Tujuan (*Auto-Redirect*) | Hak Akses & Izin |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `emilys` | `emilyspass` | `index.html` (Dashboard Admin) | Akses penuh dashboard, CRUD jenis antrian, reset nomor tiket, penerbitan tiket manual, dan pemanggilan antrian. |
| **Moderator** | `oliviaw` | `oliviawpass` | `index.html` (Dashboard Admin) | **Setara Admin** (sesuai ketentuan soal: role moderator disamakan hak aksesnya dengan admin). |
| **User (Pengunjung / Operator)** | `averyp` | `averyppass` | `ambil-antrian.html` (Kiosk Mandiri) | Akses mengambil nomor tiket di kiosk mandiri dan akses panel operator. |

> **⚠️ Catatan Revisi Modul 3**: Seluruh pengguna **wajib login** untuk dapat mengambil nomor antrian di `ambil-antrian.html`. Jika belum login, sistem akan langsung mengarahkan ke `login.html`. Satu-satunya halaman yang dapat diakses secara publik tanpa login adalah `layar.html` (Layar Monitor Antrian).

---

## 🎬 Skenario Alur Demonstrasi Praktikum (Halaman yang Wajib Dikunjungi)

Untuk mendemokan seluruh fitur aplikasi secara runtut saat sesi demo praktikum di hadapan asisten, ikuti urutan kunjungan halaman berikut:

### 1️⃣ Halaman Masuk — `login.html`
* **Demo Auth & Validasi Role**:
  1. Masukkan akun Admin (`emilys` / `emilyspass`), klik **Masuk** $\rightarrow$ verifikasi otomatis diarahkan ke `index.html`.
  2. Coba logout, lalu login sebagai Pengguna biasa (`averyp` / `averyppass`) $\rightarrow$ verifikasi otomatis diarahkan ke `ambil-antrian.html`.
  3. Uji coba masukkan password yang salah $\rightarrow$ verifikasi muncul pesan kesalahan visual.
  4. Uji coba proteksi (*Auth Guard*): Buka langsung `index.html` atau `ambil-antrian.html` tanpa login $\rightarrow$ verifikasi sistem menolak dan mengalihkan paksa kembali ke `login.html`.

### 2️⃣ Dashboard Admin — `index.html` (Tanggung Jawab: Orang 2)
* **Demo Pengelolaan Master Data & Tiket**:
  1. **CRUD Jenis Antrian**: Tambahkan layanan baru (misal Kode: `M`, Nama: `Mata`). Uji validasi penolakan jika kode bukan 1 huruf kapital atau jika nama/kode duplikat.
  2. **Toggle Status**: Nonaktifkan salah satu layanan (misal Farmasi), periksa statusnya berubah menjadi nonaktif.
  3. **Penerbitan Manual**: Terbitkan tiket secara manual dengan memilih layanan aktif dan prioritas tertentu (misal VIP).
  4. **Reset Antrian**: Klik tombol **Reset Antrian** untuk mengosongkan seluruh antrian aktif dan mengembalikan urutan nomor tiket ke `001`.

### 3️⃣ Kiosk Pengunjung — `ambil-antrian.html` (Tanggung Jawab: Orang 1)
* **Demo Kiosk Ambil Tiket (Wajib Login - Revisi)**:
  1. Uji coba proteksi (*Auth Guard*): Buka `ambil-antrian.html` saat belum login $\rightarrow$ verifikasi otomatis dialihkan ke `login.html`.
  2. Login dengan akun (`averyp` / `averyppass`), perhatikan nama pengguna dan role tampil di header kartu kiosk.
  3. Perhatikan jenis layanan yang aktif muncul secara otomatis.
  4. Pengunjung memilih jenis layanan dan tingkat prioritas (**Normal, Lansia, Disabilitas, VIP**).
  5. Klik **Ambil Nomor Antrian** $\rightarrow$ nomor tiket tercetak dengan format `[Kode]-[3 Digit]` (misal: `A-001`, `B-002`).

### 4️⃣ Panel Operator — `operator.html` (Tanggung Jawab: Orang 3)
* **Demo Pemanggilan Berbasis Antrian Prioritas**:
  1. Login sebagai petugas operator atau buka `operator.html`.
  2. Perhatikan urutan antrian: Pasien dengan prioritas lebih tinggi (**VIP > Disabilitas > Lansia > Normal**) akan muncul sebagai nomor berikutnya (*Next in Queue*) meskipun mengambil tiket belakangan.
  3. Klik tombol **Panggil Berikutnya** $\rightarrow$ status nomor berpindah menjadi dipanggil (dan memicu suara panggilan jika speaker aktif).
  4. Klik tombol **Selesai** atau **Lewati** untuk menyelesaikan giliran pasien.

### 5️⃣ Layar Monitor Publik — `layar.html` (Tanggung Jawab: Orang 3)
* **Demo Real-time Display & Fullscreen**:
  1. Buka `layar.html` di jendela/layar monitor terpisah.
  2. Saat operator di `operator.html` memanggil tiket, perhatikan bahwa tampilan di `layar.html` **otomatis ter-update tanpa perlu reload halaman** (auto-polling interval 2–3 detik & storage sync).
  3. Tampilkan sisa antrian yang masih menunggu.
  4. Klik tombol **Layar Penuh** untuk menguji HTML5 Fullscreen API.

---

## 🚀 Panduan Memulai (Setup Awal Proyek)

Bagi anggota tim yang baru meng-clone repositori ini:

### 1. Prasyarat
* **Node.js** (versi 18 ke atas)
* **Visual Studio Code** + Ekstensi **Live Server**

### 2. Instalasi Dependensi Tooling
Jalankan di terminal:
```bash
npm install
```

### 3. Kompilasi TypeScript ke JavaScript
```bash
# Kompilasi seluruh file .ts di src/ ke dist/
npm run build

# Mode watch (otomatis kompilasi setiap kali ada file disimpan)
npm run watch
```

### 4. Menjalankan di Browser
1. Klik kanan pada file `login.html` di VS Code.
2. Pilih **"Open with Live Server"**.
3. Buka tab baru untuk `ambil-antrian.html`, `operator.html`, atau `layar.html` untuk menguji interaksi antar-halaman secara bersamaan.

---

## 📜 Rulebook & Standar Kode Tim

1. **Wajib Native**: Dilarang menginstal framework CSS/JS (No Bootstrap, Tailwind, React, Vue, jQuery).
2. **TypeScript Strict**: Dilarang menggunakan `any`, `@ts-ignore`, atau *type assertion* (`as`) tanpa alasan valid.
3. **Pengecekan Tipe**: Pastikan perintah ini selalu lolos **0 error** sebelum melakukan commit:
   ```bash
   npm run typecheck
   ```
4. **Kontrak Tipe Data**: Semua kontrak interface/type berada di `src/types/`. Jangan diubah tanpa kesepakatan bersama.
5. **Penyimpanan Terpusat**: Seluruh pembacaan dan penyimpanan data wajib melalui fungsi helper di `src/utils/storage.ts`.
6. **Relative Import**: Wajib menyertakan ekstensi `.js` pada import TypeScript (contoh: `import { ... } from "./utils/storage.js"`).

---

## 👥 Matriks Pembagian Tugas Tim (3 Orang)

| Anggota | Halaman & File | Fokus Pekerjaan |
| :--- | :--- | :--- |
| **👤 Orang 1** | `login.html`<br>`ambil-antrian.html`<br>`src/login.ts`<br>`src/ambil-antrian.ts` | Integrasi POST Login API DummyJSON, Session Storage, Halaman Kiosk Publik, Penomoran Tiket `A-001`, Pembaruan Layanan di Kiosk. |
| **👤 Orang 2 (Core/Lead)** | `index.html`<br>`src/admin.ts`<br>`src/types/*`<br>`src/utils/storage.ts`<br>`src/utils/guard.ts`<br>`css/style.css` | Fondasi arsitektur tipe data, Storage helper & Seed data, CSS Design System, Auth/Role Guard, Dashboard Admin, CRUD Master Layanan, Reset Antrian, Penerbitan Manual. |
| **👤 Orang 3** | `operator.html`<br>`layar.html`<br>`src/operator.ts`<br>`src/layar.ts`<br>`src/utils/queue.ts`<br>`src/utils/audio.ts` | Algoritma *Priority Queue* (VIP > Disabilitas > Lansia > Normal), Aksi Operator (Panggil, Lewati, Selesai), Layar Monitor Real-time Polling (2-3 dtk), Web Speech API & Fullscreen. |

---

## 🛠️ Ringkasan Perintah Terminal

```bash
# Kompilasi TypeScript ke folder dist/
npm run build

# Pengecekan error tipe tanpa menghasilkan file
npm run typecheck

# Pengawasan perubahan file otomatis
npm run watch
```
