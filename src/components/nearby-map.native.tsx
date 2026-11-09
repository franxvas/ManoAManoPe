import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { NearbyMapProps } from '@/components/nearby-map.types';
import { colors } from '@/constants/theme';
import { formatMoney, getListingAmount } from '@/utils/format';
import { spreadPositions } from './map-spread';

export function NearbyMap({ listings, region, selectedId, userCoordinates, locationUnavailable, onRegionChange, onSelect, onRequestLocation }: NearbyMapProps) {
  const mapRef = useRef<MapView>(null);
  const positions = spreadPositions(listings);

  const selectListing = (listing: NearbyMapProps['listings'][number]) => {
    onSelect(listing);
    mapRef.current?.animateToRegion(
      { ...region, latitude: listing.latitude - region.latitudeDelta * 0.08, longitude: listing.longitude },
      350,
    );
  };

  return (
    <View className="flex-1">
      <MapView ref={mapRef} style={{ flex: 1 }} region={region} onRegionChangeComplete={onRegionChange} showsUserLocation={Boolean(userCoordinates)} showsMyLocationButton={false}>
        {listings.map((listing) => (
          <Marker key={listing.id} coordinate={positions.get(listing.id)!} onPress={() => selectListing(listing)}>
            <View className="items-center">
              <View className={`h-12 w-12 overflow-hidden rounded-full border-[3px] bg-white ${selectedId === listing.id ? 'border-brand' : 'border-navy'}`}>
                {listing.images[0] || listing.ownerAvatar ? (
                  <Image source={{ uri: listing.images[0] || listing.ownerAvatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View className="flex-1 items-center justify-center bg-navy">
                    <Ionicons name={listing.type === 'service' ? 'construct' : listing.type === 'promotion' ? 'pricetag' : 'bag-handle'} size={18} color="white" />
                  </View>
                )}
              </View>
              <View className={`-mt-1.5 rounded-full border-2 border-white px-1.5 py-0.5 ${selectedId === listing.id ? 'bg-brand' : 'bg-navy'}`}>
                <Text className="font-medium text-[10px] text-white">{formatMoney(getListingAmount(listing.price, listing.budget))}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>
      {locationUnavailable && (
        <Pressable onPress={onRequestLocation} className="absolute left-5 right-20 top-4 flex-row items-center rounded-2xl bg-white p-3 shadow-md">
          <Ionicons name="location-outline" size={21} color={colors.red} />
          <Text className="ml-2 flex-1 font-sans text-xs text-muted">Activa la ubicación para ver publicaciones cercanas.</Text>
        </Pressable>
      )}
      <Pressable className="absolute right-5 top-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md" onPress={() => {
        if (!userCoordinates) return onRequestLocation();
        const next = { ...region, ...userCoordinates };
        onRegionChange(next);
        mapRef.current?.animateToRegion(next, 400);
      }} accessibilityLabel="Centrar mapa en mi ubicación">
        <Ionicons name="locate" size={23} color={colors.navy} />
      </Pressable>
    </View>
  );
}
