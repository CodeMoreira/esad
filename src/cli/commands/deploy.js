const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const { getWorkspaceConfig } = require('../utils/config');
const { resolveModuleMetadata } = require('../utils/resolution');

module.exports = async (options) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: esad.config.js not found in this or parent directories.`));
    process.exit(1);
  }

  const config = await configObj.load();
  const workspaceRoot = configObj.root;
  const projectName = config.default?.projectName || config.projectName;
  
  let moduleId = options.id;
  let cwd = process.cwd();

  // Resolve Context
  if (moduleId) {
    const meta = resolveModuleMetadata(moduleId, configObj);
    if (!meta) {
      console.error(chalk.red(`❌ Error: Module not found: ${moduleId}`));
      process.exit(1);
    }
    cwd = meta.path;
  }

  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red(`❌ Error: package.json not found in ${cwd}.`));
    process.exit(1);
  }

  const pkg = fs.readJsonSync(pkgPath);
  const resolvedModuleId = moduleId || pkg.name;
  const version = options.version || pkg.version;

  console.log(`\n🚀 Starting ESAD Deploy for ${chalk.cyan(resolvedModuleId)} (v${version})\n`);

  const distPath = path.join(cwd, 'build');
  if (!fs.existsSync(distPath)) {
    console.error(chalk.red(`❌ Error: build/ directory not found. Please run 'esad build' first.`));
    process.exit(1);
  }

  // ZIP BUNDLE
  const zip = new AdmZip();
  zip.addLocalFolder(distPath);
  const buffer = zip.toBuffer();
  
  console.log(`🗜️  Generated bundle zip (${(buffer.length / 1024).toFixed(2)} KB)`);

  // RUN DEPLOY HOOK
  const deployHook = config.default?.deploy || config.deploy;
  
  if (typeof deployHook !== 'function') {
    console.error(chalk.red(`❌ Error: 'deploy' function not found in esad.config.js.`));
    process.exit(1);
  }

  try {
    console.log(`📡 Invoking custom 'deploy' hook...`);
    const result = await deployHook(buffer, { 
      version, 
      moduleId: resolvedModuleId, 
      options 
    });
    
    console.log(chalk.green(`\n✅ Deployment successful!`));
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(chalk.red(`\n❌ Deployment failed: ${err.message}`));
    process.exit(1);
  }
};

