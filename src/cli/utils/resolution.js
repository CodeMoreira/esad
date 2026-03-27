const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Resolves a project directory from a given ID, with support for prefixed names and auto-detection.
 * @param {string} id The provided project ID
 * @param {Object} configObj The workspace configuration object
 * @returns {string|null} The absolute path to the project directory, or null if not found.
 */
function resolveProjectDir(id, configObj) {
  if (!configObj) return null;
  
  const workspaceRoot = path.dirname(configObj.path);
  const { projectName } = configObj.data;

  // 1. Try exact match
  let targetDir = path.join(workspaceRoot, id);
  if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
    return targetDir;
  }

  // 2. Try prefixed match (e.g., my-app-module-name)
  targetDir = path.join(workspaceRoot, `${projectName}-${id}`);
  if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
    return targetDir;
  }

  return null;
}

/**
 * Lists all available modules in the workspace, stripping the project prefix.
 * @param {Object} configObj 
 */
function listAvailableModules(configObj) {
  const workspaceRoot = path.dirname(configObj.path);
  const { projectName } = configObj.data;
  
  const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });
  const modules = entries
    .filter(e => e.isDirectory() && e.name.startsWith(projectName))
    .map(e => {
      const name = e.name.replace(`${projectName}-`, '');
      return name;
    });

  console.log(chalk.yellow('\nMódulos disponíveis:'));
  modules.forEach(m => console.log(chalk.blue(`- ${m}`)));
}

module.exports = {
  resolveProjectDir,
  listAvailableModules
};
