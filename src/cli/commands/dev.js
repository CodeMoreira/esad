const { spawn } = require('cross-spawn');
const { getWorkspaceConfig } = require('../utils/config');

module.exports = async (options) => {
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
};
