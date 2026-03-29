const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const { getWorkspaceConfig } = require('../utils/config');
const { resolveModuleMetadata, listAvailableModules } = require('../utils/resolution');

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
  
  let moduleId = options.id;
  
  if (moduleId) {
    const meta = resolveModuleMetadata(moduleId, configObj);
    if (!meta) {
      console.error(chalk.red(`\n❌ Error: Module not found: ${moduleId}`));
      listAvailableModules(configObj);
      process.exit(1);
    }
    cwd = meta.path;
    moduleId = meta.id; // Correct fully qualified ID
    pkgPath = path.join(cwd, 'package.json');
    console.log(`📂 Module detected for Deploy: ${path.basename(cwd)}`);
  } else {
    // Target host by default if in root
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      pkgPath = path.join(cwd, 'package.json');
      console.log(chalk.green(`📂 Host detected for Deploy: ${path.basename(cwd)}`));
    }
  }

  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red(`❌ Error: package.json not found in ${cwd}.`));
    process.exit(1);
  }

  const pkg = fs.readJsonSync(pkgPath);
  moduleId = moduleId || pkg.name;
  const version = options.version || pkg.version;
  const entry = options.entry || 'index.bundle';

  console.log(`\n☁️  Starting ESAD Deploy for ${moduleId} (v${version})\n`);
  
  const config = configObj ? configObj.data : null;
  if (!config?.deployEndpoint) {
    console.error(`❌ Error: 'deployEndpoint' not configured in esad.config.json.`);
    process.exit(1);
  }
  
  const deployUrl = config.deployEndpoint.replace('{{moduleId}}', moduleId);
  console.log(`📡 Deployment Endpoint Resolved: ${deployUrl}`);
  
  const distPath = path.join(cwd, 'build');
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Error: build/ directory not found in ${cwd}. Did you run the build command?`);
    process.exit(1);
  }

  const zip = new AdmZip();
  zip.addLocalFolder(distPath);
  
  const zipPath = path.join(cwd, `bundle-${moduleId}-${version}.zip`);
  zip.writeZip(zipPath);
  console.log(`🗜️  Zipped output to ${zipPath}`);

  console.log(`🚀 Uploading to CDN via multipart POST...`);
  
  try {
    const FormData = require('form-data'); // Standard in Node versions, or use native if available
    const form = new FormData();
    form.append('version', version);
    form.append('bundle', fs.createReadStream(zipPath));

    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    // Simple CDN expects POST /api/admin/assets/:id/versions
    const uploadUrl = deployUrl.includes('/versions') ? deployUrl : `${deployUrl}/versions`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(chalk.green(`✅ Successfully uploaded ${moduleId} v${version} to CDN!`));
      console.log(`📄 Active Version is now: ${result.active_version}`);
    } else {
      const errorText = await response.text();
      console.error(chalk.red(`❌ Failed to upload: ${response.status} ${response.statusText}`));
      console.error(errorText);
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error during upload: ${err.message}`));
  } finally {
    fs.unlinkSync(zipPath);
  }
};
