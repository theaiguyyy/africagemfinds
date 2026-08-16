import assert from 'node:assert/strict';
import test from 'node:test';
import { getRelatedAvailableStones } from '../src/lib/gallery/recommendations.ts';

const stone = (id, family, status = 'available') => ({ id, family, status });

test('related gallery stones prioritize available stones from the same family', () => {
  const selected = stone('selected', 'Aquamarine');
  const result = getRelatedAvailableStones([
    selected,
    stone('tourmaline', 'Tourmaline'),
    stone('aquamarine-sold', 'Aquamarine', 'sold'),
    stone('aquamarine-1', 'Aquamarine'),
    stone('beryl', 'Beryl'),
    stone('aquamarine-2', 'Aquamarine'),
  ], selected, 4);

  assert.deepEqual(result.map((item) => item.id), [
    'aquamarine-1',
    'aquamarine-2',
    'tourmaline',
    'beryl',
  ]);
  assert.ok(result.every((item) => item.status === 'available'));
});

test('related gallery stones fall back to other available families', () => {
  const selected = stone('selected', 'Morganite');
  const result = getRelatedAvailableStones([
    selected,
    stone('sold-morganite', 'Morganite', 'sold'),
    stone('beryl', 'Beryl'),
    stone('tourmaline', 'Tourmaline'),
  ], selected);

  assert.deepEqual(result.map((item) => item.id), ['beryl', 'tourmaline']);
});
