# Clerk Email OTP Debugging Guide

## ✅ Code Fixes Applied

### 1. Added `isLoaded` Check
**Masalah:** API calls tanpa wait Clerk SDK fully loaded
**Fix:** Added `if (!isLoaded) return` di semua handlers

### 2. Added `<div id="clerk-captcha"></div>`
**Masalah:** Missing required bot protection element
**Fix:** Added di RegisterPage email form

---

## 🔍 How to Debug Email Delivery in Clerk Dashboard

### Step 1: Access Clerk Dashboard
1. Buka https://dashboard.clerk.com
2. Login dengan akun Anda
3. Pilih application "TopAsli"

### Step 2: Check Mode (CRITICAL!)
**Look di pojok kanan atas dashboard:**
- Pastikan toggle di **PRODUCTION** (bukan Development)
- Development mode punya limit 100 email/bulan
- Production mode punya limit lebih tinggi

### Step 3: Check Logs
**Path:** Dashboard → Logs (atau Events)

**Filter logs untuk email:**
1. Klik "Logs" di sidebar kiri
2. Filter by "Event type" → pilih "Email" atau "Verification"
3. Cari events untuk email `alvent88@gmail.com`

**Yang harus dicari:**
- ✅ `email.prepared` - Email siap dikirim
- ✅ `email.sent` - Email terkirim
- ❌ `email.failed` - Email gagal (akan ada error reason)

### Step 4: Check Email Configuration
**Path:** Dashboard → Email & SMS (atau Messaging)

**Verify settings:**
- [ ] Email verification **Enabled**?
- [ ] Verification strategy = **"Email code"** (OTP)?
- [ ] Email provider configured?
  - **Default Clerk SMTP** (built-in, gratis)
  - **Custom SMTP** (Gmail, SendGrid, etc)

**Jika pakai Default Clerk:**
- From email: `noreply@clkmail.topasli.com`
- Reply-to: `accounts@clerk.topasli.com`
- Check domain verification status

### Step 5: Check Domain Settings
**Path:** Dashboard → Domains

**Verify status:**
- `clerk.topasli.com` → **Verified** ✅
- `accounts.topasli.com` → **Verified** ✅
- `clkmail.topasli.com` → **Verified** ✅

**Jika ada yang NOT verified:**
- Klik domain tersebut
- Copy DNS records yang diminta
- Add ke DNS provider (Cloudflare/Namecheap/etc)
- Wait 5-60 minutes untuk propagation
- Klik "Verify" di Clerk Dashboard

### Step 6: Check API Keys
**Path:** Dashboard → API Keys

**Verify:**
- [ ] Publishable Key (Production): `pk_live_Y2xlcmsudG9wYXNsaS5jb20k`
- [ ] Secret Key (Production): `sk_live_...` (starts with sk_live)

**CRITICAL:** Secret key di Leap Settings harus **PRODUCTION** (`sk_live_...`), bukan development (`sk_test_...`)

---

## 🧪 Testing Email Delivery

### Test 1: Manual Test via Dashboard
**Path:** Dashboard → Users → Create user

1. Klik "Create user" button
2. Input email: `test123@gmail.com`
3. Pilih "Send verification email"
4. Check apakah email masuk

**Jika email TIDAK masuk:**
- Check Clerk Logs untuk error
- Verify email provider configured
- Check domain DNS records

### Test 2: Check Email Templates
**Path:** Dashboard → Customization → Emails (atau Templates)

1. Pilih "Verification code" template
2. Preview email
3. Check "From" address
4. Verify content tidak ada error

### Test 3: Send Test Email
**Path:** Dashboard → Messaging → Email provider

Biasanya ada button "Send test email" untuk verify SMTP working

---

## 🐛 Common Issues & Solutions

### Issue 1: Email Masuk Spam
**Symptoms:** Email terkirim tapi tidak terlihat di inbox

