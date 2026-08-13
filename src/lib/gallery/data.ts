import { createClient } from '@supabase/supabase-js';
import manifest from '../../../data/gallery-import-manifest.json';
import { hasSupabaseConfig, getPublicSupabaseConfig } from '@/lib/supabase/config';
import type { GalleryStone } from './types';

type Row = Record<string, any>;

export function mapGalleryRow(row: Row): GalleryStone {
  const images = [...(row.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: row.id, sku: row.sku, title: row.title, slug: row.slug,
    family: row.gemstone_family || row.category, origin: row.origin || 'Not supplied',
    originLocality: row.origin_locality || '', publicWeight: row.public_weight_label || 'Weight on request',
    description: row.description || '', educationalNote: row.educational_note || '', form: row.form || 'Not supplied',
    colour: row.colour || 'Not supplied', status: row.status === 'sold' ? 'sold' : 'available', position: row.position,
    images: images.map((image: Row) => ({ id: image.id, storageKey: image.storage_key, url: image.url, width: image.width, height: image.height, mimeType: image.mime_type, alt: image.alt_text, sortOrder: image.sort_order, isPrimary: image.is_primary })),
  };
}

function localPreview(): GalleryStone[] {
  return manifest.records.map(record => ({
    id: record.sku, sku: record.sku, title: record.title, slug: record.slug, family: record.family,
    origin: record.origin || 'Not supplied', originLocality: '', publicWeight: record.publicWeight,
    description: '', educationalNote: '', form: 'Not supplied', colour: 'Not supplied', status: 'available', position: record.number - 1,
    images: [record.primaryImage, ...record.alternateImages].filter(Boolean).map((file, index) => ({ id: `${record.sku}-${index}`, storageKey: file!, url: `/AGF/${file}`, width: 1920, height: 1080, mimeType: 'image/jpeg', alt: `${record.title}, view ${index + 1}`, sortOrder: index, isPrimary: index === 0 })),
  }));
}

export async function getGalleryStones(): Promise<GalleryStone[]> {
  if (!hasSupabaseConfig()) return localPreview();
  const { url, key } = getPublicSupabaseConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const result = await supabase.from('listings').select('id,sku,title,slug,category,gemstone_family,origin,origin_locality,public_weight_label,description,educational_note,form,colour,status,position,listing_images(*)').eq('publish_state', 'published').in('status', ['available', 'sold']).order('position');
  if (result.error) {
    if (process.env.NODE_ENV !== 'production') console.warn('Gallery CMS schema is not applied; using local review manifest.', result.error.message);
    return localPreview();
  }
  return (result.data ?? []).map(mapGalleryRow).filter(stone => stone.images.length > 0);
}
