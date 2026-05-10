# Portal Pendaftaran Pegawai
> **Modul Praktikum 5 — Stateful Architecture & Data Persistence**  
> Stack: **Next.js 14** · **PostgreSQL (DBaaS)** · **Object Storage (S3-compatible)**

---

## 🏗️ Arsitektur Sistem

```
Browser
  │
  ├─ POST /api/pelamar (multipart/form-data)
  │       │
  │       ├─ 1. Upload file ──────────→ Object Storage (S3/GCS/R2/MinIO)
  │       │                                    └─ returns publicUrl
  │       │
  │       └─ 2. INSERT (nama, email, ktp_url) ──→ PostgreSQL (DBaaS)
  │
  └─ GET  /api/pelamar ──────────────────────→ SELECT * FROM pelamar
```

Aplikasi bersifat **stateless** — tidak ada file yang disimpan di disk server.

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/username/portal-pegawai.git
cd portal-pegawai
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` dan isi semua nilai yang diperlukan:

| Variable | Keterangan |
|---|---|
| `DB_HOST` | Host/endpoint PostgreSQL DBaaS |
| `DB_PORT` | Port database (default: 5432) |
| `DB_NAME` | Nama database |
| `DB_USER` | Username database |
| `DB_PASSWORD` | Password database |
| `DB_SSL` | `true` jika DBaaS wajib SSL |
| `S3_ACCESS_KEY_ID` | Access Key Object Storage |
| `S3_SECRET_ACCESS_KEY` | Secret Key Object Storage |
| `S3_BUCKET_NAME` | Nama bucket |
| `S3_REGION` | Region (contoh: `ap-southeast-1`) |
| `S3_ENDPOINT` | Custom endpoint (non-AWS); kosongkan untuk AWS |
| `S3_PUBLIC_URL` | Base URL publik bucket |

### 3. Migrasi Database

```bash
npm run db:migrate
```

Membuat tabel `pelamar` di PostgreSQL.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Proyek

```
portal-pegawai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── pelamar/
│   │   │       └── route.ts      ← API endpoint (POST + GET)
│   │   ├── layout.tsx
│   │   └── page.tsx              ← Halaman utama (form + tabel)
│   └── lib/
│       ├── db.ts                 ← PostgreSQL connection pool
│       └── storage.ts            ← S3-compatible upload helper
├── scripts/
│   └── migrate.js                ← Buat tabel di database
├── .env.example                  ← Template env vars
├── .env                          ← (JANGAN di-commit!)
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 🗄️ Skema Database

```sql
CREATE TABLE pelamar (
  id          SERIAL PRIMARY KEY,
  nama        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  ktp_url     TEXT          NOT NULL,        -- URL Object Storage
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

## 🔌 Contoh Konfigurasi Object Storage

### AWS S3
```env
S3_REGION=ap-southeast-1
S3_ENDPOINT=          # kosongkan
S3_PUBLIC_URL=https://portal-pegawai-bucket.s3.ap-southeast-1.amazonaws.com
```

### IDCloudHost Object Storage
```env
S3_REGION=is3
S3_ENDPOINT=https://is3.cloudhost.id
S3_PUBLIC_URL=https://portal-pegawai-bucket.is3.cloudhost.id
```

### Cloudflare R2
```env
S3_REGION=auto
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://pub-xxxx.r2.dev
```

### MinIO (Lokal)
```env
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_URL=http://localhost:9000/portal-pegawai-bucket
```

---

## 🔒 Keamanan

- ✅ Semua kredensial disimpan di `.env` (tidak hardcoded)
- ✅ `.env` tercantum di `.gitignore`
- ✅ Validasi tipe file (hanya gambar) dan ukuran (maks 5 MB)
- ✅ PostgreSQL SSL support
- ✅ Connection pool dengan timeout

---

## 📡 API Reference

### `POST /api/pelamar`
Upload file ke Object Storage + simpan data ke database.

**Body (multipart/form-data):**
| Field | Type | Keterangan |
|---|---|---|
| `nama` | string | Nama lengkap pelamar |
| `email` | string | Email unik |
| `file` | File | Foto KTP/CV (image/*) |

**Response 201:**
```json
{
  "success": true,
  "message": "Pendaftaran berhasil!",
  "data": { "id": 1, "nama": "...", "email": "...", "ktp_url": "https://...", "created_at": "..." }
}
```

### `GET /api/pelamar`
Ambil semua data pelamar (100 terbaru).

**Response 200:**
```json
{
  "success": true,
  "data": [ { "id": 1, "nama": "...", ... } ]
}
```

---

## 🎓 Analisis Arsitektur

Mengapa **tidak** menyimpan gambar sebagai BLOB di database?

1. **Biaya Komputasi Tinggi**: Database DBaaS dikenakan biaya berdasarkan CPU, RAM, dan storage. BLOB besar meningkatkan storage database secara drastis (foto KTP bisa 500KB–2MB per record). Dengan 10.000 pelamar, storage database bisa mencapai 20 GB hanya untuk gambar — jauh lebih mahal daripada Object Storage yang dioptimalkan untuk file besar.

2. **Performa Menurun**: Setiap query `SELECT *` akan mengambil BLOB dari disk dan mentransfernya melalui jaringan. Ini membebani I/O database, memperlambat semua operasi (bukan hanya yang perlu gambar), dan meningkatkan latency secara keseluruhan. Object Storage dirancang khusus untuk serving file besar dengan CDN edge nodes, jauh lebih cepat untuk konten statis.
