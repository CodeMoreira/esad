const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async () => {
  console.log(`\n🏥 ${chalk.bold('ESAD Doctor: Environment Diagnostics')}\n`);

  const configObj = getWorkspaceConfig();
  let errors = 0;
  let warnings = 0;

  // 1. Config Validation
  if (!configObj) {
    console.error(`${chalk.red('✖')} esad.config.js not found in any parent directories.`);
    errors++;
  } else {
    console.log(`${chalk.green('✔')} esad.config.js detected at: ${chalk.gray(configObj.path)}`);
    
    // 2. Deployment Hook Validation
    const config = await configObj.load();
    const deployHook = config.default?.deploy || config.deploy;
    if (typeof deployHook === 'function') {
      console.log(`${chalk.green('✔')} Generic 'deploy' hook is properly defined.`);
    } else {
      console.warn(`${chalk.yellow('⚠')} Warning: 'deploy' hook is missing or is not a function.`);
      warnings++;
    }
  }

  // 3. Registry & Auth Check
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('registryUrl')) {
      console.log(`${chalk.green('✔')} registryUrl found in .env`);
    } else {
      console.warn(`${chalk.yellow('⚠')} Warning: registryUrl not found in .env (Host might fail to resolve modules).`);
      warnings++;
    }
  } else {
    console.warn(`${chalk.yellow('⚠')} Warning: .env file not found in current directory.`);
    warnings++;
  }

  // 4. Dependency Sync Check (Simple version)
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = fs.readJsonSync(pkgPath);
    const deps = pkg.dependencies || {};
    
    const criticalDeps = ['react-native', '@callstack/repack', 'react'];
    criticalDeps.forEach(dep => {
      if (deps[dep]) {
        console.log(`${chalk.green('✔')} Found critical dependency: ${dep} (${deps[dep]})`);
      } else {
        console.warn(`${chalk.yellow('⚠')} Missing critical dependency in this context: ${dep}`);
        warnings++;
      }
    });
  }

  console.log(`\n------------------------------------------------`);
  if (errors === 0) {
    console.log(`${chalk.bold.green('STABLE')}: ${errors} errors, ${warnings} warnings.`);
    if (warnings > 0) console.log(`👉 Consider addressing the warnings to ensure a perfect developer experience.`);
  } else {
    console.log(`${chalk.bold.red('UNSTABLE')}: ${errors} errors, ${warnings} warnings.`);
    console.log(`👉 Run 'esad init' or fix the manual errors above.`);
  }
  console.log(`------------------------------------------------\n`);
};
