import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildImportPlan, groupAssets, planUpserts } from '../scripts/import-gallery.mjs';

const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-gallery-test-'));
for (let stone = 1; stone <= 28; stone += 1) {
  const count = stone === 19 ? 2 : 3;
  for (let view = 1; view <= count; view += 1) fs.writeFileSync(path.join(source, `Stone${stone}-${String(view).padStart(3, '0')}.jpg`), 'fixture');
}

test('groups source images naturally and maps the first 28 lots in order', () => {
  const { groups, unmatched } = groupAssets(source);
  const plan = buildImportPlan(groups);
  assert.equal(unmatched.length, 0);
  assert.equal(plan.length, 28);
  assert.equal(plan[0].primaryImage, 'Stone1-001.jpg');
  assert.deepEqual(plan[0].alternateImages, ['Stone1-002.jpg', 'Stone1-003.jpg']);
  assert.equal(plan[9].primaryImage, 'Stone10-001.jpg');
});

test('one, two, and three-image limits preserve same-lot membership', () => {
  const { groups } = groupAssets(source);
  const plan = buildImportPlan(groups);
  const stone19 = plan[18];
  assert.equal(stone19.alternateImages.length, 1);
  for (const record of plan) {
    assert.ok([record.primaryImage, ...record.alternateImages].every(file => !file || file.toLowerCase().startsWith(`stone${record.number}-`)));
    assert.ok(record.alternateImages.length <= 2);
  }
});

test('idempotent upsert planner updates known SKUs and inserts new SKUs', () => {
  const plan = [{ sku: 'AGF-GAL-001' }, { sku: 'AGF-GAL-002' }];
  assert.deepEqual(planUpserts(new Set(['AGF-GAL-001']), plan), [
    { action: 'update', sku: 'AGF-GAL-001' },
    { action: 'insert', sku: 'AGF-GAL-002' },
  ]);
});
