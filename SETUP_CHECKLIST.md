# Zynkly Admin — Setup Checklist

Complete these steps after the code is deployed. Check each item off.

---

## Step 1: Supabase Database Migrations

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run `supabase/migrations/20240101000001_create_admins_table.sql`
  - Creates `admins` and `admin_logs` tables
- [ ] Run `supabase/migrations/20240101000002_admin_rls_policies.sql`
  - Creates RLS policies for all tables
- [ ] Verify both ran without errors

**Note:** If your existing tables already have RLS enabled with conflicting policies, adjust the migration SQL before running.

---

## Step 2: Create the First Super Admin

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → Invite user (or sign up via `/login`)
3. Enter your admin email and a strong password
4. Copy the **User UUID** (shown in the user detail)
5. Open **SQL Editor** and run:

```sql
INSERT INTO public.admins (user_id, email, name, role)
VALUES (
  'PASTE-YOUR-UUID-HERE',
  'your@email.com',
  'Your Name',
  'super_admin'
);
```

6. Verify by signing into the admin panel at your deployment URL

---

## Step 3: Configure Environment Variables

For local development — edit `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
VITE_APP_NAME=Zynkly Admin
```

Find your values in: **Supabase Dashboard** → **Settings** → **API**
- Project URL → `VITE_SUPABASE_URL`
- Anon/public key → `VITE_SUPABASE_ANON_KEY` (NOT the service role key)

---

## Step 4: Deploy to Vercel

1. Push code to GitHub
2. Go to https://vercel.com → **New Project** → Import your repo
3. Set **Framework Preset** to **Vite**
4. Add Environment Variables (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`
5. Deploy
6. Add `vercel.json` at the root for SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Step 5: Deploy the invite-admin Edge Function

Required for the "Invite Admin" feature in the Admins page.

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (find ref in Supabase Dashboard URL)
supabase link --project-ref your-project-ref

# Set the service role key as a secret (NOT in code!)
# Find it: Supabase Dashboard -> Settings -> API -> service_role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Deploy the function
supabase functions deploy invite-admin
```

Verify: When you click "Invite Admin" in the Admins page, the user should receive an email.

---

## Step 6: Configure Supabase Realtime

Ensure Realtime is enabled for the `bookings` table:

1. Supabase Dashboard → **Database** → **Replication**
2. Enable `bookings` table for realtime publication
3. Or run: `ALTER PUBLICATION supabase_realtime ADD TABLE bookings;`

---

## Step 7: Test the Full Flow

- [ ] Login with super admin credentials
- [ ] Dashboard shows stat cards and revenue chart
- [ ] Create a test booking via the mobile app → verify it appears in admin within seconds (realtime)
- [ ] Confirm/cancel the booking from admin
- [ ] Assign a cleaner to the booking
- [ ] Invite a second admin via the Admins page
- [ ] Login with second admin — verify super-admin-only pages are hidden
- [ ] Edit a service in the Services page → verify it updates in the mobile app
- [ ] Export revenue CSV from the Revenue page

---

## Step 8: Set Up App Config

Go to **App Config** page and configure these values:

| Key | Description | Example Value |
|-----|-------------|---------------|
| `convenience_fee` | Flat fee per booking (₹) | `30` |
| `min_order_value` | Minimum booking total (₹) | `199` |
| `cancellation_window_hours` | Free cancellation window | `24` |
| `max_cleaner_radius_km` | Cleaner travel radius | `15` |

---

## Step 9: Add Serviceable Pincodes

Go to **Pincodes** page and add all Phagwara-area pincodes where service is active.

Example Phagwara pincodes: 144401, 144402, 144406, 144021

---

## Step 10: Custom Domain (Optional)

1. Vercel Dashboard → Your Project → **Domains**
2. Add `admin.zynkly.com` (or your chosen subdomain)
3. Update DNS records as Vercel instructs
4. Update Supabase redirect URLs (Dashboard → Authentication → URL Configuration):
   - Site URL: `https://admin.zynkly.com`
   - Redirect URLs: Add `https://admin.zynkly.com/**`

---

## Ongoing Operations

- **Adding cleaners:** Use the Cleaners page → Add Cleaner
- **Managing leaves:** Currently via direct DB edit — consider adding a UI if this is frequent
- **Monitoring:** Check `admin_logs` table periodically for unusual activity
- **Backups:** Supabase handles this automatically on Pro plan

---

Done! The Zynkly Admin Dashboard is ready for operations.
