// Tiny document store. Uses Postgres when DATABASE_URL is set (production),
// otherwise a JSON file in ./data (local development only).
import { promises as fs } from 'fs';
import path from 'path';
import postgres from 'postgres';

export type Rec = { id: string };

const DATABASE_URL = process.env.DATABASE_URL;
const FILE = path.join(process.cwd(), 'data', 'store.json');

type FileShape = { records: Record<string, Record<string, Rec>>; counters: Record<string, number> };

let client: postgres.Sql | null = null;
let schema: Promise<void> | null = null;

async function pg(): Promise<postgres.Sql> {
  if (!client) {
    const local = /localhost|127\.0\.0\.1/.test(DATABASE_URL!);
    // prepare: false keeps this compatible with Neon's pooled (PgBouncer) connection string.
    const sql = postgres(DATABASE_URL!, { max: 5, idle_timeout: 20, ssl: local ? false : 'require', prepare: false });
    client = sql;
    schema = (async () => {
      await sql`create table if not exists ggr_records (
        collection text not null, id text not null, data jsonb not null,
        updated_at timestamptz not null default now(), primary key (collection, id))`;
      await sql`create table if not exists ggr_counters (name text primary key, value bigint not null)`;
    })();
  }
  await schema;
  return client;
}

let lock: Promise<unknown> = Promise.resolve();

async function withFile<T>(fn: (d: FileShape) => T, write: boolean): Promise<T> {
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL is not set. Connect a Postgres database (Vercel > Storage > Neon) and redeploy.');
  }
  const run = lock.then(async () => {
    let d: FileShape;
    try {
      d = JSON.parse(await fs.readFile(FILE, 'utf8'));
    } catch {
      d = { records: {}, counters: {} };
    }
    const result = fn(d);
    if (write) {
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(d, null, 2));
    }
    return result;
  });
  lock = run.catch(() => undefined);
  return run;
}

export async function list<T extends Rec>(collection: string): Promise<T[]> {
  if (DATABASE_URL) {
    const sql = await pg();
    const rows = await sql`select data from ggr_records where collection = ${collection}`;
    return rows.map((r) => r.data as T);
  }
  return withFile((d) => Object.values(d.records[collection] ?? {}) as T[], false);
}

export async function get<T extends Rec>(collection: string, id: string): Promise<T | null> {
  if (DATABASE_URL) {
    const sql = await pg();
    const rows = await sql`select data from ggr_records where collection = ${collection} and id = ${id}`;
    return (rows[0]?.data as T) ?? null;
  }
  return withFile((d) => (d.records[collection]?.[id] as T) ?? null, false);
}

export async function findBy<T extends Rec>(collection: string, field: string, value: string): Promise<T | null> {
  if (DATABASE_URL) {
    const sql = await pg();
    const rows = await sql`select data from ggr_records
      where collection = ${collection} and data->>${field} = ${value} limit 1`;
    return (rows[0]?.data as T) ?? null;
  }
  const all = await list<T>(collection);
  return all.find((r) => (r as unknown as Record<string, unknown>)[field] === value) ?? null;
}

export async function put<T extends Rec>(collection: string, rec: T): Promise<T> {
  if (DATABASE_URL) {
    const sql = await pg();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = sql.json(rec as any);
    await sql`insert into ggr_records (collection, id, data) values (${collection}, ${rec.id}, ${json})
      on conflict (collection, id) do update set data = excluded.data, updated_at = now()`;
    return rec;
  }
  return withFile((d) => {
    (d.records[collection] ??= {})[rec.id] = rec;
    return rec;
  }, true);
}

export async function remove(collection: string, id: string): Promise<void> {
  if (DATABASE_URL) {
    const sql = await pg();
    await sql`delete from ggr_records where collection = ${collection} and id = ${id}`;
    return;
  }
  await withFile((d) => {
    delete d.records[collection]?.[id];
  }, true);
}

/** Atomically returns the next value of a named counter, starting at `start`. */
export async function nextCounter(name: string, start: number): Promise<number> {
  if (DATABASE_URL) {
    const sql = await pg();
    const rows = await sql`insert into ggr_counters (name, value) values (${name}, ${start})
      on conflict (name) do update set value = ggr_counters.value + 1 returning value`;
    return Number(rows[0].value);
  }
  return withFile((d) => {
    const v = d.counters[name] === undefined ? start : d.counters[name] + 1;
    d.counters[name] = v;
    return v;
  }, true);
}
