'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';

interface Pelamar {
  id: number;
  nama: string;
  email: string;
  ktp_url: string;
  created_at: string;
}

interface SubmitState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Home() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle', message: '' });
  const [pelamars, setPelamars] = useState<Pelamar[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'data'>('form');

  function handleFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }

  async function fetchData() {
    setLoadingData(true);
    try {
      const res = await fetch('/api/pelamar');
      const json = await res.json();
      if (json.success) setPelamars(json.data);
    } catch { console.error('Gagal fetch data'); }
    finally { setLoadingData(false); }
  }

  useEffect(() => { if (activeTab === 'data') fetchData(); }, [activeTab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setSubmit({ status: 'error', message: 'Pilih file terlebih dahulu.' }); return; }
    setSubmit({ status: 'loading', message: '' });
    const fd = new FormData();
    fd.append('nama', nama);
    fd.append('email', email);
    fd.append('file', file);
    try {
      const res = await fetch('/api/pelamar', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setSubmit({ status: 'success', message: json.message });
        setNama(''); setEmail(''); setFile(null); setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setSubmit({ status: 'error', message: json.message });
      }
    } catch {
      setSubmit({ status: 'error', message: 'Gagal terhubung ke server.' });
    }
  }

  return (
    <div className="shell">

      {/* ── Header ── */}
      <header className="header">
        <div className="badge">
          <span className="badge-dot" />
          Cloud-Native Architecture
        </div>
        <h1>Portal <em>Pendaftaran</em> Pegawai</h1>
        <p className="subtitle">
          Data teks tersimpan aman di PostgreSQL · Dokumen dikirim ke Object Storage
        </p>
        <h2>Versi CI/CD : Testing</h2>
      </header>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          📋 Form Pendaftaran
        </button>
        <button
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          🗃️ Data Pelamar
        </button>
      </div>

      {/* ══ TAB: FORM ══ */}
      {activeTab === 'form' && (
        <div className="card">

          <div className="section-title">Alur Arsitektur</div>
          <div className="arch-grid">
            <div className="arch-card">
              <div className="arch-card-title">Data Teks</div>
              <div className="arch-card-val">PostgreSQL (DBaaS)</div>
              <span className="chip chip-blue">Nama · Email · URL</span>
            </div>
            <div className="arch-card">
              <div className="arch-card-title">File Gambar</div>
              <div className="arch-card-val">Object Storage</div>
              <span className="chip chip-sky">AWS S3 & ECR</span>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="section-title">Data Diri Pelamar</div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Alamat Email</label>
                <input
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Upload Foto KTP / CV</label>
                <div
                  className={`dropzone ${dragging ? 'drag' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} />
                  {!file ? (
                    <>
                      <div className="dz-icon">📂</div>
                      <div className="dz-label">
                        Drag & drop file di sini, atau <span>klik untuk memilih</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 7, fontWeight: 500 }}>
                        JPG, PNG · Maksimal 5 MB
                      </div>
                    </>
                  ) : (
                    <div style={{ pointerEvents: 'none' }}>
                      <div className="dz-icon">✅</div>
                      <div className="dz-label">File siap diupload!</div>
                    </div>
                  )}
                </div>

                {preview && file && (
                  <>
                    <div className="preview-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="preview KTP" />
                    </div>
                    <div className="preview-name">
                      📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        ✕ Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={submit.status === 'loading'}>
                {submit.status === 'loading' ? 'Memproses...' : 'Daftar Sekarang →'}
              </button>

              {submit.status === 'loading' && (
                <div className="alert alert-loading">
                  <span className="spinner" />
                  Mengupload ke S3 &amp; menyimpan ke database…
                </div>
              )}
              {submit.status === 'success' && (
                <div className="alert alert-success">✅ {submit.message}</div>
              )}
              {submit.status === 'error' && (
                <div className="alert alert-error">❌ {submit.message}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ══ TAB: DATA ══ */}
      {activeTab === 'data' && (
        <div className="card">
          <div className="data-header">
            <div>
              <div className="data-title">Daftar <em>Pelamar</em></div>
              <div className="data-sub">Data dari PostgreSQL · URL dokumen dari AWS S3</div>
            </div>
            <button className="refresh-btn" onClick={fetchData}>🔄 Refresh</button>
          </div>

          {loadingData ? (
            <div className="alert alert-loading">
              <span className="spinner" />
              Memuat data dari database…
            </div>
          ) : pelamars.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗃️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4 }}>
                Belum ada data pelamar
              </div>
              <div>Isi form pendaftaran terlebih dahulu.</div>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Dokumen</th>
                      <th>Waktu Daftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pelamars.map((p, i) => (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--muted2)', fontSize: 12, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text)' }}>{p.nama}</td>
                        <td style={{ color: 'var(--muted)', fontWeight: 500 }}>{p.email}</td>
                        <td className="url-cell">
                          <a href={p.ktp_url} target="_blank" rel="noreferrer">
                            🔗 Lihat Dokumen
                          </a>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatDate(p.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                Total {pelamars.length} pelamar
                <span className="chip chip-green">PostgreSQL</span>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
