'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Post = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  lat: number;
  lng: number;
  created_at: string;
};

const MapView = dynamic(() => import('./MapView'), { ssr: false });

export default function MapClient({ selectedCategory }: { selectedCategory?: string | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Filter posts based on selectedCategory
    if (selectedCategory) {
      setFilteredPosts(posts.filter(post => post.category_slug === selectedCategory));
    } else {
      setFilteredPosts(posts);
    }
  }, [selectedCategory, posts]);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('id,title,description,category_slug,lat,lng,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setPosts(data as Post[]);
    }
  }

  useEffect(() => {
    // 1. Fetch posts immediately on mount
    fetchPosts();
    
    // 2. Set up polling interval (every 5 seconds)
    const id = setInterval(fetchPosts, 5000);
    
    // 3. Cleanup: clear interval on unmount
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-teal-500/20 transition-shadow">
      <MapView posts={filteredPosts} />
    </div>
  );
}