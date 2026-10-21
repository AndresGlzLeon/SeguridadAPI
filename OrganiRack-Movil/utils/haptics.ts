import * as Haptics from "expo-haptics";

export const triggerHaptic = (
  pattern: "success" | "error" | "warning" | "light" | "medium" | "heavy",
) => {
  try {
    switch (pattern) {
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        break;
    }
  } catch (error) {
    console.warn("Haptic feedback not available");
  }
};

export default triggerHaptic;
