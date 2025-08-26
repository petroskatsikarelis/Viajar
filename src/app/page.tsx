//page.tsx
import MapClient from '@/components/MapClient';
import AuthStatus from '@/components/AuthStatus';

export default function Page() {
  return (
    <main className="relative">
      <header className="p-4 flex items-center">
        <h1 className="text-3xl font-bold">Viajar</h1>
        <nav className="ml-6 flex gap-4 text-sm">
          <a className="underline" href="/post">Post</a>
        </nav>
        <div className="ml-auto">
          <AuthStatus />   {/* shows Login when logged out, Profile when logged in */}
        </div>
      </header>

      <div className="mt-4 rounded-xl overflow-hidden border">
        <MapClient />
      </div>
    </main>
  );
}

