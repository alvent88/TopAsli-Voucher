# DNS Setup Guide for Clerk Production

## 🎯 Goal
Setup DNS records agar `clerk.topasli.com` pointing ke Clerk servers dengan benar.

---

## Step 1: Get Required DNS Records

### A. Login ke Clerk Dashboard
1. Buka https://dashboard.clerk.com
2. Pilih application "TopAsli"
3. **PASTIKAN di PRODUCTION mode** (toggle kanan atas)

### B. Access Domains Page
**Path:** Dashboard → **Domains**

### C. Find CNAME Record Requirements

Klik pada domain `clerk.topasli.com` untuk melihat required DNS records.

**Expected information:**
```
Type: CNAME
Host: clerk
Value: clerk-proxy.clerk.services
```

**ATAU bisa jadi format lain seperti:**
```
Type: CNAME
Host: clerk.topasli.com
Value: <unique-id>.clerk.accounts.dev
```

**📸 SCREENSHOT ini untuk reference!**

---

## Step 2: Determine Your DNS Provider

**Where is `topasli.com` domain registered/managed?**

Common providers:
- Cloudflare
- Namecheap
- GoDaddy
- Google Domains
- Route 53 (AWS)
- Other

**Check:** Login ke registrar account Anda atau check nameservers:

```bash
nslookup -type=NS topasli.com
```

---

## Step 3: Add CNAME Record

### For Cloudflare:

1. Login https://dash.cloudflare.com
2. Select domain: `topasli.com`
3. Go to **DNS** → **Records**
4. Click **+ Add record**
5. Fill in:
   ```
   Type: CNAME
   Name: clerk
   Target: <value-from-clerk-dashboard>
   Proxy status: DNS only (IMPORTANT!)
   TTL: Auto
   ```
6. **Click Save**

**⚠️ CRITICAL for Cloudflare:**
- Set Proxy status to **"DNS only"** (gray cloud icon)
- NOT "Proxied" (orange cloud)
- Clerk needs direct DNS access

### For Namecheap:

1. Login https://www.namecheap.com
2. Go to **Domain List** → Manage `topasli.com`
3. Click **Advanced DNS**
4. Click **+ Add New Record**
5. Fill in:
   ```
   Type: CNAME Record
   Host: clerk
   Value: <value-from-clerk-dashboard>
   TTL: Automatic
   ```
6. **Click Save**

### For GoDaddy:

1. Login https://www.godaddy.com
2. Go to **My Products** → **DNS**
3. Select domain `topasli.com`
4. Click **Add** under DNS Records
5. Fill in:
   ```
   Type: CNAME
   Name: clerk
   Value: <value-from-clerk-dashboard>
   TTL: 1 hour
   ```
6. **Click Save**

### For Google Domains:

1. Login https://domains.google.com
2. Select `topasli.com` → **DNS**
3. Scroll to **Custom records**
4. Click **Manage custom records**
5. Fill in:
   ```
   Host name: clerk
   Type: CNAME
   TTL: 1 hour
   Data: <value-from-clerk-dashboard>
   ```
6. **Click Save**

---

## Step 4: Verify DNS Propagation

### A. Wait Initial Period
**Minimum:** 5-10 minutes after adding record

### B. Check DNS Resolution

**Option 1: Using nslookup (Terminal/CMD)**
```bash
nslookup clerk.topasli.com
```

**Expected output:**
```
Server:  dns.google
Address:  8.8.8.8

Non-authoritative answer:
clerk.topasli.com    canonical name = clerk-proxy.clerk.services
Name:    clerk-proxy.clerk.services
Address:  <IP-address>
```

**Option 2: Using dig (Mac/Linux)**
```bash
dig clerk.topasli.com
```

**Look for CNAME in ANSWER SECTION:**
```
;; ANSWER SECTION:
clerk.topasli.com.  300  IN  CNAME  clerk-proxy.clerk.services.
```

**Option 3: Online Tool**
- Visit: https://dnschecker.org
- Enter: `clerk.topasli.com`
- Type: CNAME
- Check multiple locations worldwide

**✅ Success indicators:**
- CNAME points to Clerk's servers
- No "NXDOMAIN" errors
- Consistent results across locations

---

## Step 5: Verify in Clerk Dashboard

### A. Check Domain Status
**Path:** Dashboard → Domains → `clerk.topasli.com`

**Status should change from:**
- ❌ "Not verified" / "Pending"
- ✅ "Verified" / "Connected"

### B. Deploy Certificates

After DNS verified:

