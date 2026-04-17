const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { runProcess } = require('../utils/process');
const { cloneTemplate, renameProject } = require('../utils/scaffold');
const { getWorkspaceConfig } = require('../utils/config');
const templatesConfig = require('../templates/templates.json');

const initHost = async (projectName) => {
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
    console.log(`\n📦 Installing dependencies into host...`);
    await runProcess('npm', ['install'], { cwd: hostDir });
    console.log(`\n🎉 ESAD Workspace Initialized!`);
    console.log(`-> cd ${projectName}/${hostName}\n-> esad host dev (to start Host)`);
  } catch (err) {
    console.error(`❌ Failed to init Host:`, err.message);
  }
};

const createModule = async (moduleName) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.js not found).`);
    return;
  }

  const config = await configObj.load();
  const projectName = config.default?.projectName || config.projectName;

  const isPrefixed = moduleName.startsWith(`${projectName}-`);
  const finalModuleName = isPrefixed ? moduleName : `${projectName}-${moduleName}`;

  const workspaceDir = configObj.root;
  const targetDir = path.join(workspaceDir, finalModuleName);

  console.log(`\n📦 Creating federated mini-app: ${finalModuleName}...\n`);

  try {
    await cloneTemplate(templatesConfig.module, targetDir);
    await renameProject(targetDir, finalModuleName);
    console.log(`\n📦 Installing dependencies...`);
    await runProcess('npm', ['install'], { cwd: targetDir });
    console.log(`\n🎉 Module ${finalModuleName} is ready!`);
  } catch (err) {
    console.error(`❌ Failed to scaffold module`, err.message);
  }
};

const createCdn = async (cdnName) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.js not found).`);
    return;
  }

  const config = await configObj.load();
  const projectName = config.default?.projectName || config.projectName;

  const finalCdnName = cdnName || `${projectName}-cdn`;
  const cdnPath = path.join(process.cwd(), finalCdnName);

  if (fs.existsSync(cdnPath)) {
    console.error(`❌ Error: Directory ./${finalCdnName} already exists.`);
    return;
  }

  console.log(`\n📦 Initializing Flux Registry & CDN: ${finalCdnName}...\n`);

  try {
    console.log(`📡 Cloning template from GitHub...`);
    await runProcess('git', ['clone', 'https://github.com/CodeMoreira/simple-cdn.git', finalCdnName]);
    console.log(`🧹 Cleaning up template metadata...`);
    await fs.remove(path.join(cdnPath, '.git'));
    console.log(`\n📥 Installing dependencies (this may take a minute)...`);
    await runProcess('npm', ['install'], { cwd: cdnPath });
    console.log(`\n✅ CDN Registry created successfully in ./${finalCdnName}\n`);
  } catch (error) {
    console.error(`\n❌ Failed to create CDN: ${error.message}`);
  }
};

module.exports = async (name, options) => {
  const type = options.type;

  if (type === 'host') {
    if (!name) {
      console.error(chalk.red('❌ Error: Project name is required for host creation.'));
      process.exit(1);
    }
    return await initHost(name);
  }

  if (type === 'module') {
    if (!name) {
       console.error(chalk.red('❌ Error: Module name is required. Usage: esad create [name] --type module'));
       process.exit(1);
    }
    return await createModule(name);
  }

  if (type === 'cdn') {
    return await createCdn(name);
  }

  console.error(chalk.red(`❌ Unknown type: ${type}. Valid types are: host, module, cdn.`));
};
