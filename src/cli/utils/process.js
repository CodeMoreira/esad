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

    const isWin = process.platform === 'win32';
    const localBinPath = path.join(cwd, 'node_modules', '.bin', isWin ? `${cmd}.cmd` : cmd);
    
    let command = cmd;
    let finalArgs = args;

    if (fs.existsSync(localBinPath)) {
      // Use RELATIVE path for Windows stability
      command = isWin ? `node_modules\\.bin\\${cmd}.cmd` : `./node_modules/.bin/${cmd}`;
    } else {
      command = isWin ? `${cmd}.cmd` : cmd;
    }
    
    console.log(`[ESAD] Resolved Command: ${command} (CWD: ${cwd})`);

    const child = spawn(command, finalArgs, { 
      stdio: 'inherit', 
      cwd, 
      shell: true
    });

    child.on('error', err => {
      // Log more details to understand when this happens
      console.error(`[ESAD] Process Error: ${err.code} - ${err.message}`);
      finalize(reject, new Error(`Failed to start ${cmd}: ${err.message}`));
    });

    child.on('close', code => {
      if (code !== 0) {
        finalize(reject, new Error(`Process ${cmd} exited with code ${code}`));
      } else {
        finalize(resolve);
      }
    });
  });
};

module.exports = { runProcess };
