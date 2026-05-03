# Deployment Guide

## Recommended Platform

Use Vercel for this project.

This is a dynamic Next.js app with App Router, API routes, NextAuth, Prisma, PostgreSQL, Cloudinary uploads, sitemap, robots, and middleware/proxy behavior. Vercel supports this setup with the least configuration.

Netlify can host Next.js apps, but for this project Vercel is the safer choice because auth, API routes, server rendering, and Prisma are first-class there.

## Before Uploading To GitHub

Run:

```bash
npm install
npm run lint
npm run build
```

Do not upload real `.env` files. Only `.env.example` should be committed.

## GitHub Upload

```bash
git init
git add .
git commit -m "Initial real estate app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Vercel Deployment

1. Push the repo to GitHub.
2. Open `https://vercel.com/new`.
3. Import the GitHub repository.
4. Keep the default build settings:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: leave empty
```

5. Add environment variables from `.env.example` in Vercel:

```text
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_SITE_URL
ADMIN_EMAIL
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_MAPS_API_KEY
```

6. Set production URLs:

```text
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

7. Deploy.

## Database

Use a hosted PostgreSQL database such as Neon, Supabase, Railway, or Vercel Postgres.

After setting `DATABASE_URL`, run migrations locally against the production database:

```bash
npm run db:deploy
```

Optional demo data:

```bash
npm run db:seed
```

Change seed admin credentials before using this for a real client.

## Production Checklist

- Generate a fresh `NEXTAUTH_SECRET`.
- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the live domain.
- Add real SMTP credentials.
- Add Cloudinary credentials for image uploads.
- Update `data/siteConfig.ts` with client branding and contact details.
- Run `npm run db:deploy`.
- Test login, admin property creation, enquiry form, chatbot lead flow, and image uploads.
- Check `/sitemap.xml` and `/robots.txt` after deployment.

## Netlify Note

Use Netlify only if you specifically want Netlify. Do not drag and drop `.next`; this app needs a Next.js runtime for server routes. Connect the GitHub repo through Netlify and use:

```text
Build command: npm run build
Publish directory: .next
```

If Prisma or NextAuth server routes behave differently on Netlify, move the deployment to Vercel.
