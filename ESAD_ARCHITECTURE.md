# ESAD: Complete Architecture & Lifecycle Diagrams

This guide details the technical architecture and the full development/deployment lifecycle of a SuperApp built with the **ESAD** framework.

---

## 🏗️ 1. Detailed System Architecture
This diagram illustrates the separation of concerns and the plumbing between the Host, multiple Federated Modules, the ESAD environment, and the distribution layer.

```mermaid
graph TB
    subgraph "Local Environment (ESAD CLI)"
        CLI["ESAD CLI (@codemoreira/esad)"]
        T_Host["Host Template"]
        T_Mod["Module Template"]
    end

    subgraph "Infrastructure Layer (CDN & Registry)"
        REG["Module Registry<br/>(mf-manifest.json)"]
        CDN["CDN Storage<br/>(*.bundle assets)"]
    end

    subgraph "SuperApp Host Project"
        H_Native["Native App (Android/iOS)<br/><i>Patched: MainApplication / build.gradle</i>"]
        H_Rspack["Rspack Host Config<br/>(withESAD Wrapper)"]
        H_Entry["index.js<br/>(AppRegistry: 'main')"]
        H_SM["Re.Pack ScriptManager"]
    end

    subgraph "Federated Modules (Independent Projects)"
        Mod_1["Module: Feature A<br/>(Port 9000 / CDN Path)"]
        Mod_2["Module: Feature B<br/>(Port 9001 / CDN Path)"]
        Mod_N["Module: Feature N..."]
    end

    subgraph "Shared Core (SDK)"
        SDK["ESAD Client SDK<br/>(Global State & Auth)"]
    end

    %% Scaffolding
    CLI -->|1. Clones| T_Host
    CLI -->|1. Clones| T_Mod
    CLI -->|2. Scaffolds| H_Native
    
    %% Host Execution
    H_Native <-->|Loads| H_Entry
    H_Entry -->|Configures| H_SM
    H_SM -.->|Queries| REG
    H_SM -.->|Fetches Bundles| CDN
    
    %% Module Loading
    CDN --- Mod_1
    CDN --- Mod_2
    CDN --- Mod_N
    
    %% Communication
    SDK <-->|Shared Context| H_Native
    SDK <-->|Shared Context| Mod_1
    SDK <-->|Shared Context| Mod_2

    classDef core fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef infra fill:#f3e5f5,stroke:#4a148c,stroke-width:1px;
    classDef module fill:#fff3e0,stroke:#e65100,stroke-width:1px;
    
    class CLI,H_Native,H_Entry,H_SM,Config,SDK core;
    class REG,CDN infra;
    class Mod_1,Mod_2,Mod_N module;
```

---

## 🚀 2. End-to-End Workflow (Development to Deploy)
A step-by-step sequential view of creating, developing, and deploying modules in the ESAD ecosystem.

### A. Host & Workspace Setup
1. **`esad init <name>`**: Clones the host template, renames project identifiers, and installs base dependencies.
2. **`esad host dev`**: 
   - Verifies `android/ios` folders.
   - Runs `expo prebuild` (if needed).
   - **Automated Patch**: Injects Re.Pack configs into Gradle/Native entry points.
   - Starts Rspack Server (8081).
   - Launches Mobile Emulator.

### B. Module Development Cycle
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CLI as ESAD CLI
    participant Mod as Module Project
    participant Config as esad.config.js
    participant Host as Running Host

    Dev->>CLI: esad create <name> --type module
    CLI->>CLI: Clone Template & Inject Context
    
    Dev->>CLI: esad dev [moduleId] --port 9000
    CLI->>Mod: Start Rspack (Port 9000)
    CLI->>Config: [DevMode] Set Module 'X' URL to localhost:9000
    
    Note over Host: Host reloads/fetches
    Host->>Config: Read DevMode Mappings
    Config-->>Host: Redirects Module 'X' to localhost:9000
    Host->>Mod: Fetch Bundle from 9000
```

### C. Deployment Flow
1. **`esad build`**: Performs the production build for the specific module/platform.
2. **Bundle Generation**: Rspack generates the `.container.js.bundle` and chunks into the `./build` directory.
3. **`esad deploy`**: Packages the `./build` folder and performs the real multipart upload to the CDN.
4. **Registry Update**: The CDN Registry updates its versioning and the `mf-manifest.json`.
5. **Instant Update**: The Host App receives the new version on the next launch (OTA) or module resolution.

---

## 🔥 3. Comparison: Vanilla Re.Pack vs ESAD
*Why is ESAD needed for presentations?*

| Feature | Vanilla Re.Pack | ESAD Framework |
| :--- | :--- | :--- |
| **Setup** | Manual (Hours/Days) | Command-line (Minutes) |
| **Native Patching** | Manual (Error-prone) | Automated (CLI-driven) |
| **Expo Integration** | Complex (Metro conflicts) | Transparent (Zero-Config Redirection) |
| **Shared State** | Peer-dependency hell | Built-in SDK Wrapper |
| **Scaffolding** | Manual Boilerplate | GitHub Template Cloning |
| **Registry Management** | Custom Implementation | Integrated CDN/MF-Manifest logic |

---

## 🏛️ 4. Global State Bridge
Diagram showing how the SDK bridges the Host and the Remote Modules.

```mermaid
graph LR
    subgraph "Application Memory"
        subgraph "Host Context"
            H_State["Global State Store"]
        end
        
        subgraph "Remote Module Frame"
            M_Hook["useESADState()"]
        end
    end

    M_Hook <-->|Read/Write| H_State
    H_State --- Bridge["React Context Bridge (Singleton)"]
```

> [!TIP]
> This "Singleton Bridge" is the core reason why federated modules feel native and integrated, rather than isolated webviews or separate apps.
