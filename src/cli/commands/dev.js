const { spawn } = require('cross-spawn');
const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');

module.exports = async (options) => {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Error: Call this command from inside a Host or Module directory.`);
    return;
  }
  
  const pkg = fs.readJsonSync(pkgPath);
  const moduleId = options.id || pkg.name;
  const port = options.port || '8081';

  // Determine if it's a Host or Module
  const isHost = pkg.name.endsWith('-host') || pkg.dependencies?.['@callstack/repack'];
  
  if (isHost && !options.id) {
     console.log(`\n🚀 Starting Host App Dev Server (Re.Pack/Rspack)...\n`);
     await spawn('npx', ['react-native', 'webpack-start'], { stdio: 'inherit', shell: true });
     return;
  }

  console.log(`\n⚡ Starting ESAD Dev Server for ${moduleId} on port ${port}...\n`);
  
  const configObj = getWorkspaceConfig();
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

  const proc = spawn('npx', ['react-native', 'webpack-start', '--port', port], { stdio: 'inherit', shell: true });

  const shutdown = async () => {
    console.log(`\n🛑 Parando ESAD Dev Server e revertendo o registro na CDN...`);
    await setDevMode(false);
    proc.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};
