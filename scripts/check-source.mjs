import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Use the parser shipped with the installed Next version, without a second toolchain.
const { parseSync } = require('next/dist/compiled/babel/core');
const root = path.resolve(import.meta.dirname, '..');

async function sources(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(relative) : /\.(?:js|jsx|mjs)$/.test(entry.name) ? [relative] : [];
  }));
  return nested.flat();
}

const files = [...await sources('app'), ...await sources('scripts'), ...await sources('tests'), 'next.config.mjs'];
let failures = 0;
for (const filename of files) {
  try {
    parseSync(await readFile(path.join(root, filename), 'utf8'), {
      filename, sourceType: 'unambiguous', babelrc: false, configFile: false,
      parserOpts: { plugins: ['jsx'] },
    });
  } catch (error) {
    failures++;
    console.error(`${filename}: ${error.message}`);
  }
}
console.log(`Source syntax: ${files.length} files checked, ${failures} failures.`);
if (failures) process.exitCode = 1;
