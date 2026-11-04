import { Pressable, Text, View } from 'react-native';
import { useDeviceLocation } from '@/features/location/location-provider';
import { approximateArea, type ApproximateArea } from './area';
export function AreaPicker({
  value,
  onChange,
}: {
  value: ApproximateArea | null;
  onChange: (area: ApproximateArea | null) => void;
}) {
  const { requestLocation, isLocating, error } = useDeviceLocation();
  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={{ color: '#6b7280' }}>
        Comparte una zona aproximada para encontrar solicitudes cercanas. No se
        publica tu dirección exacta.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={isLocating}
        onPress={() => {
          void requestLocation().then((area) => {
            if (area) onChange(approximateArea(area));
          });
        }}
        style={{
          padding: 12,
          backgroundColor: '#eaf0f8',
          borderRadius: 10,
          marginTop: 8,
        }}
      >
        <Text style={{ color: '#0b2d5d' }}>
          {isLocating
            ? 'Obteniendo zona…'
            : value
              ? 'Actualizar zona aproximada'
              : 'Usar mi zona aproximada'}
        </Text>
      </Pressable>
      {value && (
        <Pressable accessibilityRole="button" onPress={() => onChange(null)}>
          <Text style={{ padding: 8, color: '#b91c1c' }}>
            Quitar ubicación compartida
          </Text>
        </Pressable>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>
          {error} Puedes seguir buscando por ciudad.
        </Text>
      )}
    </View>
  );
}
export function NearbyFilter({
  origin,
  onOrigin,
  radius,
  onRadius,
}: {
  origin: ApproximateArea | null;
  onOrigin: (v: ApproximateArea | null) => void;
  radius: number | null;
  onRadius: (v: number | null) => void;
}) {
  return (
    <View>
      <AreaPicker
        value={origin}
        onChange={(v) => {
          onOrigin(v);
          if (!v) onRadius(null);
        }}
      />
      {origin && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[null, 5, 10, 25, 50].map((km) => (
            <Pressable
              key={String(km)}
              accessibilityRole="button"
              onPress={() => onRadius(km)}
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: radius === km ? '#0b2d5d' : '#eaf0f8',
              }}
            >
              <Text style={{ color: radius === km ? 'white' : '#0b2d5d' }}>
                {km == null ? 'Todas las zonas' : `${km} km aprox.`}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
