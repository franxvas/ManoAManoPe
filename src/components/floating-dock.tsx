import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

const icons: Record<
  string,
  [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]
> = {
  index: ["home-outline", "home"],
  explore: ["compass-outline", "compass"],
  publish: ["add", "add"],
  messages: ["chatbubbles-outline", "chatbubbles"],
  profile: ["person-outline", "person"],
};
type DockProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];
export function FloatingDock({ state, descriptors, navigation }: DockProps) {
  const insets = useSafeAreaInsets();
  const [keyboard, K] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener("keyboardDidShow", () => K(true)),
      b = Keyboard.addListener("keyboardDidHide", () => K(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  if (keyboard) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.position, { bottom: Math.max(insets.bottom, 12) + 8 }]}
    >
      <View style={styles.shadow}>
        <View style={styles.shell}>
          <BlurView
            intensity={75}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.row}>
            {state.routes.map((route, index) => {
              const active = state.index === index,
                options = descriptors[route.key]?.options;
              const names = icons[route.name] ?? icons.index!;
              return (
                <DockItem
                  key={route.key}
                  active={active}
                  publish={route.name === "publish"}
                  label={options?.title ?? route.name}
                  icon={names[active ? 1 : 0]}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!active && !event.defaultPrevented)
                      navigation.navigate(route.name, route.params);
                  }}
                  onLongPress={() =>
                    navigation.emit({ type: "tabLongPress", target: route.key })
                  }
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
function DockItem({
  active,
  publish,
  label,
  icon,
  onPress,
  onLongPress,
}: {
  active: boolean;
  publish: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.set(withSpring(0.88, { reduceMotion: ReduceMotion.System }));
      }}
      onPressOut={() => {
        scale.set(
          withSpring(1, { damping: 13, reduceMotion: ReduceMotion.System }),
        );
      }}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.icon,
          publish ? styles.publish : active ? styles.active : undefined,
          motion,
        ]}
      >
        <Ionicons
          name={icon}
          size={publish ? 27 : 23}
          color={publish ? "white" : active ? colors.red : colors.muted}
        />
      </Animated.View>
      {!publish && <Text style={{fontFamily:"Inter_600SemiBold",fontSize:10,marginTop:2,color:active?colors.red:colors.muted}}>{label}</Text>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  position: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 20,
  },
  shadow: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    ...Platform.select({web:{boxShadow:'0px 8px 24px rgba(23,40,63,0.13)'},default:{shadowColor:'#17283F',shadowOffset:{width:0,height:8},shadowOpacity:.13,shadowRadius:24,elevation:12}}),
  },
  shell: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.9)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,.97)"
        : "rgba(255,255,255,.78)",
  },
  row: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  item: { flex: 1, height: 62, alignItems: "center", justifyContent: "center" },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: "#EAF0F6" },
  publish: { backgroundColor: colors.red, width: 46, height: 40, borderRadius: 14 },
  dot: {
    position: "absolute",
    bottom: 0,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.navy,
  },
});
