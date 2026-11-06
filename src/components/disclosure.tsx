import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";
export function Disclosure({
  title,
  children,
  initiallyOpen = false,
}: {
  title: string;
  children: ReactNode;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View className="mb-3 overflow-hidden rounded-3xl bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="min-h-14 flex-row items-center justify-between gap-3 px-4 py-4"
      >
        <Text className="flex-1 font-medium text-sm text-navy">{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={17}
          color={colors.muted}
        />
      </Pressable>
      {open && <View className="gap-3 px-4 pb-4">{children}</View>}
    </View>
  );
}
