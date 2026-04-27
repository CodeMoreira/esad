# ESAD: Commands & Configuration Version 2.0

This version unifies the Super App ecosystem commands and introduces programmable JavaScript configuration.

## 1. Architecture & Coding Standards

To ensure a scalable and maintainable system, the following principles must be strictly followed:

### 1.1 Core Principles
- **Language**: All code (variables, functions, classes), commands, and documentation must be in **English**.
- **SOLID**: Follow SOLID principles for robust command orchestration.
- **Ports and Adapters**: Use a Ports and Adapters approach to isolate logic from external factors (CLI environment, file system, registry APIs).
- **Small & Generic Parts**: Break the CLI and project logic into small, testable parts. Centralize logic to maintain a **Single Source of Truth**.

### 1.2 Project Organization (`esad-core`)
Both Host applications and Modules must isolate all essential ESAD logic into a dedicated standardized folder (e.g., `esad-core`, `esad-essentials`, or `esad-base`).

#### Folder Structure Guidelines:
- `providers/`: Context providers and global state managers.
- `functions/`: Core utility functions (e.g., `getRegistry`).
- `auth/`: Token management and identity logic (Storage, Refresh).
- `components/`: Generic UI components related to ESAD. High-end, **Modern Dark Mode** design (no glassmorphism).
- `constants/`: Global constants and configuration defaults.

This isolation ensures that ESAD functionality is abstracted, organized, and easy to maintain or swap.

## 2. Centralized Commands

Commands are managed from a single entry point at the project root or within module directories.

### 2.1 `esad create [name] --type [host|module|cdn]`
Interactive CLI for scaffolding.
- **Name Validation**: If a name is provided, type defaults to `module`. If type is `module` and no name is provided, the CLI will prompt for one.
- **Context Validation**:
    - Requires a valid `esad.config.js` to create `module` or `cdn`.
    - If no config exists, only `host` creation is allowed.
    - Prevents duplicate `host` or `cdn` creation if already present.
    - Allows unlimited `module` creation.

### 2.2 `esad dev [host|module-name] --port [port]`
Starts the development environment.
- **Execution Context**: Can be run from the super app root (specifying name) or directly inside a `host` or `module` folder.
- **Modules**:
    - For modules, ESAD automatically extracts the **short name** (e.g., `my-module` instead of `mega-app-my-module`).
    - Uses default React Native port if none is provided.
- **Configuration**: Validates `esad.config.js` and updates the `devMode` mapping automatically.

### 2.3 `esad deploy [module-name]`
Builds and pushes the bundle to the registry.
- **Context**: Executable from root (specifying name) or inside the module folder.
- **Nomenclature**: Extracts the module short name.
- **Execution**: Generates the build and invokes the `deploy` function from the configuration.

### 1.5 `esad doctor`
Diagnostic tool to verify environment health.
- **Dependency Check**: Verifies if remote modules and the host are using compatible versions of shared native libraries (e.g., `react-native`, `reanimated`).
- **Config Validation**: Checks for missing `.env` variables (e.g., `registryUrl`) or malformed `esad.config.js`.

### 1.6 `esad link [module-name]`
Optimized development workflow via local linking.
- **Mechanism**: Overrides bundle resolution to fetch from the local file system instead of a network request to a dev server.
- **Goal**: Ultra-fast iteration for local-only testing without needing full cloud-dev synchronization.

### 2.4 `esad build [host|module-name]`
Generates the final production build.
- **Execution Context**: Can be run from the root (specifying name) or inside a `host` or `module` folder.
- **Modules**: Automatically extracts the short name.
- **Cleanup**: Removes the `devMode` parameter from the configuration during the build process to avoid shipping local URLs.

## 3. Programmable Configuration (`esad.config.js`)

Replacing JSON with JavaScript allows for complete customization of deployment and development workflows.

