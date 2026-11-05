// One-command end-to-end run:  npm run e2e
//   1. builds the app (production) against the local test stack
//   2. starts Postgres-backed gateway + `next start`
//   3. runs every browser flow on a FRESH database
// Requires: a local PostgreSQL server (see supabase/tests/run.mjs), Playwright + a Chromium binary
// (set CHROMIUM_PATH if it is not at /opt/pw-browsers/chromium).
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStack } from './stack.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3100;
const { startGateway: _unused } = await import('./gateway.mjs'); void _unused;

async function freshStack() {
  const stack = await startStack();
  const r = await fetch(`${stack.gateway.url}/auth/v1/signup`, {
    method: 'POST', headers: { 'content-type': 'application/json', apikey: stack.gateway.anonKey },
    body: JSON.stringify({ email: 'admin@zetora.test', password: 'Passw0rd!', data: { full_name: 'Admin Tester' } }),
  });
  if (!r.ok) throw new Error('could not create the admin test user');
  await stack.gateway.pool.query(`update public.profiles set role = 'admin' where email = 'admin@zetora.test'`);
  return stack;
}

let stack = await freshStack();
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: stack.gateway.url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: stack.gateway.anonKey,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  NEXT_PUBLIC_CONTACT_EMAIL: 'hello@zetora.test',
  ZETORA_ALLOW_LOCAL_IMAGES: '1',
  ANON_KEY: stack.gateway.anonKey,
  BASE_URL: `http://localhost:${PORT}`,
};

if (!process.env.E2E_SKIP_BUILD) {
  console.log('Building the app…');
  const b = spawnSync('npx', ['next', 'build'], { cwd: root, env, stdio: 'inherit' });
  if (b.status !== 0) process.exit(b.status ?? 1);
}
let server = null;
async function startNext() {
  // detached => own process group, so we can stop `npx` AND the next-server child it spawns
  server = spawn('npx', ['next', 'start', '-p', String(PORT)], { cwd: root, env, stdio: 'ignore', detached: true });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://localhost:${PORT}/login`)).ok) return; } catch { /* still starting */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('next start did not become ready');
}
async function stopNext() {
  if (!server?.pid) return;
  try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
  await new Promise((r) => setTimeout(r, 1000));
  server = null;
}

const flows = (process.env.E2E_FLOWS ? process.env.E2E_FLOWS.split(',') : ['flow-public.mjs', 'flow-student.mjs', 'flow-i18n.mjs', 'flow-admin.mjs']); // admin last: it deletes the demo content
let failed = 0;
for (const f of flows) {
  console.log(`\n================ ${f} ================`);
  await stopNext();                       // no stale keep-alive connections to the old gateway
  await stack.gateway.close();
  stack = await freshStack();             // fresh database for every flow
  await startNext();
  // Must be ASYNC: the gateway lives in this process, so blocking it (spawnSync) would starve the app of its backend.
  const code = await new Promise((resolve) => spawn('node', [join('e2e', f)], { cwd: root, env, stdio: 'inherit' }).on('exit', resolve));
  if (code !== 0) failed++;
}
await stopNext();
await stack.gateway.close();
console.log(failed ? `\n${failed} flow(s) FAILED` : '\nAll flows passed');
process.exit(failed ? 1 : 0);
