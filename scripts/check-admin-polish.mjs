/* eslint-disable react-hooks/rules-of-hooks -- this is a Node test harness; useDb is not a React hook. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, imports = {}, env = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, process: { env }, Request, Response, URL, console,
    require: name => name in imports ? imports[name] : require(name),
  }, { filename: file });
  return exports;
}
const http = { readJsonObject: async request => request.json() };
const server = { NextResponse: { json: (value, init) => Response.json(value, init) } };
const content = load('lib/content.ts');
const about = load('lib/about.ts', { './content': content });
const projects = load('lib/projects.ts', { './content': content });
const id = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const request = (body, method = 'POST', origin = 'http://localhost') => new Request('http://localhost/api/admin/projects', {
  method, headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body),
});
const plain = value => JSON.parse(JSON.stringify(value));

// A query recorder catches broad deletes and non-minimal keep-alive reads.
function database(responses) {
  const calls = [];
  return {
    calls,
    from(table) {
      const call = { table, operations: [] };
      calls.push(call);
      const chain = new Proxy({}, { get(_, key) {
        if (key === 'then') return (resolve, reject) => {
          assert.ok(responses.length, `Unexpected query on ${table}`);
          return Promise.resolve(responses.shift()).then(resolve, reject);
        };
        return (...args) => { call.operations.push([key, ...args]); return chain; };
      } });
      return chain;
    },
  };
}

const section = { id: `new-${id}`, label: ' Profile ', heading: ' Heading ', body: ' Body ',
  media_reference: '/portrait.jpg', media_alt: 'Portrait', media_position: 'left', media_shape: 'portrait', meta: 'Engineer' };
const prepared = about.prepareAboutSections([section]);
assert.equal(prepared[0].id, id);
assert.equal(prepared[0].heading, 'Heading');
assert.equal(prepared[0].media_reference, '/portrait.jpg');
assert.throws(() => about.prepareAboutSections([section, section]));
assert.throws(() => about.prepareAboutSections([null]));
assert.throws(() => about.prepareAboutSections([{ ...section, media_reference: 'javascript:alert(1)' }]));
const original = { intro: 'Original', sections: [], updatedAt: '2026-01-01' };
let state = { current: original, saved: original };
state = about.aboutEditorReducer(state, { type: 'edit', current: { ...original, intro: ' New intro ', sections: [section] } });
assert.equal(about.aboutIsDirty(state), true);
const saved = { intro: 'New intro', sections: prepared, updatedAt: '2026-02-01' };
state = about.aboutEditorReducer(state, { type: 'saved', snapshot: saved });
assert.equal(about.aboutIsDirty(state), false);
assert.equal(state.current.intro, 'New intro');
assert.equal(state.current.sections[0].id, id);
assert.equal(state.current.sections[0].media_reference, '/portrait.jpg');
state = about.aboutEditorReducer(state, { type: 'received', snapshot: original });
assert.equal(state.current.intro, 'New intro');
state = about.aboutEditorReducer(state, { type: 'edit', current: { ...saved, intro: 'Unsaved' } });
state = about.aboutEditorReducer(state, { type: 'received', snapshot: { ...saved, intro: 'Other tab', updatedAt: '2026-03-01' } });
assert.equal(state.current.intro, 'Unsaved');
state = about.aboutEditorReducer(state, { type: 'reset' });
assert.equal(state.current.intro, 'New intro');
assert.equal(about.aboutIsDirty(state), false);
state = about.aboutEditorReducer(state, { type: 'received', snapshot: { ...saved, intro: 'Fresh server content', updatedAt: '2026-03-01' } });
assert.equal(state.current.intro, 'Fresh server content');

let db = database([]);
let authResult = { supabase: db, user: { id } };
const invalidated = [];
const auth = { authorizeAdmin: async () => authResult, sameOrigin: r => r.headers.get('origin') === 'http://localhost' };
const imports = { 'next/server': server, 'next/cache': { revalidatePath: (...args) => invalidated.push(args) },
  '@/lib/admin-auth': auth, '@/lib/http': http, '@/lib/content': content, '@/lib/projects': projects, '@/lib/about': about };
const projectRoute = load('app/api/admin/projects/route.ts', imports);
assert.equal((await projectRoute.DELETE(request({ id, confirmTitle: 'Project' }, 'DELETE', 'https://attacker.example'))).status, 403);
for (const status of [401, 403]) {
  authResult = { error: 'Authentication required', status };
  assert.equal((await projectRoute.DELETE(request({ id, confirmTitle: 'Project' }, 'DELETE'))).status, status);
}
const useDb = responses => { db = database(responses); authResult = { supabase: db, user: { id } }; };
useDb([]);
assert.equal((await projectRoute.DELETE(request({ id: 'invalid', confirmTitle: 'Project' }, 'DELETE'))).status, 400);
assert.equal(db.calls.length, 0);
for (const [row, expected] of [[{ data: null, error: {} }, 503], [{ data: null, error: null }, 404], [{ data: { title: 'Changed', slug: 'project' }, error: null }, 409]]) {
  useDb([row]);
  assert.equal((await projectRoute.DELETE(request({ id, confirmTitle: 'Project' }, 'DELETE'))).status, expected);
  assert.equal(db.calls.length, 1);
}
for (const [result, expected] of [[{ data: { id }, error: null }, 200], [{ data: null, error: null }, 409], [{ data: null, error: {} }, 503]]) {
  useDb([{ data: { title: 'Project', slug: 'project' }, error: null }, result]);
  assert.equal((await projectRoute.DELETE(request({ id, confirmTitle: 'Project' }, 'DELETE'))).status, expected);
  assert.equal(db.calls.length, 2);
  assert.deepEqual(plain(db.calls[1]), { table: 'threads', operations: [ ['delete'], ['eq', 'id', id], ['eq', 'destination', 'projects'], ['eq', 'title', 'Project'], ['select', 'id'], ['maybeSingle'] ] });
}
assert.ok(invalidated.some(args => args[0] === '/projects/project' && args[1] === 'layout'));
for (const existingId of ['', id]) {
  useDb([{ data: { id, slug: 'project' }, error: null }, { error: null }]);
  const response = await projectRoute.POST(request({ id: existingId, title: 'Project', slug: 'project', status: 'draft', blocks: [], progress: '', coverPositionX: 50, coverPositionY: 50 }));
  assert.equal(response.status, 200);
  assert.equal(db.calls[0].operations[0][0], existingId ? 'update' : 'insert');
}

const contentRoute = load('app/api/admin/content/route.ts', imports);
let rpcCalls = [];
authResult = { user: { id }, supabase: { rpc: async (...args) => {
  rpcCalls.push(args);
  return { data: { record: { intro: 'Saved intro', updated_at: '2026-02-01' }, sections: prepared }, error: null };
} } };
assert.equal((await contentRoute.POST(request({ kind: 'about', intro: 'Saved intro', sections: [null] }))).status, 400);
assert.equal(rpcCalls.length, 0);
const aboutResponse = await contentRoute.POST(request({ kind: 'about', intro: ' Saved intro ', sections: [section] }));
assert.equal(aboutResponse.status, 200);
assert.deepEqual(await aboutResponse.json(), { ok: true, record: { intro: 'Saved intro', updated_at: '2026-02-01' }, sections: plain(prepared) });
assert.deepEqual(plain(rpcCalls), [['save_about', { p_intro: 'Saved intro', p_sections: plain(prepared) }]]);
authResult.supabase.rpc = async () => ({ error: { message: 'internal SQL details' } });
assert.equal((await contentRoute.POST(request({ kind: 'about', intro: 'Saved intro', sections: [] }))).status, 503);

const env = {};
const keepalive = load('app/api/internal/supabase-keepalive/route.ts', {
  'next/server': server, '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
}, env);
const healthRequest = token => new Request('http://localhost/api/internal/supabase-keepalive', { headers: token ? { Authorization: token } : {} });
assert.equal((await keepalive.GET(healthRequest())).status, 503);
env.KEEPALIVE_SECRET = 'test-only-secret';
for (const token of [undefined, 'Bearer wrong', 'Basic test-only-secret', 'Bearer test-only-secret-extra']) {
  assert.equal((await keepalive.GET(healthRequest(token))).status, 401);
}
db = database([{ data: [{ id: 1 }], error: null }]);
const health = await keepalive.GET(healthRequest('Bearer test-only-secret'));
assert.equal(health.status, 200);
assert.equal(health.headers.get('cache-control'), 'private, no-store');
assert.deepEqual(await health.json(), { ok: true });
assert.deepEqual(plain(db.calls), [{ table: 'about_content', operations: [['select', 'id'], ['limit', 1]] }]);
db = database([{ error: { message: 'secret internal failure' } }]);
const failedHealth = await keepalive.GET(healthRequest('Bearer test-only-secret'));
assert.equal(failedHealth.status, 503);
assert.deepEqual(await failedHealth.json(), { ok: false });

console.log('PASS: About canonical state/IDs/media/reset/refresh; validation before writes; project create/edit and title-confirmed, scoped deletion/error races; keep-alive auth/minimal query/no leaked content. Supabase mocked; no production mutations.');
