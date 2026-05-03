# Premium Real Estate Next.js Template

A client-ready real estate website built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, and a rule-based AI Property Assistant.

## Install

```bash
npm install
cp .env.example .env
```

Update `.env` with your PostgreSQL, auth, email, Cloudinary, and public site URL values.

## Database Setup

Use any PostgreSQL provider, including Neon, Supabase, Railway, or a managed VPS database.

```bash
npm run db:migrate
npx prisma generate
```

For production:

```bash
npm run db:deploy
npx prisma generate
```

## Seed Demo Properties

```bash
npm run db:seed
```

Default seed admin:

```text
Email: admin@gmail.com
Password: admin123
```

Change these before using the project for a real client.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Customize For A New Client

Edit:

```text
data/siteConfig.ts
```

Update brand name, tagline, logo text, contact details, WhatsApp number, address, map location, hero copy, currency, business hours, social links, and SEO defaults.

Client-specific content should come from:

- `data/siteConfig.ts` for branding/contact/SEO
- PostgreSQL via Prisma for properties and enquiries
- Admin pages under `/admin/properties` and `/admin/enquiries`

## Admin Workflow

Log in as an admin and use:

```text
/admin/properties
/admin/properties/new
/admin/enquiries
```

Admins can create, edit, soft delete, feature, and change property status.

## AI Property Assistant

The floating “AI Property Assistant” is rule-based and does not require a paid AI API. It asks for budget, location, property type, name, and phone, suggests matching listings from `/api/properties`, and saves the lead through `/api/enquiries`.

## Deploy On Vercel With Neon Or Supabase

1. Create a PostgreSQL database on Neon or Supabase.
2. Copy the connection string into `DATABASE_URL`.
3. Add all `.env.example` variables in Vercel Project Settings.
4. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the production domain.
5. Run migrations:

```bash
npm run db:deploy
```

6. Deploy from Vercel.

## Production Checklist

- Replace seed admin credentials.
- Update `data/siteConfig.ts`.
- Add real SMTP credentials.
- Add real Cloudinary credentials for upload flows.
- Set `NEXT_PUBLIC_SITE_URL`.
- Verify sitemap at `/sitemap.xml`.
- Verify robots at `/robots.txt`.
