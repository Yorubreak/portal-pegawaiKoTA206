/**
 * app/api/pelamar/route.ts
 * 
 * POST /api/pelamar  → Terima form, upload foto ke Object Storage,
 *                      simpan data teks + URL ke PostgreSQL.
 * GET  /api/pelamar  → Ambil semua data pelamar (untuk tabel dashboard).
 */
import { NextRequest, NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db';
import { uploadToStorage } from '@/lib/storage';

// Pastikan tabel ada sebelum request pertama diproses
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

/* ─── POST: Submit Form Pendaftaran ──────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    await ensureDb();

    // Parse multipart/form-data menggunakan Web API bawaan Next.js 14
    const formData = await request.formData();

    const nama = formData.get('nama') as string | null;
    const email = formData.get('email') as string | null;
    const file = formData.get('file') as File | null;

    // Validasi input
    if (!nama || !email || !file) {
      return NextResponse.json(
        { success: false, message: 'Nama, email, dan file wajib diisi.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File harus berupa gambar (JPEG/PNG/PDF).' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file maksimal 5 MB.' },
        { status: 400 }
      );
    }

    // ── Langkah 1: Upload file ke Object Storage ──────────────
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { publicUrl } = await uploadToStorage(
      fileBuffer,
      file.name,
      file.type
    );

    // ── Langkah 2: Simpan data ke PostgreSQL ──────────────────
    const result = await query(
      `INSERT INTO pelamar (nama, email, ktp_url)
       VALUES ($1, $2, $3)
       RETURNING id, nama, email, ktp_url, created_at`,
      [nama.trim(), email.trim().toLowerCase(), publicUrl]
    );

    const pelamar = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Pendaftaran berhasil!',
        data: pelamar,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('POST /api/pelamar error:', error);

    // Duplikat email
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

/* ─── GET: Ambil Daftar Pelamar ──────────────────────────────── */
export async function GET() {
  try {
    await ensureDb();

    const result = await query(
      `SELECT id, nama, email, ktp_url, created_at
       FROM pelamar
       ORDER BY created_at DESC
       LIMIT 100`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('GET /api/pelamar error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data.' },
      { status: 500 }
    );
  }
}
