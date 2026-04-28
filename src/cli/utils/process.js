const { spawn } = require('cross-spawn');
const nativeSpawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs-extra');

const runProcess = (cmd, args, cwd = process.cwd()) => {
    let childRef;
    const promise = new Promise((resolve, reject) => {
      let finished = false;
      let started = false;

      const finalize = (fn, arg) => {
        if (finished) return;
        finished = true;
        fn(arg);
      };

      const isWin = process.platform === 'win32';
      const localBin = isWin ? `${cmd}.cmd` : cmd;
      const localBinPath = path.join(cwd, 'node_modules', '.bin', localBin);
      
      let command = cmd;
      let finalArgs = args;
      let useNativeSpawn = false;

      if (fs.existsSync(localBinPath)) {
        // 1. Priority: Local node_modules/.bin (fastest & consistent)
        command = isWin ? `node_modules\\.bin\\${localBin}` : `./node_modules/.bin/${localBin}`;
        useNativeSpawn = isWin; 
      } else {
        // 2. Fallback: System Path (git, npm, npx, etc)
        // cross-spawn handles .cmd/.exe resolution automatically
        command = cmd;
        finalArgs = args;
        useNativeSpawn = false;
      }
      
      console.log(`[ESAD] Resolved Command: ${command} (CWD: ${cwd})`);

      setTimeout(() => { started = true; }, 2000);

      const spawnFn = useNativeSpawn ? nativeSpawn : spawn;
      childRef = spawnFn(command, finalArgs, { 
        stdio: 'inherit', 
        cwd, 
        shell: true
      });

      childRef.on('error', err => {
        if (started && err.code === 'ENOENT') {
          console.warn(`[ESAD] Warning: Late ENOENT ignored for ${cmd}.`);
          return;
        }
        finalize(reject, err);
      });

      childRef.on('close', code => {
        if (code !== 0) {
          finalize(reject, new Error(`Process ${cmd} exited with code ${code}`));
        } else {
          finalize(resolve);
        }
      });
    });

    promise.child = childRef;
    promise.kill = (signal) => childRef && childRef.kill(signal);

    return promise;
  };

module.exports = { runProcess };
