# Deploying to Vercel

This guide explains how to deploy this Next.js portfolio site to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- This repository pushed to GitHub, GitLab, or Bitbucket
- The Vercel CLI (optional, for command-line deployments)

## Initial Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Import this repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `pnpm build` (auto-detected from package.json)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install` (auto-detected)

3. **Update Base URL**
   - After deployment, note your production URL (e.g., `your-site.vercel.app`)
   - Update `baseUrl` in `app/sitemap.ts` to match your production domain
   - Commit and push this change

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your site automatically

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   ```

## Continuous Deployment

Once connected, Vercel automatically deploys:
- **Production**: Every push to the `main` branch
- **Preview**: Every push to other branches and pull requests

## Custom Domain Setup

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Vercel
5. Update `baseUrl` in `app/sitemap.ts` to your custom domain
6. Commit and push the change

## Environment Variables

This project doesn't currently use environment variables. If you add any in the future:

1. Go to Project Settings → Environment Variables
2. Add variables for Production, Preview, and/or Development
3. Redeploy for changes to take effect

## Build Settings

Vercel auto-detects these settings from `package.json`:

- **Package Manager**: pnpm
- **Node.js Version**: Specified in `.nvmrc`
- **Build Command**: `pnpm build`
- **Dev Command**: `pnpm dev`
- **Install Command**: `pnpm install`

## Post-Deployment Checklist

After your first deployment:

- [ ] Update `baseUrl` in `app/sitemap.ts` to your production URL
- [ ] Test the sitemap at `/sitemap.xml`
- [ ] Test the RSS feed at `/rss`
- [ ] Verify Open Graph images at `/og`
- [ ] Check Vercel Analytics is working (if enabled)
- [ ] Test all routes: `/`, `/blog`, `/map`
- [ ] Verify blog posts are rendering correctly
- [ ] Test object detection demo (requires camera permissions)

## Troubleshooting

### Build Fails with Type Errors

The project has `strict: false` in `tsconfig.json`, but if you encounter type errors:
```bash
# Check types locally
npx tsc --noEmit
```

### pnpm Not Found

Vercel should auto-detect pnpm from `pnpm-lock.yaml`. If it doesn't:
1. Go to Project Settings → General
2. Set "Package Manager" to "pnpm"

### Wrong Node Version

Vercel reads the Node.js version from `.nvmrc`. To update:
1. Edit `.nvmrc` with desired version
2. Commit and push

### Sitemap Shows Wrong URLs

Update `baseUrl` in `app/sitemap.ts` to match your production domain, then redeploy.

## Redeploying

### From Dashboard
1. Go to your project on Vercel
2. Click "Deployments"
3. Click "..." on any deployment
4. Click "Redeploy"

### From CLI
```bash
# Redeploy latest commit to production
vercel --prod
```

### Via Git
```bash
# Trigger automatic deployment
git push origin main
```

## Vercel-Specific Features

This project includes:
- **Vercel Analytics**: Tracks page views (configured in `app/layout.tsx`)
- **Vercel Speed Insights**: Monitors Core Web Vitals (configured in `app/layout.tsx`)

These features are automatically enabled on Vercel and disabled in local development.

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
