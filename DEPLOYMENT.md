# Paper Perfector - Deployment Guide

Paper Perfector is ready to deploy! Choose your preferred hosting option below.

## Option 1: Vercel (Recommended) ⭐

Vercel is optimized for Vite apps and offers instant deployment.

### Quick Start (2 minutes)

1. **Install Vercel CLI** (already done)
   ```bash
   npm install -g vercel
   ```

2. **Deploy from this directory**
   ```bash
   cd "/Users/DRA/Desktop/Paper Perfector"
   vercel
   ```

3. **Follow the prompts:**
   - Log in with GitHub/GitLab/Bitbucket
   - Select a project name (e.g., `paper-perfector`)
   - Confirm build settings (already configured)
   - Deployment will start automatically

4. **Your app will be live at:** `https://paper-perfector.vercel.app` (or custom domain)

### Auto-Deployments (Optional)

To get automatic deployments on every commit:

1. Push to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/paper-perfector.git
   git branch -M main
   git push -u origin main
   ```

2. In Vercel dashboard, connect your GitHub repo
3. All future pushes to main will auto-deploy

---

## Option 2: Netlify

Another excellent alternative for static sites.

```bash
npm run build
netlify deploy --prod --dir=dist
```

---

## Option 3: GitHub Pages

Free hosting directly from GitHub.

1. Update `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/paper-perfector/',
     ...
   })
   ```

2. Build and push:
   ```bash
   npm run build
   git add -A && git commit -m "Build for production"
   git push origin main
   ```

3. Enable GitHub Pages in repo settings (Settings → Pages → Deploy from branch)

---

## Environment Variables (if needed)

No environment variables are required for Paper Perfector. It's a fully client-side app!

---

## Custom Domain

Both Vercel and Netlify allow you to add a custom domain:

**Vercel:** Settings → Domains → Add Domain
**Netlify:** Site Settings → Domain Management → Add Custom Domain

Example: `https://paperperfector.com`

---

## Monitoring

After deployment:

- ✅ Visit your live URL
- ✅ Test creating a new document
- ✅ Test the editor functionality
- ✅ Test PDF export
- ✅ Test importing a document
- ✅ Test theme toggle

---

## Sharing Your App

Once live, share the URL:

```
Try Paper Perfector: https://paper-perfector.vercel.app
Create beautiful academic documents with professional typography and instant PDF export.
```

---

## Support

If deployment fails, check:

1. Node version: `node --version` (v18+ recommended)
2. Build locally: `npm run build`
3. Vercel logs: Check Vercel dashboard for build errors
4. Clear node_modules: `rm -rf node_modules && npm install`

---

## Next Steps

1. Deploy to Vercel (5 minutes)
2. Share the live link
3. Optional: Add custom domain
4. Optional: Set up auto-deployments from GitHub

**That's it! Paper Perfector is now live.** 🚀
