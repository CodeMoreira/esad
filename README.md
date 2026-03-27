# ESAD (Easy Super App Development) 🚀

Zero-Config CLI and DevTools for React Native Module Federation + Expo.

ESAD is a unified toolkit designed to abstract all the complexity from Super App development using **Re.Pack (Rspack)** and **Expo**.

---

## 🏗️ CLI Commands

### 1. Initialize a Workspace
Clones the official Host Template and sets up a global workspace configuration.
```bash
npx @codemoreira/esad init my-project
```

### 2. Create a Federated Module
Clones the official Module Template and correctly configures it to join the Super App.
```bash
npx esad create-module module-rh
```

### 3. Development Mode
Starts the local Rspack server and **automatically** prepares native folders (`android/ios`) with necessary Re.Pack patches (Gradle, Entry Points).
```bash
npx esad host dev  # To run the Host
npx esad dev --id module-rh --port 9000  # To run a Module
```

### 4. Deployment
Builds, zips, and uploads the module bundle to the configured CDN registry.
```bash
npx esad deploy --id module-rh --version 1.0.0
```

---

## 🛠️ Library Usage

### 🎨 Bundler Plugin (`@codemoreira/esad/plugin`)
In your `rspack.config.mjs`, simplify everything:
```javascript
import { withESAD } from '@codemoreira/esad/plugin';

export default withESAD({
  type: 'module', // or 'host'
  id: 'my-mini-app'
});
```

### ⚡ Global State Hook (`@codemoreira/esad/client`)
Share state across different modules and the Host instantly and reactively:
```javascript
import { useESADState } from '@codemoreira/esad/client';

const [token, setToken] = useESADState('auth_token');
```

---

## 🏠 Template Features (Host & Module)

ESAD now uses a **Template-Based Scaffolding** system. Creating a project via CLI clones:
- [esad-template-host](https://github.com/CodeMoreira/esad-template-host)
- [esad-template-module](https://github.com/CodeMoreira/esad-template-module)

**Features included by default:**
- **🚀 Rspack + Re.Pack**: Blazing fast builds with Module Federation v2.
- **🎨 NativeWind v4**: Utility-first styling with Tailwind CSS logic.
- **🔐 Auth System**: Complete `AuthProvider` with `expo-secure-store`.
- **🛤️ Protected Routes**: Automatic redirection logic.
- **📦 Module Loader**: Robust dynamic remote loading via ESAD Registry.

---

## 🎨 Architecture & Workflow
For a detailed view of the system's architecture and development cycles, see [ESAD_ARCHITECTURE.md](./ESAD_ARCHITECTURE.md).
