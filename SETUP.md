# Africa Gem Finds — Supabase Setup

## 1. Create and initialise Supabase

1. Create a Supabase project in the Singapore region.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once. This creates the CMS tables, indexes, RLS policies, Realtime inquiry publication, six categories, and the public `gem-photos` bucket.
3. In **Authentication → Users**, create the owner and staff accounts.
4. Set each account's protected role in `app_metadata` with the service-role key (never the browser key):

```bash
curl -X PUT 'https://PROJECT.supabase.co/auth/v1/admin/users/USER_ID' \
  -H 'apikey: SERVICE_ROLE_KEY' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"app_metadata":{"role":"owner"}}'
```

Use `staff` instead of `owner` for staff accounts. Sign out and back in after changing a role.

## 2. Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
MAKE_WEBHOOK_URL=https://hook.make.com/REPLACE_WITH_YOUR_WEBHOOK_ID
KEEPALIVE_SECRET=generate-a-long-random-value
```

The service-role key and keepalive secret are server-only. Do not prefix either with `NEXT_PUBLIC_`.

## 3. CMS workflow

- `/admin/login` authenticates Owner/Staff with Supabase Auth.
- **Listings** creates and edits public gemstone inventory. Category pages read available/reserved rows ordered by `position`.
- **Media Library** uploads clean originals to `gem-photos`. Assign a category and star one image to make it that category's cover on the homepage and category page.
- **Categories** previews each current cover and listing count.
- **Blog** creates drafts and published posts. Published records appear on `/blog`.
- **Inquiries** receives website forms live through Supabase Realtime and supports `new`, `contacted`, and `closed` states.

Owner can delete records; Staff can create and update but destructive UI is hidden.

## 4. Inquiry email automation

The forms POST to `/api/inquiries`. The route validates and stores the inquiry, then sends an `inquiry.created` payload to `MAKE_WEBHOOK_URL`.

Build one Make.com scenario:

1. **Custom webhook** trigger.
2. Send a confirmation email to `inquiry.email`.
3. Send the founder a notification containing the name, gemstone, phone, message, and dashboard link.

The database write remains successful if the notification provider is temporarily unavailable.

## 5. Keep-alive

The app exposes `GET /api/keepalive`, protected by `Authorization: Bearer KEEPALIVE_SECRET`. Use an external scheduler because a paused database cannot wake itself.

Recommended Make.com scenario: every 2 days at 08:00 Bangkok time → HTTP GET `https://YOUR_DOMAIN/api/keepalive` with the bearer header above. The route performs one lightweight server-side query against `media`.

## 6. Run and deploy

```bash
npm install
npm run dev
npm run build
```

Connect the repository to Vercel and copy all environment variables into Production and Preview settings. Never expose the service-role key in client code.

## Remaining launch values

- Supabase project URL, publishable key, and service-role key
- Owner/Staff user IDs and `app_metadata.role`
- Make.com webhook and its two email modules
- Keepalive secret and external two-day schedule
