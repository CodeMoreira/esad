const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const { getWorkspaceConfig } = require('../utils/config');

module.exports = async (options) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  // Try to find workspace config for root-level execution
  const configObj = getWorkspaceConfig();
  if (configObj) {
    const workspaceRoot = path.dirname(configObj.path);
    const { projectName } = configObj.data;
    
    // If ID is provided, try to find that module/host folder
    if (options.id) {
       const targetDir = path.join(workspaceRoot, options.id);
       if (fs.existsSync(targetDir)) {
         cwd = targetDir;
         pkgPath = path.join(cwd, 'package.json');
         console.log(`📂 Auto-detected Project folder: ${path.relative(process.cwd(), targetDir)}`);
       }
    } else if (!fs.existsSync(pkgPath)) {
       // If no ID and no package.json in current dir, assume we want to deploy the host from root
       const hostDir = path.join(workspaceRoot, `${projectName}-host`);
       if (fs.existsSync(hostDir)) {
          cwd = hostDir;
          pkgPath = path.join(cwd, 'package.json');
          console.log(`📂 Auto-detected Host App folder: ${path.relative(process.cwd(), hostDir)}`);
       }
    }
  }

  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Error: Call this command from inside a Project directory or the Workspace Root.`);
    process.exit(1);
  }

  const pkg = fs.readJsonSync(pkgPath);
  const moduleId = options.id || pkg.name;
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
  
  const distPath = path.join(cwd, 'dist');
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Error: dist/ directory not found in ${cwd}. Did you run the build command?`);
    process.exit(1);
  }

  const zip = new AdmZip();
  zip.addLocalFolder(distPath);
  
  const zipPath = path.join(cwd, `bundle-${moduleId}-${version}.zip`);
  zip.writeZip(zipPath);
  console.log(`🗜️  Zipped output to ${zipPath}`);

  console.log(`🚀 Uploading to CDN via multipart POST...`);
  // Note: Here we would use form-data + fetch or axios to upload to Simple CDN
  
  console.log(`✅ [SIMULATED] Successfully uploaded to ${deployUrl}`);
  fs.unlinkSync(zipPath);
};
