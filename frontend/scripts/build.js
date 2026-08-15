const { spawnSync } = require('child_process');

process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = process.env.NEXT_IGNORE_INCORRECT_LOCKFILE || '1';
process.env.CIRCLE_NODE_TOTAL = process.env.NEXT_BUILD_CPUS || process.env.CIRCLE_NODE_TOTAL || '1';

const command = process.platform === 'win32' ? 'next.cmd' : 'next';
const result = spawnSync(command, ['build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(result.status || 0);
