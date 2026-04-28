const fs = require('fs-extra');
const path = require('path');
const { createJiti } = require('jiti');

const getWorkspaceConfig = () => {
  let current = process.cwd();
  let configPath = null;

  // Search upwards for esad.config.js
  while (current !== path.parse(current).root) {
    const check = path.join(current, 'esad.config.js');
    if (fs.existsSync(check)) {
      configPath = check;
      break;
    }
    current = path.dirname(current);
  }

  if (!configPath) return null;

  try {
    const jiti = createJiti(__filename);
    const configModule = jiti(configPath);
    // jiti.import returns a promise for async imports if needed, but for esad.config.js 
    // we expect a sync structure or we resolve it.
    // However, jiti v2 import is async.
    
    return { 
      path: configPath, 
      root: path.dirname(configPath),
      load: () => configModule 
    };
  } catch (err) {
    console.error(`❌ Failed to load esad.config.js: ${err.message}`);
    return null;
  }
};

module.exports = { getWorkspaceConfig };

