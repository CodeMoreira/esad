# ESAD (Easy Super App Development) 🚀

Zero-Config CLI and DevTools for React Native Module Federation + Expo.

ESAD is a unified toolkit designed to abstract all the complexity from Super App development using **Re.Pack (Rspack)** and **Expo**.

---

## 🏗️ CLI Commands

### 1. Initialize a Workspace
```bash
npx @codemoreira/esad init my-project
```

### 2. Create a Federated Module
```bash
npx esad create-module module-name
```

### 3. Create a Local CDN / Registry
```bash
npx esad create-cdn
```

### 4. Development & Cloud-Sync
Starts the Rspack server locally OR performs a **Dev-Cloud Sync** for remote preview.
```bash
npx esad dev --id module-name  # Builds and pushes bundle to Dev Cloud
```

### 5. Host Automation
Manages the Host App and automatically synchronizes project-wide configurations (Auto-Sync).
```bash
npx esad host android  # Run Host on Android
```

### 5. Build for Production
Prepares the bundle and chunks for deployment, generating a standardized `./build` directory.
```bash
npx esad build --id module-name --platform android
```

### 6. Deployment
Packages the `./build` folder and uploads it to your configured Registry/CDN via multipart POST.
```bash
npx esad deploy --id module-name --version 1.0.0
```

---

## 🛠️ Library Usage

### 🎨 Bundler Plugin (`@codemoreira/esad/plugin`)
Wrap your configuration to enable ESAD's smart resolution and redirection logic:
```javascript
import { withESAD } from '@codemoreira/esad/plugin';

export default withESAD({
  type: 'module', // or 'host'
  id: 'my-mini-app'
});
```

### ⚡ Global State SDK (`@codemoreira/esad/client`)
Share state across the Host and all Remote Modules reactively via a **Universal Singleton**:
```javascript
import { useESADState } from '@codemoreira/esad/client';

const [user, setUser] = useESADState('user');
```

---

## ⚙️ Configuration (`esad.config.json`)

ESAD supports a "Zero-Config" but powerful orchestration file at the root:
- `projectName`: Your SuperApp identifier.
- `devModeFor`: Array of **shorthand** module names (e.g. `["recebimento"]`) to load from the Dev Cloud instead of Production.
- **Auto-Sync**: CLI commands (`dev`, `build`, `deploy`) automatically propagate this config to the Host App.

---

## 🏠 Template Features (Host & Module)

ESAD provides high-quality, boilerplate-free templates:
- **🚀 Rspack + Re.Pack**: Blazing fast builds powered by Rspack.
- **📱 Clean UI**: Modern, responsive designs built with **Vanilla StyleSheet** (No external CSS libraries required).
- **🛤️ Dynamic Navigation**: Pre-configured Dashboard and Module Viewer with **Suspense** support.
- **🔐 State-Driven Auth**: Built-in login and session management via the ESAD SDK.
- **🔧 Automated Patching**: CLI-driven injection of Re.Pack extensions into Android and iOS native projects.

---

## 🎨 Architecture & Workflow
For technical diagrams and the modular deployment lifecycle, see [ESAD_ARCHITECTURE.md](./ESAD_ARCHITECTURE.md).
