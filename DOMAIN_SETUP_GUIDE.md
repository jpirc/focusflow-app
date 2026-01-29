# Dopatika Domain Setup Guide

## Overview
This guide walks you through connecting **dopatika.com** (purchased on Cloudflare) to your Vercel deployment.

---

## Step 1: Verify the Rename

Before deploying, make sure everything looks good locally:

```bash
# The dev server should already be running, check it out at:
# http://localhost:3000

# Look for:
# - "Dopatika" in the browser tab title
# - "Dopatika" in the sidebar
# - "Sign in to Dopatika" on the login page
# - Check browser console for migration messages like:
#   "[Dopatika] Running localStorage migration from FocusFlow..."
```

---

## Step 2: Push the Rename Branch to GitHub

```bash
# Make sure all changes are committed
git add -A
git commit -m "feat: rename to Dopatika

- Update all branding from FocusFlow to Dopatika
- Add localStorage migration to preserve user data
- Update package name and meta tags
- Prepare for dopatika.com domain

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push the branch
git push origin rename-to-dopatika
```

---

## Step 3: Deploy to Vercel (Test First)

### Option A: Deploy Branch for Testing
1. Go to https://vercel.com/dashboard
2. Find your project: `focusflow-app-self`
3. Go to **Git** tab
4. Enable deployments for the `rename-to-dopatika` branch
5. Vercel will auto-deploy at: `https://focusflow-app-self-git-rename-to-dopatika.vercel.app`
6. Test thoroughly before proceeding!

### Option B: Merge to Main (Production)
Once testing is complete:
```bash
git checkout main
git merge rename-to-dopatika
git push origin main
```

---

## Step 4: Connect Domain in Vercel

1. **Go to Vercel Dashboard**:
   - Navigate to your project
   - Click **Settings** → **Domains**

2. **Add Custom Domain**:
   - Enter: `dopatika.com`
   - Also add: `www.dopatika.com` (recommended)
   - Click **Add**

3. **Vercel will provide DNS records**. You'll see something like:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

---

## Step 5: Configure DNS in Cloudflare

1. **Log into Cloudflare**:
   - Go to https://dash.cloudflare.com
   - Select your domain: `dopatika.com`

2. **Add DNS Records**:
   - Go to **DNS** → **Records**

   **For root domain (@):**
   - Type: `A`
   - Name: `@`
   - Content: `76.76.21.21` (Vercel's IP - use the one they provide)
   - Proxy status: DNS only (gray cloud) - IMPORTANT!

   **For www subdomain:**
   - Type: `CNAME`
   - Name: `www`
   - Content: `cname.vercel-dns.com` (use the one Vercel provides)
   - Proxy status: DNS only (gray cloud)

3. **Disable Cloudflare Proxy** (at least initially):
   - Click the orange cloud next to each record
   - Make it gray ("DNS only")
   - This ensures Vercel can issue SSL certificates

---

## Step 6: Update Environment Variables

In Vercel, update these environment variables:

1. Go to **Settings** → **Environment Variables**
2. Update or add:
   ```
   NEXTAUTH_URL=https://dopatika.com
   ```
3. Redeploy the app for changes to take effect

---

## Step 7: Wait for DNS Propagation

- DNS changes can take 5-60 minutes
- Check status: https://www.whatsmydns.net/
- Enter: `dopatika.com`

---

## Step 8: Enable HTTPS/SSL

1. Once Vercel verifies domain ownership:
   - SSL certificates are issued automatically
   - This usually takes 1-2 minutes after DNS propagates

2. **Force HTTPS redirect**:
   - In Vercel project settings
   - **Domains** → Click your domain
   - Enable "Redirect to HTTPS"

---

## Step 9: Optional - Enable Cloudflare Proxy

After SSL is working:
1. Go back to Cloudflare DNS
2. Enable proxy (orange cloud) on both records
3. Benefits:
   - DDoS protection
   - CDN caching
   - Analytics

**Cloudflare Settings to Configure:**
- SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: **On**
- Automatic HTTPS Rewrites: **On**

---

## Step 10: Update OAuth Callbacks

If using Google OAuth, update redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth 2.0 Client
3. Add authorized redirect URIs:
   ```
   https://dopatika.com/api/auth/callback/google
   https://www.dopatika.com/api/auth/callback/google
   ```

---

## Testing Checklist

Once deployed to dopatika.com:

- [ ] Homepage loads correctly
- [ ] "Dopatika" appears in all branding
- [ ] Login works with Google OAuth
- [ ] Existing users' preferences are preserved (check browser console for migration logs)
- [ ] Tasks load correctly
- [ ] Timeline view works
- [ ] All features function as expected
- [ ] Mobile responsive design works
- [ ] SSL certificate is valid (green padlock)

---

## Troubleshooting

### Domain not connecting?
- Wait 1 hour for full DNS propagation
- Verify DNS records match exactly what Vercel provides
- Check Cloudflare proxy is disabled initially

### SSL errors?
- Ensure Cloudflare SSL mode is "Full (strict)"
- Wait for Vercel to issue certificate (can take a few minutes)
- Try disabling Cloudflare proxy temporarily

### OAuth not working?
- Check NEXTAUTH_URL is set to `https://dopatika.com`
- Verify Google OAuth redirect URIs include new domain
- Redeploy after changing environment variables

### Migration issues?
- Check browser console for migration logs
- Migration only runs once (check localStorage for `dopatika_migration_complete`)
- If needed, clear localStorage and reload

---

## Rollback Plan

If something goes wrong:

1. **DNS Level**: Change Cloudflare DNS back to Vercel's focusflow-app-self.vercel.app
2. **Git Level**:
   ```bash
   git checkout main
   git push origin main
   ```
3. **Vercel Level**: Use "Revert to Previous Deployment" in Vercel dashboard

---

## Post-Launch Tasks

- [ ] Update README.md with new domain
- [ ] Update any marketing materials
- [ ] Set up analytics (Vercel Analytics, Google Analytics, etc.)
- [ ] Monitor error logs for any migration issues
- [ ] Announce the rename to users (if any)
- [ ] Set up monitoring/uptime checks

---

## Questions?

If you run into any issues during deployment, check:
- Vercel deployment logs
- Browser console for errors
- Cloudflare DNS propagation status
- Vercel domain verification status

Good luck with the launch! 🚀
