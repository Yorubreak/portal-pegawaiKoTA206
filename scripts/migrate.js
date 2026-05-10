/**
 * scripts/migrate.js
 * Jalankan sekali: node scripts/migrate.js
 * Untuk membuat tabel pelamar di database.
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔗 Menghubungkan ke database...');
    const client = await pool.connect();

    console.log('📦 Membuat tabel pelamar...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pelamar (
        id          SERIAL PRIMARY KEY,
        nama        VARCHAR(255)  NOT NULL,
        email       VARCHAR(255)  NOT NULL UNIQUE,
        ktp_url     TEXT          NOT NULL,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Migrasi berhasil! Tabel pelamar siap.');
    client.release();
  } catch (err) {
    console.error('❌ Migrasi gagal:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
