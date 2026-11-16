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
