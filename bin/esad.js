#!/usr/bin/env node

const { program } = require('commander');

// Import Commands
const initCommand = require('../src/cli/commands/init');
const createModuleCommand = require('../src/cli/commands/createModule');
const createCdnCommand = require('../src/cli/commands/createCdn');
const deployCommand = require('../src/cli/commands/deploy');
const devCommand = require('../src/cli/commands/dev');

program
  .version('1.1.0')
  .description('esad - Easy Super App Development Toolkit');

// --- COMMMAND: esad init ---
program
  .command('init <project-name>')
  .description('Scaffold a new ESAD workspace containing the Host App')
  .action(initCommand);

// --- COMMAND: esad create-cdn ---
program
  .command('create-cdn [cdn-name]')
  .description('Scaffold the CDN / Registry backend')
  .action(createCdnCommand);

// --- COMMAND: esad create-module ---
program
  .command('create-module <module-name>')
  .description('Scaffold a React Native mini-app automatically configured for Module Federation via ESAD')
  .action(createModuleCommand);

// --- COMMAND: esad deploy ---
program
  .command('deploy')
  .requiredOption('-v, --version <semver>', 'Version number (e.g., 1.0.0)')
  .requiredOption('-i, --id <moduleId>', 'The Module ID to deploy')
  .requiredOption('-e, --entry <entryFileName>', 'The name of the main entry bundle (e.g., index.bundle)')
  .description('Zips the local dist directory and uploads it to the configured deployment endpoint')
  .action(deployCommand);

// --- COMMAND: esad dev ---
program
  .command('dev')
  .requiredOption('-i, --id <moduleId>', 'The Module ID to run in dev mode')
  .option('-p, --port <port>', 'The port to run the dev server on', '8081')
  .description('Starts the dev server and updates the external registry to bypass CDN')
  .action(devCommand);

program.parse(process.argv);
