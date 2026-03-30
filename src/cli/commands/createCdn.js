const { runProcess } = require('../utils/process');
const { getWorkspaceConfig } = require('../utils/config');
const fs = require('fs-extra');
const path = require('path');

module.exports = async (cdnName) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.json not found).`);
    return;
  }

  const { projectName } = configObj.data;
  const finalCdnName = `${projectName}-cdn`;
  const cdnPath = path.join(process.cwd(), finalCdnName);

  if (fs.existsSync(cdnPath)) {
    console.error(`❌ Error: Directory ./${finalCdnName} already exists.`);
    return;
  }

  console.log(`\n📦 Initializing Flux Registry & CDN: ${finalCdnName}...\n`);

  try {
    // 1. Clone the template
    console.log(`📡 Cloning template from GitHub...`);
    await runProcess('git', ['clone', 'https://github.com/CodeMoreira/simple-cdn.git', finalCdnName]);

    // 2. Remove .git from template
    console.log(`🧹 Cleaning up template metadata...`);
    await fs.remove(path.join(cdnPath, '.git'));

    // 3. Install dependencies
    console.log(`\n📥 Installing dependencies (this may take a minute)...`);
    await runProcess('npm', ['install'], cdnPath);

    console.log(`\n✅ CDN Registry created successfully in ./${finalCdnName}\n`);
    console.log(`To start your CDN:`);
    console.log(`  cd ${finalCdnName}`);
    console.log(`  npm start\n`);

  } catch (error) {
    console.error(`\n❌ Failed to create CDN: ${error.message}`);
  }
};
