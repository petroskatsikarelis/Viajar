'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Post = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_slug: string;
  lat: number;
  lng: number;
  created_at: string;
  author_name?: string | null;
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
      .select('id,user_id,title,description,category_slug,lat,lng,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      const rows = (data as Post[]) || [];
      const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));

      if (userIds.length === 0) {
        setPosts(rows);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id,username')
        .in('id', userIds);

      if (profileError) {
        console.error(profileError);
        setPosts(rows);
        return;
      }

      const nameByUserId = new Map(
        (profiles || []).map((p) => [
          p.id as string,
          (p as { username?: string | null }).username ?? null
        ])
      );

      const withNames = rows.map((row) => ({
        ...row,
        author_name: nameByUserId.get(row.user_id) ?? null,
      }));

      setPosts(withNames);
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