#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description('esad - Easy Super App Development Toolkit (V2)');

// --- COMMAND: esad create [name] --type [host|module|cdn] ---
program
  .command('create [name]')
  .option('-t, --type <type>', 'Type of project: host, module, cdn', 'module')
  .description('Unified scaffolding for host apps, modules, and cdn registries')
  .action(async (name, options) => {
    await require('../src/cli/commands/create')(name, options);
    process.exit(0);
  });

// --- COMMAND: esad dev [moduleId] ---
program
  .command('dev [id]') // [id] as alias to -i for better UX
  .option('-i, --id <moduleId>', 'The Module ID to run in dev mode')
  .option('-p, --port <port>', 'The port to run the dev server on', '8081')
  .description('Starts the dev server and updates the local mapping')
  .action(async (id, options) => {
    const opts = { ...options, id: id || options.id };
    await require('../src/cli/commands/dev')(opts);
  });

// --- COMMAND: esad build [id] ---
program
  .command('build [id]')
  .option('-i, --id <moduleId>', 'The Module ID to build')
  .option('-p, --platform <platform>', 'Platform: android, ios', 'android')
  .description('Builds a production bundle')
  .action(async (id, options) => {
    const opts = { ...options, id: id || options.id };
    await require('../src/cli/commands/build')(opts);
    process.exit(0);
  });

// --- COMMAND: esad deploy [id] ---
program
  .command('deploy [id]')
  .option('-i, --id <moduleId>', 'The Module ID to deploy')
  .option('-v, --version <version>', 'Specific version to deploy')
  .description('Executes the programmable deploy hook')
  .action(async (id, options) => {
    const opts = { ...options, id: id || options.id };
    await require('../src/cli/commands/deploy')(opts);
    process.exit(0);
  });

// --- COMMAND: esad host <sub> ---
program
  .command('host <subcommand>')
  .description('Manage host application (android, ios, login)')
  .action(async (sub) => {
    await require('../src/cli/commands/host')(sub);
    process.exit(0);
  });

// --- COMMAND: esad doctor ---
program
  .command('doctor')
  .description('Check environment for common issues')
  .action(async () => {
    await require('../src/cli/commands/doctor')();
    process.exit(0);
  });

// --- COMMAND: esad link [id] ---
program
  .command('link [id]')
  .description('Optimize development via local filesystem linking')
  .action(async (id) => {
    await require('../src/cli/commands/link')(id);
    process.exit(0);
  });

program.parse(process.argv);
