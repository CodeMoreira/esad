const { spawn } = require('cross-spawn');
const path = require('path');
const fs = require('fs-extra');

/**
 * Helper to spawn commands synchronously
 * @param {string} cmd 
 * @param {string[]} args 
 * @param {string} cwd 
 * @returns {Promise<void>}
 */
const runProcess = (cmd, args, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finalize = (fn, arg) => {
      if (finished) return;
      finished = true;
      fn(arg);
    };

    // Try to find a local binary in node_modules/.bin first
    const isWin = process.platform === 'win32';
    const localBinPath = path.join(cwd, 'node_modules', '.bin', isWin ? `${cmd}.cmd` : cmd);
    
    let command = cmd;
    let finalArgs = args;

    if (fs.existsSync(localBinPath)) {
      command = localBinPath;
    } else {
      // Fallback to npx
      command = isWin ? 'npx.cmd' : 'npx';
      finalArgs = [cmd, ...args];
    }

    const child = spawn(command, finalArgs, { stdio: 'inherit', cwd, shell: true });

    child.on('error', err => {
      finalize(reject, new Error(`Failed to spawn command ${command}: ${err.message}`));
    });

    child.on('close', code => {
      if (code !== 0) {
        finalize(reject, new Error(`Command ${command} ${finalArgs.join(' ')} failed with exit code ${code}`));
      } else {
        finalize(resolve);
      }
    });
  });
};

module.exports = { runProcess };
