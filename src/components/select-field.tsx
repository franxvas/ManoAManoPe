import { useState } from "react";
import {
  Modal,
  Pressable,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, O] = useState(false),
    [search, S] = useState("");
  const filtered = options.filter((o) =>
    o.label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(
        search
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      ),
  );
  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium text-sm text-ink">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${options.find(o=>o.value===value)?.label||value||'Seleccionar'}`}
        disabled={disabled}
        onPress={() => {
          S("");
          O(true);
        }}
        className={`rounded-2xl border border-line bg-white p-4 ${disabled ? "opacity-50" : ""}`}
      >
        <Text className="text-navy">
          {options.find((o) => o.value === value)?.label ||
            value ||
            "Seleccionar"}{" "}
          ▾
        </Text>
      </Pressable>
      {!!error && <Text className="mt-1 text-xs text-brand">{error}</Text>}
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => O(false)}
      >
        <SafeAreaView className="flex-1 bg-canvas">
          <View className="flex-row items-center justify-between p-5">
            <Text className="flex-1 font-display text-xl text-navy">
              {label}
            </Text>
            <Pressable onPress={() => O(false)} accessibilityRole="button">
              <Text className="p-2 text-brand">Cerrar</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel={`Buscar ${label}`}
            value={search}
            onChangeText={S}
            placeholder="Buscar…"
            className="mx-5 mb-3 rounded-xl border border-line bg-white p-4"
          />
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={filtered}
            keyExtractor={(o) => o.value}
            ListEmptyComponent={
              <Text className="p-5 text-muted">
                No hay opciones que coincidan.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item.value === value }}
                onPress={() => {
                  onChange(item.value);
                  O(false);
                }}
                className="mx-5 border-b border-line p-4"
              >
                <Text
                  className={
                    item.value === value
                      ? "font-medium text-brand"
                      : "text-navy"
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
