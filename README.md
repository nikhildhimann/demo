# Real Estate Platform - Package 2 (Growth System)

A high-performance, SEO-optimized, Next.js 14 real estate platform with an integrated CMS, CRM, and AI Property Assistant. 

## Key Features
- **Public Website:** Stunning UI, responsive design, fast performance (optimized Core Web Vitals).
- **SEO Engine:** Dynamic meta tags, Open Graph, dynamic XML sitemap, canonical URLs, JSON-LD Schema (RealEstateAgent, Residence, BreadcrumbList), and programmatic SEO landing pages (`/properties/in/[city]/[type]`).
- **Admin Dashboard:** Secure CMS to manage properties, leads, CRM, and site settings.
- **Smart Lead Generation:** AI Property Assistant (Chatbot) and dedicated Free Property Appraisal form that route leads with HOT/WARM/COLD priorities.
- **Email & WhatsApp Integration:** Automated admin notifications via Resend and direct WhatsApp click-to-chat capabilities.
- **Image Optimization:** Automated Cloudinary integration and Next.js Image optimization.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS & Framer Motion
- Database: PostgreSQL (via Prisma ORM)
- Authentication: NextAuth.js
- File Uploads: Cloudinary
- Emails: Resend

---

## Setup & Installation

### 1. Prerequisites
- Node.js (v18.17.0 or higher)
- PostgreSQL Database (Local or cloud like Neon, Supabase, Render)
- Cloudinary Account (for image uploads)
- Resend Account (for email notifications)

### 2. Environment Variables
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```
Fill out `.env` with:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: Run `openssl rand -base64 32` to generate a secure secret.
- `NEXTAUTH_URL`: Your site URL (e.g., `http://localhost:3000`).
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: From your Cloudinary dashboard.
- `RESEND_API_KEY`: From your Resend dashboard.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Run Prisma migrations to create the tables in your database:
```bash
npx prisma migrate dev --name init
```
Generate the Prisma Client:
```bash
npx prisma generate
```

### 5. Seed Database (Optional)
To set up your initial admin account and site settings:
```bash
npm run seed
```

### 6. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to view the website. Access the admin panel at `/login`.

---

## Deployment (Vercel)

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your GitHub repository.
4. Set the Build Command to `npm run build` and Install Command to `npm install`.
5. Add all Environment Variables from your `.env` file into the Vercel dashboard.
6. Click **Deploy**.

*Note: You must use a cloud PostgreSQL database (like Neon or Supabase) for production.*

## Submitting Sitemap
1. Once deployed, verify your domain in **Google Search Console**.
2. Go to the Sitemaps tab.
3. Submit `sitemap.xml` (e.g., `https://yourdomain.com/sitemap.xml`).
