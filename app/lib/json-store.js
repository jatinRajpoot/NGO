import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const isMissing = error => Number(error?.code || error?.statusCode || error?.status) === 404;
const isConflict = error => Number(error?.code || error?.statusCode || error?.status) === 412;

// Keep the existing object names and JSON schemas. Every write compares the
// generation read by its operation; a conflict reruns that operation on fresh data.
export function createJsonStore({ prefix, getBucket, getDirectory, filename = name => `${name}.json`, examples = false }) {
  const transactions = new AsyncLocalStorage();
  const queues = new Map();

  async function load(name) {
    const bucket = getBucket();
    if (!bucket) {
      const target = path.join(getDirectory(), filename(name));
      return existsSync(target) ? { data: JSON.parse(readFileSync(target, 'utf8')), generation: null } : { generation: 0 };
    }
    const key = `${prefix}/${filename(name)}`;
    for (let attempt = 0; attempt < 12; attempt++) {
      let generation;
      try {
        const [metadata] = await bucket.file(key).getMetadata();
        generation = metadata.generation;
        const [buffer] = await bucket.file(key, { generation }).download();
        return { data: JSON.parse(buffer.toString('utf8')), generation };
      } catch (error) {
        if (!isMissing(error)) throw error;
        if (generation === undefined) return { generation: 0 };
        // A writer replaced the pinned generation; retry a consistent read.
      }
    }
    throw new Error(`Could not read a stable ${prefix} collection`);
  }

  async function save(name, data, generation) {
    const payload = JSON.stringify(data, null, 2);
    const bucket = getBucket();
    if (bucket) {
      try {
        await bucket.file(`${prefix}/${filename(name)}`).save(payload, {
          contentType: 'application/json', resumable: false,
          preconditionOpts: { ifGenerationMatch: generation },
        });
      } catch (error) {
        if (isConflict(error)) error.collectionConflict = `${prefix}/${filename(name)}`;
        throw error;
      }
      return;
    }
    const target = path.join(getDirectory(), filename(name));
    const temporary = `${target}.tmp.${randomUUID()}`;
    try {
      writeFileSync(temporary, payload, { encoding: 'utf8', mode: 0o600 });
      renameSync(temporary, target);
    } finally {
      try { unlinkSync(temporary); } catch {}
    }
  }

  async function read(name, seed = () => []) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const record = await load(name);
      const context = transactions.getStore();
      if (context?.name === name) context.generation = record.generation;
      if (record.data !== undefined) return record.data;
      let initial = await seed();
      if (!examples && Array.isArray(initial) && process.env.NODE_ENV === 'production' && process.env.GSDD_DEMO_DATA !== '1') initial = [];
      try { await save(name, initial, 0); }
      catch (error) { if (isConflict(error)) continue; throw error; }
      // Reread after initialization to capture its generation, never a later
      // writer's generation paired with the earlier initializer's payload.
    }
    throw new Error(`Could not initialize ${prefix} collection`);
  }

  async function write(name, data) {
    const context = transactions.getStore();
    if (context?.name !== name) throw new Error(`Write outside ${prefix}/${name} transaction`);
    if (context.generation === undefined && context.hasWritten) throw new Error('Reread a collection before writing it again');
    const generation = context.generation === undefined ? (await load(name)).generation : context.generation;
    await save(name, data, generation);
    context.generation = undefined;
    context.hasWritten = true;
  }

  function run(name, operation) {
    if (transactions.getStore()?.name === name) return operation();
    const previous = queues.get(name) || Promise.resolve();
    const next = previous.then(async () => {
      for (let attempt = 0; attempt < 12; attempt++) {
        try { return await transactions.run({ name }, operation); }
        catch (error) {
          if (error.collectionConflict !== `${prefix}/${filename(name)}` || attempt === 11) throw error;
        }
      }
    });
    queues.set(name, next.catch(() => {}));
    return next;
  }

  return { read, write, run };
}

// Public references must remain unique after arbitrary deletions, including
// deletion of the latest record. UUIDs do not depend on collection length.
export function publicReference(prefix) {
  return `${prefix}-${new Date().getFullYear()}-${randomUUID().replaceAll('-', '').toUpperCase()}`;
}
