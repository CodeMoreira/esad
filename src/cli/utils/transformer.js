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
    // Inject devMode before the last closing brace (naive but effective for clean configs)
    content = content.replace(/}([^}]*)$/, `  devMode: {},\n}$1`);
  }

  // 2. Add or update the module entry
  const entryRegex = new RegExp(`(['"]${moduleId}['"]|${moduleId}):\\s*['"]([^'"]*)['"]`, 'g');
  
  if (entryRegex.test(content)) {
    // Update existing
    content = content.replace(entryRegex, `$1: '${url}'`);
  } else {
    // Insert new entry into devMode object
    const devModeRegex = /(devMode:\s*{)/;
    content = content.replace(devModeRegex, `$1\n    '${moduleId}': '${url}',`);
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

  // Remove the entire devMode block
  const devModeBlockRegex = /\s*devMode:\s*{[\s\S]*?},?/g;
  content = content.replace(devModeBlockRegex, '');

  fs.writeFileSync(configPath, content);
};

const syncContextDownwards = (configObj) => {
  if (!fs.existsSync(configObj.path)) return;
  const configDir = path.dirname(configObj.path);

  // Clear cache to read fresh state
  delete require.cache[require.resolve(configObj.path)];
  let configContent = require(configObj.path);
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
