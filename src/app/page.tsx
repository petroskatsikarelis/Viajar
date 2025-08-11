//page.tsx
import MapClient from '@/components/MapClient';

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold">Viajar</h1>
      <p className="mt-2">Your personal guide to Patras.</p>
      <div className="mt-6 rounded-xl overflow-hidden shadow-lg border">
        <MapClient />
      </div>
    </main>
  );
}
