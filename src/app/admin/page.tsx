'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  photo_url?: string;
  position: number;
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
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState<'owner' | 'staff'>('staff');
  const [mediaFilter, setMediaFilter] = useState('All');
  const [editingListing, setEditingListing] = useState<Partial<Listing> | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [saveNotice, setSaveNotice] = useState<{ type: 'saving' | 'saved' | 'error'; message: string } | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    const check = async () => {
      try {
        const { hasSupabaseConfig } = await import('@/lib/supabase/config');
        if (!hasSupabaseConfig()) { setChecking(false); router.replace('/admin/login'); return; }
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        const userRole = data.user?.app_metadata?.role as 'owner' | 'staff' | undefined;
        if (!data.user || !userRole || !['owner', 'staff'].includes(userRole)) {
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

  // Keep every CMS surface hydrated so switching views is instant.
  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const [inquiryResult, listingResult, mediaResult, blogResult] = await Promise.all([
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('listings').select('*').order('position'),
        supabase.from('media').select('*').order('position'),
        supabase.from('blog_posts').select('*').order('position'),
      ]);
      setInquiries((inquiryResult.data ?? []) as Inquiry[]);
      setListings((listingResult.data ?? []) as Listing[]);
      setMedia((mediaResult.data ?? []) as MediaItem[]);
      setBlogPosts((blogResult.data ?? []) as BlogPost[]);
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
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const path = `gems/${mediaFilter === 'All' ? 'Unassigned' : mediaFilter}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('gem-photos').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('gem-photos').getPublicUrl(path);
        const item = { name: file.name, url: publicUrl.publicUrl, storage_path: path, category: mediaFilter === 'All' ? 'Unassigned' : mediaFilter, weight: '', featured: false, position: media.length };
        const { data, error } = await supabase.from('media').insert(item).select().single();
        if (error) throw error;
        setMedia(current => [...current, data as MediaItem]);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const categories = ['Aquamarine', 'Tourmaline', 'Rubylite', 'Morganite', 'Spessartite Garnet', 'Beryl'];

  function notify(type: 'saving' | 'saved' | 'error', message: string) {
    setSaveNotice({ type, message });
    if (type !== 'saving') window.setTimeout(() => setSaveNotice(null), 3200);
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
    const payload = Object.fromEntries(['title','slug','category','weight','photo_url','status'].map(key => [key, form.get(key)]));
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    const result = editingListing?.id
      ? await supabase.from('listings').update(payload).eq('id', editingListing.id).select().single()
      : await supabase.from('listings').insert({ ...payload, position: listings.length }).select().single();
    if (result.error) { notify('error', result.error.message); return; }
    setListings(current => editingListing?.id ? current.map(item => item.id === result.data.id ? result.data as Listing : item) : [...current, result.data as Listing]);
    setEditingListing(null);
    notify('saved', 'Listing saved and published to the catalog.');
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
      : await supabase.from('blog_posts').insert(payload).select().single();
    if (result.error) { notify('error', result.error.message); return; }
    setBlogPosts(current => editingPost?.id ? current.map(item => item.id === result.data.id ? result.data as BlogPost : item) : [result.data as BlogPost, ...current]);
    setEditingPost(null);
    notify('saved', 'Blog post saved.');
  }

  async function moveItem(table: 'media' | 'listings' | 'blog_posts', id: string, direction: -1 | 1) {
    const current = table === 'media' ? media : table === 'listings' ? listings : blogPosts;
    const index = current.findIndex(item => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    const reordered = [...current];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const positioned = reordered.map((item, position) => ({ ...item, position }));
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    notify('saving', 'Saving new order…');
    const results = await Promise.all(positioned.map(item => supabase.from(table).update({ position: item.position }).eq('id', item.id)));
    const failed = results.find(result => result.error);
    if (failed?.error) { notify('error', failed.error.message); return; }
    if (table === 'media') setMedia(positioned as MediaItem[]);
    else if (table === 'listings') setListings(positioned as Listing[]);
    else setBlogPosts(positioned as BlogPost[]);
    notify('saved', 'Display order saved.');
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
      if (category !== 'Unassigned' && !isCategoryCover) {
        const listing = { title: name, slug: `media-${item.id}`, category, weight, origin: origin || 'Africa', description: '', photo_url: item.url, status: 'available', position: listings.length };
        const { data, error } = await supabase.from('listings').upsert(listing, { onConflict: 'slug' }).select().single();
        if (error) throw error;
        setListings(current => [...current.filter(existing => existing.slug !== listing.slug), data as Listing].sort((a,b) => a.position - b.position));
      } else {
        const slug = `media-${item.id}`;
        await supabase.from('listings').update({ status: 'sold' }).eq('slug', slug);
        setListings(current => current.map(existing => existing.slug === slug ? { ...existing, status: 'sold' } : existing));
      }
      notify('saved', isCategoryCover ? `Saved as the ${category} category cover.` : category === 'Unassigned' ? 'Photo saved in All Photos.' : `Saved and published under ${category}.`);
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
              { id: 'listings', label: 'Listings' },
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
        {/* OVERVIEW */}
        {view === 'overview' && (
          <div className={styles.panel}>
            <div className={styles.topbar}><div><h1 className={styles.panelTitle}>Overview</h1><p>What&apos;s happening across the catalog</p></div></div>
            <div className={styles.viewBody}>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <div className={styles.statNum}>{listings.length}</div>
                <div className={styles.statLabel}>Listings</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{listings.filter(l => l.status === 'available').length}</div>
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
              <div><h1 className={styles.panelTitle}>Listings</h1><p>Manage and reorder the specimens visible on the website</p></div>
              <button className="btn btn-primary" onClick={() => setEditingListing({ status: 'available' })}>Add Listing</button>
            </div>
            {editingListing && <form className={styles.editor} onSubmit={saveListing}>
              <input name="title" placeholder="Listing title" defaultValue={editingListing.title} required />
              <input name="slug" placeholder="listing-slug" defaultValue={editingListing.slug} required />
              <select name="category" defaultValue={editingListing.category}>{categories.map(cat => <option key={cat}>{cat}</option>)}</select>
              <input name="weight" placeholder="Weight" defaultValue={editingListing.weight} />
              <input name="photo_url" placeholder="Photo URL" defaultValue={editingListing.photo_url} />
              <select name="status" defaultValue={editingListing.status ?? 'available'}><option>available</option><option>reserved</option><option>sold</option></select>
              <button className="btn btn-primary" type="submit">Save Listing</button>
              <button className={styles.copyBtn} type="button" onClick={() => setEditingListing(null)}>Cancel</button>
            </form>}
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
                {listings.map(l => (
                  <tr key={l.id}>
                    <td className={styles.orderCell}>↕ {l.position + 1}</td>
                    <td><div className={styles.specimenCell}>{l.photo_url && <img src={l.photo_url} alt="" />}<div><strong>{l.title}</strong><small>{l.slug}</small></div></div></td>
                    <td>{l.category}</td>
                    <td><span className={`${styles.badge} ${styles[l.status]}`}>{l.status}</span></td>
                    <td>{l.weight || '—'}</td>
                    <td><div className={styles.rowActions}><button onClick={() => moveItem('listings', l.id, -1)} title="Move earlier">↑</button><button onClick={() => moveItem('listings', l.id, 1)} title="Move later">↓</button><button onClick={() => setEditingListing(l)}>Edit</button>{role === 'owner' && <button className={styles.danger} onClick={async () => { const { getSupabaseBrowserClient } = await import('@/lib/supabase/client'); await getSupabaseBrowserClient().from('listings').delete().eq('id', l.id); setListings(v => v.filter(x => x.id !== l.id)); }}>Delete</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listings.length === 0 && <p className={styles.empty}>No listings yet. Create the first specimen above.</p>}
          </div>
        )}

        {/* MEDIA LIBRARY */}
        {view === 'media' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h1 className={styles.panelTitle}>Media Library</h1><p>Upload photos, assign categories, choose covers, and arrange display order</p></div>
              <span className={styles.uploadState}>{uploading ? 'Uploading photos…' : `${media.length} photos`}</span>
            </div>
            <label className={styles.dropzone}>
              <span className={styles.dropIcon}>↑</span><h3>Drop photos here, or click to browse</h3><p>Upload multiple clean JPG, PNG, or WebP originals.</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className={styles.hiddenInput} onChange={handleMediaUpload} disabled={uploading} />
            </label>
            <div className={styles.filters}>{['All', ...categories].map(cat => <button key={cat} className={`${styles.copyBtn} ${mediaFilter === cat ? styles.active : ''}`} onClick={() => setMediaFilter(cat)}>{cat}</button>)}</div>
            <div className={styles.mediaGrid}>
              {media.filter(m => mediaFilter === 'All' || m.category === mediaFilter).map(m => (
                <div key={m.id} className={`${styles.mediaItem} ${extra.editableMedia}`}>
                  <span className={styles.mediaPosition}>{m.position + 1}</span>
                  <button className={`${styles.mediaStar} ${m.featured ? styles.featured : ''}`} onClick={() => featureMedia(m)} title="Set category cover">★</button>
                  <div className={`${styles.mediaThumb} admin-media-thumb`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.name} />
                  </div>
                  <form className={extra.mediaEditor} onSubmit={event => saveMediaStone(event, m)}>
                    <input name="name" defaultValue={m.name} placeholder="Stone name" aria-label="Stone name" required />
                    <input name="origin" defaultValue={listings.find(listing => listing.photo_url === m.url)?.origin ?? 'Africa'} placeholder="Origin" aria-label="Origin" />
                    <input name="weight" defaultValue={m.weight} placeholder="Weight" aria-label="Weight" />
                    <select name="category" defaultValue={m.category} aria-label="Gemstone category"><option>Unassigned</option>{categories.map(cat => <option key={cat}>{cat}</option>)}</select>
                    <button type="submit">Save stone</button>
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
                <div className={`${styles.mediaThumb} category-thumb`}>{cover ? <img src={cover.url} alt="" /> : <span className={styles.empty}>No cover</span>}</div>
                <strong>{category}</strong><div>{listings.filter(item => item.category === category).length} listings</div>
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
              <button className="btn btn-primary" onClick={() => setEditingPost({ published: false })}>New Post</button>
            </div>
            {editingPost && <form className={styles.editor} onSubmit={savePost}>
              <input name="title" placeholder="Post title" defaultValue={editingPost.title} required />
              <input name="slug" placeholder="post-slug" defaultValue={editingPost.slug} required />
              <input name="tag" placeholder="Field Notes" defaultValue={editingPost.tag} />
              <div className={extra.coverPicker}>
                <label>Cover image</label>
                {editingPost.cover_url && <img src={editingPost.cover_url} alt="Current post cover" />}
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadBlogCover(e.target.files[0])} />
                <input name="cover_url" placeholder="Or paste an image URL" value={editingPost.cover_url ?? ''} onChange={e => setEditingPost(current => ({ ...current, cover_url: e.target.value }))} />
                <small>{uploadingPostImage ? 'Uploading…' : 'Upload a clean image or paste its URL.'}</small>
              </div>
              <textarea name="excerpt" placeholder="Excerpt" defaultValue={editingPost.excerpt} />
              <textarea name="content" placeholder="Post content" defaultValue={editingPost.content} rows={10} required />
              <label><input name="published" type="checkbox" defaultChecked={editingPost.published} /> Published</label>
              <button className="btn btn-primary" type="submit">Save Post</button><button type="button" className={styles.copyBtn} onClick={() => setEditingPost(null)}>Cancel</button>
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
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td><code className={styles.slug}>{p.slug}</code></td>
                    <td>{p.tag}</td>
                    <td><span className={`${styles.badge} ${p.published ? styles.available : styles.reserved}`}>{p.published ? 'Published' : 'Draft'}</span></td>
                    <td><div className={styles.rowActions}><button onClick={() => moveItem('blog_posts', p.id, -1)} title="Move earlier">↑</button><button onClick={() => moveItem('blog_posts', p.id, 1)} title="Move later">↓</button><button onClick={() => setEditingPost(p)}>Edit</button>{role === 'owner' && <button className={styles.danger} onClick={async () => { const { getSupabaseBrowserClient } = await import('@/lib/supabase/client'); await getSupabaseBrowserClient().from('blog_posts').delete().eq('id', p.id); setBlogPosts(v => v.filter(x => x.id !== p.id)); }}>Delete</button>}</div></td>
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
