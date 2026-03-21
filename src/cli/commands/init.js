const fs = require('fs-extra');
const path = require('path');
const { runProcess } = require('../utils/process');
const templates = require('../templates/host');

module.exports = async (projectName) => {
  const workspaceDir = path.join(process.cwd(), projectName);
  console.log(`\n🚀 Initializing ESAD Workspace: ${projectName}...\n`);
  
  fs.ensureDirSync(workspaceDir);

  const configPath = path.join(workspaceDir, 'esad.config.json');
  if (!fs.existsSync(configPath)) {
    const configTemplate = {
      projectName: projectName,
      registryUrl: "http://localhost:3000/modules",
      deployEndpoint: "http://localhost:3000/api/admin/modules/{{moduleId}}/versions",
      devModeEndpoint: "http://localhost:3000/api/admin/modules/{{moduleId}}"
    };
    fs.writeJsonSync(configPath, configTemplate, { spaces: 2 });
    console.log(`✅ Generated dynamic configuration file: esad.config.json`);
  }

  const gitignorePath = path.join(workspaceDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const hostName = `${projectName}-host`;
    const gitignoreContent = `# ESAD Workspace Git Configuration\n` +
      `# Ignore everything by default\n` +
      `/*\n\n` +
      `# Exceptions: Track only the Host and Configs\n` +
      `!/${hostName}/\n` +
      `!/esad.config.json\n` +
      `!/.gitignore\n` +
      `\n# Ignore node_modules\n` +
      `node_modules/\n`;
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log(`✅ Generated .gitignore`);
  }

  const hostName = `${projectName}-host`;
  const hostDir = path.join(workspaceDir, hostName);
  
  try {
    console.log(`\n📦 Scaffolding clean Expo project: ${hostName}...`);
    await runProcess('npx', ['create-expo-app', hostName, '--template', 'blank'], workspaceDir);
    
    console.log(`\n📦 Installing ESAD, Re.Pack and UI dependencies into host...`);
    const hostPkgPath = path.join(hostDir, 'package.json');
    const hostPkg = fs.readJsonSync(hostPkgPath);
    const reactVersion = hostPkg.dependencies.react;

    const deps = [
      '@codemoreira/esad',
      '@callstack/repack@^5.2.5',
      '@rspack/core@^1.7.9',
      '@rspack/plugin-react-refresh@^1.6.1',
      '@callstack/repack-plugin-expo-modules',
      '@react-native-community/cli',
      'nativewind',
      'tailwindcss',
      'postcss',
      'autoprefixer',
      'expo-secure-store',
      'react-native-reanimated',
      'react-native-safe-area-context',
      'react-native-screens',
      'expo-router',
      `react-dom@${reactVersion}`
    ];
    await runProcess('npm', ['install', ...deps], hostDir); 

    // Re-read package.json to get the version after npm install updated it
    const updatedPkg = fs.readJsonSync(hostPkgPath);

    // Update package.json scripts to delegate to ESAD CLI
    updatedPkg.scripts = {
       ...updatedPkg.scripts,
       "start": "esad host start",
       "android": "esad host android",
       "ios": "esad host ios",
       "dev": "esad host dev"
    };
    fs.writeJsonSync(hostPkgPath, updatedPkg, { spaces: 2 });
    console.log(`✅ Abstracted package.json scripts to use ESAD CLI.`);

    console.log(`\n🎨 Configuring NativeWind & Tailwind...`);
    fs.writeFileSync(path.join(hostDir, 'tailwind.config.js'), templates.tailwindConfig);
    fs.writeFileSync(path.join(hostDir, 'babel.config.js'), templates.babelConfig);

    const rspackContent = `import { withESAD } from '@codemoreira/esad/plugin';\n\nexport default withESAD({\n  type: 'host',\n  id: '${hostName}'\n});\n`
    fs.writeFileSync(path.join(hostDir, 'rspack.config.mjs'), rspackContent);

    console.log(`\n🔐 Scaffolding Auth & Navigation...`);
    fs.ensureDirSync(path.join(hostDir, 'providers'));
    fs.ensureDirSync(path.join(hostDir, 'hooks'));
    fs.ensureDirSync(path.join(hostDir, 'lib'));
    fs.ensureDirSync(path.join(hostDir, 'app', '(protected)', 'module'));

    fs.writeFileSync(path.join(hostDir, 'providers/auth.tsx'), templates.authProvider);
    fs.writeFileSync(path.join(hostDir, 'app/_layout.tsx'), templates.rootLayout);
    fs.writeFileSync(path.join(hostDir, 'app/login.tsx'), templates.loginPage);
    fs.writeFileSync(path.join(hostDir, 'app/global.css'), templates.globalCss);
    fs.writeFileSync(path.join(hostDir, 'lib/moduleLoader.ts'), templates.moduleLoader);
    fs.writeFileSync(path.join(hostDir, 'index.js'), templates.indexJs);
    fs.writeFileSync(path.join(hostDir, 'app/(protected)/index.tsx'), templates.dashboard);
    fs.writeFileSync(path.join(hostDir, 'app/(protected)/module/[id].tsx'), templates.modulePage);

    console.log(`\n🎉 ESAD Workpace Initialized!`);
    console.log(`-> cd ${projectName}\n-> esad dev (to start Host)`);
  } catch (err) {
    console.error(`❌ Failed to init Host:`, err.message);
  }
};
