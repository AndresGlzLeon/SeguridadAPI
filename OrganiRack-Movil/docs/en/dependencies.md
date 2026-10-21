# Dependencies

External library justification and security notes for OrganiRack+ Mobile.

## Production Dependencies

### Runtime Dependencies

| Package | Version | Purpose | Justification | Security Notes |
|---------|---------|---------|---------------|----------------|
| react | 19.1.0 | UI library | Latest stable version for React Native | Regularly updated for security patches |
| react-native | 0.81.5 | Mobile framework | Compatible with Expo 54 | Use only official React Native packages |
| expo | 54.0.33 | Build and deployment platform | Official managed service | Ensures security updates automatically applied |
| expo-router | 6.0.23 | File-based routing | Reduces boilerplate, improves maintainability | Built on React Navigation |
| react-navigation | 7.1.28 | Navigation implementation | Core dependency for routing | Security: Handle deep linking validation |
| axios | 1.13.6 | HTTP client | Mature, widely used library | Use with interceptors for token management |
| expo-secure-store | 15.0.8 | Encrypted storage | OS-level encryption for tokens | Preferred over AsyncStorage for sensitive data |
| expo-camera | 17.0.10 | Camera access | Native camera functionality | Requires runtime permissions |
| expo-haptics | 15.0.8 | Haptic feedback | User feedback on confirmations | Optional enhancement |

### Framework Packages

| Package | Purpose |
|---------|---------|
| @react-navigation/native-stack | Stack navigation | 
| @react-navigation/bottom-tabs | Tab-based navigation |
| @react-navigation/elements | Navigation utilities |
| expo-font | Font loading | 
| expo-status-bar | Status bar management |
| expo-constants | App metadata access |
| expo-splash-screen | Splash screen management |

### Vector Icons

```typescript
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
```

All icons served from @expo/vector-icons (icon fonts included in Expo).

## Development Dependencies

| Package | Purpose | Note |
|---------|---------|------|
| typescript | Type checking | Strict mode enabled, recommended for team development |
| @types/react | Type definitions | Required for TypeScript support |
| eslint | Code linting | Enforces code quality and consistency |
| eslint-config-expo | ESLint configuration | Official Expo configuration |

## Dependency Management Strategy

### Version Pinning

Production dependencies are pinned to specific versions in `package-lock.json` to ensure reproducible builds across environments. Never rely on caret (^) or tilde (~) ranges for production deployments.

### Update Policy

- **Critical Security Updates:** Apply within 24 hours
- **Minor Updates:** Review and apply within 1 sprint
- **Major Updates:** Plan and test thoroughly before applying
- **Deprecation Warnings:** Address within current sprint

### Vulnerability Scanning

```bash
# Check for known vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# List detailed vulnerabilities
npm audit --detailed

# Skip audit on install (not recommended)
npm install --prefer-offline --no-audit
```

## Known Compatibility Issues

### React Native 0.81 + TypeScript 5.9

Type definitions may require `skipLibCheck: true` in `tsconfig.json` due to mismatches in @types packages. This is acceptable for Expo-managed projects.

### Expo and Hermes Engine

Currently using JavaScriptCore engine. Hermes support available in future Expo versions, which will reduce app size and improve startup time.

### Android Emulator Networking

For local backend testing on Android emulator, use `10.0.2.2` instead of `127.0.0.1` or `localhost`. Configuration in `.env`:

```properties
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

## Optional Dependencies (Not Installed)

### Why Redux is Not Used

- **Complexity:** Unnecessary for current app scope
- **Learning Curve:** Context API sufficient for authentication state
- **Bundle Size:** Adds 40KB+ to bundle
- **Migration Path:** Can add Redux/Zustand later if needed

### Why React Query is Not Used

- **Current Need:** Simple API calls handled via custom hooks
- **Alternative:** Consider for complex caching requirements
- **Bundle Impact:** Adds 30KB+

### Why Animated Library is Not Used

- **Expo Support:** `react-native-reanimated` already included for animations
- **Use Case:** Simple fade/slide animations handled by React Native Animated API

## Security Considerations

### API Communication

All API communication goes through Axios client with:
- HTTPS enforced in production
- Request timeout (30 seconds) prevents hanging connections
- Token attached automatically via interceptors
- Response validation before processing

### Token Management

JWT tokens are:
- Stored in `expo-secure-store` (OS-level encryption)
- Never logged or exposed in console
- Automatically refreshed when expired (via interceptor)
- Cleared on logout

### User Input Validation

All user input validated before submission:
- Location codes checked for format
- Quantity validated as positive integer
- API responses validated with TypeScript

### Environment Variables

Sensitive configuration in `.env`:
- Never committed to version control
- `EXPO_PUBLIC_` prefix indicates embedded in bundle
- Non-public values must use other configuration method

## Dependency Compliance

### Licenses

All dependencies use compatible open-source licenses:
- MIT (majority of packages)
- Apache 2.0
- ISC
- BSD

See individual package licenses for details.

### Forced Dependency Resolution

The `overrides` section in `package.json` enforces specific versions to resolve conflicts:

```json
{
  "overrides": {
    "minimatch": "^10.1.2",
    "glob": "^10.4.5"
  }
}
```

This ensures consistent versions across nested dependencies.

## Performance Optimization

### Bundle Size Optimization

Current bundle size approximately 25MB (varies by platform).

**Opportunities for reduction:**
1. Remove unused vector icon fonts
2. Implement code splitting with Expo Router
3. Enable ProGuard/R8 for Android
4. Tree-shake unused dependencies

### Runtime Performance

- Axios instance reused across all API calls
- Token interceptor caches token in memory between calls
- React fast refresh enabled for development

## Updating Dependencies

### Safe Update Process

1. Create new git branch
2. Update single dependency: `npm update package-name`
3. Run tests and test in emulator
4. Commit with clear message: "Update package-name to X.Y.Z"
5. Create pull request with change summary

### Batch Updates

For multiple security updates:

```bash
# Check what would be updated
npm outdated

# Update all patch versions
npm update

# Review changes
git diff package.json

# Commit if all tests pass
git commit -m "Update dependencies - patch releases"
```

### Major Version Updates

For major version updates (breaking changes):

1. Read changelog and migration guide
2. Update in development branch
3. Run full test suite
4. Test on physical device if possible
5. Document any API changes required

## Dependency Documentation

For each major dependency, reference:
- Official documentation URL
- Key API methods used
- Configuration location
- Known limitations or gotchas

### Key Documentation Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Reporting Dependency Issues

If a dependency has security vulnerabilities or bugs:

1. Report on package GitHub repository
2. Document workaround if available
3. Track in project issues
4. Monitor for fix release
5. Update when available

Example issue format:
```
Dependency: package-name v1.0.0
Issue: Security vulnerability CVE-XXXX
Workaround: Avoid using feature Y
Status: Waiting for v1.1.0 release
```
