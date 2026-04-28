const { runProcess } = require('../utils/process');
const path = require('path');
const fs = require('fs-extra');
const { getWorkspaceConfig } = require('../utils/config');

module.exports = async (subcommand) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  const configObj = getWorkspaceConfig();
  if (configObj) {
    const workspaceRoot = configObj.root;
    const { projectName } = configObj.data;
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      pkgPath = path.join(cwd, 'package.json');
    }
  }

  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Error: Call this command from inside the Host App or the Workspace Root.`);
    return;
  }

  // Handle direct platform commands
  try {
    if (subcommand === 'android') {
      console.log(`🤖 Compiling and launching on Android...`);
      await runProcess('react-native', ['run-android', '--no-packager'], cwd);
    } else if (subcommand === 'ios') {
      console.log(`🍎 Compiling and launching on iOS...`);
      await runProcess('react-native', ['run-ios', '--no-packager'], cwd);
    } else {
      console.log(`\n💡 Tip: Use 'esad dev' for the interactive dev manager.`);
      console.log(`   Or use 'esad host android' / 'esad host ios' for direct runs.`);
    }
  } catch (err) {
    console.error(`❌ Error running host command: ${err.message}`);
  }
};
