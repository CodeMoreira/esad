# ESAD (Easy Super App Development) 🚀

Zero-Config CLI and DevTools for React Native Module Federation.

ESAD is a unified toolkit designed to abstract all the complexity from Super App development using **Re.Pack (Webpack)** and **React Native**.

---

## 🏗️ Commands

### 1. Initialize a Workspace
Creates a main project folder with a Host (Expo-ready) and a global configuration.
```bash
npx @codemoreira/esad init my-project
```

### 2. Create a Federated Module
Scaffolds a new mini-app correctly named and configured to join the Super App.
```bash
npx esad create-module module-rh
```

### 3. Create a Service Registry / CDN
Sets up the backend registry used for dynamic routing and file hosting.
```bash
npx esad create-cdn
```

### 4. Development Mode (Real-time HMR)
Starts the local packager and **automatically** notifies the Registry to bypass the CDN, so your Host App sees your local changes instantly.
```bash
npx esad dev --id module-rh --port 8081
```

### 5. Deployment
Builds, zips, and uploads the module bundle to the configured CDN endpoint.
```bash
npx esad deploy --id module-rh --version 1.0.0 --entry index.bundle
```

---

## 🛠️ Library Usage

### 🎨 Bundler Plugin (`esad/plugin`)
In your `rspack.config.mjs`, simplify everything:
```javascript
import { withESAD } from 'esad/plugin';

export default withESAD({
  type: 'module', // or 'host'
  id: 'my-mini-app'
});
```

### ⚡ Global State Hook (`esad/client`)
Share state across different modules and the Host instantly and reatively:
```javascript
import { useESADState } from 'esad/client';

const [token, setToken] = useESADState('auth_token');
```
