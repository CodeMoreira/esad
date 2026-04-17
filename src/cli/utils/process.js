const { spawn } = require('cross-spawn');

/**
 * Helper to spawn commands synchronously
 * @param {string} cmd 
 * @param {string[]} args 
 * @param {string} cwd 
 * @returns {Promise<void>}
 */
const runProcess = (cmd, args, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    // On Windows, npx must be executed as npx.cmd
    const command = process.platform === 'win32' && cmd === 'npx' ? 'npx.cmd' : cmd;

    const child = spawn(command, args, { stdio: 'inherit', cwd, shell: true });

    child.on('error', err => {
      reject(new Error(`Failed to spawn command ${command}: ${err.message}`));
    });

    child.on('close', code => {
      if (code !== 0) reject(new Error(`Command ${command} ${args.join(' ')} failed with exit code ${code}`));
      else resolve();
    });
  });
};

module.exports = { runProcess };
