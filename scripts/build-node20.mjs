#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const prismaCli = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
const nextCli = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

const env = {
  ...process.env,
  SKIP_INTERNAL_API_FETCH: process.env.SKIP_INTERNAL_API_FETCH ?? '1',
  SKIP_PRISMA: process.env.SKIP_PRISMA ?? '1',
  SKIP_AWS: process.env.SKIP_AWS ?? '1',
};

function runBinary(binaryPath, args) {
  const result = spawnSync(process.execPath, [binaryPath, ...args], {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`[build] Using Node version ${process.version}`);

runBinary(prismaCli, ['generate']);
runBinary(nextCli, ['build']);
