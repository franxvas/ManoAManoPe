import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

import { colors } from "@/constants/theme";

interface Props extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export function PrimaryButton({
  label,
  loading,
  variant = "primary",
  disabled,
  className = "",
  ...props
}: Props) {
  const backgrounds =
    variant === "primary"
      ? "bg-brand"
      : variant === "secondary"
        ? "bg-navy"
        : "border border-line bg-white";
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      disabled={disabled || loading}
      className={`min-h-12 items-center justify-center rounded-full px-5 py-3 ${backgrounds} ${disabled || loading ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? colors.navy : colors.white}
        />
      ) : (
        <Text
          className={`font-medium text-sm ${variant === "outline" ? "text-navy" : "text-white"}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
