import { Disclosure } from "@/components/disclosure";
import { useState } from "react";
import { Text } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { readCache, writeCache } from "./cache";
export function DraftControls<T>({
  cacheKey,
  values,
  restore,
}: {
  cacheKey: string;
  values: () => T;
  restore: (v: T) => void;
}) {
  const [notice, N] = useState(""),
    [busy, B] = useState(false);
  async function action(load: boolean) {
    B(true);
    try {
      if (load) {
        const data = await readCache<T>(cacheKey);
        if (data) {
          restore(data);
          N("Borrador recuperado. Revísalo antes de publicar.");
        } else N("No hay un borrador guardado.");
      } else {
        await writeCache(cacheKey, values());
        N("Borrador guardado en este dispositivo. Todavía no está publicado.");
      }
    } catch {
      N("No se pudo guardar el borrador. Revisa el espacio disponible.");
    } finally {
      B(false);
    }
  }
  return (
    <Disclosure title="Borrador">
      <Text className="text-xs text-muted">
        Guarda el texto para continuar después. Tendrás que volver a seleccionar
        las fotos y conectarte para publicar.
      </Text>
      <PrimaryButton
        label="Guardar borrador"
        variant="outline"
        loading={busy}
        onPress={() => void action(false)}
      />
      <PrimaryButton
        label="Recuperar borrador"
        variant="outline"
        loading={busy}
        onPress={() => void action(true)}
      />
      {!!notice && (
        <Text accessibilityRole="alert" className="text-sm text-navy">
          {notice}
        </Text>
      )}
    </Disclosure>
  );
}
