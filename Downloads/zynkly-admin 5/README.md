# Zynkly Admin Dashboard

A production-ready web admin panel for the Zynkly cleaning services platform, serving Phagwara, Punjab, India.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite + React 18 |
| Language | JavaScript (no TypeScript) |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 + shadcn/ui primitives |
| Backend | Supabase (existing project) |
| Auth | Supabase Auth (email/password) |
| State | Zustand (auth) + TanStack React Query (server) |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Dates | date-fns |
| Toasts | Sonner |
| Deploy | Vercel |

---

## Prerequisites

- Node.js 18+
- npm 9+
- Access to the Zynkly Supabase project

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd zynkly-admin
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Zynkly Admin
```

> Never put the service role key here. It would leak to the browser. Privileged operations use Edge Functions.

### 3. Apply database migrations

Run these SQL files via the Supabase Dashboard SQL editor (in order):

1. `supabase/migrations/20240101000001_create_admins_table.sql`
2. `supabase/migrations/20240101000002_admin_rls_policies.sql`

### 4. Create the first Super Admin

After running migrations:

1. Go to Supabase Dashboard -> Authentication -> Users
2. Create a new user with your admin email and password
3. Copy the user's UUID
4. Run in SQL editor:

```sql
INSERT INTO public.admins (user_id, email, name, role)
VALUES (
  'YOUR-USER-UUID-HERE',
  'your@email.com',
  'Your Name',
  'super_admin'
);
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:5173

---

## Deploying to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: GitHub integration

1. Push repo to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`

Build settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Add `public/vercel.json` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Supabase Edge Functions

### Deploy invite-admin Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase functions deploy invite-admin
```

---

## Roles

| Route | Admin | Super Admin |
|-------|-------|-------------|
| Dashboard | Yes | Yes |
| Bookings | Yes | Yes |
| Customers | Yes | Yes |
| Cleaners | Yes | Yes |
| Reviews | Yes | Yes |
| Revenue | Yes | Yes |
| Support | Yes | Yes |
| Services | No | Yes |
| Pincodes | No | Yes |
| Admins | No | Yes |
| Waitlist | No | Yes |
| Legal | No | Yes |
| App Config | No | Yes |

---

## Development Notes

- All API calls use the Supabase anon key -- RLS enforces access control
- Bookings receive real-time updates via Supabase Realtime postgres_changes
- Admin actions are logged to `admin_logs` table
- See `DECISIONS.md` for architectural decisions
- See `SETUP_CHECKLIST.md` for deployment checklist
