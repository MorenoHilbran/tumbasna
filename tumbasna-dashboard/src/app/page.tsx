import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import LandingPage from "@/components/Landing/LandingPage";

export const metadata: Metadata = {
  title: "Tumbasna - Pasar Digital Komoditas Pangan Banyumas",
  description: "Menghubungkan Pembeli (UMKM Banyumas) dan Petani/Supplier Lokal Banyumas secara langsung. Belanja kolektif bahan pangan segar dengan sistem harga transparan dan logistik cerdas terintegrasi AI.",
};

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // Jika diakses lewat dashboard.tumbasna.my.id, langsung arahkan ke /dashboard
  if (host.includes('dashboard.')) {
    redirect('/dashboard');
  }

  return (
    <main>
      <LandingPage />
    </main>
  );
}
