import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dasbor Ruang Rapat",
  description: "Sistem Manajemen Jadwal Penggunaan Ruang Rapat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-text min-h-screen">
        {children}
      </body>
    </html>
  );
}
