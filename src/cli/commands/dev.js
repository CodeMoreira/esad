const { spawn } = require('cross-spawn');
const { getWorkspaceConfig, syncHostConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { resolveModuleMetadata, listAvailableModules, resolveProjectDir } = require('../utils/resolution');
const { runProcess } = require('../utils/process');
const AdmZip = require('adm-zip');

module.exports = async (options) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  // Enforce Workspace Root
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: Call this command from the project root (esad.config.json not found).`));
    process.exit(1);
  }

  const workspaceRoot = path.dirname(configObj.path);
  const { projectName } = configObj.data;
  
  // Synchronize Host Config
  syncHostConfig(configObj);
  
  if (options.id) {
    const targetDir = resolveProjectDir(options.id, configObj);
    if (!targetDir) {
      console.error(chalk.red(`\n❌ Error: Module not found: ${options.id}`));
      listAvailableModules(configObj);
      process.exit(1);
    }
    cwd = targetDir;
    pkgPath = path.join(cwd, 'package.json');
    console.log(chalk.green(`📂 Module detected: ${path.relative(workspaceRoot, cwd)}`));
  } else {
    // Target host by default if in root
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      pkgPath = path.join(cwd, 'package.json');
      console.log(chalk.green(`📂 Host detected: ${path.relative(workspaceRoot, cwd)}`));
    }
  }

  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red(`❌ Error: package.json not found in ${cwd}.`));
    process.exit(1);
  }

  const pkg = fs.readJsonSync(pkgPath);
  let moduleId = options.id || pkg.name;
  const platform = options.platform || 'android';

  console.log(chalk.cyan(`\n☁️  Starting ESAD Dev-Push for ${moduleId} (${platform})\n`));
  
  const config = configObj ? configObj.data : null;
  const devUrlBase = config?.deployEndpoint || config?.devEndpoint;
  
  if (!devUrlBase) {
    console.error(chalk.red(`❌ Error: 'deployEndpoint' not configured in esad.config.json.`));
    process.exit(1);
  }

  const devUploadUrl = devUrlBase.replace('{{moduleId}}', moduleId) + '/dev';
  console.log(`📡 Dev-Cloud Endpoint: ${devUploadUrl}`);

  // 1. Build
  console.log(`\n🏗️  Step 1/3: Building bundle...`);
  const bundleOutput = path.join(cwd, 'build', platform, 'index.bundle');
  await fs.ensureDir(path.dirname(bundleOutput));
  
  try {
    await runProcess('npx', [
      'react-native', 
      'webpack-bundle', 
      '--platform', platform, 
      '--dev', 'false',
      '--bundle-output', bundleOutput,
      '--assets-dest', path.dirname(bundleOutput)
    ], cwd);
  } catch (err) {
    console.error(chalk.red(`❌ Build failed.`));
    process.exit(1);
  }

  // 2. Zip
  console.log(`\n🗜️  Step 2/3: Zipping assets...`);
  const zip = new AdmZip();
  const buildDir = path.join(cwd, 'build');
  zip.addLocalFolder(buildDir);
  const zipPath = path.join(cwd, `dev-bundle-${moduleId}.zip`);
  zip.writeZip(zipPath);

  // 3. Upload
  console.log(`\n🚀 Step 3/3: Pushing to Dev-Cloud...`);
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('bundle', fs.createReadStream(zipPath));

    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const response = await fetch(devUploadUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (response.ok) {
      console.log(chalk.green(`\n✅ Successfully synced ${moduleId} to Dev-Cloud!`));
      console.log(`📱 Host app configured with 'devModeFor: ["${options.id || moduleId}"]' will now load this version.\n`);
    } else {
      const errorText = await response.text();
      console.error(chalk.red(`❌ Cloud Sync failed: ${response.status} ${response.statusText}`));
      console.error(errorText);
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error during sync: ${err.message}`));
  } finally {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
};
