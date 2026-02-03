'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MapClient from '@/components/MapClient';
import AuthStatus from '@/components/AuthStatus';

const CATEGORIES = [
  { slug: 'cafe', label: 'Café', emoji: '☕', color: 'from-amber-400 to-amber-600' },
  { slug: 'restaurant', label: 'Restaurant', emoji: '🍽️', color: 'from-red-400 to-red-600' },
  { slug: 'museum', label: 'Museum', emoji: '🏛️', color: 'from-purple-400 to-purple-600' },
  { slug: 'view', label: 'Viewpoint', emoji: '🌅', color: 'from-orange-400 to-orange-600' },
  { slug: 'bar', label: 'Bar', emoji: '🍹', color: 'from-pink-400 to-pink-600' },
  { slug: 'club', label: 'Nightclub', emoji: '🎉', color: 'from-indigo-400 to-indigo-600' },
  { slug: 'park', label: 'Park', emoji: '🌳', color: 'from-green-400 to-green-600' },
  { slug: 'other', label: 'Other', emoji: '⭐', color: 'from-gray-400 to-gray-600' },
];

export default function ExplorePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b-2 border-teal-500 shadow-lg">
        <div className="p-6 flex items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-lg">🌍</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Viajar</h1>
          </div>
          <nav className="ml-8 flex gap-6 text-lg font-semibold">
            <a className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" href="/">Map</a>
            <a className="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400" href="/explore">Explore</a>
            <a className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" href="/post">Create Post</a>
          </nav>
          <div className="ml-auto">
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Category Grid - Narrower */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-24 h-fit">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Categories</h3>
              <div className="space-y-3">
                {/* All Categories Button */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full p-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                    selectedCategory === null
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🌐 All Categories
                </button>

                {/* Category Buttons */}
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full p-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                      selectedCategory === cat.slug
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-xl mr-2">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Info Box */}
              {selectedCategory && (
                <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border-l-4 border-teal-500">
                  <p className="text-sm text-teal-700 dark:text-teal-300 font-semibold">
                    📍 Showing posts from <span className="font-bold">{CATEGORIES.find(c => c.slug === selectedCategory)?.label}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Heading and Map */}
          <div className="lg:col-span-3 space-y-4">
            {/* Heading */}
            <div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent mb-2">Explore Viajar</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Discover amazing places by category. Select a category to filter posts and see them on the map.
              </p>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border-2 border-teal-500 shadow-2xl hover:shadow-teal-500/20 transition-shadow h-[600px]">
              <MapClient selectedCategory={selectedCategory} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
