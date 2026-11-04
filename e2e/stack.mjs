// Brings up the full local test stack: Postgres (migrations + seed) + gateway.
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { startGateway } from './gateway.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
export const RUN_DIR = join(here, '.run');
const DB = 'zetora_e2e';
const adminUrl = process.env.TEST_DATABASE_URL || 'postgres://zetora_test:zetora@127.0.0.1:5432/postgres';

export async function startStack({ autoconfirm = true, port = 54321 } = {}) {
  const boot = new pg.Client({ connectionString: adminUrl });
  await boot.connect();
  await boot.query(`drop database if exists ${DB} with (force)`);
  await boot.query(`create database ${DB}`);
  await boot.end();

  const u = new URL(adminUrl);
  u.pathname = `/${DB}`;
  const databaseUrl = u.toString();
  const db = new pg.Client({ connectionString: databaseUrl });
  await db.connect();
  db.on('notice', () => {});
  await db.query(readFileSync(join(root, 'supabase', 'tests', 'stubs.sql'), 'utf8'));
  for (const f of readdirSync(join(root, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.query(readFileSync(join(root, 'supabase', 'migrations', f), 'utf8'));
  }
  await db.query(readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8'));
  await db.end();

  rmSync(join(RUN_DIR, 'storage'), { recursive: true, force: true });
  const gateway = await startGateway({ databaseUrl, port, storageDir: join(RUN_DIR, 'storage'), autoconfirm });
  return { gateway, databaseUrl };
}
