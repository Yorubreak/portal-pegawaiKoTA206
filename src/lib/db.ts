/**
 * lib/db.ts
 * Koneksi ke PostgreSQL menggunakan environment variables.
 * Menggunakan connection pool agar efisien di lingkungan serverless.
 */
import { Pool } from 'pg';

// Singleton pool — dibuat sekali, dipakai ulang di setiap request
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,               // maksimal 10 koneksi paralel
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }
  return pool;
}

/**
 * Jalankan query SQL.
 * @param text  - Query SQL dengan placeholder $1, $2, ...
 * @param params - Array nilai untuk placeholder
 */
export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Inisialisasi skema database (buat tabel jika belum ada).
 * Dipanggil sekali saat aplikasi pertama kali jalan.
 */
export async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS pelamar (
      id          SERIAL PRIMARY KEY,
      nama        VARCHAR(255)  NOT NULL,
      email       VARCHAR(255)  NOT NULL UNIQUE,
      ktp_url     TEXT          NOT NULL,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Tabel pelamar siap.');
}
