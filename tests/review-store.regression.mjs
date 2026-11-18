import './helpers/register-source.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Two module instances model separate Cloud Run processes against one bucket.
let generation = 1;
let contents = '[]';
let reads = 0;
let release;
const barrier = new Promise(resolve => { release = resolve; });
globalThis.ReviewStorage = class {
  bucket() { return { file(name, options = {}) { return {
    async getMetadata() { return [{ generation: String(generation) }]; },
    async download() {
      const snapshot = contents;
      if (++reads <= 2) { if (reads === 2) release(); await barrier; }
      if (options.generation && Number(options.generation) !== generation) throw Object.assign(new Error('Replaced generation'), { code: 404 });
      return [Buffer.from(snapshot)];
    },
    async save(value, options = {}) {
      const expected = options.preconditionOpts?.ifGenerationMatch;
      if (expected !== undefined && Number(expected) !== generation) throw Object.assign(new Error('Conflict'), { code: 412 });
      contents = value; generation++;
    },
  }; } }; }
};
process.env.GALLERY_BUCKET = 'mock-review-bucket';
let source = (await readFile('app/lib/support-store.js', 'utf8'))
  .replace("import { Storage } from '@google-cloud/storage';", 'const Storage = globalThis.ReviewStorage;')
  .replace("'./portal-store'", JSON.stringify(pathToFileURL(path.resolve('app/lib/portal-store.js')).href))
  .replace("'./json-store'", JSON.stringify(pathToFileURL(path.resolve('app/lib/json-store.js')).href));
const a = await import('data:text/javascript;base64,' + Buffer.from(source + '\n// A').toString('base64'));
const b = await import('data:text/javascript;base64,' + Buffer.from(source + '\n// B').toString('base64'));
const results = await Promise.all([
  a.createBeneficiary({ name: 'Concurrent A', phone: '9000000001', district: 'Araria' }),
  b.createBeneficiary({ name: 'Concurrent B', phone: '9000000002', district: 'Araria' }),
]);
assert.ok(results.every(x => x.ok));
assert.equal(JSON.parse(contents).length, 2, 'Both accepted submissions must survive concurrent writers');
assert.notEqual(results[0].beneficiary.trackingCode, results[1].beneficiary.trackingCode);

contents = '[]'; generation++;
const first = await a.submitComplaint({ name: 'A', subject: 'First', description: 'First complaint' });
const second = await a.submitComplaint({ name: 'B', subject: 'Second', description: 'Second complaint' });
await a.deleteComplaints([first.complaint.id]);
const third = await a.submitComplaint({ name: 'C', subject: 'Third', description: 'Third complaint' });
assert.notEqual(second.complaint.ticketNo, third.complaint.ticketNo, 'Deleting an older record must never reuse an existing ticket');
assert.equal((await a.lookupComplaintStatus(second.complaint.ticketNo)).length, 1);
console.log('PASS: concurrent accepted submissions survive and public identifiers are not reused.');


// Keep the previously committed asset available when Cloud Storage rejects a metadata write.
const { Storage } = await import('@google-cloud/storage');
const files = new Map();
const blockedWrites = new Set();
let nextGeneration = 100;
const missing = () => Object.assign(new Error('Fixture object missing'), { code: 404 });
Storage.prototype.bucket = function () {
  return { file(key, options = {}) {
    return {
      async getMetadata() {
        const file = files.get(key);
        if (!file) throw missing();
        return [{ generation: String(file.generation) }];
      },
      async download() {
        const file = files.get(key);
        if (!file || (options.generation && Number(options.generation) !== file.generation)) throw missing();
        return [Buffer.from(file.payload)];
      },
      async save(payload, options = {}) {
        if (blockedWrites.has(key)) throw Object.assign(new Error('Fixture write unavailable'), { code: 503 });
        const expected = options.preconditionOpts?.ifGenerationMatch;
        if (expected !== undefined && Number(expected) !== (files.get(key)?.generation || 0)) {
          throw Object.assign(new Error('Fixture generation conflict'), { code: 412 });
        }
        files.set(key, { payload, generation: nextGeneration++ });
      },
      async delete() { files.delete(key); },
    };
  } };
};
process.env.NODE_ENV = 'production';
const posts = await import('../app/lib/posts-store.js');
const system = await import('../app/lib/admin-system-store.js');
const image = {
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9AAAAABJRU5ErkJggg==', 'base64'),
  filename: 'fixture.png', contentType: 'image/png',
};
const draft = { title: 'Fixture', type: 'activity', descriptionHtml: '<p>Fixture description</p>' };
const { post } = await posts.createPost({ ...draft, imageFiles: [image] });
blockedWrites.add('posts/posts.json');
await assert.rejects(posts.updatePost(post.id, { ...draft, deletedImageIds: [post.images[0].id] }), { code: 503 });
assert.ok(await posts.readPostImage(post.images[0].filename));
assert.equal((await posts.listPosts())[0].images[0].filename, post.images[0].filename);
const { profile } = await system.saveAdminPhoto(image);
blockedWrites.add('admin-system/admin-profile.json');
await assert.rejects(system.removeAdminPhoto(), { code: 503 });
assert.ok(await system.readAdminPhoto(profile.photoFilename));
assert.equal((await system.getExtendedAdminProfile()).photoFilename, profile.photoFilename);
console.log('PASS: failed metadata writes preserve committed post images and administrator photos.');
