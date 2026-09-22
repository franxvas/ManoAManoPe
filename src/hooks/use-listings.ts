import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchListings } from '@/services/listings';
import { useAppStore } from '@/stores/app-store';
import type { ListingType } from '@/types/domain';

export function useListings(query = '', type?: ListingType, enabled = true) {
  const localListings = useAppStore((state) => state.listings);
  const remote = useQuery({
    queryKey: ['listings', query, type],
    queryFn: () => fetchListings({ query, type }),
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
    listings: isSupabaseConfigured ? (remote.data ?? []) : local,
    isLoading: isSupabaseConfigured && remote.isLoading,
    isError: remote.isError,
    refresh: remote.refetch,
  };
}
