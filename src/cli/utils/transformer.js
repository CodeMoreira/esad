const fs = require('fs-extra');
const path = require('path');

/**
 * Safely updates the devMode object in esad.config.js
 * This uses a simple yet robust regex approach to preserve comments/formatting.
 */
const updateDevMode = (configPath, moduleId, url) => {
  let content = fs.readFileSync(configPath, 'utf8');

  // 1. Ensure devMode object exists
  if (!content.includes('devMode:')) {
    // Inject devMode after the opening brace of export default
    content = content.replace(/(export default\s*\{)/, `$1\n  devMode: {},\n`);
  }

  // 2. Add or update the module entry
  const entryRegex = new RegExp(`(['"]${moduleId}['"]|${moduleId}):\\s*['"]([^'"]*)['"]`, 'g');
  
  if (entryRegex.test(content)) {
    // Update existing entry
    content = content.replace(entryRegex, `'${moduleId}': '${url}'`);
  } else {
    // Insert new entry right after devMode: {
    content = content.replace(/(devMode:\s*\{)/, `$1\n    '${moduleId}': '${url}',`);
  }

  fs.writeFileSync(configPath, content);
};

const removeDevMode = (configPath, moduleId) => {
  if (!fs.existsSync(configPath)) return;
  let content = fs.readFileSync(configPath, 'utf8');

  // Remove specific module entry
  const entryRegex = new RegExp(`\\s*['"]?${moduleId}['"]?:\\s*['"]([^'"]*)['"],?`, 'g');
  content = content.replace(entryRegex, '');

  fs.writeFileSync(configPath, content);
};

const clearAllDevMode = (configPath) => {
  if (!fs.existsSync(configPath)) return;
  let content = fs.readFileSync(configPath, 'utf8');

  // Simply reset devMode to empty object
  const devModeBlockRegex = /devMode:\s*{[\s\S]*?}/;
  content = content.replace(devModeBlockRegex, 'devMode: {}');

  fs.writeFileSync(configPath, content);
};

const { createJiti } = require('jiti');

const syncContextDownwards = (configObj) => {
  if (!fs.existsSync(configObj.path)) return;
  const configDir = path.dirname(configObj.path);

  const jiti = createJiti(__filename);
  let configContent = jiti(configObj.path);
  if (configContent.default) configContent = configContent.default;

  const exportData = {
    projectName: configContent.projectName || 'esad-workspace',
    devMode: configContent.devMode || {}
  };

  try {
    const children = fs.readdirSync(configDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(configDir, dirent.name))
      .filter(dir => fs.existsSync(path.join(dir, 'package.json')));

    for (const childDir of children) {
      fs.writeJsonSync(path.join(childDir, '.esad.context.json'), exportData, { spaces: 2 });
    }
  } catch (err) {
    console.error('Failed to sync context downwards:', err.message);
  }
};

module.exports = { updateDevMode, removeDevMode, clearAllDevMode, syncContextDownwards };
