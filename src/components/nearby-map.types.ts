import type { Listing } from '@/types/domain';
import type { DeviceCoordinates } from '@/features/location/location-provider';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface NearbyMapProps {
  listings: Listing[];
  region: MapRegion;
  selectedId?: string;
  userCoordinates: DeviceCoordinates | null;
  locationUnavailable: boolean;
  onRegionChange: (region: MapRegion) => void;
  onSelect: (listing: Listing) => void;
  onRequestLocation: () => void;
}
