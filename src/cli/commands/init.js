const fs = require('fs-extra');
const path = require('path');
const { runProcess } = require('../utils/process');
const { cloneTemplate, renameProject } = require('../utils/scaffold');
const templatesConfig = require('../templates/templates.json');

module.exports = async (projectName) => {
  const workspaceDir = path.join(process.cwd(), projectName);
  console.log(`\n🚀 Initializing ESAD Workspace: ${projectName}...\n`);
  
  fs.ensureDirSync(workspaceDir);

  const configPath = path.join(workspaceDir, 'esad.config.js');
  if (!fs.existsSync(configPath)) {
    const configTemplate = `/**
 * ESAD: Super App Configuration
 */
export default {
  projectName: '${projectName}',
  
  // 1. Development Overrides
  // Managed automatically by 'esad dev'
  devMode: {},

  // 2. Programmable Deployment
  // Receives the compiled bundle.
  async deploy(bundle, { version, moduleId, options }) {
    console.log('🚀 Starting custom upload for ' + moduleId + '...');
    
    // Example: Simple CDN V2 upload
    // const response = await fetch('http://localhost:3000/api/admin/modules/' + moduleId + '/versions', {
    //   method: 'POST',
    //   body: bundle,
    //   headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
    // });
    // return await response.json();

    return { status: 'mock_success', moduleId, version };
  }
};
`;
    fs.writeFileSync(configPath, configTemplate);
    console.log(`✅ Generated programmable configuration: esad.config.js`);
  }

  const gitignorePath = path.join(workspaceDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const hostName = `${projectName}-host`;
    const gitignoreContent = `# ESAD Workspace Git Configuration\n` +
      `/*\n\n` +
      `!/${hostName}/\n` +
      `!/esad.config.js\n` +
      `!/.gitignore\n` +
      `\nnode_modules/\n`;
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
