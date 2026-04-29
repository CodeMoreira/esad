const { runProcess } = require('../utils/process');
const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const http = require('http');
const readline = require('readline');
const { spawn } = require('cross-spawn');
const { prepareNative } = require('../utils/scaffold');
const { resolveProjectDir } = require('../utils/resolution');

/**
 * Check if a port is in use
 */
const isPortInUse = (port) => new Promise((resolve) => {
  const req = http.get(`http://localhost:${port}`, (res) => {
    resolve(true); 
  });
  req.on('error', () => {
    resolve(false); 
  });
  req.end();
});

const runHostDevFlow = async (cwd, options = {}) => {
  let choice = options.platform ? options.platform.charAt(0).toLowerCase() : null;

  if (!choice) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    console.log(`\n${chalk.bold('ESAD Host Dev Manager')}`);
    console.log(chalk.dim(`---------------------`));
    console.log(`[a] Run on Android`);
    console.log(`[i] Run on iOS`);
    console.log(`[b] Bundler Only`);
    console.log(`[c] Cancel`);
    
    choice = (await askQuestion(`\nSelect platform: `)).toLowerCase();
    rl.close();
  }
  
  if (choice === 'c') {
    console.log(`\n❌ Cancelled.`);
    return;
  }

  const portBusy = await isPortInUse(8081);
  let shouldStartBundler = true;

  if (portBusy) {
    console.log(`\n⚠️  Warning: Port 8081 is already in use.`);
    console.log(`💡 Skipping Bundler startup. Proceeding with Native Build.\n`);
    shouldStartBundler = false;
  }

  if (shouldStartBundler && choice !== 'c') {
    console.log(`\n🛠️ Starting Rspack Bundler...`);
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '/D', cwd, 'npx.cmd', 'react-native', 'webpack-start'], { 
        detached: true, 
        stdio: 'ignore',
        shell: true 
      }).unref();
    } else {
      spawn('npx', ['react-native', 'webpack-start'], { 
        cwd, 
        detached: true, 
        stdio: 'inherit', 
        shell: true 
      }).unref();
    }

    console.log(`⏳ Waiting for Rspack Bundler on port 8081...`);
    const waitForBundler = async () => {
      for (let i = 0; i < 30; i++) {
        if (await isPortInUse(8081)) return true;
        await new Promise(r => setTimeout(r, 2000));
      }
      return false;
    };

    if (!(await waitForBundler())) {
      console.error(`\n❌ Timeout: Bundler did not respond.`);
      return;
    }
    console.log(`✅ Bundler ready!`);
  }

  if (choice === 'a') {
    console.log(`🤖 Launching Android...`);
    await runProcess('react-native', ['run-android', '--no-packager'], cwd);
  } else if (choice === 'i') {
    console.log(`🍎 Launching iOS...`);
    await runProcess('react-native', ['run-ios', '--no-packager'], cwd);
  } else if (choice === 'b') {
    console.log(`✨ Bundler is active.`);
  }
};

module.exports = async (options) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: esad.config.js not found. Run this from your project root.`));
    process.exit(1);
  }

  const config = configObj.data;
  const workspaceRoot = configObj.root;
  const projectName = config.projectName;
  
  let cwd = process.cwd();
  let selectedModuleId = options.id;

  // 1. Module Dev Flow
  if (selectedModuleId) {
    const targetDir = resolveProjectDir(selectedModuleId, configObj);
    if (!targetDir) {
      console.error(chalk.red(`❌ Error: Module not found: ${selectedModuleId}`));
      process.exit(1);
    }
    cwd = targetDir;
    
    const pkg = fs.readJsonSync(path.join(cwd, 'package.json'));
    const moduleId = selectedModuleId || pkg.name;
    const port = options.port || '8081';

    await prepareNative(cwd, 'all');

    const { updateDevMode, removeDevMode, syncContextDownwards } = require('../utils/transformer');
    
    console.log(`\n⚡ Starting ESAD Dev Server for ${chalk.cyan(moduleId)} on port ${port}...\n`);
    const localBundleUrl = `http://localhost:${port}/index.bundle`;
    updateDevMode(configObj.path, moduleId, localBundleUrl);
    syncContextDownwards(configObj);

    const proc = runProcess('npx', ['react-native', 'webpack-start', '--port', port], { cwd });

    const shutdown = async () => {
      console.log(`\n🛑 Stopping ESAD Dev Server and reverting config...`);
      removeDevMode(configObj.path, moduleId);
      syncContextDownwards(configObj);
      if (proc.kill) proc.kill();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return;
  }

  // 2. Host Dev Flow (Auto-detection)
  const pkgPath = path.join(cwd, 'package.json');
  let isHost = fs.existsSync(pkgPath) && fs.readJsonSync(pkgPath).name.endsWith('-host');

  if (!isHost) {
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      isHost = true;
      console.log(`📂 Auto-detected Host App: ${chalk.dim(path.relative(process.cwd(), hostDir))}`);
    }
  }

  if (isHost) {
    await prepareNative(cwd, 'all');
    await runHostDevFlow(cwd, options);
  } else {
    console.error(chalk.red(`❌ Error: Could not detect Host or Module context.`));
    console.log(`👉 Try: esad dev <module-id>`);
  }
};
