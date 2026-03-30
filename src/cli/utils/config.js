const fs = require('fs-extra');
const path = require('path');

const getWorkspaceConfig = () => {
  let cwd = process.cwd();
  let configPath = path.join(cwd, 'esad.config.json');
  
  // Search up to 2 levels (root or project folder)
  if (!fs.existsSync(configPath)) configPath = path.join(cwd, '..', 'esad.config.json');
  if (!fs.existsSync(configPath)) configPath = path.join(cwd, '..', '..', 'esad.config.json');
  
  if (!fs.existsSync(configPath)) return null;
  return { path: configPath, data: fs.readJsonSync(configPath) };
};

const syncHostConfig = (configObj) => {
  if (!configObj) return;
  const { projectName } = configObj.data;
  const workspaceRoot = path.dirname(configObj.path);
  const hostDir = path.join(workspaceRoot, `${projectName}-host`);
  
  if (fs.existsSync(hostDir)) {
    const hostConfigPath = path.join(hostDir, 'esad.config.json');
    
    // Only pass client-safe fields
    const clientConfig = {
      projectName: configObj.data.projectName,
      registryUrl: configObj.data.registryUrl,
      devModeFor: configObj.data.devModeFor || []
    };
    
    fs.writeJsonSync(hostConfigPath, clientConfig, { spaces: 2 });
    console.log(`\n🔄 Sync: Config propagated to ${path.relative(workspaceRoot, hostConfigPath)}`);
  }
};

module.exports = { getWorkspaceConfig, syncHostConfig };
