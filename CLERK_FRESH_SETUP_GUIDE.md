# Panduan Hapus & Create Ulang Clerk Production Instance

## ⚠️ PENTING - Backup Data Dulu!

Sebelum hapus production instance, **BACKUP** data penting:

### 1. Export Users (Jika Ada)
**Path:** Clerk Dashboard → Users → Export

- Download CSV semua users yang sudah terdaftar
- Save ke tempat aman

### 2. Save API Keys & Settings
**Catat di notepad:**
- Current Publishable Key: `pk_live_Y2xlcmsudG9wYXNsaS5jb20k`
- Current Secret Key: (check di Leap Settings)
- Email templates customization (jika ada)
- Custom domain yang digunakan

---

## 🗑️ Cara Hapus Production Instance

### Step 1: Access Clerk Dashboard
1. Login https://dashboard.clerk.com
2. Pilih application "TopAsli"
3. **PASTIKAN di PRODUCTION mode** (toggle kanan atas)

### Step 2: Delete Application
**Path:** Dashboard → Settings → Danger Zone (atau Advanced)

1. Scroll ke bawah sampai "Delete application"
2. Klik "Delete"
3. Confirm dengan ketik nama application
4. Application akan dihapus **PERMANENT** (tidak bisa di-undo!)

**WARNING:** Semua data users, sessions, logs akan **hilang permanent**!

---

## ✨ Create Ulang Production Instance (CLEAN START)

### Step 1: Create New Clerk Application
1. Buka https://dashboard.clerk.com
2. Klik "**+ Create application**"
3. Isi details:
   - **Name:** TopAsli (atau nama baru)
   - **Select framework:** React (atau skip)
   - Klik "**Create application**"

### Step 2: Configure Authentication Methods
**Path:** User & Authentication → Email, Phone, Username

**Enable:**
- ✅ Email address
- ✅ Email verification code (OTP)
- ❌ Password (optional, bisa disabled)

**Settings:**
- Verification required: **Yes**
- Verification method: **Email code**

### Step 3: Email Provider Setup (CRITICAL!)
**Path:** Customization → Email (atau Messaging → Email)

**Option 1: Use Clerk's Email (RECOMMENDED - Simple)**
- Provider: **Clerk** (default)
- No configuration needed
- Emails will come from: `noreply@clerk.accounts.dev`
- ✅ **WORKS IMMEDIATELY, NO SETUP**

**Option 2: Custom Domain Email (Advanced)**
- Hanya jika Anda punya domain email sendiri
- Memerlukan DNS setup
- Skip untuk sekarang

**PILIH OPTION 1** untuk kemudahan!

### Step 4: Get API Keys
**Path:** Dashboard → API Keys

**Copy 2 keys:**

1. **Publishable Key** (untuk frontend)
   - Will look like: `pk_live_<random-string>`
   - This is for React app
   
2. **Secret Key** (untuk backend)
   - Will look like: `sk_live_<random-string>`
   - This is for Encore backend

**SAVE BOTH KEYS!**

### Step 5: Update Frontend Code

Replace publishable key di `/frontend/App.tsx`:

```typescript
const PUBLISHABLE_KEY = "pk_live_<YOUR-NEW-KEY-HERE>";
```

### Step 6: Update Backend Secret

**Leap Settings → Secrets → ClerkSecretKey:**

1. Edit secret `ClerkSecretKey`
2. Paste: `sk_live_<YOUR-NEW-SECRET-HERE>`
3. Save

### Step 7: Deploy & Test

1. Deploy application
2. Buka `/register`
3. Input email: `alvent88@gmail.com`
4. Klik "Kirim Kode OTP"
5. **Email akan langsung terkirim!**
6. Check inbox (juga spam folder)

---

## ✅ Keuntungan Fresh Instance

### 1. No Custom Domain Issues
- Tidak perlu setup DNS `clerk.topasli.com`
- Langsung pakai domain default Clerk
- **Email langsung jalan tanpa konfigurasi**

