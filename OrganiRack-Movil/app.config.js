import "dotenv/config";

export default {
  expo: {
    name: "OrganiRack",
    slug: "OrganiRack",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "organirack",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.organirack.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
          "recordAudioAndroid": true,
          "barcodeScannerEnabled": true
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiUrl: process.env.API_URL || "http://192.168.1.10:8000/api/v1",
      eas: {
        projectId: "f2e588e0-44d4-4463-ad75-61540a5aa2d9",
      },
    },
  },
};
