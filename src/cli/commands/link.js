const { getWorkspaceConfig } = require('../utils/config');
const { resolveProjectDir } = require('../utils/resolution');
const { updateDevMode } = require('../utils/transformer');
const path = require('path');
const chalk = require('chalk');

module.exports = async (moduleId) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: esad.config.js not found.`));
    process.exit(1);
  }

  if (!moduleId) {
    console.error(chalk.red(`❌ Error: Module ID is required for linking. Usage: esad link [module-name]`));
    process.exit(1);
  }

  const targetDir = resolveProjectDir(moduleId, configObj);
  if (!targetDir) {
    console.error(chalk.red(`❌ Error: Module not found: ${moduleId}`));
    process.exit(1);
  }

  // Generate a local filesystem link
  // Re.Pack can handle file:// on some platforms, or we use this as a hint for the resolver.
  const localPath = `file://${path.join(targetDir, 'build', 'index.bundle')}`;
  
  updateDevMode(configObj.path, moduleId, localPath);

  console.log(`\n🔗 ${chalk.bold('Module Linked Locally')}`);
  console.log(`${chalk.cyan(moduleId)} -> ${chalk.gray(localPath)}`);
  console.log(`\n👉 Run 'esad build ${moduleId}' to generate the bundle if you haven't yet.`);
  console.log(`📡 The Host app's ScriptManager will now prioritize this local file.\n`);
};
