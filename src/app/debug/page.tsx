'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Debug() {
  const [ok, setOk] = useState<string>('Checking…');

  useEffect(() => {
    (async () => {
      console.log('ENV URL', process.env.NEXT_PUBLIC_SUPABASE_URL);

      // Attempt to fetch one row from the 'posts' table to check connectivity
      const { data, error } = await supabase.from('posts').select('*').limit(1);

      if (error) {
        setOk('ERROR: ' + error.message);
      } else {
        setOk('OK: connected. Rows=' + (data?.length ?? 0));
      }
    })();
  }, []);

  return <pre className="p-4">{ok}</pre>;
}