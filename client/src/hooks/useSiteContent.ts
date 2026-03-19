import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * A lightweight CMS hook that fetches content from the `site_content` table
 * by a unique `section_key`. Returns { data, loading, error }.
 *
 * Usage:
 *   const { data, loading } = useSiteContent('hero_title');
 *   // data is the JSONB `content` field
 */
export function useSiteContent<T = any>(sectionKey: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const { data: row, error: fetchError } = await supabase
          .from('site_content')
          .select('content')
          .eq('section_key', sectionKey)
          .single();

        if (fetchError) {
          // Not found is ok — just means no CMS override exists
          if (fetchError.code === 'PGRST116') {
            setData(null);
          } else {
            setError(fetchError.message);
          }
        } else if (row) {
          setData(row.content as T);
        }
      } catch (err) {
        setError('Failed to fetch content');
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [sectionKey]);

  return { data, loading, error };
}
