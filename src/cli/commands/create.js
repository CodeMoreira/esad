const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { runProcess } = require('../utils/process');
const { cloneTemplate, renameProject } = require('../utils/scaffold');
const { getWorkspaceConfig } = require('../utils/config');
const templatesConfig = require('../templates/templates.json');

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
    
    // Inject local context mock immediately
    fs.writeJsonSync(path.join(targetDir, '.esad.context.json'), { projectName, devMode: {} }, { spaces: 2 });
    
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
    console.error(chalk.red('❌ Error: The "host" type is no longer supported in create.'));
    console.error(chalk.yellow('👉 Use "esad init <project-name>" instead to create a new workspace.'));
    process.exit(1);
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

  console.error(chalk.red(`❌ Unknown type: ${type}. Valid types are: module, cdn.`));
};
