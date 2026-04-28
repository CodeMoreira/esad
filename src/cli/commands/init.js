const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { runProcess } = require('../utils/process');
const { cloneTemplate, renameProject } = require('../utils/scaffold');
const templatesConfig = require('../templates/templates.json');

module.exports = async (projectName) => {
  if (!projectName) {
    console.error(chalk.red('❌ Error: Project name is required to initialize a new ESAD workspace.'));
    console.error(chalk.yellow('👉 Usage: esad init <project-name>'));
    process.exit(1);
  }

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
    // return { status: 'mock_success', moduleId, version };
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
      `# Note: We use a whitelist approach because modules should be kept in separate repositories.\n` +
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
    await cloneTemplate(templatesConfig.host, hostDir);
    await renameProject(hostDir, hostName);
    
    // Inject local context mock immediately to avoid crashes on fresh boot
    fs.writeJsonSync(path.join(hostDir, '.esad.context.json'), { projectName, devMode: {} }, { spaces: 2 });
    
    console.log(`\n📦 Installing dependencies into host...`);
    await runProcess('npm', ['install'], { cwd: hostDir });
    console.log(`\n🎉 ESAD Workspace Initialized!`);
    console.log(`-> cd ${projectName}/${hostName}\n-> esad host dev (to start Host)`);
  } catch (err) {
    console.error(`❌ Failed to init Host:`, err.message);
  }
};
