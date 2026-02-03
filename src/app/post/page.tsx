'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Load the whole composer (it already imports PickMap inside)
const PostFeatures = dynamic(() => import('@/components/PostFeatures'), {
  ssr: false, // avoid SSR for react-leaflet
});

export default function PostPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors mb-6 font-semibold">
          <span>←</span>
          <span>Back</span>
        </Link>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Create Recommendation</h1>
          <p className="text-gray-600 dark:text-gray-400">Share a place you loved with the community</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-teal-500 shadow-xl p-6 md:p-8">
          <PostFeatures />
        </div>
      </div>
    </main>
  );
}