**Solutions:**
1. Check **Spam/Junk** folder di Gmail
2. Add `noreply@clkmail.topasli.com` ke contacts
3. Setup SPF/DKIM records untuk domain (optional, improves deliverability):
   ```
   SPF: v=spf1 include:_spf.clerk.com ~all
   DKIM: Provided by Clerk in domain settings
   ```

### Issue 2: "Email not configured"
**Symptoms:** Logs show "email provider not configured"

**Solutions:**
1. Go to Dashboard → Messaging → Email
2. Choose email provider:
   - **Default Clerk** (recommended, no setup needed)
   - **Custom SMTP** (Gmail, SendGrid, AWS SES, etc)
3. If custom, fill in SMTP credentials
4. Save and test

### Issue 3: Rate Limit Exceeded
**Symptoms:** Error "rate limit exceeded" atau "quota exceeded"

**Solutions:**
1. Check mode (Dev has 100/month limit)
2. Switch to Production mode
3. Upgrade Clerk plan if needed (check pricing)

### Issue 4: Domain Not Verified
**Symptoms:** Email dari `@clerk.accounts.dev` instead of `@topasli.com`

**Solutions:**
1. Go to Dashboard → Domains
2. Add custom domain `clkmail.topasli.com`
3. Add required DNS records:
   - CNAME for `clkmail` → provided by Clerk
   - TXT for verification → provided by Clerk
4. Wait for verification (5-60 mins)
5. Set as default email domain

### Issue 5: Secret Key Mismatch
**Symptoms:** 401 Unauthorized errors di backend

**Solutions:**
1. Check Leap Settings → Secrets → `ClerkSecretKey`
2. Must start with `sk_live_...` (production)
3. Get from Clerk Dashboard → API Keys (Production mode)
4. Update in Leap Settings
5. Re-deploy backend

---

## 📊 Expected Behavior

### Normal Flow (Success):
1. User input email → klik "Kirim Kode OTP"
2. Frontend calls `signUp.create()` ✅
3. Frontend calls `prepareEmailAddressVerification()` ✅
4. Clerk sends email **immediately** (< 10 seconds)
5. Email arrives in inbox (or spam) within **1-3 minutes**
6. User input code → verification success

### Clerk Dashboard Logs (Success):
```
12:34:01 - sign_up.created (user@example.com)
12:34:02 - email.prepared (verification_code)
12:34:03 - email.sent (noreply@clkmail.topasli.com → user@example.com)
```

### Clerk Dashboard Logs (Failed):
```
12:34:01 - sign_up.created (user@example.com)
12:34:02 - email.prepared (verification_code)
12:34:03 - email.failed (reason: "Email provider not configured")
```

---

## 🎯 Quick Checklist

Before testing, verify ALL these:

- [ ] Clerk Dashboard di **Production mode**
- [ ] Secret key di Leap Settings = `sk_live_...` (production)
- [ ] Publishable key di code = `pk_live_Y2xlcmsudG9wYXNsaS5jb20k`
- [ ] Domain `clerk.topasli.com` → Verified
- [ ] Domain `clkmail.topasli.com` → Verified  
- [ ] Email provider configured (Default Clerk or Custom SMTP)
- [ ] Email verification **enabled** di settings
- [ ] Verification strategy = "Email code"
- [ ] `<div id="clerk-captcha"></div>` ada di form
- [ ] `isLoaded` checked sebelum API calls

---

## 📞 Get Help

**Jika semua sudah dicek dan email masih tidak terkirim:**

1. **Check Clerk Dashboard Logs** untuk exact error message
2. **Screenshot error** dari logs
3. **Share di Clerk Discord:** https://clerk.com/discord
4. **Contact Clerk Support:** Dashboard → Help → Contact Support

**Info yang perlu dishare saat minta bantuan:**
- Clerk Application ID
- Email address yang ditest
- Screenshot Clerk Logs showing error
- Timestamp when OTP was requested
- Current email provider configuration
