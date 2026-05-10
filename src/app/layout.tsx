import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal Pendaftaran Pegawai',
  description: 'Cloud-native employee registration portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
