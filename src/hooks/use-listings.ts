import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { readCache, writeCache } from '@/features/offline/cache';


import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchListings } from '@/services/listings';
import { useAppStore } from '@/stores/app-store';
import type { Listing, ListingType } from '@/types/domain';

export function useListings(query = '', type?: ListingType, enabled = true) {
  const [cached, setCached] = useState(false);
  const localListings = useAppStore((state) => state.listings);
  const remote = useQuery({
    queryKey: ['listings', query, type],
    queryFn: async () => {
      const key = `listing-cache:${query}:${type ?? 'all'}`;
      try { const rows = await fetchListings({ query, type }); setCached(false); await writeCache(key, rows).catch(() => {}); return rows; }
      catch (error) { const rows = await readCache<Listing[]>(key); if (rows) { setCached(true); return rows; } throw error; }
    },
    enabled: isSupabaseConfigured && enabled,
  });
  const local = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-PE');
    return localListings.filter((listing) => {
      const searchable = `${listing.title} ${listing.description} ${listing.ownerName}`.toLocaleLowerCase('es-PE');
      return listing.status === 'published' && (!type || listing.type === type) && (!normalized || searchable.includes(normalized));
    });
  }, [localListings, query, type]);

  return {
    cached,
    listings: isSupabaseConfigured ? (remote.data ?? []) : local,
    isLoading: isSupabaseConfigured && remote.isLoading,
    isError: remote.isError,
    refresh: remote.refetch,
  };
}
