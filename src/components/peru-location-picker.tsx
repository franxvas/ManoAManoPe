import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { SelectField } from "./select-field";
import { PrimaryButton } from "./primary-button";
import { useDeviceLocation } from "@/features/location/location-provider";
import {
  locateDistrict,
  normalizePlace,
  peruLocations,
  resolvePeruLocation,
} from "@/services/peru";
import { errorMessage } from "@/utils/errors";
export function PeruLocationPicker({
  region,
  city,
  onChange,
  onCoordinates,
}: {
  region: string;
  city: string;
  onChange: (region: string, city: string) => void;
  onCoordinates?: (
    coords: { latitude: number; longitude: number } | null,
  ) => void;
}) {
  const query = useQuery({
    queryKey: ["peru-locations"],
    queryFn: peruLocations,
    staleTime: 86400000,
  });
  const [province, P] = useState(""),
    [error, E] = useState(""),
    [busy, B] = useState(false);
  const { requestLocation } = useDeviceLocation();
  const rows = query.data ?? [];
  const dep = rows.find(
    (r) =>
      r.provincia === "00" &&
      normalizePlace(r.nombre) === normalizePlace(region),
  );
  const districts = rows.filter(
    (r) => r.departamento === dep?.departamento && r.distrito !== "00",
  );
  const matches = districts.filter(
    (r) => normalizePlace(r.nombre) === normalizePlace(city),
  );
  const selectedProvince =
    province || (matches.length === 1 ? matches[0]!.provincia : "");
  async function locate() {
    B(true);
    E("");
    try {
      const coords = await requestLocation();
      if (!coords)
        throw new Error(
          "Activa la ubicación o elige una localidad en las listas.",
        );
      const value = await resolvePeruLocation(coords, rows);
      P(value.province);
      onChange(value.region, value.city);
      onCoordinates?.(coords);
    } catch (e) {
      E(errorMessage(e));
    } finally {
      B(false);
    }
  }
  async function choose(value: string) {
    onChange(region, value);
    if (!onCoordinates) return;
    onCoordinates(null);
    B(true);
    E("");
    try {
      const provinceName =
        rows.find(
          (r) =>
            r.departamento === dep?.departamento &&
            r.provincia === selectedProvince &&
            r.distrito === "00",
        )?.nombre ?? "";
      onCoordinates(await locateDistrict(region, provinceName, value));
    } catch (e) {
      E(errorMessage(e));
    } finally {
      B(false);
    }
  }
  return (
    <View className="mb-3">
      {query.isLoading ? (
        <Text className="mb-3 text-muted">Cargando localidades del Perú…</Text>
      ) : (
        <>
          <SelectField
            label="Región o departamento"
            disabled={busy}
            value={dep?.nombre ?? ""}
            options={rows
              .filter((r) => r.provincia === "00")
              .map((r) => ({ value: r.nombre, label: r.nombre }))}
            onChange={(v) => {
              P("");
              onCoordinates?.(null);
              onChange(v, "");
            }}
          />
          <SelectField
            label="Provincia"
            value={selectedProvince}
            disabled={!dep || busy}
            options={rows
              .filter(
                (r) =>
                  r.departamento === dep?.departamento &&
                  r.provincia !== "00" &&
                  r.distrito === "00",
              )
              .map((r) => ({ value: r.provincia, label: r.nombre }))}
            onChange={(v) => {
              P(v);
              onCoordinates?.(null);
              onChange(region, "");
            }}
          />
          <SelectField
            label="Distrito o ciudad"
            value={city}
            disabled={!selectedProvince || busy}
            options={districts
              .filter((r) => r.provincia === selectedProvince)
              .map((r) => ({ value: r.nombre, label: r.nombre }))}
            onChange={(v) => void choose(v)}
          />
          <PrimaryButton
            label="Completar con mi ubicación"
            variant="outline"
            loading={busy}
            disabled={!rows.length}
            onPress={() => void locate()}
          />
        </>
      )}
      {(query.isError || !!error) && (
        <Text accessibilityRole="alert" className="mt-2 text-sm text-brand">
          {error || errorMessage(query.error)}
        </Text>
      )}
      {query.isError && (
        <PrimaryButton
          label="Volver a cargar localidades"
          onPress={() => void query.refetch()}
        />
      )}
    </View>
  );
}
