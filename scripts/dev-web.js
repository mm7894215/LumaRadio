const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const initialBuild = spawnSync(npmCommand, ['run', 'build:runtime'], { cwd: root, stdio: 'inherit' });
if (initialBuild.status !== 0) process.exit(initialBuild.status || 1);

const children = [
  spawn(npmCommand, ['exec', 'tsc', '--', '-p', 'tsconfig.runtime.json', '--watch', '--preserveWatchOutput'], { cwd: root, stdio: 'inherit' }),
  spawn(npmCommand, ['exec', 'tsc', '--', '-p', 'tsconfig.worker.json', '--watch', '--preserveWatchOutput'], { cwd: root, stdio: 'inherit' }),
  spawn(nodeCommand, ['server.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, PORT: '3001', HOST: '127.0.0.1' } }),
  spawn(npmCommand, ['exec', 'vite', '--', '--host', '127.0.0.1', '--port', '3000'], { cwd: root, stdio: 'inherit' }),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
  process.exitCode = code;
}

for (const child of children) {
  child.once('exit', (code, signal) => {
    if (!stopping && code !== 0 && signal !== 'SIGTERM') stop(code ?? 1);
  });
}
process.once('SIGINT', () => stop(130));
process.once('SIGTERM', () => stop(143));
