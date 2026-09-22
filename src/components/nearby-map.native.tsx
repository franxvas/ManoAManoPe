import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { NearbyMapProps } from '@/components/nearby-map.types';
import { colors } from '@/constants/theme';
import { formatMoney, getListingAmount } from '@/utils/format';

export function NearbyMap({ listings, region, selectedId, userCoordinates, locationUnavailable, onRegionChange, onSelect, onRequestLocation }: NearbyMapProps) {
  const mapRef = useRef<MapView>(null);

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
          <Marker key={listing.id} coordinate={{ latitude: listing.latitude, longitude: listing.longitude }} onPress={() => selectListing(listing)}>
            <View className={`items-center rounded-xl border-2 border-white px-2 py-1.5 ${selectedId === listing.id ? 'bg-brand' : 'bg-navy'}`}>
              <Ionicons name={listing.type === 'service' ? 'construct' : listing.type === 'promotion' ? 'pricetag' : listing.type === 'need' ? 'megaphone' : 'bag-handle'} size={13} color="white" />
              <Text className="font-medium text-[10px] text-white">{formatMoney(getListingAmount(listing.price, listing.budget))}</Text>
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
