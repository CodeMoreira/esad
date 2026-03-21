#!/usr/bin/env node

const { program } = require('commander');

// Import Commands
const initCommand = require('../src/cli/commands/init');
const createModuleCommand = require('../src/cli/commands/createModule');
const createCdnCommand = require('../src/cli/commands/createCdn');
const deployCommand = require('../src/cli/commands/deploy');
const devCommand = require('../src/cli/commands/dev');
const hostCommand = require('../src/cli/commands/host');

program
  .version('1.2.0')
  .description('esad - Easy Super App Development Toolkit');

// --- COMMMAND: esad init ---
program
  .command('init <project-name>')
  .description('Scaffold a new ESAD workspace containing the Host App')
  .action(async (name) => {
     await initCommand(name);
     process.exit(0);
  });

// --- COMMAND: esad create-cdn ---
program
  .command('create-cdn [cdn-name]')
  .description('Scaffold the CDN / Registry backend')
  .action(async (name) => {
     await createCdnCommand(name);
     process.exit(0);
  });

// --- COMMAND: esad host ---
program
  .command('host <subcommand>')
  .description('Manage the Host App (dev, android, ios)')
  .action(async (sub) => {
     await hostCommand(sub);
     process.exit(0);
  });

// --- COMMAND: esad create-module ---
program
  .command('create-module <module-name>')
  .description('Scaffold a React Native mini-app automatically configured for Module Federation via ESAD')
  .action(async (name) => {
     await createModuleCommand(name);
     process.exit(0);
  });

// --- COMMAND: esad deploy ---
program
  .command('deploy')
  .option('-v, --version <semver>', 'Version number (e.g., 1.0.0)')
  .option('-i, --id <moduleId>', 'The Module ID to deploy')
  .option('-e, --entry <entryFileName>', 'The name of the main entry bundle (e.g., index.bundle)', 'index.bundle')
  .description('Zips the local dist directory and uploads it to the configured deployment endpoint')
  .action(async (options) => {
     await deployCommand(options);
     process.exit(0);
  });

// --- COMMAND: esad dev ---
program
  .command('dev')
  .option('-i, --id <moduleId>', 'The Module ID to run in dev mode')
  .option('-p, --port <port>', 'The port to run the dev server on', '8081')
  .description('Starts the dev server and updates the external registry to bypass CDN')
  .action(async (options) => {
     await devCommand(options);
     // Note: dev command has its own shutdown logic with SIGINT/SIGTERM
  });

program.parse(process.argv);
