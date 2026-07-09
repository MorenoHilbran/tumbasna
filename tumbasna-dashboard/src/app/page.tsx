import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from "@/components/Landing/LandingPage";

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

