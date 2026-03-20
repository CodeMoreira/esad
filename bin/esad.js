#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('cross-spawn');
const AdmZip = require('adm-zip');

program
  .version('1.0.0')
  .description('esad - Easy Super App Development Toolkit');

// Helper to spawn commands synchronously
const runProcess = (cmd, args, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd, shell: true });
    child.on('close', code => {
      if (code !== 0) reject(new Error(`Command ${cmd} ${args.join(' ')} failed`));
      else resolve();
    });
  });
};

const getWorkspaceConfig = () => {
  let configPath = path.join(process.cwd(), 'esad.config.json');
  if (!fs.existsSync(configPath)) configPath = path.join(process.cwd(), '../esad.config.json');
  if (!fs.existsSync(configPath)) return null;
  return { path: configPath, data: fs.readJsonSync(configPath) };
};

// --- COMMMAND: esad init ---
program
  .command('init <project-name>')
  .description('Scaffold a new ESAD workspace containing the Host App')
  .action(async (projectName) => {
    const workspaceDir = path.join(process.cwd(), projectName);
    console.log(`\n🚀 Initializing ESAD Workspace: ${projectName}...\n`);
    
    // Create Workspace Dir
    fs.ensureDirSync(workspaceDir);

    // Create base esad.config.json at root workspace
    const configPath = path.join(workspaceDir, 'esad.config.json');
    if (!fs.existsSync(configPath)) {
      const configTemplate = {
        projectName: projectName,
        registryUrl: "http://localhost:3000/modules",
        deployEndpoint: "http://localhost:3000/api/admin/modules/{{moduleId}}/versions",
        devModeEndpoint: "http://localhost:3000/api/admin/modules/{{moduleId}}"
      };
      fs.writeJsonSync(configPath, configTemplate, { spaces: 2 });
      console.log(`✅ Generated dynamic configuration file: esad.config.json`);
    }

    // Create .gitignore to allow only host and config (Poly-repo support)
    const gitignorePath = path.join(workspaceDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const hostName = `${projectName}-host`;
      const gitignoreContent = `# ESAD Workspace Git Configuration\n` +
        `# Ignore everything by default\n` +
        `/*\n\n` +
        `# Exceptions: Track only the Host and Configs\n` +
        `!/${hostName}/\n` +
        `!/esad.config.json\n` +
        `!/.gitignore\n` +
        `\n# Ignore node_modules\n` +
        `node_modules/\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(`✅ Generated .gitignore (Whitelist mode: ignored modules so they can have their own repos)`);
    }

    // Scaffold Expo app using create-expo-app
    const hostName = `${projectName}-host`;
    const hostDir = path.join(workspaceDir, hostName);
    
    try {
      console.log(`\n📦 Scaffolding clean Expo project: ${hostName}...`);
      await runProcess('npx', ['create-expo-app', hostName, '--template', 'blank'], workspaceDir);
      
      console.log(`\n📦 Installing ESAD dependencies into host...`);
      // Simulate local ESAD package link (in reality it would be an npm publish fetch)
      await runProcess('npm', ['install', '../../esad'], hostDir); 

      // Generate the Host's rspack config using withESAD
      const rspackContent = `import { withESAD } from 'esad/plugin';\n\nexport default withESAD({\n  type: 'host',\n  id: '${hostName}'\n});\n`;
      fs.writeFileSync(path.join(hostDir, 'rspack.config.mjs'), rspackContent);
      console.log(`✅ Injected withESAD wrapper into rspack.config.mjs`);

      console.log(`\n🎉 ESAD Workpace Initialized!`);
      console.log(`-> cd ${projectName}\n-> esad create-cdn\n-> esad create-module modulo1`);
    } catch (err) {
      console.error(`❌ Failed to init Host:`, err.message);
    }
  });

// --- COMMAND: esad create-cdn ---
program
  .command('create-cdn [cdn-name]')
  .description('Scaffold the CDN / Registry backend')
  .action(async (cdnName) => {
    const configObj = getWorkspaceConfig();
    if (!configObj) {
      console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.json not found).`);
      return;
    }
    const finalCdnName = cdnName || `${configObj.data.projectName}-cdn`;
    console.log(`\n📦 Creating CDN Registry: ${finalCdnName}...\n`);
    // Placeholder for backend cloning
    console.log(`[TODO] Scaffold Node Express backend into ./${finalCdnName}`);
  });

