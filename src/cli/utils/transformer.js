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

const clearAllDevMode = (configPath) => {
  if (!fs.existsSync(configPath)) return;
  let content = fs.readFileSync(configPath, 'utf8');

  // Remove the entire devMode block
  const devModeBlockRegex = /\s*devMode:\s*{[\s\S]*?},?/g;
  content = content.replace(devModeBlockRegex, '');

  fs.writeFileSync(configPath, content);
};

module.exports = { updateDevMode, removeDevMode, clearAllDevMode };

