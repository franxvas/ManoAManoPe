import { Tabs } from "expo-router";
import { FloatingDock } from "@/components/floating-dock";
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        animation: "fade",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="explore" options={{ title: "Explorar" }} />
      <Tabs.Screen name="publish" options={{ title: "Publicar" }} />
      <Tabs.Screen name="messages" options={{ title: "Mensajes" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
