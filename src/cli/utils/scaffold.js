const { runProcess } = require('./process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Clones a template repository and cleans up the .git folder
 */
async function cloneTemplate(url, dest) {
  console.log(`\n📥 Cloning template: ${url}...`);
  await runProcess('git', ['clone', url, dest]);
  
  const gitDir = path.join(dest, '.git');
  if (fs.existsSync(gitDir)) {
    await fs.remove(gitDir);
    console.log(`✅ Detached from template repository.`);
  }
}

/**
 * Renames the project in package.json and app.json
 */
async function renameProject(targetDir, newName) {
  const pkgPath = path.join(targetDir, 'package.json');
  const appJsonPath = path.join(targetDir, 'app.json');

  if (fs.existsSync(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    pkg.name = newName;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    console.log(`✅ Updated package.json name: ${newName}`);
  }

  if (fs.existsSync(appJsonPath)) {
    const appJson = await fs.readJson(appJsonPath);
    if (appJson.expo) {
      appJson.expo.name = newName;
      appJson.expo.slug = newName;
      if (appJson.expo.android) {
        appJson.expo.android.package = `com.anonymous.${newName.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
      
      // Auto-register ESAD Expo Config Plugin
      if (!appJson.expo.plugins) appJson.expo.plugins = [];
      if (!appJson.expo.plugins.includes('@codemoreira/esad/expo-plugin')) {
        appJson.expo.plugins.push('@codemoreira/esad/expo-plugin');
        console.log(`✅ Registered @codemoreira/esad/expo-plugin in app.json.`);
      }
    } else {
      appJson.name = newName;
      appJson.slug = newName;
    }
    await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
    console.log(`✅ Updated app.json name/slug/package.`);
  }

  // 3. Update Rspack Config if exists
  const rspackPath = path.join(targetDir, 'rspack.config.mjs');
  if (fs.existsSync(rspackPath)) {
    let content = await fs.readFile(rspackPath, 'utf8');
    const regex = /id:\s*['"][^'"]+['"]/;
    if (regex.test(content)) {
      content = content.replace(regex, `id: '${newName}'`);
      await fs.writeFile(rspackPath, content);
      console.log(`✅ Updated rspack.config.mjs id: ${newName}`);
    }
  }
}

/**
 * Prepares the native folders and applies Re.Pack patches via Config Plugin
 */
async function prepareNative(cwd, platform = 'android') {
  const hasAndroid = fs.existsSync(path.join(cwd, 'android'));
  const hasIos = fs.existsSync(path.join(cwd, 'ios'));

  if ((!hasAndroid && (platform === 'android' || platform === 'all')) || 
      (!hasIos && (platform === 'ios' || platform === 'all'))) {
    
    console.log(`\n📦 Native folder(s) missing. Running expo prebuild...`);
    await runProcess('npx', ['expo', 'prebuild', '--platform', platform === 'all' ? 'all' : platform], cwd);

    // FIX SCRIPTS: Revert Expo's overwrite and point to ESAD CLI
    console.log(`\n🧹 Cleaning up package.json scripts (pointing to ESAD CLI)...`);
    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      pkg.scripts.android = 'esad dev --platform android';
      pkg.scripts.ios = 'esad dev --platform ios';
      pkg.scripts.start = 'esad dev';
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      console.log(`✅ Scripts updated to use ESAD CLI (start, android, ios).`);
    }
  }

  // Create react-native.config.js if missing (Essential for Re.Pack commands)
  const rnConfigPath = path.join(cwd, 'react-native.config.js');
  if (!fs.existsSync(rnConfigPath)) {
    const content = `module.exports = {\n  commands: require('@callstack/repack/commands/rspack'),\n};\n`;
    await fs.writeFile(rnConfigPath, content);
    console.log(`✅ Generated react-native.config.js.`);
  }
}

module.exports = {
  cloneTemplate,
  renameProject,
  prepareNative
};
