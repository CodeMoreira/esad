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
 * Prepares the native folders and applies Re.Pack patches
 */
async function prepareNative(cwd, platform = 'android') {
  if (!fs.existsSync(path.join(cwd, 'android')) && (platform === 'android' || platform === 'all')) {
    console.log(`📦 Native folder not found. Running expo prebuild...`);
    await runProcess('npx', ['expo', 'prebuild', '--platform', 'android'], cwd);
  }

  // Apply Gradle Patch (Android)
  const buildGradlePath = path.join(cwd, 'android/app/build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    let content = await fs.readFile(buildGradlePath, 'utf8');
    if (!content.includes('project.ext.react')) {
      const patch = `\nproject.ext.react = [\n    bundleCommand: "repack-bundle",\n    bundleConfig: "rspack.config.mjs"\n]\n\n`;
      content = content.replace(/react \{/, `${patch}react {`);
      
      // Force androidx.core version to avoid SDK 36 requirement conflict
      if (!content.includes('androidx.core:core:')) {
        const forcePatch = `\nconfigurations.all {\n    resolutionStrategy {\n        force 'androidx.core:core:1.15.0'\n        force 'androidx.core:core-ktx:1.15.0'\n    }\n}\n\n`;
        content = forcePatch + content;
      }

      await fs.writeFile(buildGradlePath, content);
      console.log(`✅ Patched android/app/build.gradle for Re.Pack and AndroidX versions.`);
    }
  }

  // Create react-native.config.js if missing
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
