# 🎯 SOLUSI CLERK CORS - Custom Domain Setup

## ⚠️ MASALAH

Clerk production instance **HARUS** menggunakan **root domain** (`topasli.com`) atau subdomain nya (`app.topasli.com`).

**TIDAK BISA** menggunakan Leap temporary domain: `gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev`

---

## ✅ SOLUSI PERMANEN - Setup Custom Domain

### **STEP 1: Beli Domain (Jika Belum Punya)**

**Domain registrar recommended:**
- **Namecheap** - https://www.namecheap.com (~$10/tahun)
- **Cloudflare** - https://www.cloudflare.com (~$9/tahun)
- **Porkbun** - https://porkbun.com (~$8/tahun)

**Pilih domain:**
- `topasli.com` (main domain)
- Atau beli domain lain yang matching dengan brand Anda

---

### **STEP 2: Setup DNS - Point ke Leap**

**Setelah beli domain, login ke DNS provider (Cloudflare/Namecheap/etc):**

#### **Option A: Gunakan Subdomain (RECOMMENDED)**

**Setup CNAME record:**

```
Type:  CNAME
Name:  app (atau www)
Target: gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev
TTL:   Auto atau 3600
```

**Hasil:** `app.topasli.com` → Leap app

---

#### **Option B: Gunakan Root Domain**

**Setup A record:**

1. **Dapatkan IP Leap server** (ping `gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev`)
2. **Setup A record:**
   ```
   Type:  A
   Name:  @ (root)
   Target: [IP dari step 1]
   TTL:   Auto atau 3600
   ```

**CATATAN:** Root domain mungkin tidak support CNAME, jadi pakai A record. Tapi **IP bisa berubah** jika Leap redeploy.

**RECOMMENDED:** Pakai **subdomain** (`app.topasli.com`) dengan CNAME lebih stable.

---

### **STEP 3: Verify DNS Propagation**

**Check DNS sudah propagate:**

1. **Buka:** https://www.whatsmydns.net/
2. **Input:** `app.topasli.com` (atau domain yang Anda pilih)
3. **Select:** CNAME
4. **Tunggu** mayoritas server hijau (30 menit - 2 jam)

**Atau test manual:**
```bash
dig app.topasli.com CNAME
# Atau
nslookup app.topasli.com
```

---

### **STEP 4: Setup SSL Certificate (OPTIONAL - Leap Auto Handle)**

**Jika pakai subdomain:**
- ✅ Leap **otomatis** handle SSL certificate untuk subdomain
- ✅ **Tidak perlu manual setup**

**Jika pakai root domain:**
- ⚠️ Mungkin perlu setup **SSL certificate** manual di Leap settings
- **Check Leap docs** untuk custom domain SSL setup

---

### **STEP 5: Update Clerk Paths**

**Setelah DNS propagate:**

1. **Buka Clerk Dashboard** → **Paths**
2. **Set Home URL:**
   ```
   https://app.topasli.com
   ```
   (atau domain yang Anda pilih)
3. **Save**

---

### **STEP 6: Update Frontend Domain (OPTIONAL)**

**Jika ingin user akses via custom domain:**

**Leap Settings** (jika ada custom domain feature):
- Set primary domain: `app.topasli.com`

**Atau** tetap pakai Leap domain (`gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev`) dan hanya setup CNAME untuk redirect.

---

### **STEP 7: Test Production**

**Setelah semua setup:**

1. **Switch ke production keys** di `/frontend/App.tsx`:
   ```typescript
   const PUBLISHABLE_KEY = "pk_live_Y2xlcmsudG9wYXNsaS5jb20k";
   ```
2. **Deploy**
3. **Test registration** di:
   - `https://app.topasli.com/register` (jika setup custom domain di Leap)
   - `https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/register` (jika hanya setup Clerk Paths)

---

## 🚀 SOLUSI SEMENTARA - Pakai Development Instance

**Untuk testing SEKARANG tanpa custom domain:**

✅ **SUDAH DIAKTIFKAN!**

**App sekarang pakai:**
- Frontend: `pk_test_aGVscGluZy1rYW5nYXJvby03Ny5jbGVyay5hY2NvdW50cy5kZXYk` (development)
- Backend: `sk_test_...` (development - **perlu diganti di Leap Settings**)

**ACTION:**

1. **Buka Leap Settings** → **Secrets**
2. **Edit `ClerkSecretKey`**
3. **Ganti dengan development secret key** dari Clerk Dashboard → Development instance → API Keys
4. **Format:** `sk_test_...` (BUKAN `sk_live_...`)
5. **Save**

**Setelah itu:**
- ✅ OTP email akan terkirim (pakai development instance)
- ✅ TIDAK ada CORS error
- ✅ Bisa test semua fitur

---

## 📊 Comparison

| Fitur | Development Instance | Production Instance |
|-------|---------------------|-------------------|
| **Custom domain required** | ❌ No | ✅ Yes |
| **Email OTP** | ✅ Works | ✅ Works (after custom domain) |
| **CORS error** | ❌ No error | ⚠️ Error without custom domain |
| **Usage limits** | ⚠️ Limited (dev only) | ✅ Unlimited (production) |
| **Professional** | ❌ Dev keys visible | ✅ Production ready |

---

## ✅ RECOMMENDED PATH

### **Phase 1 (SEKARANG): Development Testing**
1. ✅ **Switch ke development instance** (DONE!)
2. **Update backend secret key** ke `sk_test_...`
3. **Test semua fitur** email OTP, registration, login
4. **Verify everything works**

### **Phase 2 (PRODUCTION): Custom Domain Setup**
1. **Beli domain** `topasli.com`
2. **Setup DNS** `app.topasli.com` → Leap
3. **Setup Clerk Paths** → `https://app.topasli.com`
4. **Switch ke production keys** (`pk_live_...` + `sk_live_...`)
5. **Test production registration**

---

## 🆘 NEED HELP?

**Jika Anda sudah punya domain `topasli.com`:**
1. **Screenshot DNS settings** dari domain provider
2. Saya akan bantu setup CNAME record yang benar

**Jika belum punya domain:**
1. **Lanjut pakai development instance dulu**
2. **Beli domain nanti** sebelum launch ke public

---

## 📝 NOTES

**Development instance limits:**
- Max **500 Monthly Active Users (MAU)**
- Max **1,000 sign-ups per month**
- **Good for testing**, NOT for production with real users

**Production instance benefits:**
- **Unlimited users**
- **Professional branding** (no "development keys" warning)
- **Better performance**
- **Better support**

---

**Current status:** App pakai **development instance** untuk testing. Siap test OTP sekarang!
