// =============================================================================
// TEST-ONLY Supabase-compatible gateway.
//
// Speaks just enough of the Supabase REST (PostgREST), Auth (GoTrue) and Storage
// protocols for the Zetora app + supabase-js to run end to end against a REAL
// PostgreSQL database. Every REST/Storage request executes inside a transaction
// as the `anon` / `authenticated` role with the JWT claims set — exactly how
// PostgREST does it — so Row Level Security is genuinely exercised.
//
// It is NOT shipped with the app and NOT a PostgREST replacement: unsupported
// query features throw loudly instead of silently misbehaving.
// =============================================================================
import http from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import pg from 'pg';
import { SignJWT, jwtVerify } from 'jose';

export const JWT_SECRET = 'zetora-e2e-secret-zetora-e2e-secret-0123456789';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function startGateway({ databaseUrl, port = 54321, storageDir, autoconfirm = true }) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 8 });
  mkdirSync(storageDir, { recursive: true });
  const outbox = [];
  const pkceCodes = new Map(); // code -> user id
  const refreshTokens = new Map(); // token -> user id
  const origin = `http://127.0.0.1:${port}`;

  await pool.query(`create table if not exists public.mock_passwords (user_id uuid primary key, password text not null)`);
  await pool.query(`grant all on public.mock_passwords to postgres`);

  // ---- schema introspection (foreign keys + function signatures) ----
  const fks = (await pool.query(`
    select regexp_replace(c.conrelid::regclass::text, '^public\\.|"', '', 'g') as child,
           regexp_replace(c.confrelid::regclass::text, '^public\\.|"', '', 'g') as parent,
           a.attname as child_col, af.attname as parent_col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_attribute af on af.attrelid = c.confrelid and af.attnum = c.confkey[1]
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace and cardinality(c.conkey) = 1`)).rows;
  const fns = new Map();
  for (const r of (await pool.query(`
    select p.proname, p.proargnames,
           (select coalesce(array_agg(format_type(t, null) order by o), '{}') from unnest(p.proargtypes::oid[]) with ordinality as x(t, o)) as argtypes,
           p.proretset, format_type(p.prorettype, null) as rettype
    from pg_proc p where p.pronamespace = 'public'::regnamespace`)).rows) fns.set(r.proname, r);

  // ------------------------------------------------------------------ helpers
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': 'Content-Range,Content-Length,Content-Type',
  };
  const send = (res, status, body, headers = {}) => {
    const isBuf = Buffer.isBuffer(body);
    const payload = body === undefined || body === null ? '' : isBuf ? body : typeof body === 'string' ? body : JSON.stringify(body);
    res.writeHead(status, { ...cors, ...(isBuf || typeof body === 'string' ? {} : { 'Content-Type': 'application/json' }), ...headers });
    res.end(payload);
  };
  const readBody = (req) => new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
  const readJson = async (req) => {
    const b = await readBody(req);
    if (!b.length) return {};
    try { return JSON.parse(b.toString('utf8')); } catch { return {}; }
  };

  async function claimsFrom(req) {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return { role: 'anon', claims: { role: 'anon' } };
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return { role: payload.role === 'authenticated' ? 'authenticated' : 'anon', claims: payload, token };
  }

  async function withRole(auth, fn) {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query(`set local role ${auth.role}`);
      await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(auth.claims)]);
      const out = await fn(c);
      await c.query('commit');
      return out;
    } catch (e) {
      await c.query('rollback').catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  }

  const ident = (s) => {
    if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw new Error(`bad identifier ${s}`);
    return `"${s}"`;
  };

  // ------------------------------------------------------------ REST: select
  function splitTop(s) {
    const out = []; let depth = 0; let cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out.map((x) => x.trim()).filter(Boolean);
  }
  function parseSelect(sel) {
    return splitTop(sel || '*').map((item) => {
      const m = item.match(/^([a-z_][a-z0-9_]*)(?:!([a-z_][a-z0-9_]*))?\(([\s\S]*)\)$/i);
      if (m) {
        if (m[2] === 'inner' || /!inner/.test(item)) throw new Error('!inner embeds are not supported by the test gateway');
        return { embed: m[1], sub: parseSelect(m[3] || '*') };
      }
      const a = item.match(/^(?:([a-z_][a-z0-9_]*):)?([a-z_][a-z0-9_]*|\*)$/i);
      if (!a) throw new Error(`Unsupported select item: ${item}`);
      return { col: a[2], alias: a[1] };
    });
  }
  function findRel(table, name) {
    const m2o = fks.find((f) => f.child === table && f.parent === name);
    if (m2o) return { kind: 'm2o', childCol: m2o.child_col, parentCol: m2o.parent_col };
    const o2m = fks.find((f) => f.child === name && f.parent === table);
    if (o2m) return { kind: 'o2m', childCol: o2m.child_col, parentCol: o2m.parent_col };
    throw new Error(`No relationship between ${table} and ${name}`);
  }
  function selectList(table, alias, items, depth = 0) {
    return items.map((it) => {
      if (it.col === '*') return `${alias}.*`;
      if (it.col) return `${alias}.${ident(it.col)}${it.alias ? ` AS ${ident(it.alias)}` : ''}`;
      const rel = findRel(table, it.embed);
      const ea = `e${depth}_${it.embed}`;
      const inner = selectList(it.embed, ea, it.sub, depth + 1);
      if (rel.kind === 'm2o') {
        return `(SELECT row_to_json(x) FROM (SELECT ${inner} FROM ${ident(it.embed)} ${ea} WHERE ${ea}.${ident(rel.parentCol)} = ${alias}.${ident(rel.childCol)}) x) AS ${ident(it.embed)}`;
      }
      return `(SELECT coalesce(json_agg(x), '[]'::json) FROM (SELECT ${inner} FROM ${ident(it.embed)} ${ea} WHERE ${ea}.${ident(rel.childCol)} = ${alias}.${ident(rel.parentCol)}) x) AS ${ident(it.embed)}`;
    }).join(', ');
  }

  const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
  function condition(col, spec, values) {
    let s = spec; let neg = false;
    if (s.startsWith('not.')) { neg = true; s = s.slice(4); }
    const dot = s.indexOf('.');
    const op = s.slice(0, dot); const val = s.slice(dot + 1);
    const push = (v) => { values.push(v); return `$${values.length}`; };
    let sql;
    switch (op) {
      case 'eq': sql = `${col} = ${push(val)}`; break;
      case 'neq': sql = `${col} <> ${push(val)}`; break;
      case 'gt': sql = `${col} > ${push(val)}`; break;
      case 'gte': sql = `${col} >= ${push(val)}`; break;
      case 'lt': sql = `${col} < ${push(val)}`; break;
      case 'lte': sql = `${col} <= ${push(val)}`; break;
      case 'like': sql = `${col} LIKE ${push(val.replace(/\*/g, '%'))}`; break;
      case 'ilike': sql = `${col} ILIKE ${push(val.replace(/\*/g, '%'))}`; break;
      case 'in': {
        const inner = val.replace(/^\(/, '').replace(/\)$/, '');
        const arr = (inner.match(/"([^"]*)"|[^,]+/g) ?? []).map((x) => x.replace(/^"|"$/g, ''));
        sql = `${col} = ANY(${push(arr)})`;
        break;
      }
      case 'is': sql = val === 'null' ? `${col} IS NULL` : val === 'true' ? `${col} IS TRUE` : `${col} IS FALSE`; break;
      default: throw new Error(`Unsupported filter operator: ${op}`);
    }
    return neg ? `NOT (${sql})` : sql;
  }
  function where(searchParams, alias, values) {
    const conds = [];
    for (const [k, v] of searchParams) {
      if (RESERVED.has(k)) continue;
      if (k === 'or' || k === 'and' || k.includes('.')) throw new Error(`Unsupported filter key: ${k}`);
      conds.push(condition(`${alias}.${ident(k)}`, v, values));
    }
    return conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
  }
  function orderBy(searchParams, alias) {
    const o = searchParams.get('order');
    if (!o) return '';
    return ' ORDER BY ' + o.split(',').map((p) => {
      const [col, ...mods] = p.split('.');
      return `${alias}.${ident(col)}${mods.includes('desc') ? ' DESC' : ''}${mods.includes('nullsfirst') ? ' NULLS FIRST' : ''}${mods.includes('nullslast') ? ' NULLS LAST' : ''}`;
    }).join(', ');
  }
  function prefer(req) {
    const set = new Set();
    for (const part of String(req.headers.prefer ?? '').split(',')) set.add(part.trim());
    return set;
  }
  const wantsObject = (req) => String(req.headers.accept ?? '').includes('application/vnd.pgrst.object+json');

  function respondRows(res, req, rows, status = 200, extra = {}) {
    if (wantsObject(req)) {
      if (rows.length !== 1) {
        return send(res, 406, { code: 'PGRST116', details: `The result contains ${rows.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
      }
      return send(res, status, rows[0], extra);
    }
    return send(res, status, rows, extra);
  }

  function pgError(res, e, auth) {
    if (e.code === 'PGRST301') return send(res, 401, { code: 'PGRST301', message: e.message });
    if (e.code && /^[0-9A-Z]{5}$/.test(e.code)) {
      const status = e.code === '42501' ? (auth?.role === 'anon' ? 401 : 403) : e.code.startsWith('23') ? 409 : e.code === 'P0002' ? 404 : 400;
      return send(res, status, { code: e.code, message: e.message, details: e.detail ?? null, hint: e.hint ?? null });
    }
    console.error('[gateway] error:', e.message);
    return send(res, 400, { code: 'GATEWAY', message: e.message, details: null, hint: null });
  }

  async function handleRest(req, res, url) {
    const name = decodeURIComponent(url.pathname.replace(/^\/rest\/v1\//, ''));
    let auth;
    try { auth = await claimsFrom(req); } catch { return send(res, 401, { code: 'PGRST301', message: 'JWT expired or invalid' }); }

    try {
      // ---- RPC ----
      if (name.startsWith('rpc/')) {
        const fname = name.slice(4);
        const fn = fns.get(fname);
        if (!fn) return send(res, 404, { code: 'PGRST202', message: `Could not find the function public.${fname}` });
        const args = req.method === 'GET' ? Object.fromEntries(url.searchParams) : await readJson(req);
        const names = fn.proargnames ?? [];
        const parts = []; const values = [];
        for (const [k, v] of Object.entries(args)) {
          const idx = names.indexOf(k);
          if (idx < 0 || idx >= fn.argtypes.length) return send(res, 404, { code: 'PGRST202', message: `No such argument ${k} for ${fname}` });
          const type = fn.argtypes[idx];
          values.push(/json/.test(type) ? (v === null ? null : JSON.stringify(v)) : v);
          parts.push(`${ident(k)} => $${values.length}::${type}`);
        }
        const call = `public.${ident(fname)}(${parts.join(', ')})`;
        const out = await withRole(auth, async (c) => {
          if (fn.rettype === 'void') { await c.query(`SELECT ${call}`, values); return { void: true }; }
          if (fn.proretset) {
            const r = await c.query(`SELECT coalesce(json_agg(r), '[]'::json) AS j FROM (SELECT * FROM ${call}) r`, values);
            return { j: r.rows[0].j };
          }
          const r = await c.query(`SELECT to_json(${call}) AS j`, values);
          return { j: r.rows[0].j };
        });
        if (out.void) return send(res, 204, '');
        // Scalars (e.g. a uuid) must be JSON-encoded, exactly like PostgREST does.
        return send(res, 200, JSON.stringify(out.j), { 'Content-Type': 'application/json' });
      }

      const table = ident(name);
      const sp = url.searchParams;
      const items = parseSelect(sp.get('select') ?? '*');

      // ---- SELECT / HEAD ----
      if (req.method === 'GET' || req.method === 'HEAD') {
        const values = [];
        const w = where(sp, 't', values);
        const limit = sp.get('limit') ? ` LIMIT ${Number(sp.get('limit'))}` : '';
        const offset = sp.get('offset') ? ` OFFSET ${Number(sp.get('offset'))}` : '';
        const pf = prefer(req);
        const out = await withRole(auth, async (c) => {
          let total = null;
          if (pf.has('count=exact')) total = Number((await c.query(`SELECT count(*) AS n FROM ${table} t${w}`, values)).rows[0].n);
          if (req.method === 'HEAD') return { rows: [], total };
          const r = await c.query(`SELECT coalesce(json_agg(r), '[]'::json) AS j FROM (SELECT ${selectList(name, 't', items)} FROM ${table} t${w}${orderBy(sp, 't')}${limit}${offset}) r`, values);
          return { rows: r.rows[0].j, total };
        });
        const start = Number(sp.get('offset') ?? 0);
        const range = out.total != null ? `${out.rows.length ? `${start}-${start + out.rows.length - 1}` : '*'}/${out.total}` : undefined;
        if (req.method === 'HEAD') return send(res, 200, '', range ? { 'Content-Range': range } : {});
        return respondRows(res, req, out.rows, 200, range ? { 'Content-Range': range } : {});
      }

      // ---- INSERT / UPSERT ----
      if (req.method === 'POST') {
        const body = await readJson(req);
        const rowsIn = Array.isArray(body) ? body : [body];
        const cols = [...new Set(rowsIn.flatMap((r) => Object.keys(r)))];
        const pf = prefer(req);
        const wantRep = pf.has('return=representation');
        const onConflict = sp.get('on_conflict');
        let conflict = '';
        if (pf.has('resolution=ignore-duplicates')) conflict = onConflict ? ` ON CONFLICT (${onConflict.split(',').map(ident).join(',')}) DO NOTHING` : ' ON CONFLICT DO NOTHING';
        else if (pf.has('resolution=merge-duplicates')) {
          const target = onConflict ? onConflict.split(',').map(ident).join(',') : '';
          conflict = ` ON CONFLICT (${target}) DO UPDATE SET ${cols.map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`).join(', ')}`;
        }
        const colList = cols.map(ident).join(', ');
        const ins = `INSERT INTO ${table} (${colList}) SELECT ${colList} FROM json_populate_recordset(null::${table}, $1::json)${conflict} RETURNING *`;
        const out = await withRole(auth, async (c) => {
          if (!wantRep) { await c.query(ins.replace(' RETURNING *', ''), [JSON.stringify(rowsIn)]); return null; }
          const r = await c.query(`WITH m AS (${ins}) SELECT coalesce(json_agg(r), '[]'::json) AS j FROM (SELECT ${selectList(name, 't', items)} FROM m t) r`, [JSON.stringify(rowsIn)]);
          return r.rows[0].j;
        });
        if (out === null) return send(res, 201, '');
        return respondRows(res, req, out, 201);
      }

      // ---- UPDATE ----
      if (req.method === 'PATCH') {
        const body = await readJson(req);
        const cols = Object.keys(body);
        const values = [JSON.stringify(body)];
        const w = where(sp, 't', values);
        const set = cols.map((c) => `${ident(c)} = r.${ident(c)}`).join(', ');
        const upd = `UPDATE ${table} t SET ${set} FROM json_populate_record(null::${table}, $1::json) r${w} RETURNING t.*`;
        const wantRep = prefer(req).has('return=representation');
        const out = await withRole(auth, async (c) => {
          if (!wantRep) { await c.query(upd.replace(' RETURNING t.*', ''), values); return null; }
          const r = await c.query(`WITH m AS (${upd}) SELECT coalesce(json_agg(r), '[]'::json) AS j FROM (SELECT ${selectList(name, 't', items)} FROM m t) r`, values);
          return r.rows[0].j;
        });
        if (out === null) return send(res, 204, '');
        return respondRows(res, req, out, 200);
      }

      // ---- DELETE ----
      if (req.method === 'DELETE') {
        const values = [];
        const w = where(sp, 't', values);
        const del = `DELETE FROM ${table} t${w} RETURNING t.*`;
        const wantRep = prefer(req).has('return=representation');
        const out = await withRole(auth, async (c) => {
          if (!wantRep) { await c.query(del.replace(' RETURNING t.*', ''), values); return null; }
          const r = await c.query(`WITH m AS (${del}) SELECT coalesce(json_agg(r), '[]'::json) AS j FROM (SELECT ${selectList(name, 't', items)} FROM m t) r`, values);
          return r.rows[0].j;
        });
        if (out === null) return send(res, 204, '');
        return respondRows(res, req, out, 200);
      }
      return send(res, 405, { message: 'Method not allowed' });
    } catch (e) {
      return pgError(res, e, auth);
    }
  }

  // ------------------------------------------------------------------- Auth
  const sign = (claims, ttl) => new SignJWT(claims).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) + ttl).sign(secret);
  const userJson = (u, meta) => ({
    id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at, phone: '',
    confirmed_at: u.created_at, last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: meta ?? u.raw_user_meta_data ?? {},
    identities: [{ identity_id: u.id, id: u.id, user_id: u.id, provider: 'email', identity_data: { sub: u.id, email: u.email }, created_at: u.created_at, updated_at: u.created_at }],
    created_at: u.created_at, updated_at: u.created_at, is_anonymous: false,
  });
  async function sessionFor(u) {
    const ttl = 3600;
    const access = await sign({ aud: 'authenticated', role: 'authenticated', sub: u.id, email: u.email, phone: '', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: u.raw_user_meta_data ?? {}, aal: 'aal1', amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }], session_id: randomUUID(), is_anonymous: false }, ttl);
    const refresh = randomBytes(12).toString('hex');
    refreshTokens.set(refresh, u.id);
    return { access_token: access, token_type: 'bearer', expires_in: ttl, expires_at: Math.floor(Date.now() / 1000) + ttl, refresh_token: refresh, user: userJson(u) };
  }
  const getUserById = async (id) => (await pool.query(`select id, email, raw_user_meta_data, created_at from auth.users where id = $1`, [id])).rows[0];
  const authErr = (res, status, code, msg) => send(res, status, { code: status, error_code: code, msg });

  async function handleAuth(req, res, url) {
    const path = url.pathname.replace(/^\/auth\/v1/, '');
    if (path === '/settings') return send(res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: autoconfirm });
    if (path === '/.well-known/jwks.json') return send(res, 200, { keys: [] });

    if (path === '/signup' && req.method === 'POST') {
      const b = await readJson(req);
      const email = String(b.email ?? '').toLowerCase();
      if (!email || String(b.password ?? '').length < 6) return authErr(res, 422, 'weak_password', 'Password should be at least 6 characters.');
      const exists = (await pool.query(`select 1 from auth.users where email = $1`, [email])).rowCount;
      if (exists) return authErr(res, 422, 'user_already_exists', 'User already registered');
      const id = randomUUID();
      await pool.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, email, JSON.stringify(b.data ?? {})]);
      await pool.query(`insert into public.mock_passwords (user_id, password) values ($1, $2)`, [id, b.password]);
      const u = await getUserById(id);
      if (autoconfirm) return send(res, 200, await sessionFor(u));
      const code = randomBytes(8).toString('hex');
      pkceCodes.set(code, id);
      outbox.push({ to: email, kind: 'confirm', link: `${url.searchParams.get('redirect_to') ?? origin}?code=${code}` });
      return send(res, 200, userJson(u));
    }

    if (path === '/token' && req.method === 'POST') {
      const grant = url.searchParams.get('grant_type');
      const b = await readJson(req);
      if (grant === 'password') {
        const row = (await pool.query(`select u.id, u.email, u.raw_user_meta_data, u.created_at, p.password from auth.users u join public.mock_passwords p on p.user_id = u.id where u.email = $1`, [String(b.email ?? '').toLowerCase()])).rows[0];
        if (!row || row.password !== b.password) return authErr(res, 400, 'invalid_credentials', 'Invalid login credentials');
        return send(res, 200, await sessionFor(row));
      }
      if (grant === 'refresh_token') {
        const id = refreshTokens.get(b.refresh_token);
        if (!id) return authErr(res, 400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
        refreshTokens.delete(b.refresh_token);
        return send(res, 200, await sessionFor(await getUserById(id)));
      }
      if (grant === 'pkce') {
        const id = pkceCodes.get(b.auth_code);
        if (!id) return authErr(res, 400, 'flow_state_not_found', 'invalid flow state, no valid flow state found');
        pkceCodes.delete(b.auth_code);
        return send(res, 200, await sessionFor(await getUserById(id)));
      }
      return authErr(res, 400, 'unsupported_grant_type', 'Unsupported grant type');
    }

    if (path === '/user') {
      let auth;
      try { auth = await claimsFrom(req); } catch { return authErr(res, 401, 'bad_jwt', 'invalid JWT'); }
      if (!auth.claims.sub) return authErr(res, 401, 'no_authorization', 'This endpoint requires a Bearer token');
      const u = await getUserById(auth.claims.sub);
      if (!u) return authErr(res, 403, 'user_not_found', 'User from sub claim in JWT does not exist');
      if (req.method === 'GET') return send(res, 200, userJson(u));
      if (req.method === 'PUT') {
        const b = await readJson(req);
        if (b.password) await pool.query(`update public.mock_passwords set password = $2 where user_id = $1`, [u.id, b.password]);
        return send(res, 200, userJson(u));
      }
    }

    if (path === '/logout') return send(res, 204, '');

    if (path === '/recover' && req.method === 'POST') {
      const b = await readJson(req);
      const u = (await pool.query(`select id from auth.users where email = $1`, [String(b.email ?? '').toLowerCase()])).rows[0];
      if (u) {
        const code = randomBytes(8).toString('hex');
        pkceCodes.set(code, u.id);
        outbox.push({ to: b.email, kind: 'recovery', link: `${url.searchParams.get('redirect_to')}${(url.searchParams.get('redirect_to') ?? '').includes('?') ? '&' : '?'}code=${code}` });
      }
      return send(res, 200, {});
    }
    return send(res, 404, { msg: `auth route not mocked: ${req.method} ${path}` });
  }

  // ---------------------------------------------------------------- Storage
  const filePath = (bucket, name) => join(storageDir, bucket, ...name.split('/'));
  async function handleStorage(req, res, url) {
    const path = decodeURIComponent(url.pathname.replace(/^\/storage\/v1/, ''));

    // public objects
    let m = path.match(/^\/object\/public\/([^/]+)\/(.+)$/);
    if (m && req.method === 'GET') {
      const bucket = (await pool.query(`select public from storage.buckets where id = $1`, [m[1]])).rows[0];
      const fp = filePath(m[1], m[2]);
      if (!bucket?.public || !existsSync(fp)) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      return send(res, 200, readFileSync(fp), { 'Content-Type': mimeOf(m[2]), 'Cache-Control': 'public, max-age=3600' });
    }

    // signed object download
    m = path.match(/^\/object\/sign\/([^/]+)\/(.+)$/);
    if (m && req.method === 'GET') {
      try {
        const { payload } = await jwtVerify(url.searchParams.get('token') ?? '', secret, { algorithms: ['HS256'] });
        if (payload.url !== `${m[1]}/${m[2]}`) throw new Error('mismatch');
      } catch { return send(res, 400, { statusCode: '400', error: 'InvalidJWT', message: 'jwt expired or invalid' }); }
      const fp = filePath(m[1], m[2]);
      if (!existsSync(fp)) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      const dl = url.searchParams.get('download');
      return send(res, 200, readFileSync(fp), {
        'Content-Type': mimeOf(m[2]), 'Cache-Control': 'private, max-age=0',
        ...(dl !== null ? { 'Content-Disposition': `attachment; filename="${dl || m[2].split('/').pop()}"` } : {}),
      });
    }

    let auth;
    try { auth = await claimsFrom(req); } catch { return send(res, 401, { statusCode: '401', error: 'Unauthorized', message: 'Invalid JWT' }); }

    // create signed url
    m = path.match(/^\/object\/sign\/([^/]+)\/(.+)$/);
    if (m && req.method === 'POST') {
      const b = await readJson(req);
      const visible = await withRole(auth, async (c) => (await c.query(`select 1 from storage.objects where bucket_id = $1 and name = $2`, [m[1], m[2]])).rowCount);
      if (!visible || !existsSync(filePath(m[1], m[2]))) return send(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      const token = await sign({ url: `${m[1]}/${m[2]}` }, Number(b.expiresIn ?? 60));
      return send(res, 200, { signedURL: `/object/sign/${m[1]}/${m[2]}?token=${token}` });
    }

    // list
    m = path.match(/^\/object\/list\/([^/]+)$/);
    if (m && req.method === 'POST') {
      const b = await readJson(req);
      const prefix = b.prefix ? `${String(b.prefix).replace(/\/$/, '')}/` : '';
      const rows = await withRole(auth, async (c) => (await c.query(`select name from storage.objects where bucket_id = $1 and name like $2 and ($3 = '' or name ilike $4)`, [m[1], `${prefix.replace(/[\\%_]/g, '\\$&')}%`, b.search ?? '', `%${String(b.search ?? '').replace(/[\\%_]/g, '\\$&')}%`])).rows);
      return send(res, 200, rows.map((r) => ({ name: r.name.slice(prefix.length), id: r.name, metadata: {} })));
    }

    // bulk remove
    m = path.match(/^\/object\/([^/]+)$/);
    if (m && req.method === 'DELETE') {
      const b = await readJson(req);
      const removed = await withRole(auth, async (c) => (await c.query(`delete from storage.objects where bucket_id = $1 and name = any($2) returning name`, [m[1], b.prefixes ?? []])).rows);
      for (const r of removed) rmSync(filePath(m[1], r.name), { force: true });
      return send(res, 200, removed.map((r) => ({ name: r.name, bucket_id: m[1] })));
    }

    // upload
    m = path.match(/^\/object\/([^/]+)\/(.+)$/);
    if (m && (req.method === 'POST' || req.method === 'PUT')) {
      const [bucketId, name] = [m[1], m[2]];
      const bucket = (await pool.query(`select * from storage.buckets where id = $1`, [bucketId])).rows[0];
      if (!bucket) return send(res, 404, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
      let data; let mime = String(req.headers['content-type'] ?? '');
      if (mime.startsWith('multipart/form-data')) {
        const web = new Request('http://local/upload', { method: 'POST', headers: { 'content-type': mime }, body: Readable.toWeb(Readable.from([await readBody(req)])), duplex: 'half' });
        const fd = await web.formData();
        const file = [...fd.values()].find((v) => typeof v !== 'string');
        if (!file) return send(res, 400, { statusCode: '400', error: 'invalid', message: 'no file' });
        data = Buffer.from(await file.arrayBuffer()); mime = file.type;
      } else data = await readBody(req);
      if (bucket.file_size_limit && data.length > Number(bucket.file_size_limit)) return send(res, 413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
      if (bucket.allowed_mime_types && !bucket.allowed_mime_types.includes(mime.split(';')[0])) return send(res, 415, { statusCode: '415', error: 'invalid_mime_type', message: `mime type ${mime} is not supported` });
      try {
        await withRole(auth, async (c) => {
          await c.query(`insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)`, [bucketId, name, auth.claims.sub ?? null]);
        });
      } catch (e) {
        if (e.code === '42501') return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
        if (e.code === '23505') return send(res, 409, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' });
        throw e;
      }
      mkdirSync(dirname(filePath(bucketId, name)), { recursive: true });
      writeFileSync(filePath(bucketId, name), data);
      return send(res, 200, { Id: randomUUID(), Key: `${bucketId}/${name}` });
    }
    return send(res, 404, { message: `storage route not mocked: ${req.method} ${path}` });
  }

  const mimeOf = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ({ pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', txt: 'text/plain' })[ext] ?? 'application/octet-stream';
  };

  // ------------------------------------------------------------------ server
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '');
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith('/rest/v1/')) return await handleRest(req, res, url);
      if (url.pathname.startsWith('/auth/v1/')) return await handleAuth(req, res, url);
      if (url.pathname.startsWith('/storage/v1/')) return await handleStorage(req, res, url);
      if (url.pathname === '/__mock/emails') return send(res, 200, outbox);
      return send(res, 404, { message: 'not found' });
    } catch (e) {
      console.error('[gateway] fatal', e);
      return send(res, 500, { message: String(e.message) });
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));

  // Deterministic so a production build can embed it (NEXT_PUBLIC_* is inlined at build time).
  const anonKey = await new SignJWT({ role: 'anon', iss: 'zetora-e2e' }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuedAt(1700000000).setExpirationTime(4102444800).sign(secret);
  return {
    url: origin, anonKey, outbox, pool, storageDir,
    async close() { await new Promise((r) => server.close(r)); await pool.end(); },
  };
}

