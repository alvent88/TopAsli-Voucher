# URGENT FIX: Clerk Custom Domain Issue

## Problem Identified

Dari screenshot console error:
```
e@https://clerk.topasli.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js:8:1493
```

**Root cause:** Clerk SDK trying to load from `clerk.topasli.com` tapi **DNS/CNAME tidak pointing ke Clerk servers dengan benar**.

## Immediate Solution: Disable Custom Domain

### Step 1: Go to Clerk Dashboard
1. Login https://dashboard.clerk.com
2. Select "TopAsli" application
3. **Make sure you're in PRODUCTION mode** (toggle kanan atas)

### Step 2: Disable Custom Domain (Temporary)
**Path:** Dashboard → **Settings** → **Domains** (atau **Paths**)

**Action:**
1. Find "Frontend API" domain setting
2. Current: `clerk.topasli.com`
3. **Change to:** Leave EMPTY or use Clerk's default
4. Save changes

**Alternative if you can't disable:**
1. Go to Clerk Dashboard → **Domains**
2. Click on `clerk.topasli.com`
3. **Remove** or **Disable** the domain temporarily
4. This will force Clerk to use default domain: `<your-app-id>.clerk.accounts.dev`

### Step 3: Get New Publishable Key

After disabling custom domain:

1. Go to **API Keys** in Clerk Dashboard
2. Your **Publishable Key** might have changed
3. It should now be something like: `pk_live_<base64-encoded-clerk-accounts-dev-url>`
4. **Copy the new key**

### Step 4: Update Frontend

Replace publishable key di `/frontend/App.tsx`:

**NEW KEY dari Clerk Dashboard** (setelah disable custom domain)

Expected format akan seperti:
```typescript
const PUBLISHABLE_KEY = "pk_live_..."; // Will be different after domain change
```

### Step 5: Update Backend Secret Key

Jika secret key juga berubah (unlikely, tapi check):

1. Clerk Dashboard → API Keys → **Secret Key**
2. Copy `sk_live_...`
3. Update di Leap Settings → Secrets → `ClerkSecretKey`

---

## Why This Happens?

**Custom domain `clerk.topasli.com` requires:**

1. ✅ DNS CNAME record pointing to Clerk
2. ✅ SSL certificate verified
3. ✅ Clerk backend configuration
4. ❌ **Proper propagation time** (can take hours)

**Your DNS might be:**
- Still propagating
- Pointing to wrong server
- Missing required CNAME records

---

## Testing After Fix

1. Clear browser cache
2. Open https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/register
3. Input email `alvent88@gmail.com`
4. Klik "Kirim Kode OTP"
5. Should work immediately (no custom domain issues)
6. Check Clerk Dashboard → Logs for `email.sent` event

---

## Re-enable Custom Domain Later (Optional)

Once email OTP is working with default domain:

### Required DNS Records for clerk.topasli.com:

Get exact values from Clerk Dashboard → Domains → clerk.topasli.com

**Example (your actual values will differ):**

```
Type: CNAME
Host: clerk
Value: clerk-proxy.clerk.services
TTL: Auto or 3600
```

**Verify DNS propagation:**
```bash
nslookup clerk.topasli.com
# Should return: clerk-proxy.clerk.services or similar
```

**Wait 1-24 hours** for full DNS propagation before re-enabling custom domain.

---

## Alternative Quick Fix: Use Accounts Domain

Instead of `clerk.topasli.com`, you can use:

**accounts.topasli.com** (if this DNS is working)

1. Clerk Dashboard → Domains
2. Set Frontend API to: `accounts.topasli.com`
3. Verify DNS CNAME for `accounts` subdomain
4. Get new publishable key
5. Update frontend

---

## Expected Behavior After Fix

**Console should show:**
```
Clerk: Clerk has been loaded successfully
```

**NOT:**
```
Error loading from https://clerk.topasli.com/...
```

**Logs in Clerk Dashboard:**
```
12:34:01 - sign_up.created (alvent88@gmail.com)
12:34:02 - email.prepared (verification_code)
12:34:03 - email.sent (notifications@topasli.com → alvent88@gmail.com)
```

---

## Priority Action NOW

1. **Disable clerk.topasli.com** custom domain in Clerk Dashboard
2. **Get new publishable key** after disabling
3. **Update frontend** with new key
4. **Test immediately**
5. **Check logs** for email.sent event

Custom domain setup dapat dilakukan **SETELAH** email OTP confirmed working dengan default Clerk domain!
