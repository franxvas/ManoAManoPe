import { useState } from "react";
import { Modal, Pressable, Text, TextInput } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { trustRpc } from "./api";

export const reportReasons = [
  { value: "estafa", label: "Posible estafa" },
  { value: "prohibido", label: "Producto o servicio prohibido" },
  { value: "falso", label: "Información falsa o engañosa" },
  { value: "ofensivo", label: "Contenido ofensivo" },
  { value: "spam", label: "Spam o repetido" },
  { value: "otro", label: "Otro motivo" },
] as const;

export function ReportListingModal({
  listingId,
  visible,
  onClose,
}: {
  listingId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>();
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const close = () => {
    setReason(undefined);
    setDetails("");
    setMessage("");
    setSent(false);
    onClose();
  };

  const send = async () => {
    if (!reason) return setMessage("Elige un motivo.");
    setBusy(true);
    try {
      await trustRpc("report_listing", {
        p_listing_id: listingId,
        p_reason: reason,
        p_details: details,
      });
      setSent(true);
      setMessage("Gracias. Revisaremos esta publicación.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={close}>
        <Pressable
          className="gap-2 rounded-t-[32px] bg-white p-6 pb-10"
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="font-display text-2xl text-navy">
            Reportar publicación
          </Text>
          {!sent &&
            reportReasons.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setReason(r.value)}
                className={`rounded-xl border px-4 py-3 ${reason === r.value ? "border-brand bg-red-50" : "border-line"}`}
              >
                <Text className="text-ink">{r.label}</Text>
              </Pressable>
            ))}
          {!sent && (
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Detalles (opcional)"
              maxLength={500}
              multiline
              className="min-h-16 rounded-xl border border-line px-4 py-3 text-ink"
            />
          )}
          {Boolean(message) && (
            <Text className={sent ? "text-success" : "text-brand"}>{message}</Text>
          )}
          {sent ? (
            <PrimaryButton label="Cerrar" onPress={close} />
          ) : (
            <PrimaryButton
              label={busy ? "Enviando…" : "Enviar reporte"}
              disabled={busy}
              onPress={() => void send()}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
