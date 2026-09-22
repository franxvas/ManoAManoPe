import * as Location from 'expo-location';
import { AppState, Linking, Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

export interface DeviceCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextValue {
  coordinates: DeviceCoordinates | null;
  permissionStatus: Location.PermissionStatus;
  canAskAgain: boolean;
  isLocating: boolean;
  error: string;
  requestLocation: () => Promise<DeviceCoordinates | null>;
  openLocationSettings: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: PropsWithChildren) {
  const [coordinates, setCoordinates] = useState<DeviceCoordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState(Location.PermissionStatus.UNDETERMINED);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const requestInFlight = useRef<Promise<DeviceCoordinates | null> | null>(null);

  const requestLocation = useCallback(() => {
    if (requestInFlight.current) return requestInFlight.current;
    const request = (async () => {
      setIsLocating(true);
      setError('');
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        setPermissionStatus(permission.status);
        setCanAskAgain(permission.canAskAgain);
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          setCoordinates(null);
          setError('No podemos mostrar contenido cercano porque el permiso de ubicación no está activado.');
          return null;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const next = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        setCoordinates(next);
        return next;
      } catch {
        setCoordinates(null);
        setError('No pudimos obtener tu ubicación. Verifica que la ubicación del dispositivo esté activada.');
        return null;
      } finally {
        setIsLocating(false);
        requestInFlight.current = null;
      }
    })();
    requestInFlight.current = request;
    return request;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && permissionStatus !== Location.PermissionStatus.UNDETERMINED) void requestLocation();
    });
    return () => subscription.remove();
  }, [permissionStatus, requestLocation]);

  const value = useMemo<LocationContextValue>(() => ({
    coordinates,
    permissionStatus,
    canAskAgain,
    isLocating,
    error,
    requestLocation,
    openLocationSettings: async () => {
      if (Platform.OS === 'web') {
        await requestLocation();
        return;
      }
      await Linking.openSettings();
    },
  }), [canAskAgain, coordinates, error, isLocating, permissionStatus, requestLocation]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useDeviceLocation() {
  const value = useContext(LocationContext);
  if (!value) throw new Error('useDeviceLocation debe usarse dentro de LocationProvider');
  return value;
}
