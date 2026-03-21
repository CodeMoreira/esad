const { runProcess } = require('../utils/process');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('cross-spawn');
const http = require('http');
const readline = require('readline');
const { getWorkspaceConfig } = require('../utils/config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

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

  // 1. Initial Checks & Prebuild
  if (subcommand === 'dev' || subcommand === 'start') {
    if (!fs.existsSync(path.join(cwd, 'android')) && !fs.existsSync(path.join(cwd, 'ios'))) {
      console.log(`📦 Native folders not found. Running expo prebuild...`);
      await runProcess('npx', ['expo', 'prebuild'], cwd);
    }

    // 2. Patch Native Files
    console.log(`🔧 Patching native files for Re.Pack compatibility...`);
    const patchFiles = async () => {
      // Android
      const androidMainApp = path.join(cwd, 'android/app/src/main/java');
      if (fs.existsSync(androidMainApp)) {
        const files = await fs.readdir(androidMainApp, { recursive: true });
        for (const file of files) {
          if (file.endsWith('MainApplication.kt') || file.endsWith('MainApplication.java')) {
            const filePath = path.join(androidMainApp, file);
            let content = await fs.readFile(filePath, 'utf8');
            if (content.includes('.expo/.virtual-metro-entry')) {
              content = content.replace(/.expo\/.virtual-metro-entry/g, 'index');
              await fs.writeFile(filePath, content);
            }
          }
        }
      }
      // iOS
      const iosDir = path.join(cwd, 'ios');
      if (fs.existsSync(iosDir)) {
        const iosFiles = await fs.readdir(iosDir, { recursive: true });
        for (const file of iosFiles) {
          if (file.match(/AppDelegate\.(m|mm|swift)/)) {
            const filePath = path.join(iosDir, file);
            let content = await fs.readFile(filePath, 'utf8');
            if (content.includes('.expo/.virtual-metro-entry')) {
              content = content.replace(/.expo\/.virtual-metro-entry/g, 'index');
              await fs.writeFile(filePath, content);
            }
          }
        }
      }
    };
    await patchFiles();

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

    // 4. Start Bundler in a New Window
    console.log(`\n🛠️ Starting Rspack Bundler in a new window...`);
    if (process.platform === 'win32') {
      // Use CMD /C START /D <dir> to open a new window in the correct folder
      spawn('cmd', ['/c', 'start', '/D', cwd, 'npx', 'react-native', 'webpack-start'], { 
        detached: true, 
        stdio: 'ignore',
        shell: true 
      }).unref();
    } else {
      // For MacOS or Linux
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
        try {
          await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8081', (res) => resolve(res));
            req.on('error', reject);
            req.end();
          });
          return true;
        } catch (e) {
          await new Promise(r => setTimeout(r, 2000));
        }
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

    // 6. Launch Native App
    if (choice === 'a') {
      console.log(`🤖 Compiling and sending to Android...`);
      await runProcess('npx', ['expo', 'run:android', '--no-bundler'], cwd);
    } else if (choice === 'i') {
      console.log(`🍎 Compiling and sending to iOS...`);
      await runProcess('npx', ['expo', 'run:ios', '--no-bundler'], cwd);
    } else if (choice === 'b') {
      console.log(`✨ Bundler is running. You can open the app manually.`);
    }

    rl.close();
  } else {
    // Other subcommands (android, ios directly)
    try {
      if (subcommand === 'android') {
        await runProcess('npx', ['expo', 'run:android', '--no-bundler'], cwd);
      } else if (subcommand === 'ios') {
        await runProcess('npx', ['expo', 'run:ios', '--no-bundler'], cwd);
      }
    } catch (err) {
      console.error(`❌ Error running host command: ${err.message}`);
    }
    rl.close();
  }
};
