// Long-running test stack for manual / Playwright runs:  node e2e/dev-stack.mjs
import { startStack } from './stack.mjs';

const { gateway } = await startStack({ autoconfirm: process.env.AUTOCONFIRM !== '0' });

async function signup(email, password, name) {
  const r = await fetch(`${gateway.url}/auth/v1/signup`, {
    method: 'POST', headers: { 'content-type': 'application/json', apikey: gateway.anonKey },
    body: JSON.stringify({ email, password, data: { full_name: name } }),
  });
  return r.json();
}
await signup('admin@zetora.test', 'Passw0rd!', 'Admin Tester');
await gateway.pool.query(`update public.profiles set role = 'admin' where email = 'admin@zetora.test'`);
console.log('ANON_KEY=' + gateway.anonKey);
console.log('READY');
process.on('SIGTERM', async () => { await gateway.close(); process.exit(0); });
setInterval(() => {}, 1 << 30);
