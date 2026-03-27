const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const { getWorkspaceConfig } = require('../utils/config');
const { resolveProjectDir, listAvailableModules } = require('../utils/resolution');

module.exports = async (options) => {
  let cwd = process.cwd();
  let pkgPath = path.join(cwd, 'package.json');
  
  // Enforce Workspace Root
  const configObj = getWorkspaceConfig();
  if (!configObj) {
    console.error(chalk.red(`❌ Erro: Comando deve ser executado na raiz do projeto (esad.config.json não encontrado).`));
    process.exit(1);
  }

  const workspaceRoot = path.dirname(configObj.path);
  const { projectName } = configObj.data;
  
  if (options.id) {
    const targetDir = resolveProjectDir(options.id, configObj);
    if (!targetDir) {
      console.error(chalk.red(`\n❌ Erro: Não foi encontrado o módulo: ${options.id}`));
      listAvailableModules(configObj);
      process.exit(1);
    }
    cwd = targetDir;
    pkgPath = path.join(cwd, 'package.json');
    console.log(chalk.green(`📂 Módulo detectado para Deploy: ${path.relative(workspaceRoot, cwd)}`));
  } else {
    // Target host by default if in root
    const hostDir = path.join(workspaceRoot, `${projectName}-host`);
    if (fs.existsSync(hostDir)) {
      cwd = hostDir;
      pkgPath = path.join(cwd, 'package.json');
      console.log(chalk.green(`📂 Host detectado para Deploy: ${path.relative(workspaceRoot, cwd)}`));
    }
  }

  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red(`❌ Erro: Arquivo package.json não encontrado em ${cwd}.`));
    process.exit(1);
  }

  const pkg = fs.readJsonSync(pkgPath);
  const moduleId = options.id || pkg.name;
  const version = options.version || pkg.version;
  const entry = options.entry || 'index.bundle';

  console.log(`\n☁️  Starting ESAD Deploy for ${moduleId} (v${version})\n`);
  
  const config = configObj ? configObj.data : null;
  if (!config?.deployEndpoint) {
    console.error(`❌ Error: 'deployEndpoint' not configured in esad.config.json.`);
    process.exit(1);
  }
  
  const deployUrl = config.deployEndpoint.replace('{{moduleId}}', moduleId);
  console.log(`📡 Deployment Endpoint Resolved: ${deployUrl}`);
  
  const distPath = path.join(cwd, 'dist');
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Error: dist/ directory not found in ${cwd}. Did you run the build command?`);
    process.exit(1);
  }

  const zip = new AdmZip();
  zip.addLocalFolder(distPath);
  
  const zipPath = path.join(cwd, `bundle-${moduleId}-${version}.zip`);
  zip.writeZip(zipPath);
  console.log(`🗜️  Zipped output to ${zipPath}`);

  console.log(`🚀 Uploading to CDN via multipart POST...`);
  // Note: Here we would use form-data + fetch or axios to upload to Simple CDN
  
  console.log(`✅ [SIMULATED] Successfully uploaded to ${deployUrl}`);
  fs.unlinkSync(zipPath);
};
