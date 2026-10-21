# Installation and Setup Guide

Complete environment configuration for OrganiRack+ Mobile development.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18.0.0 or higher** with npm 9.0.0+
  - Verify: `node --version && npm --version`
- **Git** for version control
- **Expo CLI** globally installed: `npm install -g expo-cli`
- **Android SDK** (API 36+) for Android development, or
- **Xcode 14+** for iOS development

## Development Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Apoquellia/OrganiRackPlus.git
cd OrganiRackPlus/OrganiRack-Movil
```

### 2. Install Dependencies

```bash
npm install
```

**Troubleshooting Dependency Issues:**

If you encounter compatibility warnings or peer dependency conflicts:

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# If conflicts persist, use legacy peer deps flag
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```properties
# Backend API Configuration
EXPO_PUBLIC_API_URL=http://your-backend-url/api
EXPO_PUBLIC_API_TIMEOUT=30000

# Authentication Settings
EXPO_PUBLIC_SESSION_TIMEOUT=900000

# Environment
NODE_ENV=development
```

**Important Notes:**

- Environment variables prefixed with `EXPO_PUBLIC_` are embedded in the app bundle and visible to end users
- Never commit `.env` file; use `.env.example` for template reference
- Sensitive credentials should be stored in backend only
- API timeout is in milliseconds (30000 = 30 seconds)

### 4. Backend API Configuration

The application connects to a Laravel backend. Configure the endpoint in `.env`:

```properties
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api  # For local development
# OR
EXPO_PUBLIC_API_URL=https://api.example.com/api     # For production
```

**Endpoint Requirements:**

- GET `/login` — User authentication
- POST `/mobile/picking/orders` — Fetch assigned orders
- GET `/mobile/picking/{id}` — Get order details
- POST `/mobile/picking/confirmar` — Confirm picking operation

See [API Reference](api.md) for detailed specifications.

## Android Development Setup

### Android Emulator

#### Option A: Using Android Studio (Recommended)

1. Download and install [Android Studio](https://developer.android.com/studio)
2. Launch Android Studio and open AVD Manager
3. Create a new Virtual Device (API 36+ recommended)
4. Start the emulator

#### Option B: Command Line

```bash
# List available devices
emulator -list-avds

# Start emulator (example: Medium_Phone_API_36.0)
emulator -avd Medium_Phone_API_36.0 -no-snapshot-load
```

### Running on Android Emulator

```bash
# Terminal 1: Start emulator
emulator -avd Medium_Phone_API_36.0 -no-snapshot-load

# Terminal 2: Start Expo dev server
npm start

# Select 'a' in Expo menu to open on Android
```

Or use the combined script:

```bash
npm run dev  # Starts emulator and Expo server
```

## iOS Development Setup

### Requirements

- macOS 12.0+
- Xcode 14.0+
- CocoaPods package manager
- Apple Developer Account (for device testing)

### iOS Simulator

```bash
# Terminal 1: Start Expo dev server
npm start

# Terminal 2: Open in iOS simulator (press 'i' in Expo menu)
```

Or use npm script:

```bash
npm run ios
```

## Web Development

For web/browser testing:

```bash
npm run web

# App will be available at http://localhost:8081
```

**Note:** Some React Native features may not work in web environment. For full testing, use mobile emulators.

## Development Server

### Starting the Development Server

```bash
npm start
```

This launches Expo Go menu with options:

- Press `a` — Open in Android emulator
- Press `i` — Open in iOS simulator
- Press `w` — Open in web browser
- Press `j` — Open debugger
- Press `r` — Reload app
- Press `m` — Toggle menu

### Live Reloading

Changes to code automatically reload in connected devices:

- **Fast Refresh:** Most changes (UI, logic) reload instantly
- **Full Reload:** Some changes (dependencies, native code) require manual refresh

## Debugging

### React Native Debugger

For advanced debugging:

```bash
npm install -g react-native-debugger

# Start debugger and then press 'm' in Expo menu to connect
```

### Console Logging

All console logs appear in terminal running Expo:

```typescript
console.log('Debug message');
console.warn('Warning message');
console.error('Error message');
```

### VS Code Debugging

Configure `.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Attach to Expo",
      "request": "attach",
      "type": "node",
      "port": 19000,
      "preLaunchTask": "npm: start"
    }
  ]
}
```

## Build Configuration

### Expo Configuration (app.config.js)

The `app.config.js` file controls build settings:

```javascript
{
  "expo": {
    "name": "OrganiRack",
    "version": "2.1.0",
    "ios": { "bundleIdentifier": "com.example.organirack" },
    "android": { "package": "com.example.organirack" }
  }
}
```

### Release Build

```bash
# Create production build (Android APK)
eas build --platform android --profile production

# Create production build (iOS IPA)
eas build --platform ios --profile production
```

## TypeScript Configuration

The project uses strict TypeScript mode. Key settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["*"],
      "@api/*": ["API/*"],
      "@components/*": ["components/*"],
      "@hooks/*": ["hooks/*"]
    }
  }
}
```

Use path aliases for clean imports:

```typescript
// Instead of:
import { usePickingFlow } from '../../../hooks/usePicking';

// Use:
import { usePickingFlow } from '@hooks/usePicking';
```

## Code Quality

### ESLint

```bash
# Check for linting issues
npm run lint

# ESLint configuration in eslint.config.js
```

### Fixing Common Issues

```bash
# Auto-fix fixable issues
npx eslint . --fix
```

## Testing

While the project doesn't currently have automated tests, prepare your environment:

```bash
npm install --save-dev jest @testing-library/react-native
```

## Troubleshooting Setup Issues

### "Command not found: expo"

Install Expo CLI globally:

```bash
npm install -g expo-cli

# Verify installation
expo --version
```

### Port Already in Use (8081)

```bash
# On Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :8081
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Clear Expo cache
expo start -c

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Android Emulator Won't Start

```bash
# Reset emulator
emulator -avd Medium_Phone_API_36.0 -wipe-data

# Check hardware acceleration
emulator -list-avds -c

# For Intel machines, disable acceleration if problematic
emulator -avd Medium_Phone_API_36.0 -no-accel
```

### API Connection Issues

Verify backend connectivity from device:

```bash
# From within app or terminal
curl http://<backend-url>/api/health

# Ensure backend is running and accessible
# Check firewall settings
# On Android emulator, use 10.0.2.2 instead of 127.0.0.1 for localhost
```

## Next Steps

1. Review [Architecture & Design](architecture.md) to understand system structure
2. Study [Hooks Reference](hooks.md) for business logic implementation
3. Examine [API Reference](api.md) for backend integration details
4. Consult [Troubleshooting](troubleshooting.md) for issue resolution

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Axios Documentation](https://axios-http.com/)
