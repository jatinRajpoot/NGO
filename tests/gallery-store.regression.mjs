import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { transformSync } = require('next/dist/compiled/babel/core');
const code = transformSync(await readFile('app/lib/gallery-store.js', 'utf8'), {
  babelrc: false, configFile: false,
  plugins: [require('next/dist/compiled/babel/plugin-transform-modules-commonjs')],
}).code;
const originals = (await readdir('public/media/gallery')).filter((name) => /^IMG-\d{8}-WA\d+\.webp$/i.test(name));
assert.ok(originals.length > 1, 'Regression fixtures require bundled gallery photos');
const hidden = originals[0];
let metadataReads = 0;
let downloads = 0;
const bucket = {
  file(name, options) {
    assert.equal(name, 'manifest.json');
    return {
      async getMetadata() { return [{ generation: String(++metadataReads) }]; },
      async download() {
        downloads++;
        if (options.generation === 1) {
          throw Object.assign(new Error('Old generation replaced by another writer'), { code: 404 });
        }
        return [Buffer.from(JSON.stringify({ version: 1, uploaded: [], hiddenOriginals: [hidden] }))];
      },
    };
  },
};
const module = { exports: {} };
const context = vm.createContext({
  module, exports: module.exports, Buffer, console, setTimeout,
  process: { env: { NODE_ENV: 'production', GALLERY_BUCKET: 'regression-test-only' }, cwd: () => process.cwd() },
  require: (name) => name === '@google-cloud/storage'
    ? { Storage: class { bucket() { return bucket; } } }
    : require(name),
});
vm.runInContext(code, context, { filename: 'gallery-store.cjs' });
const photos = await module.exports.listGalleryPhotos();
assert.equal(metadataReads, 2, 'A vanished generation must trigger a fresh metadata lookup');
assert.equal(downloads, 2);
assert.equal(photos.length, originals.length - 1, 'Real calendar dates must retain valid seed photos');
assert.ok(!photos.some((photo) => photo.id === hidden), 'A raced read must honor the current hidden-photo manifest');
assert.ok(photos.every((photo) => /^\d{4}-\d{2}-\d{2}$/.test(photo.date)));
console.log('PASS: calendar dates and GCS generation-race gallery visibility. No cloud access used.');
