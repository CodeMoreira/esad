const fs = require('fs-extra');
const path = require('path');
const { runProcess } = require('../utils/process');
const { getWorkspaceConfig } = require('../utils/config');
const { cloneTemplate, renameProject } = require('../utils/scaffold');
const templatesConfig = require('../templates/templates.json');

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
    // 1. Clone Template instead of react-native init
    await cloneTemplate(templatesConfig.module, targetDir);
    
    // 2. Rename Project
    await renameProject(targetDir, finalModuleName);

    console.log(`\n📦 Installing dependencies...`);
    await runProcess('npm', ['install'], targetDir);

    console.log(`\n🎉 Module ${finalModuleName} is ready!`);
  } catch (err) {
    console.error(`❌ Failed to scaffold module`, err.message);
  }
};
