import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseConfig } from './config';

let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, key } = getPublicSupabaseConfig();
    client = createBrowserClient(url, key);
  }
  return client;
}
