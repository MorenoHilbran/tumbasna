import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    default: "Tumbasna â€” Admin Dashboard Komoditas Pangan",
    template: "%s | Tumbasna Admin",
  },
  description:
    "Platform monitoring komoditas pangan cerdas berbasis AI. Pantau distribusi, harga pasar, transaksi, dan logistik secara real-time.",
  keywords: [
    "komoditas",
    "supply demand",
    "monitoring harga",
    "inflasi pangan",
    "TPID",
    "Bank Indonesia",
    "tumbasna",
    "logistik",
    "admin dashboard",
  ],
  authors: [{ name: "Tim Tumbasna" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Tumbasna",
    title: "Tumbasna â€” Admin Dashboard Komoditas Pangan",
    description:
      "Platform monitoring komoditas pangan cerdas berbasis AI. Pantau distribusi, harga pasar, transaksi, dan logistik secara real-time.",
    images: [
      {
        url: "/logo-full.png",
        width: 1200,
        height: 630,
        alt: "Tumbasna Admin Dashboard",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className="font-sans antialiased"
        style={{ background: '#F4F7F2', color: '#1a2e1e' }}
      >
        {children}
      </body>
    </html>
  );
}

