const fs = require('fs-extra');
const path = require('path');
const { runProcess } = require('../utils/process');
const { cloneTemplate, renameProject } = require('../utils/scaffold');
const templatesConfig = require('../templates/templates.json');

module.exports = async (projectName) => {
  const workspaceDir = path.join(process.cwd(), projectName);
  console.log(`\n🚀 Initializing ESAD Workspace: ${projectName}...\n`);
  
  fs.ensureDirSync(workspaceDir);

  const configPath = path.join(workspaceDir, 'esad.config.json');
  if (!fs.existsSync(configPath)) {
    const configTemplate = {
      projectName: projectName,
      registryUrl: "http://localhost:3000/modules",
      deployEndpoint: "http://localhost:3000/api/admin/modules/{{moduleId}}/versions",
      devModeEndpoint: "http://localhost:3000/api/admin/modules/{{moduleId}}"
    };
    fs.writeJsonSync(configPath, configTemplate, { spaces: 2 });
    console.log(`✅ Generated dynamic configuration file: esad.config.json`);
  }

  const gitignorePath = path.join(workspaceDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const hostName = `${projectName}-host`;
    const gitignoreContent = `# ESAD Workspace Git Configuration\n` +
      `# Ignore everything by default\n` +
      `/*\n\n` +
      `# Exceptions: Track only the Host and Configs\n` +
      `!/${hostName}/\n` +
      `!/esad.config.json\n` +
      `!/.gitignore\n` +
      `\n# Ignore node_modules\n` +
      `node_modules/\n`;
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log(`✅ Generated .gitignore`);
  }

  const hostName = `${projectName}-host`;
  const hostDir = path.join(workspaceDir, hostName);
  
  try {
    // 1. Clone Template instead of create-expo-app
    await cloneTemplate(templatesConfig.host, hostDir);
    
    // 2. Rename Project
    await renameProject(hostDir, hostName);

    console.log(`\n📦 Installing dependencies into host...`);
    await runProcess('npm', ['install'], hostDir); 

    console.log(`\n🎉 ESAD Workspace Initialized!`);
    console.log(`-> cd ${projectName}/${hostName}\n-> esad host dev (to start Host)`);
  } catch (err) {
    console.error(`❌ Failed to init Host:`, err.message);
  }
};
