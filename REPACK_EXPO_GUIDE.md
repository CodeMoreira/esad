# Technical Guide: Re.Pack 5 + Expo SDK 52 Integration

This guide documents the critical native patches and configurations applied by ESAD to stabilize React Native Module Federation within the Expo ecosystem.

---

## 1. Kotlin Versioning (The 1.9.25 Rule)
Expo SDK 52 (React Native 0.76) defaults to Kotlin 1.8.x. However, Re.Pack 5 and some modern MFv2 dependencies require **Kotlin 1.9.25** to avoid compilation errors and compatibility issues with the latest Rspack-generated bundles.

**ESAD Automation**: The `expo-plugin` automatically injects `kotlinVersion = '1.9.25'` into the `build.gradle` of every host project.

---

## 2. ABI Filters (Avoiding SoLoader Crashes)
When loading federated modules, mismatched native architectures can cause the app to crash with `SoLoader` or `UnsatisfiedLinkError`.

**Solution**: ESAD forces the application to build only for the most stable architectures:
- `armeabi-v7a`
- `arm64-v8a`
- `x86_64`

This prevents the "Missing Native Library" crash common in heterogeneous micro-frontend environments.

---

## 3. Entry Point Synchronization
In standard Expo, the entry point is handled by `expo-router` or `AppEntry.js`. For Re.Pack, we must ensure the native side looks for `index` (the Rspack bundle) instead of the Metro entry.

**ESAD Automation**:
- **Android**: Patches `MainApplication.kt` to ensure `getJSMainModuleName()` returns `"index"`.
- **iOS**: Ensures `AppDelegate.mm` is aligned with the Re.Pack resolution logic.

---

## 4. Cleartext Traffic (Development)
Since federated modules are often served from `http://localhost:9000` during development, Android requires explicit permission to fetch these bundles over non-HTTPS connections.

**ESAD Automation**: The `expo-plugin` automatically injects `android:usesCleartextTraffic="true"` into the `AndroidManifest.xml` during the `prebuild` phase.

---

## 5. Rspack vs Metro
ESAD completely bypasses Metro in favor of **Rspack**. 
- **Port 8081**: Reserved for the Rspack Host server.
- **Port 9000+**: Reserved for Federated Modules.

The CLI ensures that when running `npm start`, the Rspack server is invoked, preventing port conflicts and ensuring the correct bundle format (`.container.js.bundle`) is served.

---

> [!NOTE]
> All these configurations are managed by the **@codemoreira/esad/expo-plugin**. Manual changes to the `android/` or `ios/` folders are discouraged as they will be overwritten during the next `esad dev` cycle (Zero-Config).
