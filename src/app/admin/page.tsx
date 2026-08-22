'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { storageVariant } from '@/lib/gallery/images';
import styles from './admin.module.css';
import extra from './adminExtras.module.css';

type View = 'overview' | 'listings' | 'media' | 'categories' | 'blog' | 'inquiries';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  gemstone?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'closed';
  message: string;
  created_at?: string;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  status: 'available' | 'sold' | 'reserved';
  slug: string;
  weight?: string;
  origin?: string;
  origin_locality?: string;
  weight_value?: number | null;
  weight_unit?: 'g' | 'kg' | 'ct' | null;
  photo_url?: string;
  position: number;
  sku?: string;
  gemstone_family?: string;
  public_weight_label?: string;
  raw_source_weight_note?: string;
  publish_state?: 'draft' | 'published';
  description?: string;
  educational_note?: string;
  form?: string;
  colour?: string;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
}

interface ListingImage {
  id: string;
  listing_id: string;
  storage_key: string;
  source_filename: string;
  url: string;
  width: number;
  height: number;
  mime_type: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: string;
  weight: string;
  featured: boolean;
  position: number;
  storage_path: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  tag: string;
  excerpt: string;
  content: string;
  cover_url: string;
  published: boolean;
  published_at?: string;
  position: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState<View>('overview');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const [categoryRecords, setCategoryRecords] = useState<CategoryRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState<'owner' | 'staff'>('staff');
  const [mediaFilter, setMediaFilter] = useState('All');
  const [listingSearch, setListingSearch] = useState('');
  const [listingCategoryFilter, setListingCategoryFilter] = useState('All');
  const [listingPublishFilter, setListingPublishFilter] = useState('All');
  const [editingListing, setEditingListing] = useState<Partial<Listing> | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [saveNotice, setSaveNotice] = useState<{ type: 'saving' | 'saved' | 'error'; message: string } | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [uploadingListingImages, setUploadingListingImages] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ table: 'media' | 'listings' | 'blog_posts'; id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listingEditorRef = useRef<HTMLFormElement>(null);
  const blogEditorRef = useRef<HTMLFormElement>(null);

  // Auth guard
  useEffect(() => {
    const check = async () => {
      try {
        const { hasSupabaseConfig } = await import('@/lib/supabase/config');
        if (!hasSupabaseConfig()) { setChecking(false); router.replace('/admin/login'); return; }
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getClaims();
        const claims = data?.claims as { app_metadata?: { role?: string } } | undefined;
        const userRole = claims?.app_metadata?.role as 'owner' | 'staff' | undefined;
        if (error || !claims || !userRole || !['owner', 'staff'].includes(userRole)) {
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }
        setRole(userRole);
        setAuthed(true);
        setChecking(false);
      } catch {
        router.replace('/admin/login');
      }
    };
    check();
  }, [router]);

