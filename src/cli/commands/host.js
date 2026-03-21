const { runProcess } = require('../utils/process');
const path = require('path');
const fs = require('fs-extra');

module.exports = async (subcommand) => {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Error: Call this command from inside the Host App directory.`);
    return;
  }

  const pkg = fs.readJsonSync(pkgPath);
  const isHost = pkg.name.endsWith('-host') || pkg.dependencies?.['@callstack/repack'];

  if (!isHost) {
    console.warn(`⚠️ Warning: This directory doesn't look like an ESAD Host App.`);
  }

  try {
    switch (subcommand) {
      case 'dev':
      case 'start':
        console.log(`\n🚀 Starting Host App Dev Server (Re.Pack/Rspack)...\n`);
        await runProcess('npx', ['react-native', 'webpack-start'], process.cwd());
        break;
      
      case 'android':
        console.log(`\n🤖 Running Host App on Android...\n`);
        await runProcess('npx', ['expo', 'run:android', '--no-bundler'], process.cwd());
        break;

      case 'ios':
        console.log(`\n🍎 Running Host App on iOS...\n`);
        await runProcess('npx', ['expo', 'run:ios', '--no-bundler'], process.cwd());
        break;

      default:
        console.error(`❌ Unknown host subcommand: ${subcommand}`);
        console.log(`Available: dev, android, ios`);
    }
  } catch (err) {
    console.error(`❌ Error running host command: ${err.message}`);
  }
};
