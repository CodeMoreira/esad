const { runProcess } = require('../utils/process');
const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { prepareNative } = require('../utils/scaffold');
const { resolveProjectDir } = require('../utils/resolution');

module.exports = async (options) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: esad.config.js not found. Run this from your project root.`));
    process.exit(1);
  }

  const config = await configObj.load();
  const workspaceRoot = configObj.root;
  const projectName = config.default?.projectName || config.projectName;
  
  let cwd = process.cwd();
  let selectedModuleId = options.id;

  if (selectedModuleId) {
    const targetDir = resolveProjectDir(selectedModuleId, configObj);
    if (!targetDir) {
      console.error(chalk.red(`❌ Error: Module not found: ${selectedModuleId}`));
      process.exit(1);
    }
    cwd = targetDir;
  }

  const pkgPath = path.join(cwd, 'package.json');
  const pkg = fs.readJsonSync(pkgPath);
  const moduleId = selectedModuleId || pkg.name;
  const port = options.port || '8081';

  // Determine if it's a Host or Module
  const isHost = pkg.name.endsWith('-host') || pkg.dependencies?.['@callstack/repack'];
  
  await prepareNative(cwd, 'all');

  if (isHost && !selectedModuleId) {
     console.log(`\n🚀 Starting ${chalk.green('Host App')} Dev Server (Re.Pack/Rspack)...\n`);
     await runProcess('npx', ['react-native', 'webpack-start'], { cwd });
     return;
  }

  const { updateDevMode, removeDevMode } = require('../utils/transformer');
  
  console.log(`\n⚡ Starting ESAD Dev Server for ${chalk.cyan(moduleId)} on port ${port}...\n`);
  
  // Automate devMode update in esad.config.js
  const localBundleUrl = `http://localhost:${port}/index.bundle`;
  updateDevMode(configObj.path, moduleId, localBundleUrl);
  console.log(chalk.gray(`📡 Mode: Module Dev. Host configured to load ${moduleId} from ${localBundleUrl}`));

  const proc = runProcess('npx', ['react-native', 'webpack-start', '--port', port], { cwd });

  const shutdown = async () => {
    console.log(`\n🛑 Stopping ESAD Dev Server and reverting config...`);
    removeDevMode(configObj.path, moduleId);
    if (proc.kill) proc.kill();
    process.exit(0);
  };


  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

