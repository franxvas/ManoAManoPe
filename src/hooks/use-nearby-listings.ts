import { useQuery } from '@tanstack/react-query';

import type { DeviceCoordinates } from '@/features/location/location-provider';
import { fetchNearbyListings } from '@/services/listings';
import type { ListingType } from '@/types/domain';

export function useNearbyListings(coordinates: DeviceCoordinates | null, radiusKm = 15, type?: ListingType, categoryId?: string) {
  return useQuery({
    queryKey: ['nearby-listings', coordinates?.latitude, coordinates?.longitude, radiusKm, type, categoryId],
    queryFn: () => fetchNearbyListings(coordinates!.latitude, coordinates!.longitude, radiusKm, type, categoryId),
    enabled: Boolean(coordinates),
    staleTime: 30_000,
  });
}
