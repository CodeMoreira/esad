const { runProcess } = require('../utils/process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { getWorkspaceConfig, syncHostConfig } = require('../utils/config');
const { resolveProjectDir, listAvailableModules } = require('../utils/resolution');
const { prepareNative } = require('../utils/scaffold');

module.exports = async (options) => {
  let cwd = process.cwd();
  
  // Enforce Workspace Root
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: Call this command from the project root (esad.config.json not found).`));
    process.exit(1);
  }

  syncHostConfig(configObj);

  const { projectName } = configObj.data;
  
  if (options.id) {
    const targetDir = resolveProjectDir(options.id, configObj);
    if (!targetDir) {
      console.error(chalk.red(`\n❌ Error: Module not found: ${options.id}`));
      listAvailableModules(configObj);
      process.exit(1);
    }
    cwd = targetDir;
  } else {
    // Build host by default if in root
    const hostDir = path.join(path.dirname(configObj.path), `${projectName}-host`);
    if (fs.existsSync(hostDir)) cwd = hostDir;
  }

  const platform = options.platform || 'android';
  
  // Prepare Native Folders
  await prepareNative(cwd, platform);

  console.log(`\n🏗️  Building production bundle for ${path.basename(cwd)} (${platform})...\n`);
  
  try {
    const bundleOutput = path.join(cwd, 'build', platform, 'index.bundle');
    fs.ensureDirSync(path.dirname(bundleOutput));

    // Run Re.Pack production build
    await runProcess('npx', [
      'react-native', 
      'webpack-bundle', 
      '--platform', platform, 
      '--dev', 'false',
      '--bundle-output', bundleOutput,
      '--assets-dest', path.dirname(bundleOutput)
    ], cwd);
    
    console.log(chalk.green(`\n✅ Build complete! Assets generated in build/ directory.`));
    console.log(`👉 You can now run: esad deploy ${options.id ? `--id ${options.id}` : ''}\n`);
  } catch (err) {
    console.error(chalk.red(`\n❌ Build failed: ${err.message}`));
    process.exit(1);
  }
};
