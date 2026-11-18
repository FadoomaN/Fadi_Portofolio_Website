// Optional isolated database check: npm install --prefix work/qa @electric-sql/pglite
// No live Supabase connection or credentials are used.
import { PGlite } from '../work/qa/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
const sql = name => fs.readFile(`supabase/migrations/${name}`, 'utf8');
const tableDefinition = (source, table) => source.match(new RegExp(`create table(?: if not exists)? public\\.${table} \\([\\s\\S]*?\\n\\);`, 'i'))?.[0];
await db.exec(`
  create role anon;
  create role authenticated;
  create schema auth;
  create function auth.jwt() returns jsonb language sql as $$ select jsonb_build_object('aal', current_setting('test.aal')) $$;
  create function public.is_admin() returns boolean language sql as $$ select current_setting('test.admin') = 'true' $$;
  create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = clock_timestamp(); return new; end $$;
  set test.aal = 'aal2'; set test.admin = 'true';
  create table public.threads (id uuid primary key default gen_random_uuid(), destination text, status text);
`);
await db.exec(tableDefinition(await sql('20260914_admin_site_structure.sql'), 'about_content'));
await db.exec(tableDefinition(await sql('20260916_database_first_media.sql'), 'about_sections'));
await db.exec(`create trigger about_content_set_updated_at before update on public.about_content for each row execute function public.set_updated_at();
  create trigger about_sections_set_updated_at before update on public.about_sections for each row execute function public.set_updated_at();
  insert into public.about_content(id, title, intro) values (1, 'ABOUT ME', 'Original intro');`);
await db.exec(await sql('20261118090000_atomic_about_save.sql'));
const id = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const section = { id, label: 'Education', heading: 'Engineering', body: 'Saved body',
  media_reference: '/portrait.jpg', media_alt: 'Portrait', media_position: 'left', media_shape: 'portrait', meta: 'Engineer' };
const save = async (intro, sections) => (await db.query('select public.save_about($1, $2::jsonb) as saved', [intro, sections === null ? null : JSON.stringify(sections)])).rows[0].saved;
const first = await save('  Saved intro  ', [section]);
assert.equal(first.record.intro, 'Saved intro');
assert.equal(first.sections[0].id, id);
assert.equal(first.sections[0].media_reference, '/portrait.jpg');
const edited = await save('Second intro', [{ ...section, heading: 'Updated heading' }, { ...section, id: otherId }]);
assert.equal(edited.sections.length, 2);
assert.equal(edited.sections[0].heading, 'Updated heading');
assert.deepEqual(edited.sections.map(s => s.sort_order), [0, 1]);
await assert.rejects(save('Must roll back', [{ ...section, body: 'Must roll back' }, { ...section, id: otherId, media_shape: 'invalid' }]));
const unchanged = await db.query('select intro from public.about_content where id = 1');
assert.equal(unchanged.rows[0].intro, 'Second intro');
assert.equal((await db.query('select body from public.about_sections where id = $1', [id])).rows[0].body, 'Saved body');
assert.equal((await save('Intro only', null)).sections.length, 2);
assert.equal((await save('Removed one', [section])).sections.length, 1);
assert.equal((await save('Removed all', [])).sections.length, 0);
for (const settings of ["set test.aal = 'aal1'", "set test.aal = 'aal2'; set test.admin = 'false'"]) {
  await db.exec(settings);
  await assert.rejects(save('Unauthorized', [section]));
}
await db.exec("set test.admin = 'true'");
for (const migration of ['20260920100000_projects_workspace.sql', '20260920110000_project_dev_logs.sql', '20260921150000_project_devlog_blocks.sql']) await db.exec(await sql(migration));
await db.query("insert into public.threads(id,destination,status) values ($1,'projects','published'),($2,'projects','draft')", [id, otherId]);
await db.query("insert into public.project_blocks(project_id,type) values ($1,'text'),($2,'text')", [id, otherId]);
const log = (await db.query("insert into public.project_dev_logs(project_id,title,slug) values ($1,'Test log','test-log') returning id", [id])).rows[0];
await db.query("insert into public.project_devlog_blocks(devlog_id,type,sort_order) values ($1,'text',0)", [log.id]);
await db.query('delete from public.threads where id = $1', [id]);
assert.equal((await db.query('select * from public.project_dev_logs')).rows.length, 0);
assert.equal((await db.query('select * from public.project_devlog_blocks')).rows.length, 0);
assert.deepEqual((await db.query('select project_id from public.project_blocks')).rows, [{ project_id: otherId }]);
await db.close();
console.log('PASS: PostgreSQL About create/edit/IDs/media/removals/rollback/MFA gates and actual project→devlog→block cascades. Isolated PGlite; production untouched.');
