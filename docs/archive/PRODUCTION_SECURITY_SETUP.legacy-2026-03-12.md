# Production Security Setup for Dopatika

## 🔒 High Priority Security Configuration

Follow these steps **before** launching dopatika.com to production.

---

## 1. Update Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Select your project: `focusflow-app-self`
3. Go to **Settings** → **Environment Variables**

### Step 2: Update NEXTAUTH_SECRET
This is **CRITICAL** - your current secret is a placeholder.

1. Find `NEXTAUTH_SECRET` or add it if missing
2. Replace with this newly generated secure secret:
   ```
   Zav8JBKJSJVggrlVOnST85Gebg5I3KFJd2Sef3n7Kmo=
   ```
3. Select environments: **Production**, **Preview**, **Development**
4. Click **Save**

### Step 3: Update NEXTAUTH_URL
1. Find `NEXTAUTH_URL` or add it if missing
2. Set to: `https://dopatika.com`
3. Select environments: **Production** only
4. Click **Save**

### Step 4: Verify Other Required Variables
Ensure these are set (check your current values):
- ✅ `DATABASE_URL` - Supabase connection pooling URL
- ✅ `DIRECT_URL` - Supabase direct connection URL
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- ✅ `OPENAI_API_KEY` - OpenAI API key (optional)

### Step 5: Redeploy
After updating environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋮** (three dots) → **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## 2. Update Google OAuth Callbacks

### Why This Is Important:
Google OAuth won't work on dopatika.com until you add the new domain to authorized callbacks.

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID (used in your app)
4. Click to edit it
5. Under **Authorized redirect URIs**, add:
   ```
   https://dopatika.com/api/auth/callback/google
   https://www.dopatika.com/api/auth/callback/google
   ```
6. **Keep the old URLs** for now (in case you need to rollback):
   ```
   https://focusflow-app-self.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
7. Click **Save**

### Testing:
After updating:
1. Visit https://dopatika.com/login
2. Click "Continue with Google"
3. Verify it redirects properly and logs you in

---

## 3. HTTPS / SSL Setup (Connection Security)

### Why You're Seeing "Not Secure" Warning

**On localhost (http://localhost:3000):**
- ❌ Shows "Not secure" - This is **NORMAL** for local development
- Chrome warns because it's using HTTP, not HTTPS
- **This is fine** - localhost is only accessible to you

**On production (https://dopatika.com):**
- ✅ Will show green padlock - automatically secured by Vercel
- Vercel provides free SSL certificates via Let's Encrypt
- HTTPS is enabled automatically when you connect your domain

### How Vercel Provides HTTPS:
1. When you connect dopatika.com in Vercel (Step 4 of DOMAIN_SETUP_GUIDE.md)
2. Vercel automatically:
   - Issues an SSL certificate
   - Enables HTTPS
   - Redirects HTTP → HTTPS
3. You don't need to do anything!

### To Verify HTTPS Is Working:
Once your domain is connected:
1. Visit `https://dopatika.com`
2. Check for green padlock 🔒 in Chrome address bar
3. Click padlock → should show "Connection is secure"

### If SSL Isn't Working:
See troubleshooting in DOMAIN_SETUP_GUIDE.md:
- Wait for DNS propagation (5-60 minutes)
- Ensure Cloudflare proxy is disabled initially
- Check Vercel domain verification status
- Set Cloudflare SSL/TLS mode to "Full (strict)" if using Cloudflare proxy

---

## 4. Security Checklist Before Launch

Before making dopatika.com live, verify:

- [ ] NEXTAUTH_SECRET updated in Vercel with secure random value
- [ ] NEXTAUTH_URL set to `https://dopatika.com` in Vercel Production
- [ ] Google OAuth callbacks updated with dopatika.com URLs
- [ ] Test login with credentials (email/password)
- [ ] Test login with Google OAuth
- [ ] Verify HTTPS is working (green padlock)
- [ ] Check that non-authenticated users are redirected to /login
- [ ] Test that old focusflow localStorage data migrates properly
- [ ] Verify all API routes require authentication

---

## 5. Post-Launch Security Monitoring

### Week 1:
- Monitor Vercel logs for authentication errors
- Check browser console for any security warnings
- Test registration flow with a new account
- Verify password hashing is working (check database)

### Ongoing:
- Rotate NEXTAUTH_SECRET periodically (every 90 days)
- Monitor failed login attempts
- Keep dependencies updated: `npm audit`
- Review Vercel deployment logs weekly

---

## 6. Future Security Enhancements (Medium Priority)

After launch, consider implementing:

1. **Password Requirements**
   - Minimum 8 characters
   - Require mix of uppercase, lowercase, numbers
   - Add password strength indicator

2. **Rate Limiting**
   - Limit login attempts (5 per 15 minutes)
   - Limit registration attempts
   - Use Vercel Edge Config or Upstash Redis

3. **Email Verification**
   - Send verification email on registration
   - Require verification before full access
   - Use SendGrid, Resend, or similar service

4. **Password Reset**
   - "Forgot password" link on login page
   - Email with time-limited reset token
   - Secure token generation and validation

5. **Account Security**
   - Lock account after 5 failed login attempts
   - Email notification of new logins
   - Session management UI (logout all devices)

---

## 7. Emergency Rollback

If something goes wrong after launch:

1. **Environment Variables**:
   - Revert NEXTAUTH_URL in Vercel
   - Redeploy

2. **OAuth Issues**:
   - Add back old redirect URIs in Google Console

3. **Domain Issues**:
   - Point DNS back to old Vercel URL
   - See DOMAIN_SETUP_GUIDE.md "Rollback Plan"

4. **Database Issues**:
   - Database is unchanged by these updates
   - No rollback needed

---

## Need Help?

If you encounter issues:
- Check Vercel deployment logs
- Check browser console for errors
- Verify environment variables are set correctly
- Check Google OAuth configuration
- Review DOMAIN_SETUP_GUIDE.md for domain setup issues

---

## Summary

**What you need to do NOW:**
1. ✅ Update NEXTAUTH_SECRET in Vercel (use the generated secret above)
2. ✅ Update NEXTAUTH_URL to `https://dopatika.com` in Vercel
3. ✅ Update Google OAuth callbacks with dopatika.com URLs

**What happens automatically:**
- ✅ Vercel provides HTTPS/SSL for free
- ✅ Green padlock appears on production
- ✅ HTTP → HTTPS redirect is automatic

**Local development:**
- ⚠️ "Not secure" warning is normal on localhost
- ⚠️ This doesn't affect your production site
- ⚠️ No action needed for local development

Your production site will be fully secure once you complete steps 1-3! 🔒
