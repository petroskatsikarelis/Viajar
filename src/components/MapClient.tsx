'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import 'leaflet/dist/leaflet.css';
import { patchLeafletIcon } from '@/lib/leaflet-icon';
patchLeafletIcon(); 

type Post = { id:string; title:string; description:string|null; category_slug:string; lat:number; lng:number; created_at:string; };
const MapView = dynamic(()=>import('./MapView'),{ ssr:false });

export default function MapClient(){
  const [posts,setPosts]=useState<Post[]>([]);
  async function fetchPosts(){
    const { data, error } = await supabase.from('posts')
      .select('id,title,description,category_slug,lat,lng,created_at')
      .order('created_at',{ ascending:false });
    if(error) console.error(error); else setPosts(data as Post[]);
  }
  useEffect(()=>{ fetchPosts(); const id=setInterval(fetchPosts,5000); return ()=>clearInterval(id); },[]);
  return <MapView posts={posts} />;
}
