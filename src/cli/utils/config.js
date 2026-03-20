const fs = require('fs-extra');
const path = require('path');

const getWorkspaceConfig = () => {
  let configPath = path.join(process.cwd(), 'esad.config.json');
  if (!fs.existsSync(configPath)) configPath = path.join(process.cwd(), '../esad.config.json');
  if (!fs.existsSync(configPath)) return null;
  return { path: configPath, data: fs.readJsonSync(configPath) };
};

module.exports = { getWorkspaceConfig };
