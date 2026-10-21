import { Redirect } from "expo-router";
import { useAuth } from "@context/AuthContext";

export default function Index() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(screens)/homeScreen" />; 
  } else {
    return <Redirect href="/(auth)/loginScreen" />;
  }
}