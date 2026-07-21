# VELCARCARE CRM

A modern, mobile-first **Car Service Centre CRM** for **VELCARCARE — Multi Brand Car Service Centre**, Kanchipuram. Built as a premium "Automotive Workshop Command Center": dark charcoal sidebar, clean white workspace, strong red primary actions, rounded cards, and a step-by-step mobile workflow.

> **Live mode.** The app connects to Supabase for auth and all data. If `.env` is missing credentials it shows a "Connect Supabase" screen instead of loading.

---

## Tech stack

| Area | Choice |
|------|--------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS, custom reusable components, Lucide icons |
| Routing | React Router v6 |
| Data/State | TanStack Query + Supabase JS client |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Forms | React Hook Form + Zod (patterns wired) |
| Charts | Recharts |
| PDF | jsPDF + autoTable |
| Toasts | Sonner |
| Dates | date-fns |

No Next.js. No Firebase. The Supabase **service-role key is never** in the frontend — privileged actions run in an Edge Function.

---

## Quick start

```bash
npm install
npm run dev          # open the printed URL
npm run build        # tsc + vite build → dist/
npm run preview
```

Sign in with the **Manager email + password** you created in Supabase Auth (see step 3 below). Staff sign in with the username/email + password the Manager sets when creating their account.

---

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Run migrations** (SQL editor, in order):
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/seed.sql`
3. **Create the Manager** in Authentication → Users → *Add user* (email `velcarcarekpm@gmail.com`, set a password, tick **Auto Confirm User**). Then run `supabase/migrations/0003_manager_profile.sql` — it finds that user by email and links the Manager profile (no UID to paste). If you used a different email, change it at the bottom of that file first.
4. **Configure env**: copy `.env.example` → `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-public-key>
   ```
   With real values present the app uses live Supabase auth + data.
5. **Enable staff creation**: run `supabase/migrations/0005_create_staff_rpc.sql`. This adds a Manager-only `create_staff` RPC (SECURITY DEFINER) that the "Add Staff" button calls — no Edge Function or CORS setup needed. It also adds `reset_user_password(email, password)` for the Manager.
   - A `create-staff` Edge Function is also included under `supabase/functions/` as an alternative; if you prefer it, deploy with `supabase functions deploy create-staff --no-verify-jwt` (the `--no-verify-jwt` flag is required so the CORS preflight isn't rejected — the function does its own Manager auth check).
6. **Storage**: create public buckets `logos`, `vehicles`, `parts`, `documents` for image/PDF uploads.

---

## Access model

- **Manager** — full access; creates/edits/deactivates staff, manages permissions, company settings, GST, inventory, reports.
- **Staff** — permission-based. The Manager toggles **View / Add / Edit / Delete / Print / Download / WhatsApp** per module (Dashboard, Customers, Vehicles, Bookings, Job Cards, Inspection, Services, Estimates, Invoices, Payments, Inventory, Purchases, Reminders, Reports).

Staff IDs auto-generate as `VCC-STF-001`, `VCC-STF-002`, … RLS enforces the same permissions at the database layer via `is_manager()` and `has_perm(module, action)`.

---

## Project structure

```
src/
  components/
    ui/            Button, Card, Input, Dialog, StatusBadge, Logo, Misc…
    layout/        AppSidebar, TopHeader, MobileBottomNav, MobileDrawer, AppLayout
    common/        StatCard, StepProgress, SearchFilterBar, ActionButtons,
                   GlobalSearch, Guards, ImageUpload
    catalogue/     CarBrandCard, CarModelCard, SparePartCard, ServiceCard
  context/         AuthContext, SettingsContext
  config/          nav.ts
  data/            carCatalogue.ts (built-in brands+models), mockData.ts
  lib/             supabase, types, permissions, pdf, utils
  pages/           Dashboard, Login, Settings, Staff, Reports, …
                   customers/  vehicles/  jobcards/  invoices/  inventory/  purchases/
supabase/
  migrations/      0001_schema, 0002_rls, 0003_manager_profile
  functions/       create-staff  (Edge Function)
  seed.sql
```

---

## Key flows implemented

- **Step-by-step customer + vehicle wizard**: Customer → Brand → Model → Variant & Year → Vehicle → Confirm, with duplicate-phone detection and image cards.
- **Built-in Indian car catalogue** (old + current models) in DB tables + a full local dataset.
- **Job Card builder**: complaints, service selection, vehicle-filtered spare-part tabs, live summary, convert to invoice.
- **3-step invoice builder** with GST/non-GST, branded **PDF download**, and WhatsApp share message.
- **Inventory** with low-stock alerts and stock-movement model.
- **Purchases** with inline vendor details (no separate supplier module) — stock increases on confirm.
- **Settings**: editable company details and a GST number the Manager can enter/edit/disable (never hardcoded), with a live invoice preview.
- **WhatsApp**: prefilled `wa.me` messages for invoices, reminders and status updates (download PDF, then attach).

---

## Inventory rules (as specified)

Stock **increases** on confirmed purchase. Stock **decreases** only when a job-card part is marked *used* or an invoice is *confirmed* — never on estimates or draft invoices. `invoices.stock_deducted` and `job_card_parts.used` guard against double deduction when converting estimate → invoice or job card → invoice. Every change is written to `stock_movements`.

---

## Branding

The logo lives at `public/logo.svg` (used in login, sidebar, mobile header, invoices, PDFs, settings preview). Replace it with the official artwork — everything picks it up automatically. Company name, address, phones (9787549179 / 7339477926), WhatsApp and email are pre-seeded and editable in Settings.

---

## Live data

All list/detail pages, the dashboard, global search and settings read from Supabase via TanStack Query hooks (`src/hooks/data.ts` → `src/lib/api.ts`). Create flows that persist to Supabase: **Customer wizard** (customer + vehicle), **Add Vehicle**, **Add Spare Part**, **New Purchase**, **Staff creation** (via the `create-staff` Edge Function), **Settings**, and **Job Card status** updates. A fresh project starts empty — add your first customer to see live activity.

## Roadmap (next passes)

- Persist Job Card and Invoice line items on save (builders currently compute totals live from the catalogue; wiring their inserts + stock deduction is the next step).
- Link purchase items to catalogue parts to auto-increment stock + write `stock_movements`.
- Excel import/export for catalogue and reports; estimate/inspection persistence.