### File Structure
```javascript
export default {
  projectName: 'MySuperApp',
  
  // 1. Development Overrides (Mechanism)
  // When 'esad dev' is running, the Host uses these URLs for specified modules.
  // If `devMode` doesn't exist, ESAD creates it automatically with these mappings.
  devMode: {
    'auth-module': 'http://192.168.1.10:8081',
    'wallet-module': 'localhost:8100'
  },

  // 2. Programmable Deployment (Mechanism)
  // Receives the compiled bundle. Common patterns: simple-cdn, AWS S3, FTP, etc.
  async deploy(bundle, { version, moduleId, options }) {
    // ESAD automatically removes `devMode` before calling this function.
    // Deployment logic is fully customizable.
    const response = await fetch(`https://my-cdn.com/api/upload/${moduleId}`, {
      method: 'POST',
      body: bundle,
      headers: { 'Authorization': `Bearer ${process.env.ESAD_TOKEN}` }
    });
    
    return await response.json();
  }
}
```

### Key Features:
- **Registry Configuration**: The Host application must fetch the module registry URL from an environment variable named `registryUrl` defined in the `.env` file.
    - **Authentication**: Fetches must include the `Authorization` header if a user token is present.
- **Secure Resolution**: The `ScriptManager` resolver must be configured to inject the `Authorization: Bearer <token>` header into all bundle requests to ensure secure loading from the CDN.
- **Native Integration**: Optimized for `simple-cdn` by default but flexible for any provider.

## 4. Template Architecture & Design System

All default templates (`host`, `module`) must follow a high-end, industry-standard modular structure.

### 4.1 Folder Structure (`src/`)
To ensure maintainability and professional organization, code must be separated into the following domains:
- `api/`: Service layers, API fetchers, and backend integration.
- `components/`: Atomic and reusable UI components (Buttons, Inputs, Cards).
- `context/`: State management providers (Auth, Theme, Multi-language).
- `navigation/`: Routing configuration using **React Navigation**.
- `screens/`: Page/Screen level components.
- `utils/`: Helper functions, validators, and formatters.
- `theme/`: Design tokens (Colors, Spacing, Typography).

### 4.2 Routing System
- **Provider**: Templates must use `@react-navigation/native` and `@react-navigation/native-stack`.
- **Navigation Type**: Host apps should implement a Root Stack (including Auth and Main flows).

### 4.3 Resilience & UX Components
- **Smart Skeleton**: A centralized component that automatically generates shaded layout placeholders. It should accept a "layout" schema or intelligently mirror the dimensions of the target component.
- **RemoteComponent Wrapper**: A high-level component to isolate Federated Modules. It must:
    - Integrate a **React Error Boundary** to prevent remote crashes from affecting the host.
    - Show the **Smart Skeleton** automatically during the fetch/resolve phase.
    - Support a "Retry" mechanism for failed loads.

### 4.3 Design System (Dark Mode)
- **Theme**: **Modern Dark Mode** (Primary background: deep blacks/greys; Secondary: dark navy/slate).
- **Aesthetic**:
    - High-quality typography (e.g., Inter, Montserrat).
    - Subtle gradients for brand accents.
    - Sharp borders and shadows.
    - **Prohibited**: Glassmorphism or overly blurred elements.
- **Interactions**: Smooth micro-animations for state changes (loading, success, errors).

## 5. Professionalism & Scalability Suggestions

To ensure the ecosystem provides a robust, production-ready starting point:

1.  **Safe Remote Sandboxing**: Always wrap remote imports in the `RemoteComponent` to ensure app stability.
2.  **Global UI Kit**: Provide a set of high-quality, pre-styled components (GradientButton, Typography, Card) in the `components/` folder that developers can actually use in production.
3.  **Unified Auth Flow**: Implement a pre-configured Auth Context with placeholders for Biometrics, Token Refresh, and Secure Storage.
4.  **Theme Engine**: A centralized `theme` system that allows easy color and spacing adjustments across the entire Super App.
5.  **Offline & Connectivity**: Include hooks to monitor network status and provide localized error states when the registry is unreachable.
6.  **I18n Readiness**: Integrate `i18next` by default with a modular structure (each module can provide its own translations).

