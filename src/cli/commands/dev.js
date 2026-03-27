const { spawn } = require('cross-spawn');
const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');
const { prepareNative } = require('../utils/scaffold');

module.exports = async (options) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  // Try to find workspace config for root-level execution
  const configObj = getWorkspaceConfig();
  if (configObj) {
    const workspaceRoot = path.dirname(configObj.path);
    const { projectName } = configObj.data;
    
    if (options.id) {
       // Target a specific module
       const moduleDir = path.join(workspaceRoot, options.id);
       if (fs.existsSync(moduleDir)) {
         cwd = moduleDir;
         pkgPath = path.join(cwd, 'package.json');
         console.log(`📂 Auto-detected Module folder: ${path.relative(process.cwd(), moduleDir)}`);
       }
    } else {
       // Target host by default if in root
       const hostDir = path.join(workspaceRoot, `${projectName}-host`);
       if (fs.existsSync(hostDir)) {
          cwd = hostDir;
          pkgPath = path.join(cwd, 'package.json');
          console.log(`📂 Auto-detected Host App folder: ${path.relative(process.cwd(), hostDir)}`);
       }
    }
  }

  const pkg = fs.readJsonSync(pkgPath);
  const moduleId = options.id || pkg.name;
  const port = options.port || '8081';

  // Determine if it's a Host or Module
  const isHost = pkg.name.endsWith('-host') || pkg.dependencies?.['@callstack/repack'];
  
  // 1. Initial Checks & Automated Native Preparation
  await prepareNative(cwd, 'all');

  if (isHost && !options.id) {
     console.log(`\n🚀 Starting Host App Dev Server (Re.Pack/Rspack)...\n`);
     await spawn('npx', ['react-native', 'webpack-start'], { cwd, stdio: 'inherit', shell: true });
     return;
  }

  console.log(`\n⚡ Starting ESAD Dev Server for ${moduleId} on port ${port}...\n`);
  
  const config = configObj ? configObj.data : null;
  let devApiUrl = config?.devModeEndpoint ? config.devModeEndpoint.replace('{{moduleId}}', moduleId) : null;

  const setDevMode = async (isActive) => {
    if (!devApiUrl) return;
    try {
      const body = { 
        is_dev_mode: isActive, 
        ...(isActive && { dev_url: `http://localhost:${port}/index.bundle` }) 
      };
      const res = await fetch(devApiUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) console.log(`📡 Registry Sync: Dev Override is ${isActive ? 'ON' : 'OFF'} para o modulo ${moduleId}`);
    } catch(e) { /* ignore */ }
  };

  await setDevMode(true);

  const proc = spawn('npx', ['react-native', 'webpack-start', '--port', port], { cwd, stdio: 'inherit', shell: true });

  const shutdown = async () => {
    console.log(`\n🛑 Parando ESAD Dev Server e revertendo o registro na CDN...`);
    await setDevMode(false);
    proc.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};
