# ESAD: Easy Super App Development 🚀

**Zero-Config CLI & Framework for React Native Module Federation + Expo.**

ESAD is a unified toolkit designed to abstract all the complexity of Super App development. It bridges **Expo SDK 52** and **Re.Pack 5 (Rspack)** into a professional, linear workflow.

---

## 🔥 Key Features

- **⚡ Zero-Config Native**: Automatic Android/iOS patching via **Expo Config Plugins**. No more manual Gradle or Manifest edits.
- **🚀 Rspack Powered**: Blazing fast bundle generation for both Host and Remote Modules.
- **🛡️ Authenticated Remotes**: Built-in support for **JWT-signed bundle resolution** and dynamic module discovery.
- **📦 Shared Memory Bridge**: Reactive global state across federation boundaries using the ESAD Client SDK.
- **🧹 Lifecycle Maestro**: Automated `prebuild`, script fixing, and dev-server management.

---

## 🏗️ Quick Start (V2)

### 1. Initialize a Workspace
Creates the project root, a programmable `esad.config.js`, and the Host Application.
```bash
npx @codemoreira/esad init my-super-app
```

### 2. Expand your Workspace
Create new Federated Modules with built-in navigation and shared state examples.
```bash
esad create my-feature --type module
```

### 3. Development Manager (The Maestro)
The `dev` command handles everything: Prebuilds, Script Fixing, and Native Launch.

**Run the Host App:**
```bash
esad dev
```
*Choose Android or iOS. The CLI will automatically run `expo prebuild` if native folders are missing.*

**Run a specific Module (in a separate terminal):**
```bash
esad dev my-feature --port 9000
```

---

## 🛠️ Toolset Usage

### 🎨 Bundler Plugin (`@codemoreira/esad/plugin`)
The `withESAD` wrapper automates Module Federation v2 setup and dynamic exposes:
```javascript
import { withESAD } from '@codemoreira/esad/plugin';

export default withESAD(env, {
  type: 'module', 
  id: 'my-feature',
  dirname: __dirname
});
```

### ⚡ Client SDK (`@codemoreira/esad/client`)
Share state across the Host and all Remote Modules reactively:
```javascript
import { useESADState } from '@codemoreira/esad/client';

const [user, setUser] = useESADState('auth_user');
const [counter, setCounter] = useESADState('global_counter', 0);
```

---

## 🏛️ Architecture & Deep Dive
For technical diagrams, lifecycle details, and the "Zero-Config" philosophy, see [ESAD_ARCHITECTURE.md](./ESAD_ARCHITECTURE.md).

---

## 🏠 Modern Templates
ESAD templates provide a high-end starting point:
- **Navigation Multi-página**: Federated modules with internal stack navigators.
- **Real Auth**: Integration-ready for Simple-CDN registries via JWT.
- **Smart UI**: Pre-configured Skeletons, Typography, and Modern Dark Mode.

---

> [!TIP]
> **Why ESAD?** React Native Module Federation is hard. ESAD makes it as easy as a standard Expo app while keeping the power of dynamic micro-frontends.
