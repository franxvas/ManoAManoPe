import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text } from "react-native";

import { colors } from "@/constants/theme";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View
      className="flex-row items-center"
      accessibilityLabel="MANO A MANO punto pe"
    >
      <View
        className={`${compact ? "h-8 w-8" : "h-14 w-14"} items-center justify-center rounded-full bg-brand`}
      >
        <MaterialCommunityIcons
          name="handshake-outline"
          size={compact ? 22 : 32}
          color={colors.white}
        />
      </View>
      <View className="ml-2">
        <Text
          className={`${compact ? "text-[15px]" : "text-3xl"} font-medium tracking-tight text-navy`}
        >
          mano a mano<Text className="text-brand">.pe</Text>
        </Text>
        {!compact && (
          <Text className="mt-0.5 font-medium text-[10px] uppercase tracking-[2px] text-muted">
            Comunidad que conecta
          </Text>
        )}
      </View>
    </View>
  );
}
