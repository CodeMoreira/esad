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

### 4. Development & Native Automation
Starts the Rspack server and **automatically patches** native files (Gradle, Entry Points) if necessary.
```bash
npx esad host dev  # Run the Host App
npx esad dev --id module-name --port 9000  # Run a Module
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
Share state across the Host and all Remote Modules reactively:
```javascript
import { useESADState } from '@codemoreira/esad/client';

const [user, setUser] = useESADState('user');
```

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
