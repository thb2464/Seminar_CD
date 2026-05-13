import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(e2eRoot, '../../Travel_TVB');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const outDir = path.join(e2eRoot, '.frontend-dist', `run-${Date.now()}`);
const relativeOutDir = path.relative(frontendRoot, outDir);

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        VITE_API_GATEWAY_URL: 'http://localhost:8000',
      },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });

await run(
  npmCommand,
  ['run', 'build', '--', '--configLoader', 'runner', '--outDir', relativeOutDir, '--emptyOutDir'],
  { cwd: frontendRoot },
);

const preview = spawn(
  npmCommand,
  [
    'run',
    'preview',
    '--',
    '--configLoader',
    'runner',
    '--host',
    '127.0.0.1',
    '--port',
    '5173',
    '--strictPort',
    '--outDir',
    relativeOutDir,
  ],
  {
    cwd: frontendRoot,
    env: {
      ...process.env,
      VITE_API_GATEWAY_URL: 'http://localhost:8000',
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

const stopPreview = () => {
  if (!preview.killed) {
    preview.kill('SIGTERM');
  }
};

process.on('SIGINT', () => {
  stopPreview();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopPreview();
  process.exit(143);
});

preview.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

preview.on('exit', (code) => {
  process.exit(code ?? 0);
});
