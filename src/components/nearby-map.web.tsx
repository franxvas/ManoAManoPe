import { Ionicons } from '@expo/vector-icons';
import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Pressable, Text, View } from 'react-native';
import 'leaflet/dist/leaflet.css';

import type { MapRegion, NearbyMapProps } from '@/components/nearby-map.types';
import { colors } from '@/constants/theme';
import { formatMoney, getListingAmount } from '@/utils/format';

const markerIcon = (label: string, active: boolean) => L.divIcon({
  className: '',
  html: `<div style="background:${active ? colors.red : colors.navy};border:3px solid white;border-radius:18px;color:white;font:600 11px Inter,sans-serif;padding:6px 9px;box-shadow:0 3px 10px #0004;white-space:nowrap;transform:translate(-25%,-25%)">${label}</div>`,
  iconSize: [60, 34],
  iconAnchor: [30, 17],
});

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#2F80ED;border:4px solid white;box-shadow:0 2px 8px #0005"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapEvents({ onRegionChange }: { onRegionChange: (region: MapRegion) => void }) {
  useMapEvents({
    moveend: (event) => {
      const map = event.target;
      const center = map.getCenter();
      const bounds = map.getBounds();
      onRegionChange({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
        longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest()),
      });
    },
  });
  return null;
}

function MapViewport({ region }: { region: MapRegion }) {
  const map = useMap();
  useEffect(() => {
    const current = map.getCenter();
    if (Math.abs(current.lat - region.latitude) > 0.0001 || Math.abs(current.lng - region.longitude) > 0.0001) {
      map.panTo([region.latitude, region.longitude]);
    }
  }, [map, region.latitude, region.longitude]);
  return null;
}

export function NearbyMap({ listings, region, selectedId, userCoordinates, locationUnavailable, onRegionChange, onSelect, onRequestLocation }: NearbyMapProps) {
  const centerOnUser = () => {
    if (!userCoordinates) return onRequestLocation();
    onRegionChange({ ...region, ...userCoordinates });
  };

  return (
    <View className="flex-1 overflow-hidden bg-slate-100">
      <MapContainer center={[region.latitude, region.longitude]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onRegionChange={onRegionChange} />
        <MapViewport region={region} />
        {userCoordinates && <Marker position={[userCoordinates.latitude, userCoordinates.longitude]} icon={userIcon} />}
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            icon={markerIcon(formatMoney(getListingAmount(listing.price, listing.budget)), listing.id === selectedId)}
            eventHandlers={{ click: () => onSelect(listing) }}
          />
        ))}
      </MapContainer>
      {locationUnavailable && (
        <Pressable onPress={onRequestLocation} className="absolute left-5 right-20 top-4 flex-row items-center rounded-2xl bg-white p-3 shadow-md">
          <Ionicons name="location-outline" size={21} color={colors.red} />
          <Text className="ml-2 flex-1 font-sans text-xs text-muted">Activa la ubicación para ver publicaciones cercanas.</Text>
        </Pressable>
      )}
      <Pressable className="absolute right-5 top-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md" onPress={centerOnUser} accessibilityLabel="Centrar mapa en mi ubicación">
        <Ionicons name="locate" size={23} color={colors.navy} />
      </Pressable>
    </View>
  );
}
