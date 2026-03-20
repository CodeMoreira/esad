const { getWorkspaceConfig } = require('../utils/config');

module.exports = async (cdnName) => {
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(`❌ Error: Call this command from inside an ESAD workspace (esad.config.json not found).`);
    return;
  }
  const finalCdnName = cdnName || `${configObj.data.projectName}-cdn`;
  console.log(`\n📦 Creating CDN Registry: ${finalCdnName}...\n`);
  // Placeholder for backend cloning
  console.log(`[TODO] Scaffold Node Express backend into ./${finalCdnName}`);
};
