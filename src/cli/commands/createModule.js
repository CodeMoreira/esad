const fs = require('fs-extra');
const path = require('path');
const { runProcess } = require('../utils/process');
const { getWorkspaceConfig } = require('../utils/config');

module.exports = async (moduleName) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.json not found).`);
    return;
  }

  const { projectName } = configObj.data;
  const isPrefixed = moduleName.startsWith(`${projectName}-`);
  const finalModuleName = isPrefixed ? moduleName : `${projectName}-\${moduleName}`;
  
  const workspaceDir = path.dirname(configObj.path);
  const targetDir = path.join(workspaceDir, finalModuleName);

  console.log(`\n📦 Creating federated mini-app: ${finalModuleName}...\n`);
  
  try {
    await runProcess('npx', ['react-native@latest', 'init', finalModuleName], workspaceDir);
    console.log(`\n📦 Installing ESAD dependencies...`);
    // Note: Assuming local link or npm install depends on final workflow
    await runProcess('npm', ['install', '@codemoreira/esad'], targetDir);

    const rspackContent = `import { withESAD } from '@codemoreira/esad/plugin';\n\nexport default withESAD({\n  type: 'module',\n  id: '${finalModuleName}'\n});\n`
    fs.writeFileSync(path.join(targetDir, 'rspack.config.mjs'), rspackContent);
    console.log(`✅ Injected withESAD wrapper into rspack.config.mjs`);

    console.log(`\n🎉 Module ${finalModuleName} is ready!`);
  } catch (err) {
    console.error(`❌ Failed to scaffold module`, err.message);
  }
};