// --- COMMAND: esad create-module ---
program
  .command('create-module <module-name>')
  .description('Scaffold a React Native mini-app automatically configured for Module Federation via ESAD')
  .action(async (moduleName) => {
    const configObj = getWorkspaceConfig();
    if (!configObj) {
      console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.json not found).`);
      return;
    }

    const { projectName } = configObj.data;
    const isPrefixed = moduleName.startsWith(`${projectName}-`);
    const finalModuleName = isPrefixed ? moduleName : `${projectName}-${moduleName}`;
    
    const workspaceDir = path.dirname(configObj.path);
    const targetDir = path.join(workspaceDir, finalModuleName);

    console.log(`\n📦 Creating federated mini-app: ${finalModuleName}...\n`);
    
    try {
      await runProcess('npx', ['react-native@latest', 'init', finalModuleName], workspaceDir);
      console.log(`\n📦 Installing ESAD dependencies...`);
      // Simulate local link
      await runProcess('npm', ['install', '../../esad'], targetDir);

      const rspackContent = `import { withESAD } from 'esad/plugin';\n\nexport default withESAD({\n  type: 'module',\n  id: '${finalModuleName}'\n});\n`;
      fs.writeFileSync(path.join(targetDir, 'rspack.config.mjs'), rspackContent);
      console.log(`✅ Injected withESAD wrapper into rspack.config.mjs`);

      console.log(`\n🎉 Module ${finalModuleName} is ready!`);
    } catch (err) {
      console.error(`❌ Failed to scaffold module`, err.message);
    }
  });

// --- COMMAND: esad deploy ---
program
  .command('deploy')
  .requiredOption('-v, --version <semver>', 'Version number (e.g., 1.0.0)')
  .requiredOption('-i, --id <moduleId>', 'The Module ID to deploy')
  .requiredOption('-e, --entry <entryFileName>', 'The name of the main entry bundle (e.g., index.bundle)')
  .description('Zips the local dist directory and uploads it to the configured deployment endpoint')
  .action(async (options) => {
    console.log(`\n☁️  Starting ESAD Deploy for ${options.id} (v${options.version})\n`);
    
    const configObj = getWorkspaceConfig();
    if (!configObj) {
      console.error(`❌ Error: esad.config.json not found in current directory or parent.`);
      process.exit(1);
    }

    const config = configObj.data;
    if (!config.deployEndpoint) {
      console.error(`❌ Error: 'deployEndpoint' not configured in esad.config.json.`);
      process.exit(1);
    }
    
    const deployUrl = config.deployEndpoint.replace('{{moduleId}}', options.id);
    console.log(`📡 Deployment Endpoint Resolved: ${deployUrl}`);
    
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      console.error(`❌ Error: dist/ directory not found. Did you run the build command?`);
      process.exit(1);
    }

    const zip = new AdmZip();
    zip.addLocalFolder(distPath);
    
    const zipPath = path.join(process.cwd(), `bundle-${options.id}-${options.version}.zip`);
    zip.writeZip(zipPath);
    console.log(`🗜️  Zipped output to ${zipPath}`);

    console.log(`🚀 Uploading to CDN via multipart POST...`);
    // Example fetch upload would go here
    
    console.log(`✅ [SIMULATED] Successfully uploaded to ${deployUrl}`);
    fs.unlinkSync(zipPath);
  });

// --- COMMAND: esad dev ---
program
  .command('dev')
  .requiredOption('-i, --id <moduleId>', 'The Module ID to run in dev mode')
  .option('-p, --port <port>', 'The port to run the dev server on', '8081')
  .description('Starts the dev server and updates the external registry to bypass CDN')
  .action(async (options) => {
    console.log(`\n⚡ Starting ESAD Dev Server for ${options.id} on port ${options.port}...\n`);
    
    const configObj = getWorkspaceConfig();
    const config = configObj ? configObj.data : null;
    let devApiUrl = config?.devModeEndpoint ? config.devModeEndpoint.replace('{{moduleId}}', options.id) : null;

    const setDevMode = async (isActive) => {
      if (!devApiUrl) return;
      try {
        const body = { 
          is_dev_mode: isActive, 
          ...(isActive && { dev_url: `http://localhost:${options.port}/index.bundle` }) 
        };
        const res = await fetch(devApiUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) console.log(`📡 Registry Sync: Dev Override is ${isActive ? 'ON' : 'OFF'} para o modulo Host`);
      } catch(e) { /* ignore */ }
    };

    await setDevMode(true);

    const proc = spawn('npx', ['react-native', 'webpack-start', '--port', options.port], { stdio: 'inherit', shell: true });

    const shutdown = async () => {
      console.log(`\n🛑 Parando ESAD Dev Server e revertendo o registro na CDN...`);
      await setDevMode(false);
      proc.kill();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

program.parse(process.argv);