  // Load records in parallel; image bytes are deferred until their view is opened.
  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      setLoadingData(true);
      setDataError(null);
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const [inquiryResult, listingResult, mediaResult, blogResult, listingImageResult, categoryResult] = await Promise.all([
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('listings').select('*').order('position'),
        supabase.from('media').select('*').order('position'),
        supabase.from('blog_posts').select('*').order('position'),
        supabase.from('listing_images').select('*').order('sort_order'),
        supabase.from('categories').select('*').order('position'),
      ]);
      const failure = [inquiryResult, listingResult, mediaResult, blogResult, listingImageResult, categoryResult].find(result => result.error);
      if (failure?.error) {
        setDataError(failure.error.message);
        setLoadingData(false);
        return;
      }
      setInquiries((inquiryResult.data ?? []) as Inquiry[]);
      setListings(((listingResult.data ?? []) as Listing[]).map(item => item.category === 'Rubylite' ? { ...item, category: 'Rubellite' } : item));
      setMedia(((mediaResult.data ?? []) as MediaItem[]).map(item => item.category === 'Rubylite' ? { ...item, category: 'Rubellite' } : item));
      setBlogPosts((blogResult.data ?? []) as BlogPost[]);
      setListingImages((listingImageResult.data ?? []) as ListingImage[]);
      setCategoryRecords((categoryResult.data ?? []) as CategoryRecord[]);
      setLoadingData(false);
    };
    load();
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    let unsubscribe: (() => Promise<'ok' | 'timed out' | 'error'>) | undefined;
    import('@/lib/supabase/client').then(({ getSupabaseBrowserClient }) => {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase.channel('admin-inquiries').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, (payload: { new: Record<string, unknown> }) => {
        const inquiry = payload.new as unknown as Inquiry;
        setInquiries(current => [inquiry, ...current.filter(item => item.id !== inquiry.id)]);
      }).subscribe();
      unsubscribe = () => channel.unsubscribe();
    });
    return () => { if (unsubscribe) void unsubscribe(); };
  }, [authed]);

  const handleSignOut = async () => {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    await getSupabaseBrowserClient().auth.signOut();
    router.replace('/admin/login');
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      for (const [offset, file] of files.entries()) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const path = `gems/${mediaFilter === 'All' ? 'Unassigned' : mediaFilter}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('gem-photos').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('gem-photos').getPublicUrl(path);
        const item = { name: file.name, url: publicUrl.publicUrl, storage_path: path, category: mediaFilter === 'All' ? 'Unassigned' : mediaFilter, weight: '', featured: false, position: media.length + offset };
        const { data, error } = await supabase.from('media').insert(item).select().single();
        if (error) throw error;
        setMedia(current => [...current, data as MediaItem]);
      }
      notify('saved', `${files.length} photo${files.length === 1 ? '' : 's'} uploaded successfully.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fallbackCategories = ['Aquamarine', 'Tourmaline', 'Rubellite', 'Morganite', 'Spessartite Garnet', 'Beryl'];
  const categories = Array.from(new Set([
    ...categoryRecords.map(category => category.name === 'Rubylite' ? 'Rubellite' : category.name),
    ...fallbackCategories,
    ...listings.map(listing => listing.gemstone_family || listing.category).filter(Boolean),
  ])).filter(category => category !== 'Rubylite').sort((a, b) => a.localeCompare(b));
  const galleryListingIds = new Set(listingImages.map(image => image.listing_id));
  const galleryListings = listings.filter(listing => listing.sku?.startsWith('AGF-GAL-') || galleryListingIds.has(listing.id));
  const galleryRecordIds = new Set(galleryListings.map(listing => listing.id));
  const visibleGalleryListings = galleryListings.filter(listing => {
    const search = listingSearch.trim().toLowerCase();
    const family = listing.gemstone_family || listing.category;
    return (!search || [listing.title, listing.slug, listing.sku, listing.origin, family].some(value => value?.toLowerCase().includes(search)))
      && (listingCategoryFilter === 'All' || family === listingCategoryFilter)
      && (listingPublishFilter === 'All' || listing.publish_state === listingPublishFilter);
  });

  function notify(type: 'saving' | 'saved' | 'error', message: string) {
    setSaveNotice({ type, message });
    if (type !== 'saving') window.setTimeout(() => setSaveNotice(null), 3200);
  }

  function databaseErrorMessage(error: { code?: string; message: string }, subject: string) {
    if (error.code === '23505' && error.message.includes('listings_sku_unique')) return 'That reference / SKU is already used by another stone. Existing stone references are locked to prevent this conflict.';
    if (error.code === '23505' && error.message.includes('slug')) return 'That permanent page URL is already used by another stone. Choose a different URL.';
    return `${subject}: ${error.message}`;
  }

  async function nextGallerySku(supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseBrowserClient>) {
    const { data, error } = await supabase.from('listings').select('sku').like('sku', 'AGF-GAL-%');
    if (error) throw error;
    const nextNumber = Math.max(0, ...(data ?? []).map((item: { sku: string | null }) => Number(item.sku?.match(/AGF-GAL-(\d+)/)?.[1] || 0))) + 1;
    return `AGF-GAL-${String(nextNumber).padStart(3, '0')}`;
  }

  function openListingEditor(listing: Partial<Listing>) {
    if (!listing.id) {
      const nextNumber = Math.max(0, ...galleryListings.map(item => Number(item.sku?.match(/AGF-GAL-(\d+)/)?.[1] || 0))) + 1;
      const sku = `AGF-GAL-${String(nextNumber).padStart(3, '0')}`;
      setEditingListing({ ...listing, sku, gemstone_family: categories[0], category: categories[0], public_weight_label: 'Weight on request' });
    } else {
      setEditingListing(listing);
    }
    window.requestAnimationFrame(() => listingEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function openBlogEditor(post: Partial<BlogPost>) {
    setEditingPost(post);
    window.requestAnimationFrame(() => blogEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function persistAdminOrder(
    resource: 'media' | 'listings' | 'blog_posts' | 'listing_images',
    ordered: { id: string; position?: number; sort_order?: number }[],
  ): Promise<string | null> {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    const rpc = await supabase.rpc('reorder_admin_items', { resource_name: resource, ordered_ids: ordered.map(item => item.id) });
    if (!rpc.error) return null;

    // Safe compatibility path until the atomic reorder migration reaches the project.
    if (rpc.error.code !== 'PGRST202' && rpc.error.code !== '42883') return rpc.error.message;
    const field = resource === 'listing_images' ? 'sort_order' : 'position';
    const results = await Promise.all(ordered.map(item => supabase.from(resource).update({ [field]: item[field] }).eq('id', item.id)));
    return results.find(result => result.error)?.error?.message ?? null;
  }

  async function featureMedia(item: MediaItem) {
    if (item.category === 'Unassigned') { notify('error', 'Assign a gemstone category before setting a cover.'); return; }
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    notify('saving', `Saving ${item.category} cover…`);
    const { error: resetError } = await supabase.from('media').update({ featured: false }).eq('category', item.category).eq('featured', true);
    if (resetError) { notify('error', resetError.message); return; }
    const next = !item.featured;
    if (next) {
      const { error } = await supabase.from('media').update({ featured: true }).eq('id', item.id);
      if (error) { notify('error', error.message); return; }
    }
    setMedia(current => current.map(m => ({ ...m, featured: m.category === item.category ? (m.id === item.id && next) : m.featured })));
    notify('saved', next ? `${item.category} cover updated.` : `${item.category} cover removed.`);
  }

  async function updateMediaWeight(id: string, weight: string) {
    setMedia(current => current.map(item => item.id === id ? { ...item, weight } : item));
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    await getSupabaseBrowserClient().from('media').update({ weight }).eq('id', id);
  }

  async function saveListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    notify('saving', 'Saving listing…');
    const form = new FormData(event.currentTarget);
    const family = String(form.get('gemstone_family') || form.get('category') || '').trim();
    const weightValue = String(form.get('weight_value') || '').trim();
    const publicWeight = String(form.get('public_weight_label') || '').trim() || 'Weight on request';
    const payload = {
      title: String(form.get('title') || '').trim(),
      slug: String(form.get('slug') || '').trim(),
      sku: String(form.get('sku') || '').trim(),
      category: family,
      gemstone_family: family,
      origin: String(form.get('origin') || '').trim(),
      origin_locality: String(form.get('origin_locality') || '').trim(),
      weight_value: weightValue ? Number(weightValue) : null,
      weight_unit: String(form.get('weight_unit') || '') || null,
      weight: publicWeight,
      public_weight_label: publicWeight,
      raw_source_weight_note: String(form.get('raw_source_weight_note') || '').trim(),
      description: String(form.get('description') || '').trim(),
      educational_note: String(form.get('educational_note') || '').trim(),
      form: String(form.get('form') || '').trim(),
      colour: String(form.get('colour') || '').trim(),
      photo_url: String(form.get('photo_url') || '').trim(),
      status: form.get('status') === 'sold' ? 'sold' : 'available',
      publish_state: form.get('publish_state') === 'published' ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    };
    if (!payload.title || !payload.slug || !payload.sku || !family) { notify('error', 'Title, URL slug, reference, and gemstone category are required.'); return; }
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    const skuConflictQuery = supabase.from('listings').select('id').eq('sku', payload.sku);
    const slugConflictQuery = supabase.from('listings').select('id').eq('slug', payload.slug);
    if (editingListing?.id) {
      skuConflictQuery.neq('id', editingListing.id);
      slugConflictQuery.neq('id', editingListing.id);
    }
    const [skuConflict, slugConflict] = await Promise.all([skuConflictQuery.maybeSingle(), slugConflictQuery.maybeSingle()]);
    if (skuConflict.error) { notify('error', databaseErrorMessage(skuConflict.error, 'Could not validate the reference')); return; }
    if (slugConflict.error) { notify('error', databaseErrorMessage(slugConflict.error, 'Could not validate the page URL')); return; }
    if (skuConflict.data) { notify('error', 'That reference / SKU is already used by another stone.'); return; }
    if (slugConflict.data) { notify('error', 'That permanent page URL is already used by another stone.'); return; }
    const result = editingListing?.id
      ? await supabase.from('listings').update(payload).eq('id', editingListing.id).select().single()
      : await supabase.from('listings').insert({ ...payload, position: galleryListings.length }).select().single();
    if (result.error) { notify('error', databaseErrorMessage(result.error, 'Listing could not be saved')); return; }
    setListings(current => editingListing?.id ? current.map(item => item.id === result.data.id ? result.data as Listing : item) : [...current, result.data as Listing]);
    setEditingListing(result.data as Listing);
    notify('saved', result.data.publish_state === 'published'
      ? 'Saved and published. The Gallery reads this change immediately.'
      : 'Draft saved. Change Website visibility to Published when it is ready.');
  }

  async function toggleListingStatus(listing: Listing) {
    const next = listing.status === 'sold' ? 'available' : 'sold';
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    notify('saving', `Marking ${listing.title} as ${next}…`);
    const { error } = await getSupabaseBrowserClient().from('listings').update({ status: next }).eq('id', listing.id);
    if (error) { notify('error', error.message); return; }
    setListings(current => current.map(item => item.id === listing.id ? { ...item, status: next } : item));
    setEditingListing(current => current?.id === listing.id ? { ...current, status: next } : current);
    notify('saved', next === 'sold' ? 'Marked sold. Visitors can still ask for similar material.' : 'Marked available and visible as current inventory.');
  }

  async function readImageSize(file: File) {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => { resolve({ width: image.naturalWidth, height: image.naturalHeight }); URL.revokeObjectURL(objectUrl); };
      image.onerror = () => { reject(new Error(`Could not read ${file.name}.`)); URL.revokeObjectURL(objectUrl); };
      image.src = objectUrl;
    });
  }

  async function readRemoteImageSize(url: string) {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Could not read the selected media image.'));
      image.src = url;
    });
  }

  async function uploadListingImages(listing: Listing, files: File[]) {
    if (!files.length) return;
    setUploadingListingImages(true);
    notify('saving', `Uploading ${files.length} gallery image${files.length === 1 ? '' : 's'}…`);
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const existing = listingImages.filter(image => image.listing_id === listing.id);
      const uploaded: ListingImage[] = [];
      for (const [offset, file] of files.entries()) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const storageKey = `gallery/${listing.sku || listing.id}/${Date.now()}-${offset}-${safeName}`;
        const size = await readImageSize(file);
        const { error: uploadError } = await supabase.storage.from('gem-photos').upload(storageKey, file, { cacheControl: '31536000', upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('gem-photos').getPublicUrl(storageKey);
        const row = {
          listing_id: listing.id, storage_key: storageKey, source_filename: file.name, url: publicUrl.publicUrl,
          width: size.width, height: size.height, mime_type: file.type || 'image/jpeg',
          alt_text: `${listing.title}, view ${existing.length + offset + 1}`,
          sort_order: existing.length + offset, is_primary: existing.length === 0 && offset === 0,
        };
        const { data, error } = await supabase.from('listing_images').insert(row).select().single();
        if (error) throw error;
        uploaded.push(data as ListingImage);
      }
      const primary = uploaded.find(image => image.is_primary);
      if (primary) {
        await supabase.from('listings').update({ photo_url: primary.url }).eq('id', listing.id);
        setListings(current => current.map(item => item.id === listing.id ? { ...item, photo_url: primary.url } : item));
      }
      setListingImages(current => [...current, ...uploaded]);
      notify('saved', 'Gallery images uploaded. Their order and primary image are saved.');
    } catch (error) { notify('error', error instanceof Error ? error.message : 'Gallery image upload failed.'); }
    finally { setUploadingListingImages(false); }
  }

  async function setPrimaryListingImage(listing: Listing, image: ListingImage) {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    notify('saving', 'Saving primary gallery image…');
    const reset = await supabase.from('listing_images').update({ is_primary: false }).eq('listing_id', listing.id);
    if (reset.error) { notify('error', reset.error.message); return; }
    const [imageResult, listingResult] = await Promise.all([
      supabase.from('listing_images').update({ is_primary: true }).eq('id', image.id),
      supabase.from('listings').update({ photo_url: image.url }).eq('id', listing.id),
    ]);
    if (imageResult.error || listingResult.error) { notify('error', imageResult.error?.message || listingResult.error?.message || 'Save failed.'); return; }
    setListingImages(current => current.map(item => item.listing_id === listing.id ? { ...item, is_primary: item.id === image.id } : item));
    setListings(current => current.map(item => item.id === listing.id ? { ...item, photo_url: image.url } : item));
    notify('saved', 'Primary gallery image updated.');
  }

  async function moveListingImage(listingId: string, imageId: string, direction: -1 | 1) {
    const images = listingImages.filter(image => image.listing_id === listingId).sort((a,b) => a.sort_order - b.sort_order);
    const index = images.findIndex(image => image.id === imageId); const target = index + direction;
    if (index < 0 || target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    const positioned = images.map((image, sort_order) => ({ ...image, sort_order }));
    notify('saving', 'Saving image order…');
    const error = await persistAdminOrder('listing_images', positioned);
    if (error) { notify('error', error); return; }
    setListingImages(current => [...current.filter(image => image.listing_id !== listingId), ...positioned]);
    notify('saved', 'Gallery image order saved.');
  }

  async function updateListingImageAlt(image: ListingImage, altText: string) {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const { error } = await getSupabaseBrowserClient().from('listing_images').update({ alt_text: altText }).eq('id', image.id);
    if (error) { notify('error', error.message); return; }
    setListingImages(current => current.map(item => item.id === image.id ? { ...item, alt_text: altText } : item));
    notify('saved', 'Image description saved.');
  }

  async function removeStorageIfUnreferenced(storageKey: string, url: string) {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    const [mediaRefs, imageRefs, listingRefs, blogRefs] = await Promise.all([
      supabase.from('media').select('id', { count: 'exact', head: true }).eq('storage_path', storageKey),
      supabase.from('listing_images').select('id', { count: 'exact', head: true }).eq('storage_key', storageKey),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('photo_url', url),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('cover_url', url),
    ]);
    const failure = [mediaRefs, imageRefs, listingRefs, blogRefs].find(result => result.error);
    if (failure?.error) throw failure.error;
    if ([mediaRefs, imageRefs, listingRefs, blogRefs].some(result => (result.count ?? 0) > 0)) return false;
    const removed = await supabase.storage.from('gem-photos').remove([storageKey]);
    if (removed.error) throw removed.error;
    return true;
  }

  async function replaceListingImage(listing: Listing, image: ListingImage, file: File) {
    setUploadingListingImages(true);
    notify('saving', 'Replacing gallery image…');
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const storageKey = `gallery/${listing.sku || listing.id}/${Date.now()}-replacement-${safeName}`;
      const size = await readImageSize(file);
      const uploaded = await supabase.storage.from('gem-photos').upload(storageKey, file, { cacheControl: '31536000', upsert: false });
      if (uploaded.error) throw uploaded.error;
      const { data: publicUrl } = supabase.storage.from('gem-photos').getPublicUrl(storageKey);
      const next = { storage_key: storageKey, source_filename: file.name, url: publicUrl.publicUrl, width: size.width, height: size.height, mime_type: file.type || 'image/jpeg' };
      const imageUpdate = await supabase.from('listing_images').update(next).eq('id', image.id);
      if (imageUpdate.error) { await supabase.storage.from('gem-photos').remove([storageKey]); throw imageUpdate.error; }
      if (image.is_primary) {
        const listingUpdate = await supabase.from('listings').update({ photo_url: next.url, updated_at: new Date().toISOString() }).eq('id', listing.id);
        if (listingUpdate.error) throw listingUpdate.error;
        setListings(current => current.map(item => item.id === listing.id ? { ...item, photo_url: next.url } : item));
      }
      setListingImages(current => current.map(item => item.id === image.id ? { ...item, ...next } : item));
      if (image.storage_key && image.storage_key !== storageKey) await removeStorageIfUnreferenced(image.storage_key, image.url);
      notify('saved', 'Image replaced without changing its gallery position.');
    } catch (error) { notify('error', error instanceof Error ? error.message : 'Image replacement failed.'); }
    finally { setUploadingListingImages(false); }
  }

  async function deleteListingImage(listing: Listing, image: ListingImage) {
    if (!window.confirm(`Remove ${image.source_filename || 'this image'} from ${listing.title}?`)) return;
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    notify('saving', 'Removing gallery image…');
    const siblings = listingImages.filter(item => item.listing_id === listing.id && item.id !== image.id).sort((a, b) => a.sort_order - b.sort_order);
    const nextPrimary = image.is_primary ? siblings[0] : siblings.find(item => item.is_primary);
    const removed = await supabase.from('listing_images').delete().eq('id', image.id);
    if (removed.error) { notify('error', removed.error.message); return; }
    if (image.is_primary) {
      if (nextPrimary) await setPrimaryListingImage(listing, nextPrimary);
      else {
        const cleared = await supabase.from('listings').update({ photo_url: '' }).eq('id', listing.id);
        if (cleared.error) { notify('error', cleared.error.message); return; }
        setListings(current => current.map(item => item.id === listing.id ? { ...item, photo_url: '' } : item));
      }
    }
    const positioned = siblings.map((item, sort_order) => ({ ...item, sort_order, is_primary: nextPrimary ? item.id === nextPrimary.id : item.is_primary }));
    if (positioned.length) await persistAdminOrder('listing_images', positioned);
    setListingImages(current => [...current.filter(item => item.listing_id !== listing.id), ...positioned]);
    if (image.storage_key) await removeStorageIfUnreferenced(image.storage_key, image.url);
    notify('saved', 'Gallery image removed.');
  }

  async function savePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    notify('saving', 'Saving blog post…');
    const form = new FormData(event.currentTarget);
    const published = form.get('published') === 'on';
    const payload = { title: form.get('title'), slug: form.get('slug'), tag: form.get('tag'), excerpt: form.get('excerpt'), content: form.get('content'), cover_url: form.get('cover_url'), published, published_at: published ? new Date().toISOString() : null };
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    const result = editingPost?.id
      ? await supabase.from('blog_posts').update(payload).eq('id', editingPost.id).select().single()
      : await supabase.from('blog_posts').insert({ ...payload, position: blogPosts.length }).select().single();
    if (result.error) { notify('error', result.error.message); return; }
    setBlogPosts(current => editingPost?.id ? current.map(item => item.id === result.data.id ? result.data as BlogPost : item) : [result.data as BlogPost, ...current]);
    setEditingPost(null);
    notify('saved', 'Blog post saved.');
  }

  async function moveItem(table: 'media' | 'listings' | 'blog_posts', id: string, direction: -1 | 1) {
    const current = table === 'media' ? media : table === 'listings' ? galleryListings : blogPosts;
    const index = current.findIndex(item => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    const reordered = [...current];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const positioned = reordered.map((item, position) => ({ ...item, position }));
    notify('saving', 'Saving new order…');
    const error = await persistAdminOrder(table, positioned);
    if (error) { notify('error', error); return; }
    if (table === 'media') setMedia(positioned as MediaItem[]);
    else if (table === 'listings') setListings(all => [...all.filter(item => !galleryRecordIds.has(item.id)), ...(positioned as Listing[])]);
    else setBlogPosts(positioned as BlogPost[]);
    notify('saved', 'Display order saved.');
  }

  async function dropItem(table: 'media' | 'listings' | 'blog_posts', targetId: string) {
    if (!draggedItem || draggedItem.table !== table || draggedItem.id === targetId) return;
    const current = table === 'media' ? media : table === 'listings' ? galleryListings : blogPosts;
    const sourceIndex = current.findIndex(item => item.id === draggedItem.id);
    const targetIndex = current.findIndex(item => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...current];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const positioned = reordered.map((item, position) => ({ ...item, position }));
    setDraggedItem(null);
    if (table === 'media') setMedia(positioned as MediaItem[]);
    else if (table === 'listings') setListings(all => [...all.filter(item => !galleryRecordIds.has(item.id)), ...(positioned as Listing[])]);
    else setBlogPosts(positioned as BlogPost[]);
    notify('saving', 'Saving dragged order…');
    const error = await persistAdminOrder(table, positioned);
    if (error) {
      if (table === 'media') setMedia(current as MediaItem[]);
      else if (table === 'listings') setListings(all => [...all.filter(item => !galleryRecordIds.has(item.id)), ...(current as Listing[])]);
      else setBlogPosts(current as BlogPost[]);
      notify('error', error);
      return;
    }
    notify('saved', 'Dragged order saved and synced to the website.');
  }

  async function uploadBlogCover(file: File) {
    setUploadingPostImage(true);
    notify('saving', 'Uploading blog cover…');
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `blog/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('gem-photos').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('gem-photos').getPublicUrl(path);
      setEditingPost(current => ({ ...current, cover_url: data.publicUrl }));
      notify('saved', 'Cover uploaded. Click Save Post to publish the change.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Cover upload failed.');
    } finally { setUploadingPostImage(false); }
  }

  async function saveMediaStone(event: React.FormEvent<HTMLFormElement>, item: MediaItem) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldCreateListing = submitter?.value === 'gallery';
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const origin = String(form.get('origin') || '').trim();
    const weight = String(form.get('weight') || '').trim();
    const category = String(form.get('category') || 'Unassigned');
    if (!name) { notify('error', 'Stone name is required.'); return; }
    notify('saving', `Saving ${name}…`);
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const { error: mediaError } = await supabase.from('media').update({ name, weight, category, featured: category === item.category ? item.featured : false }).eq('id', item.id);
      if (mediaError) throw mediaError;
      setMedia(current => current.map(mediaItem => mediaItem.id === item.id ? { ...mediaItem, name, weight, category, featured: category === item.category ? item.featured : false } : mediaItem));
      const isCategoryCover = item.storage_path.startsWith('seed/category-covers/');
      const linkedImage = listingImages.find(image => image.url === item.url);
      const linkedListing = linkedImage ? listings.find(listing => listing.id === linkedImage.listing_id) : undefined;
      if (!shouldCreateListing) {
        if (linkedListing && !isCategoryCover) {
          const publicUpdate = {
            title: name, category, gemstone_family: category, origin,
            weight, public_weight_label: weight || 'Weight on request',
            publish_state: 'published', updated_at: new Date().toISOString(),
          };
          const listingUpdate = await supabase.from('listings').update(publicUpdate).eq('id', linkedListing.id).select().single();
          if (listingUpdate.error) throw listingUpdate.error;
          setListings(current => current.map(listing => listing.id === linkedListing.id ? listingUpdate.data as Listing : listing));
          notify('saved', 'Media and its linked Gallery listing were saved and published.');
        } else {
          notify('saved', isCategoryCover ? `Saved as the ${category} category cover.` : 'Media details saved. Use “Publish as Gallery listing” to add this new photo to the website.');
        }
        return;
      }
      if (category === 'Unassigned') throw new Error('Choose a gemstone category before creating a Gallery listing.');
      if (isCategoryCover) throw new Error('Category-cover images cannot be published as stone listings.');

      const existing = listings.find(listing => listing.slug === `media-${item.id}`) ?? linkedListing;
      const sku = existing?.sku || await nextGallerySku(supabase);
      const listingPayload = {
        title: name, slug: existing?.slug || `media-${item.id}`, sku,
        category, gemstone_family: category, origin, weight,
        public_weight_label: weight || 'Weight on request', photo_url: item.url,
        status: existing?.status === 'sold' ? 'sold' : 'available',
        publish_state: 'published',
        description: existing?.description || '', educational_note: existing?.educational_note || '',
        position: existing?.position ?? galleryListings.length, updated_at: new Date().toISOString(),
      };
      const listingResult = existing?.id
        ? await supabase.from('listings').update(listingPayload).eq('id', existing.id).select().single()
        : await supabase.from('listings').insert(listingPayload).select().single();
      if (listingResult.error) throw new Error(databaseErrorMessage(listingResult.error, 'Gallery listing could not be created'));
      const savedListing = listingResult.data as Listing;
      const matchingImage = listingImages.find(image => image.listing_id === savedListing.id && image.url === item.url);
      if (!matchingImage) {
        const size = await readRemoteImageSize(item.url);
        const currentImages = listingImages.filter(image => image.listing_id === savedListing.id);
        const imageResult = await supabase.from('listing_images').insert({
          listing_id: savedListing.id, storage_key: item.storage_path, source_filename: item.name,
          url: item.url, width: size.width, height: size.height, mime_type: item.url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
          alt_text: `${name}, primary view`, sort_order: currentImages.length, is_primary: currentImages.length === 0,
        }).select().single();
        if (imageResult.error) throw imageResult.error;
        setListingImages(current => [...current, imageResult.data as ListingImage]);
      }
      setListings(current => existing?.id
        ? current.map(listing => listing.id === savedListing.id ? savedListing : listing)
        : [...current, savedListing]);
      setEditingListing(savedListing);
      setView('listings');
      window.requestAnimationFrame(() => listingEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      notify('saved', 'Gallery listing published. You can complete its details and add alternate images here.');
    } catch (error) { notify('error', error instanceof Error ? error.message : 'Stone could not be saved.'); }
  }

  if (checking) {
    return <div className={styles.loading}><span className={styles.spinner} /> Verifying access…</div>;
  }

  if (!authed) return null;

  // showView() — kept as SPA tab-switch per §8
  function showView(v: View) { setView(v); }

  return (
    <div className={styles.shell}>
      {saveNotice && <div className={`${extra.saveToast} ${extra[saveNotice.type]}`} role="status">{saveNotice.message}</div>}
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <div className={styles.logo}>
            <div className={styles.dots}>
              <span style={{ background: 'var(--blue)' }} />
              <span style={{ background: 'var(--green)' }} />
              <span style={{ background: 'var(--ruby)' }} />
            </div>
            <span className={styles.logoText}>African Gem Finds</span>
          </div>
          <div className={extra.versionBadge}>CMS v2 · Supabase synced</div>
          <nav className={styles.nav}>
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'media', label: 'Media Library' },
              { id: 'listings', label: 'Gallery Listings' },
              { id: 'categories', label: 'Categories' },
              { id: 'blog', label: 'Blog' },
              { id: 'inquiries', label: 'Inquiries' },
            ] as { id: View; label: string }[]).map(item => (
              <button
                key={item.id}
                className={`${styles.navItem} ${view === item.id ? styles.active : ''}`}
                onClick={() => showView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className={styles.sideBottom}>
          <div className={styles.roleCard}><span>{role === 'owner' ? 'O' : 'S'}</span><div><strong>CMS Account</strong><small>{role}</small></div></div>
          <a href="/" className={styles.sideLink} target="_blank" rel="noopener noreferrer">← View Site</a>
          <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        {dataError && <div className={extra.dataError} role="alert">CMS data could not load: {dataError}</div>}
        {/* OVERVIEW */}
        {view === 'overview' && (
          <div className={styles.panel}>
            <div className={styles.topbar}><div><h1 className={styles.panelTitle}>Overview</h1><p>What&apos;s happening across the catalog</p></div></div>
            <div className={styles.viewBody}>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <div className={styles.statNum}>{galleryListings.length}</div>
                <div className={styles.statLabel}>Gallery Listings</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{galleryListings.filter(l => l.status === 'available').length}</div>
                <div className={styles.statLabel}>Available</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{inquiries.length}</div>
                <div className={styles.statLabel}>Inquiries</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{blogPosts.length}</div>
                <div className={styles.statLabel}>Blog Posts</div>
              </div>
            </div>
            <h2 className={styles.subhead}>Recent Inquiries</h2>
            {inquiries.slice(0, 5).map(inq => (
              <div key={inq.id} className={styles.inqRow}>
                <div>
                  <strong>{inq.name}</strong>
                  <span className={styles.inqEmail}>{inq.email}</span>
                  {inq.gemstone && <span className={styles.inqCat}>{inq.gemstone}</span>}
                </div>
                <p className={styles.inqMsg}>{inq.message}</p>
              </div>
            ))}
            {inquiries.length === 0 && <p className={styles.empty}>No inquiries yet.</p>}
            </div>
          </div>
        )}

        {/* LISTINGS */}
        {view === 'listings' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h1 className={styles.panelTitle}>Gallery Listings</h1><p>Edit every public stone, its category, facts, availability, order, and images</p></div>
              <button className="btn btn-primary" onClick={() => openListingEditor({ status: 'available', publish_state: 'published' })}>Add Gallery Stone</button>
            </div>
            {editingListing && <form key={editingListing.id ?? 'new-listing'} ref={listingEditorRef} className={`${styles.editor} ${extra.editorAnchor}`} onSubmit={saveListing}>
              <div className={extra.editorIntro}><strong>{editingListing.id ? `Editing ${editingListing.title}` : 'Create a gallery listing'}</strong><span>Every labeled field below saves to the public Gallery. Images are managed after the first save.</span></div>
              <label className={extra.fieldLabel}>Stone name<input name="title" placeholder="e.g. Madagascar Aquamarine Rough Parcel" defaultValue={editingListing.title} required /></label>
              <label className={extra.fieldLabel}>Permanent page URL<input name="slug" placeholder="madagascar-aquamarine-rough-parcel" defaultValue={editingListing.slug} required /></label>
              <label className={extra.fieldLabel}>Reference / SKU<input name="sku" placeholder="AGF-GAL-001" defaultValue={editingListing.sku} readOnly={Boolean(editingListing.id)} required /><small>{editingListing.id ? 'Locked after creation so links and references cannot collide.' : 'Generated automatically; change it only before the first save.'}</small></label>
              <label className={extra.fieldLabel}>Gemstone category<select name="gemstone_family" defaultValue={editingListing.gemstone_family ?? editingListing.category ?? categories[0]}>{categories.map(cat => <option key={cat}>{cat}</option>)}</select><small>This controls the Gallery filter and category assignment.</small></label>
              <label className={extra.fieldLabel}>Origin country<input name="origin" placeholder="e.g. Nigeria" defaultValue={editingListing.origin} /></label>
              <label className={extra.fieldLabel}>Origin locality<input name="origin_locality" placeholder="Optional region or locality" defaultValue={editingListing.origin_locality} /></label>
              <label className={extra.fieldLabel}>Numeric weight<input name="weight_value" type="number" min="0" step="any" placeholder="e.g. 596" defaultValue={editingListing.weight_value ?? ''} /></label>
              <label className={extra.fieldLabel}>Weight unit<select name="weight_unit" defaultValue={editingListing.weight_unit ?? ''}><option value="">To be confirmed</option><option value="g">grams (g)</option><option value="kg">kilograms (kg)</option><option value="ct">carats (ct)</option></select></label>
              <label className={extra.fieldLabel}>Public weight wording<input name="public_weight_label" placeholder="e.g. 596 g or Weight on request" defaultValue={editingListing.public_weight_label ?? editingListing.weight} /><small>This exact wording is shown to visitors.</small></label>
              <label className={extra.fieldLabel}>Internal source weight note<input name="raw_source_weight_note" placeholder="Private source note" defaultValue={editingListing.raw_source_weight_note} /></label>
              <label className={extra.fieldLabel}>Colour<input name="colour" placeholder="Verified colour description" defaultValue={editingListing.colour} /></label>
              <label className={extra.fieldLabel}>Form<input name="form" placeholder="Optional crystal or parcel form" defaultValue={editingListing.form} /></label>
              <label className={`${extra.fieldLabel} ${extra.fullField}`}>Stone description<textarea name="description" placeholder="Verified details about this individual lot" defaultValue={editingListing.description} /></label>
              <label className={`${extra.fieldLabel} ${extra.fullField}`}>Educational fact<textarea name="educational_note" placeholder="A short relevant fact visitors can learn from" defaultValue={editingListing.educational_note} /></label>
              <input name="photo_url" type="hidden" defaultValue={editingListing.photo_url} />
              <label className={extra.fieldLabel}>Availability<select name="status" defaultValue={editingListing.status === 'sold' ? 'sold' : 'available'}><option value="available">Available</option><option value="sold">Sold</option></select></label>
              <label className={extra.fieldLabel}>Website visibility<select name="publish_state" defaultValue={editingListing.publish_state ?? 'draft'}><option value="draft">Draft — hidden</option><option value="published">Published — visible</option></select></label>
              <div className={extra.saveBar}><button className="btn btn-primary" type="submit" disabled={saveNotice?.type === 'saving'}>{saveNotice?.type === 'saving' ? 'Saving…' : 'Save all listing changes'}</button><span>{editingListing.publish_state === 'published' ? 'Published changes appear on the website after saving.' : 'Drafts remain private until published.'}</span></div>
              <button className={styles.copyBtn} type="button" onClick={() => setEditingListing(null)}>Cancel</button>
              {editingListing.id && <section className={extra.galleryImageManager}>
                <div className={extra.galleryImageHead}>
                  <div><strong>Gallery images</strong><small>Upload alternate views, reorder them, and choose the card/primary image.</small></div>
                  <label className={extra.galleryUploadButton}>{uploadingListingImages ? 'Uploading…' : 'Upload images'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploadingListingImages} onChange={event => { const listing = editingListing as Listing; void uploadListingImages(listing, Array.from(event.target.files ?? [])); event.target.value = ''; }} /></label>
                </div>
                <div className={extra.galleryImageGrid}>{listingImages.filter(image => image.listing_id === editingListing.id).sort((a,b) => a.sort_order - b.sort_order).map((image, index) => <article key={image.id} className={extra.galleryImageCard}>
                  <div className={extra.galleryImagePreview}><Image src={storageVariant(image.url, 320)} alt={image.alt_text} fill sizes="(max-width: 700px) 80vw, 220px" quality={90} unoptimized={image.url.includes('/storage/v1/object/public/')} /><span>{image.is_primary ? 'Primary' : `View ${index + 1}`}</span></div>
                  <input aria-label={`Alt text for view ${index + 1}`} defaultValue={image.alt_text} onBlur={event => event.target.value !== image.alt_text && updateListingImageAlt(image, event.target.value)} />
                  <div><button type="button" onClick={() => moveListingImage(editingListing.id!, image.id, -1)} disabled={index === 0}>←</button><button type="button" onClick={() => moveListingImage(editingListing.id!, image.id, 1)} disabled={index === listingImages.filter(item => item.listing_id === editingListing.id).length - 1}>→</button><button type="button" className={image.is_primary ? extra.primarySelected : ''} onClick={() => setPrimaryListingImage(editingListing as Listing, image)}>★ Primary</button><label className={extra.replaceButton}>Replace<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => { const file = event.target.files?.[0]; if (file) void replaceListingImage(editingListing as Listing, image, file); event.target.value = ''; }} /></label><button type="button" className={extra.imageDelete} onClick={() => void deleteListingImage(editingListing as Listing, image)}>Remove</button></div>
                </article>)}</div>
                {listingImages.filter(image => image.listing_id === editingListing.id).length === 0 && <p>No gallery images yet. Upload the primary image and alternate views here.</p>}
              </section>}
            </form>}
            <div className={extra.listingTools}><label>Search gallery<input value={listingSearch} onChange={event => setListingSearch(event.target.value)} placeholder="Name, reference, origin…" /></label><label>Category<select value={listingCategoryFilter} onChange={event => setListingCategoryFilter(event.target.value)}><option>All</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Visibility<select value={listingPublishFilter} onChange={event => setListingPublishFilter(event.target.value)}><option>All</option><option value="published">Published</option><option value="draft">Draft</option></select></label><span>{visibleGalleryListings.length} of {galleryListings.length} stones</span></div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th><th>Specimen</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Weight</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleGalleryListings.map(l => (
                  <tr key={l.id} draggable onDragStart={() => setDraggedItem({ table: 'listings', id: l.id })} onDragEnd={() => setDraggedItem(null)} onDragOver={event => event.preventDefault()} onDrop={() => void dropItem('listings', l.id)} className={draggedItem?.id === l.id ? extra.dragging : ''}>
                    <td className={`${styles.orderCell} ${extra.dragHandle}`} title="Drag to reorder">⠿ {l.position + 1}</td>
                    <td><div className={styles.specimenCell}>{l.photo_url && <Image src={storageVariant(l.photo_url, 320)} alt="" width={44} height={44} sizes="44px" quality={90} unoptimized={l.photo_url.includes('/storage/v1/object/public/')} />}<div><strong>{l.title}</strong><small>{l.slug}</small></div></div></td>
                    <td>{l.gemstone_family || l.category}</td>
                    <td><span className={`${styles.badge} ${styles[l.status]}`}>{l.status}</span>{l.status === 'sold' && <small className={extra.soldHelp}>Visitors can ask for a similar stone.</small>}</td>
                    <td>{l.public_weight_label || l.weight || '—'}</td>
                    <td><div className={styles.rowActions}><button onClick={() => moveItem('listings', l.id, -1)} title="Move earlier">↑</button><button onClick={() => moveItem('listings', l.id, 1)} title="Move later">↓</button><button onClick={() => toggleListingStatus(l)}>{l.status === 'sold' ? 'Mark available' : 'Mark sold'}</button><button onClick={() => openListingEditor(l)}>Edit &amp; Images</button>{role === 'owner' && <button className={styles.danger} onClick={async () => { const { getSupabaseBrowserClient } = await import('@/lib/supabase/client'); await getSupabaseBrowserClient().from('listings').delete().eq('id', l.id); setListings(v => v.filter(x => x.id !== l.id)); }}>Delete</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loadingData && <p className={styles.empty}>Loading listings…</p>}
            {!loadingData && listings.length === 0 && <p className={styles.empty}>No listings yet. Create the first specimen above.</p>}
          </div>
        )}

        {/* MEDIA LIBRARY */}
        {view === 'media' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h1 className={styles.panelTitle}>Media Library</h1><p>Organize reusable photos and category covers, or turn a photo into a complete Gallery listing</p></div>
              <span className={styles.uploadState}>{uploading ? 'Uploading photos…' : `${media.length} photos`}</span>
            </div>
            <label className={styles.dropzone}>
              <span className={styles.dropIcon}>↑</span><h3>Drop photos here, or click to browse</h3><p>Upload multiple clean JPG, PNG, or WebP originals.</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className={styles.hiddenInput} onChange={handleMediaUpload} disabled={uploading} />
            </label>
            <div className={styles.filters}>{['All', ...categories].map(cat => <button key={cat} className={`${styles.copyBtn} ${mediaFilter === cat ? styles.active : ''}`} onClick={() => setMediaFilter(cat)}>{cat}</button>)}</div>
            <div className={styles.mediaGrid}>
              {media.filter(m => mediaFilter === 'All' || m.category === mediaFilter).map(m => (
                <div key={m.id} draggable onDragStart={() => setDraggedItem({ table: 'media', id: m.id })} onDragEnd={() => setDraggedItem(null)} onDragOver={event => event.preventDefault()} onDrop={() => void dropItem('media', m.id)} className={`${styles.mediaItem} ${extra.editableMedia} ${draggedItem?.id === m.id ? extra.dragging : ''}`}>
                  <span className={styles.mediaPosition}>{m.position + 1}</span>
                  <button className={`${styles.mediaStar} ${m.featured ? styles.featured : ''}`} onClick={() => featureMedia(m)} title="Set category cover">★</button>
                  <div className={`${styles.mediaThumb} admin-media-thumb`}>
                    <Image src={storageVariant(m.url, 320)} alt={m.name} fill sizes="(max-width: 700px) 45vw, 220px" quality={90} unoptimized={m.url.includes('/storage/v1/object/public/')} />
                  </div>
                  <form className={extra.mediaEditor} onSubmit={event => saveMediaStone(event, m)}>
                    <input name="name" defaultValue={m.name} placeholder="Stone name" aria-label="Stone name" required />
                    <input name="origin" defaultValue={listings.find(listing => listing.photo_url === m.url)?.origin ?? 'Africa'} placeholder="Origin" aria-label="Origin" />
                    <input name="weight" defaultValue={m.weight} placeholder="Weight" aria-label="Weight" />
                    <select name="category" defaultValue={m.category} aria-label="Gemstone category"><option>Unassigned</option>{categories.map(cat => <option key={cat}>{cat}</option>)}</select>
                    <button type="submit" name="intent" value="media">Save media details</button>
                    {!m.storage_path.startsWith('seed/category-covers/') && <button type="submit" name="intent" value="gallery" className={extra.promoteButton}>Publish / edit Gallery listing</button>}
                    <div className={extra.orderButtons}><button type="button" onClick={() => moveItem('media', m.id, -1)}>← Earlier</button><button type="button" onClick={() => moveItem('media', m.id, 1)}>Later →</button></div>
                  </form>
                </div>
              ))}
            </div>
            {media.length === 0 && <p className={styles.empty}>No media uploaded yet. Use the button above.</p>}
          </div>
        )}

        {view === 'categories' && (
          <div className={styles.panel}>
            <div className={styles.topbar}><div><h1 className={styles.panelTitle}>Categories</h1><p>The six gemstone collections shown across the site</p></div></div>
            <div className={styles.viewBody}>
            <div className={styles.mediaGrid}>{categories.map(category => {
              const cover = media.find(item => item.category === category && item.featured);
              return <div className={extra.categoryCard} key={category}>
                <div className={`${styles.mediaThumb} category-thumb`}>{cover ? <Image src={storageVariant(cover.url, 320)} alt={`${category} category cover`} fill sizes="220px" quality={90} unoptimized={cover.url.includes('/storage/v1/object/public/')} /> : <span className={styles.empty}>No cover</span>}</div>
                <strong>{category}</strong><div>{galleryListings.filter(item => (item.gemstone_family || item.category) === category).length} gallery listings</div>
                <button className="btn btn-primary" onClick={() => { setMediaFilter(category); setView('media'); }}>Change cover</button>
              </div>;
            })}</div>
            </div>
          </div>
        )}

        {/* BLOG */}
        {view === 'blog' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h1 className={styles.panelTitle}>Blog Posts</h1><p>Edit current articles, drafts, covers, and publishing status</p></div>
              <button className="btn btn-primary" onClick={() => openBlogEditor({ published: false })}>New Post</button>
            </div>
            {editingPost && <form key={editingPost.id ?? 'new-post'} ref={blogEditorRef} className={`${styles.editor} ${extra.editorAnchor}`} onSubmit={savePost}>
              <input name="title" placeholder="Post title" defaultValue={editingPost.title} required />
              <input name="slug" placeholder="post-slug" defaultValue={editingPost.slug} required />
              <input name="tag" placeholder="Field Notes" defaultValue={editingPost.tag} />
              <div className={extra.coverPicker}>
                <label>Cover image</label>
                {editingPost.cover_url && <Image src={storageVariant(editingPost.cover_url, 320)} alt="Current post cover" width={140} height={90} sizes="140px" quality={90} unoptimized={editingPost.cover_url.includes('/storage/v1/object/public/')} />}
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadBlogCover(e.target.files[0])} />
                <input name="cover_url" placeholder="Or paste an image URL" value={editingPost.cover_url ?? ''} onChange={e => setEditingPost(current => ({ ...current, cover_url: e.target.value }))} />
                <small>{uploadingPostImage ? 'Uploading…' : 'Upload a clean image or paste its URL.'}</small>
              </div>
              <textarea name="excerpt" placeholder="Excerpt" defaultValue={editingPost.excerpt} />
              <textarea name="content" placeholder="Post content" defaultValue={editingPost.content} rows={10} required />
              <label><input name="published" type="checkbox" defaultChecked={editingPost.published} /> Published</label>
              <button className="btn btn-primary" type="submit" disabled={saveNotice?.type === 'saving'}>{saveNotice?.type === 'saving' ? 'Saving…' : 'Save Post'}</button><button type="button" className={styles.copyBtn} onClick={() => setEditingPost(null)}>Cancel</button>
            </form>}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Tag</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts.map(p => (
                  <tr key={p.id} draggable onDragStart={() => setDraggedItem({ table: 'blog_posts', id: p.id })} onDragEnd={() => setDraggedItem(null)} onDragOver={event => event.preventDefault()} onDrop={() => void dropItem('blog_posts', p.id)} className={draggedItem?.id === p.id ? extra.dragging : ''}>
                    <td>{p.title}</td>
                    <td><code className={styles.slug}>{p.slug}</code></td>
                    <td>{p.tag}</td>
                    <td><span className={`${styles.badge} ${p.published ? styles.available : styles.reserved}`}>{p.published ? 'Published' : 'Draft'}</span></td>
                    <td><div className={styles.rowActions}><button onClick={() => moveItem('blog_posts', p.id, -1)} title="Move earlier">↑</button><button onClick={() => moveItem('blog_posts', p.id, 1)} title="Move later">↓</button><button onClick={() => openBlogEditor(p)}>Edit</button>{role === 'owner' && <button className={styles.danger} onClick={async () => { const { getSupabaseBrowserClient } = await import('@/lib/supabase/client'); await getSupabaseBrowserClient().from('blog_posts').delete().eq('id', p.id); setBlogPosts(v => v.filter(x => x.id !== p.id)); }}>Delete</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {blogPosts.length === 0 && <p className={styles.empty}>No blog posts yet. Create the first post above.</p>}
          </div>
        )}

        {/* INQUIRIES */}
        {view === 'inquiries' && (
          <div className={styles.panel}>
            <div className={styles.topbar}><div><h1 className={styles.panelTitle}>Inquiries</h1><p>Live submissions from the website contact forms</p></div><span className={styles.liveBadge}>● Live</span></div>
            <div className={styles.viewBody}>
            <div className={extra.inquiryLayout}><div>{inquiries.map(inq => (
              <button key={inq.id} className={`${extra.inquirySummary} ${selectedInquiry?.id === inq.id ? extra.selected : ''}`} onClick={() => setSelectedInquiry(inq)}>
                <div className={styles.inqMeta}>
                  <strong>{inq.name}</strong>
                  <a href={`mailto:${inq.email}`} className={styles.inqEmailLink}>{inq.email}</a>
                  {inq.gemstone && <span className={styles.inqCat}>{inq.gemstone}</span>}
                  {inq.created_at && (
                    <span className={styles.inqDate}>
                      {new Date(inq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <p className={styles.inqMsg}>{inq.message.slice(0, 110)}{inq.message.length > 110 ? '…' : ''}</p>
              </button>
            ))}</div>
            <aside className={extra.inquiryDetail}>
              {selectedInquiry ? <>
                <div className={extra.detailHead}><div><span>Form submission</span><h2>{selectedInquiry.name}</h2></div><button onClick={() => setSelectedInquiry(null)}>×</button></div>
                <label>Name<input value={selectedInquiry.name} readOnly /></label>
                <label>Email<input value={selectedInquiry.email} readOnly /></label>
                <label>Phone<input value={selectedInquiry.phone || 'Not supplied'} readOnly /></label>
                <label>Gemstone<input value={selectedInquiry.gemstone || 'Not specified'} readOnly /></label>
                <label>Message<textarea value={selectedInquiry.message} readOnly rows={8} /></label>
                <label>Status<select value={selectedInquiry.status} onChange={async e => { const status = e.target.value as Inquiry['status']; const { getSupabaseBrowserClient } = await import('@/lib/supabase/client'); notify('saving','Saving inquiry status…'); const { error } = await getSupabaseBrowserClient().from('inquiries').update({ status }).eq('id', selectedInquiry.id); if (error) { notify('error',error.message); return; } const updated = { ...selectedInquiry, status }; setSelectedInquiry(updated); setInquiries(v => v.map(x => x.id === updated.id ? updated : x)); notify('saved','Inquiry status saved.'); }}><option>new</option><option>contacted</option><option>closed</option></select></label>
                <a className="btn btn-primary" href={`mailto:${selectedInquiry.email}`}>Reply by email</a>
              </> : <div className={extra.selectPrompt}>Select an inquiry to see the complete submitted form.</div>}
            </aside></div>
            {inquiries.length === 0 && <p className={styles.empty}>No inquiries yet.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
