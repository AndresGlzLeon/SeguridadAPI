import { useAuth } from "@context/AuthContext";
import { Stack } from "expo-router";

export default function ScreensLayout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="homeScreen" />
      <Stack.Screen name="overrideScreen" />
      <Stack.Screen name="scannerScreen" />
    </Stack>
  );
}
