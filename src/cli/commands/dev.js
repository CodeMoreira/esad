const { spawn } = require('cross-spawn');
const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { prepareNative } = require('../utils/scaffold');
const { resolveProjectDir, listAvailableModules } = require('../utils/resolution');

module.exports = async (options) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  // Enforce Workspace Root
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Erro: Comando deve ser executado na raiz do projeto (esad.config.json não encontrado).`));
    process.exit(1);
  }

  const workspaceRoot = path.dirname(configObj.path);
  const { projectName } = configObj.data;
  
  if (options.id) {
    const targetDir = resolveProjectDir(options.id, configObj);
    if (!targetDir) {
      console.error(chalk.red(`\n❌ Erro: Não foi encontrado o módulo: ${options.id}`));
      listAvailableModules(configObj);
      process.exit(1);
    }
    cwd = targetDir;
    pkgPath = path.join(cwd, 'package.json');
    console.log(chalk.green(`📂 Módulo detectado: ${path.relative(workspaceRoot, cwd)}`));
  } else {
    // Target host by default if in root
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      pkgPath = path.join(cwd, 'package.json');
      console.log(chalk.green(`📂 Host detectado: ${path.relative(workspaceRoot, cwd)}`));
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
