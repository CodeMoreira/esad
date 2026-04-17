const { runProcess } = require('../utils/process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { getWorkspaceConfig } = require('../utils/config');
const { resolveProjectDir } = require('../utils/resolution');
const { clearAllDevMode } = require('../utils/transformer');

module.exports = async (options) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Error: esad.config.js not found.`));
    process.exit(1);
  }

  const config = await configObj.load();
  const workspaceRoot = configObj.root;
  const projectName = config.default?.projectName || config.projectName;
  
  let cwd = process.cwd();
  
  if (options.id) {
    const targetDir = resolveProjectDir(options.id, configObj);
    if (!targetDir) {
      console.error(chalk.red(`❌ Error: Module not found: ${options.id}`));
      process.exit(1);
    }
    cwd = targetDir;
  }

  const platform = options.platform || 'android';
  
  console.log(`\n🏗️  Building production bundle for ${chalk.cyan(path.basename(cwd))} (${platform})...\n`);
  
  // 1. CLEANUP CONFIG (Avoid shipping local dev URLs)
  console.log(chalk.gray(`🧹 Cleaning up devMode mappings in esad.config.js...`));
  clearAllDevMode(configObj.path);

  try {
    const bundleOutput = path.join(cwd, 'build', 'index.bundle'); // Simplified path as per V2
    fs.ensureDirSync(path.dirname(bundleOutput));

    // Run Re.Pack production build
    await runProcess('npx', [
      'react-native', 
      'webpack-bundle', 
      '--platform', platform, 
      '--dev', 'false',
      '--bundle-output', bundleOutput,
      '--assets-dest', path.dirname(bundleOutput)
    ], { cwd });
    
    console.log(chalk.green(`\n✅ Build complete! Assets generated in build/ directory.`));
    console.log(`👉 Next step: 'esad deploy ${options.id || ''}'\n`);
  } catch (err) {
    console.error(chalk.red(`\n❌ Build failed: ${err.message}`));
    process.exit(1);
  }
};

