'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { hasSupabaseConfig } = await import('@/lib/supabase/config');
      if (!hasSupabaseConfig()) throw new Error('Supabase is not configured.');
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const role = data.user?.app_metadata?.role as string | undefined;
      if (role === 'owner' || role === 'staff') {
        router.push('/admin');
      } else {
        setError('Your account does not have admin access.');
        await supabase.auth.signOut();
      }
    } catch (error) {
      setError(error instanceof Error && error.message.includes('configured') ? error.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.dots}>
            <span style={{ background: 'var(--blue)' }} />
            <span style={{ background: 'var(--green)' }} />
            <span style={{ background: 'var(--ruby)' }} />
          </div>
          <span className={styles.logoText}>Africa Gem Finds</span>
        </div>
        <h1>Admin Login</h1>
        <p>Access restricted to authorised staff only.</p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
