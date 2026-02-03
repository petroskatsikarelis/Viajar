'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

type PostData = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  lat: number;
  lng: number;
};

// Load the composer (it already imports PickMap inside)
const PostFeatures = dynamic(() => import('@/components/PostFeatures'), {
  ssr: false,
});

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [post, setPost] = useState<PostData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (!currentUser) {
          setError('You must be logged in to edit posts');
          setLoading(false);
          return;
        }

        // Fetch the post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('id,title,description,category_slug,lat,lng,user_id')
          .eq('id', postId)
          .single();

        if (postError || !postData) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        // Check if user owns this post
        if (postData.user_id !== currentUser.id) {
          setError('You can only edit your own posts');
          setLoading(false);
          return;
        }

        setPost(postData as PostData);
      } catch (err) {
        setError('Failed to load post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
          <Link href="/profile" className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all">Go to Profile</Link>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Post not found</p>
          <Link href="/profile" className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all">Go to Profile</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/profile" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors mb-6 font-semibold">
          <span>←</span>
          <span>Back</span>
        </Link>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Edit Recommendation</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your place recommendation</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-teal-500 shadow-xl p-6 md:p-8">
          <PostFeatures editingPost={post} />
        </div>
      </div>
    </main>
  );
}
