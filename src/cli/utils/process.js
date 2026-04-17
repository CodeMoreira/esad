const { spawn } = require('cross-spawn');
const nativeSpawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs-extra');

const runProcess = (cmd, args, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    let finished = false;
    let started = false;

    const finalize = (fn, arg) => {
      if (finished) return;
      finished = true;
      fn(arg);
    };

    const isWin = process.platform === 'win32';
    const localBinPath = path.join(cwd, 'node_modules', '.bin', isWin ? `${cmd}.cmd` : cmd);
    
    let command = cmd;
    let finalArgs = args;
    let useNativeSpawn = false;

    if (fs.existsSync(localBinPath)) {
      command = isWin ? `node_modules\\.bin\\${cmd}.cmd` : `./node_modules/.bin/${cmd}`;
      useNativeSpawn = isWin; // Use native spawn on Windows for local binaries to avoid cross-spawn issues
    } else {
      command = isWin ? 'npx.cmd' : 'npx';
      finalArgs = [cmd, ...args];
    }
    
    console.log(`[ESAD] Resolved Command: ${command} (CWD: ${cwd})`);

    // Mark as started after a short delay
    setTimeout(() => { started = true; }, 2000);

    const spawnFn = useNativeSpawn ? nativeSpawn : spawn;
    const child = spawnFn(command, finalArgs, { 
      stdio: 'inherit', 
      cwd, 
      shell: true
    });

    child.on('error', err => {
      // If the process already "started" (ran for > 2s), we ignore early-spawn errors
      // as they are likely shell artifacts from the process exiting.
      if (started && err.code === 'ENOENT') {
        console.warn(`[ESAD] Warning: Late ENOENT ignored for ${cmd}.`);
        return;
      }

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
