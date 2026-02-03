//page.tsx
import MapClient from '@/components/MapClient';
import AuthStatus from '@/components/AuthStatus';

export default function Page() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b-2 border-teal-500 shadow-lg">
        <div className="p-6 flex items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🌍</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Viajar</h1>
          </div>
          <nav className="ml-8 flex gap-6 text-lg font-semibold">
            <a className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" href="/post">Create Post</a>
            <a className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" href="/explore">Explore</a>
          </nav>
          <div className="ml-auto">
            <AuthStatus /> {/* shows Login when logged out, Profile when logged in */}
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mt-8 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-2xl hover:shadow-teal-500/20 transition-shadow">
          <MapClient />
        </div>
      </div>
    </main>
  );
}