1. **"Deploy certificates" button** will appear
2. Click the button
3. Clerk will provision TLS certificates (LetsEncrypt)
4. Wait 1-5 minutes
5. Certificate status → "Active"

---

## Step 6: Test Custom Domain

### A. Browser Test
Open: `https://clerk.topasli.com`

**Expected:**
- ✅ Clerk page loads (or redirect)
- ✅ Valid SSL certificate
- ❌ NOT 404 error
- ❌ NOT SSL warning

### B. Check Clerk SDK Loading
Open: `https://clerk.topasli.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js`

**Expected:**
- ✅ JavaScript file loads
- ❌ NOT 404 error

---

## Step 7: Update Application & Test

### A. Update to Production Keys

**Frontend (`/frontend/App.tsx`):**
```typescript
const PUBLISHABLE_KEY = "pk_live_Y2xlcmsudG9wYXNsaS5jb20k";
```

**Backend (Leap Settings → Secrets):**
```
ClerkSecretKey = sk_live_<your-production-secret>
```

### B. Deploy Application
Deploy ke Leap

### C. Test Registration Flow
1. Open `/register`
2. Input email: `alvent88@gmail.com`
3. Click "Kirim Kode OTP"
4. **Email should arrive within 1-3 minutes**
5. Check inbox + spam folder
6. Email from: `noreply@clkmail.topasli.com`

---

## 🐛 Troubleshooting

### Issue 1: DNS Not Propagating

**Symptoms:**
- `nslookup clerk.topasli.com` returns NXDOMAIN
- Still showing old IP or no record

**Solutions:**
1. Clear local DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```
2. Wait longer (up to 48 hours max)
3. Double-check DNS record in provider dashboard

### Issue 2: Clerk Shows "Not Verified"

**Symptoms:**
- DNS resolves correctly
- But Clerk Dashboard still shows "Not verified"

**Solutions:**
1. Click "Verify" button in Clerk Dashboard manually
2. Wait 5-10 minutes, refresh page
3. Check CAA records (see Issue 4)

### Issue 3: Certificate Not Deploying

**Symptoms:**
- DNS verified ✅
- But "Deploy certificates" stuck or fails

**Solutions:**
1. Check for CAA DNS records:
   ```bash
   dig topasli.com CAA
   ```
2. If CAA records exist, they might block LetsEncrypt
3. Remove CAA records OR add:
   ```
   0 issue "letsencrypt.org"
   0 issue "pki.goog"
   ```

### Issue 4: Cloudflare Proxy Interfering

**Symptoms:**
- DNS works
- But Clerk can't verify

**Solutions:**
1. Go to Cloudflare DNS settings
2. Find `clerk` CNAME record
3. Click orange cloud icon → change to **gray cloud** (DNS only)
4. Save

### Issue 5: 404 on clerk.topasli.com

**Symptoms:**
- DNS resolves ✅
- But browser shows 404

**Possible causes:**
1. Certificates not deployed yet
2. DNS not fully propagated
3. Wrong CNAME target value

**Solutions:**
1. Wait for certificate deployment
2. Verify CNAME target matches Clerk Dashboard exactly
3. Check Clerk Dashboard domain status

---

## ✅ Success Checklist

Before proceeding to production:

- [ ] DNS CNAME record added in DNS provider
- [ ] DNS propagation verified (`nslookup` shows CNAME)
- [ ] Clerk Dashboard shows "Verified" status
- [ ] Certificates deployed successfully
- [ ] `https://clerk.topasli.com` loads without errors
- [ ] Clerk SDK JS file accessible
- [ ] Production keys updated in code
- [ ] Application deployed to Leap
- [ ] Registration test successful
- [ ] Email OTP received in inbox

---

## 📞 Need Help?

**If DNS setup stuck after 24 hours:**

1. **Screenshot:**
   - DNS records in provider dashboard
   - Clerk Dashboard domain status
   - `nslookup` output
   
2. **Contact Clerk Support:**
   - Discord: https://clerk.com/discord
   - Dashboard → Help → Contact Support
   
3. **Share:**
   - Domain: topasli.com
   - Subdomain: clerk.topasli.com
   - DNS provider name
   - Screenshots above

---

## ⏱️ Estimated Timeline

- **DNS record creation:** 2 minutes
- **Initial propagation:** 5-30 minutes  
- **Full global propagation:** 1-24 hours
- **Certificate deployment:** 1-5 minutes (after DNS verified)
- **Total time:** Usually 30 minutes to 2 hours

**Best case:** Working in 30 minutes
**Worst case:** Working in 48 hours
**Average:** Working in 1-4 hours
