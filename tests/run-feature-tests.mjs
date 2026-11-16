import { spawnSync } from 'node:child_process';

for (const file of [
  'pr-fixes.integration.mjs',
  'feature-posts-news.test.mjs',
  'feature-admin-overview-system.test.mjs',
  'feature-donations-finance.test.mjs',
  'feature-operations.test.mjs',
  'feature-beneficiaries-support.test.mjs',
  'feature-membership-suite.test.mjs',
]) {
  const result = spawnSync(process.execPath, [`tests/${file}`], { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status || 1);
}
