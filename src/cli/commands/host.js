const { runProcess } = require('../utils/process');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('cross-spawn');
const http = require('http');
const readline = require('readline');
const { getWorkspaceConfig } = require('../utils/config');
const { prepareNative } = require('../utils/scaffold');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Check if a port is in use
 */
const isPortInUse = (port) => new Promise((resolve) => {
  const req = http.get(`http://localhost:${port}`, (res) => {
    resolve(true); // Responded, so it's in use
  });
  req.on('error', () => {
    resolve(false); // Refused, so it's free
  });
  req.end();
});

module.exports = async (subcommand) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  // Try to find workspace config to resolve host path from root
  const configObj = getWorkspaceConfig();
  if (configObj) {
    const workspaceRoot = path.dirname(configObj.path);
    const { projectName } = configObj.data;
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      pkgPath = path.join(cwd, 'package.json');
      console.log(`📂 Auto-detected Host App folder: ${path.relative(process.cwd(), hostDir)}`);
    }
  }

  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Error: Call this command from inside the Host App or the Workspace Root.`);
    return;
  }

  const pkg = fs.readJsonSync(pkgPath);

  // 1. Initial Checks & Automated Native Preparation
  if (subcommand === 'dev' || subcommand === 'start') {
    await prepareNative(cwd, 'all');

    // 3. Platform Selection
    console.log(`\nESAD Host Dev Manager`);
    console.log(`---------------------`);
    console.log(`[a] Run on Android`);
    console.log(`[i] Run on iOS`);
    console.log(`[b] Bundler Only`);
    console.log(`[c] Cancel`);
    
    const choice = (await askQuestion(`\nSelect platform: `)).toLowerCase();
    
    if (choice === 'c') {
      console.log(`\n❌ Cancelled.`);
      rl.close();
      return;
    }

    // 4. Check for Port 8081
    const portBusy = await isPortInUse(8081);
    let shouldStartBundler = true;

    if (portBusy) {
      console.log(`\n⚠️  Warning: Port 8081 is already in use by another process.`);
      console.log(`💡 Skipping Bundler startup - assuming it's already running. Proceeding with Native Build only.\n`);
      shouldStartBundler = false;
    }

    // 4. Start Bundler in a New Window (if needed)
    if (shouldStartBundler && choice !== 'c') {
      console.log(`\n🛠️ Starting Rspack Bundler in a new window...`);
      if (process.platform === 'win32') {
        const npxCmd = 'npx.cmd';
        spawn('cmd', ['/c', 'start', '/D', cwd, npxCmd, 'react-native', 'webpack-start'], { 
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

      // 5. Wait for Bundler (Port 8081)
      console.log(`⏳ Waiting for Rspack Bundler to initialize on port 8081...`);
      const waitForBundler = async () => {
        for (let i = 0; i < 30; i++) {
          if (await isPortInUse(8081)) return true;
          await new Promise(r => setTimeout(r, 2000));
        }
        return false;
      };

      const isReady = await waitForBundler();
      if (!isReady) {
        console.error(`\n❌ Timeout: Bundler did not respond after 60 seconds.`);
        rl.close();
        return;
      }
      console.log(`✅ Bundler stable and ready to use!`);
    }

    // 6. Launch Native App
    if (choice === 'a') {
      console.log(`🤖 Compiling and launching on Android...`);
      await runProcess('react-native', ['run-android', '--no-packager'], cwd);
    } else if (choice === 'i') {
      console.log(`🍎 Compiling and launching on iOS...`);
      await runProcess('react-native', ['run-ios', '--no-packager'], cwd);
    } else if (choice === 'b') {
      if (portBusy) {
        console.log(`✨ Bundler is already active. You can launch manual native runs.`);
      } else {
        console.log(`✨ Bundler is running. You can open the app manually.`);
      }
    }

    rl.close();
  } else {
    // Other subcommands (android, ios directly)
    try {
      if (subcommand === 'android') {
        await runProcess('react-native', ['run-android', '--no-packager'], cwd);
      } else if (subcommand === 'ios') {
        await runProcess('react-native', ['run-ios', '--no-packager'], cwd);
      }
    } catch (err) {
      console.error(`❌ Error running host command: ${err.message}`);
    }
    rl.close();
  }
};
