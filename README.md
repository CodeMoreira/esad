# ESAD (Easy Super App Development) 🚀

Zero-Config CLI and DevTools for React Native Module Federation + Expo.

ESAD is a unified toolkit designed to abstract all the complexity from Super App development using **Re.Pack (Rspack)** and **Expo**. It provides a professional, linear workflow from scaffolding to deployment.

---

## 🏗️ CLI Workflow (V2)

### 1. Initialize a Workspace
Creates the project root, a programmable `esad.config.js`, and the Host Application.
```bash
npx @codemoreira/esad init my-project
```

### 2. Expand your Workspace
Create new Federated Modules or a Local Registry/CDN.
```bash
esad create my-module   # Creates a new module (Feature)
esad create --type cdn  # Scaffolds a local registry for testing
```

### 3. Development Manager (Unified)
The `dev` command is the single entry point for development. It automatically detects if it should run the Host or a Module.

**Run the Host App (Interactive):**
```bash
esad dev
```
*Allows selecting Android, iOS, or Bundler Only. Automatically patches native files.*

**Run a specific Module:**
```bash
esad dev my-module --port 9000
```
*Starts the module server and updates the Host's local mapping automatically.*

### 4. Build & Deploy
Prepare and push your features to the registry.

**Build for Production:**
```bash
esad build my-module --platform android
```

**Execute Programmable Deploy:**
```bash
esad deploy my-module --version 1.0.0
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
ESAD templates provide a high-end starting point:
- **🚀 Rspack + Re.Pack**: Blazing fast builds.
- **📱 Professional Architecture**: Modular structure (`src/api`, `src/components`, `src/navigation`).
- **🛤️ Dynamic Navigation**: Pre-configured Module Viewer with **Suspense** and **ErrorBoundary** support.
- **🔐 State-Driven Auth**: Built-in login and session management via the ESAD SDK.
- **🔧 Automated Native Patching**: Zero-config injection into Android/iOS projects.

---

## 🎨 Architecture & Workflow
For technical diagrams and the full lifecycle, see [ESAD_ARCHITECTURE.md](./ESAD_ARCHITECTURE.md).
