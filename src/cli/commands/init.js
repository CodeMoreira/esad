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
  // Target: Simple-CDN (V2)
  async deploy(bundle, { version, moduleId, options }) {
    const axios = require('axios');
    const FormData = require('form-data');
    const fs = require('fs');

    console.log('🚀 Deploying ' + moduleId + '@' + version + ' to Simple-CDN...');

    const form = new FormData();
    form.append('bundle', fs.createReadStream(bundle));
    form.append('version', version);

    // Variables loaded from workspace .env
    const registryUrl = process.env.REGISTRY_URL || 'http://localhost:3000';
    const deployToken = process.env.REGISTRY_DEPLOY_TOKEN;

    if (!deployToken) {
      throw new Error('❌ REGISTRY_DEPLOY_TOKEN not found in environment. Generate one in the CDN Dashboard.');
    }

    try {
      const response = await axios.post(
        \`\${registryUrl}/api/admin/modules/\${moduleId}/versions\`, 
        form, 
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': \`Bearer \${deployToken}\`
          }
        }
      );
      console.log('✅ ' + moduleId + ' deployed successfully: ' + response.data.status);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      throw new Error('❌ Deployment failed: ' + errorMsg);
    }
  }
};
`;
    fs.writeFileSync(configPath, configTemplate);
    console.log(`✅ Generated programmable configuration: esad.config.js`);
  }

  const envExamplePath = path.join(workspaceDir, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    const envTemplate = `# ESAD Infrastructure Configuration
# ---------------------------------
# The URL of your Simple-CDN / Registry
REGISTRY_URL=http://localhost:3000

# Your API Deployment Token (Generate this in the Registry Dashboard)
# This is required for the 'esad deploy' command to work.
REGISTRY_DEPLOY_TOKEN=your_token_here
`;
    fs.writeFileSync(envExamplePath, envTemplate);
    console.log(`✅ Generated .env.example`);
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
    const context = { projectName, devMode: {} };
    fs.writeJsonSync(path.join(hostDir, '.esad.context.json'), context, { spaces: 2 });
    
    // Stabilize filesystem before heavy operations
    await new Promise(res => setTimeout(res, 500));

    console.log(`\n📦 Installing dependencies into host (this may take a minute)...`);
    await runProcess('npm', ['install'], { cwd: hostDir });
    
    console.log(chalk.green(`\n🎉 ESAD Workspace Initialized successfully!`));
    console.log(chalk.cyan(`\n👉 Next steps:`));
    console.log(`   1. cd ${projectName}/${hostName}`);
    console.log(`   2. esad dev (to start Host)`);
    console.log(`   3. esad dev (in a module folder to federate)\n`);
  } catch (err) {
    console.error(chalk.red(`\n❌ Failed to initialize workspace:`));
    console.error(chalk.yellow(`   ${err.message}`));
    console.log(chalk.dim(`\n   Check npm logs if it was an installation error.`));
  }
};