### 2. Clean Configuration
- No legacy settings
- No conflicting domains
- Fresh email templates

### 3. Simple Email Setup
- Use "Delivered by Clerk" (built-in)
- No SMTP configuration needed
- No DNS records needed
- **WORKS OUT OF THE BOX**

---

## 🚫 JANGAN Lakukan Ini

### ❌ Jangan Setup Custom Domain Dulu
**Skip for now:**
- clerk.topasli.com
- accounts.topasli.com
- clkmail.topasli.com

**Why?** Domain setup kompleks dan bisa cause issues. Test email OTP dulu dengan default Clerk domain!

### ❌ Jangan Enable Development Mode
- Hanya punya 100 email/month limit
- Production lebih reliable

### ❌ Jangan Setup Custom SMTP Dulu
- Use Clerk's built-in email first
- Verify everything works
- Baru customize later

---

## 📋 Quick Checklist - Create New Instance

**Sebelum delete old instance:**
- [ ] Export users (jika ada data penting)
- [ ] Screenshot current settings
- [ ] Save current API keys sebagai backup

**Saat create new instance:**
- [ ] Name: TopAsli
- [ ] Mode: Production (default)
- [ ] Email authentication: Enabled
- [ ] Verification method: Email code
- [ ] Email provider: **Clerk** (default)

**After creation:**
- [ ] Copy new Publishable Key → update di App.tsx
- [ ] Copy new Secret Key → update di Leap Settings
- [ ] Deploy application
- [ ] Test registration dengan email real
- [ ] Verify email OTP diterima

---

## 🎯 Expected Result After Fresh Setup

### 1. No DNS/Domain Issues
✅ Clerk SDK loads from `.clerk.accounts.dev` (works 100%)

### 2. Email Immediately Works
✅ Email sent from `noreply@clerk.accounts.dev`
✅ Arrives in inbox within 1-3 minutes

### 3. Clean Dashboard
✅ No conflicting settings
✅ Clear logs
✅ Easy debugging

### 4. Clerk Dashboard Logs Will Show:
```
12:34:01 - sign_up.created (alvent88@gmail.com)
12:34:02 - email.prepared (verification_code)
12:34:03 - email.sent (noreply@clerk.accounts.dev → alvent88@gmail.com)
```

---

## 💡 Tips

### Email dari Clerk Default Domain
Emails akan dari: `noreply@clerk.accounts.dev`

**Ini NORMAL dan PROFESIONAL!** Banyak app besar pakai domain Clerk default.

**Advantages:**
- ✅ No DNS setup needed
- ✅ High deliverability (Clerk's email infrastructure)
- ✅ Works immediately
- ✅ No spam issues

### Custom Domain (Later)
Jika Anda mau emails dari `noreply@topasli.com`, bisa setup SETELAH basic email OTP confirmed working.

**Steps for custom email domain (OPTIONAL, LATER):**
1. Go to Clerk Dashboard → Domains
2. Add `mail.topasli.com` (atau similar)
3. Add required DNS records
4. Wait for verification
5. Set as default email sender

**TAPI UNTUK SEKARANG:** Skip custom domain, pakai Clerk default!

---

## 🚀 Ready to Start?

**Action Plan:**

1. **NOW:** Delete current production instance (if you want fresh start)
2. **Create** new Clerk application
3. **Configure** email authentication (1 minute setup)
4. **Copy** API keys (publishable + secret)
5. **Update** code with new keys
6. **Deploy** application
7. **Test** registration
8. **Success!** Email OTP working!

**Estimated time:** 10-15 minutes total for complete fresh setup

**Difficulty:** Easy (no DNS, no custom domains, no complex config)

---

Jika Anda siap, silakan **delete instance lama** dan create yang baru. Nanti saya akan guide update API keys di code! 👍
