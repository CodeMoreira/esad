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
    let configData = jiti(configPath);
    if (configData.default) configData = configData.default;

    return { 
      path: configPath, 
      root: path.dirname(configPath),
      data: configData,
      load: () => configData 
    };
  } catch (err) {
    console.error(`❌ Failed to load esad.config.js: ${err.message}`);
    return null;
  }
};

module.exports = { getWorkspaceConfig };

