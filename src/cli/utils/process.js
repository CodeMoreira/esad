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
    const child = spawn(cmd, args, { stdio: 'inherit', cwd, shell: true });
    child.on('close', code => {
      if (code !== 0) reject(new Error(`Command ${cmd} ${args.join(' ')} failed`));
      else resolve();
    });
  });
};

module.exports = { runProcess };
