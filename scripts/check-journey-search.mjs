import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = fs.readFileSync('lib/filter-content.ts', 'utf8');
const exports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
const { filterContent } = exports;
const threads = [
  { title: 'First thread to test', description: 'Cooking experiments', category: 'Food' },
  { title: 'Weekend notes', description: 'Sports and running', category: 'Fitness' },
];
const fields = item => [item.title, item.description, item.category];
assert.deepEqual(filterContent(threads, 'FIRST', fields).map(item => item.title), ['First thread to test']);
assert.deepEqual(filterContent(threads, 'cooking', fields).map(item => item.title), ['First thread to test']);
assert.deepEqual(filterContent(threads, 'FOOD', fields).map(item => item.title), ['First thread to test']);
assert.equal(filterContent(threads, 'missing', fields).length, 0);
assert.equal(filterContent(threads, '  ', fields).length, 2);
const cooking = [{ title: 'Ramen', description: 'Broth and noodles', thread_id: 'cooking' }];
const sports = [{ title: 'Ramen challenge', description: 'Run', thread_id: 'sports' }];
assert.deepEqual(filterContent(cooking, 'RAM', item => [item.title, item.description]).map(item => item.title), ['Ramen']);
assert.equal(filterContent(cooking, 'sports', item => [item.title, item.description]).length, 0);
assert.equal(sports.length, 1);
console.log('PASS: shared case-insensitive title/description/category search, empty reset, zero result and scoped subthread datasets.');
