import type { GalleryStone } from './types';

export function getRelatedAvailableStones(
  stones: GalleryStone[],
  selected: GalleryStone,
  limit = 4,
) {
  const available = stones.filter(
    (stone) => stone.id !== selected.id && stone.status === 'available',
  );
  const sameFamily = available.filter((stone) => stone.family === selected.family);
  const otherFamilies = available.filter((stone) => stone.family !== selected.family);
  return [...sameFamily, ...otherFamilies].slice(0, limit);
}
