# ✅ QUICK FIX - Update Clerk Paths ke Leap Domain

## 🔧 LANGKAH

Karena `app.topasli.com` tidak punya SSL certificate (Leap tidak auto-provision SSL untuk custom domain), **gunakan Leap domain saja**.

### **1. Update Clerk Dashboard → Paths**

**Set semua URL ke Leap domain:**

```
Home URL:     https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev
Sign-in URL:  https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/login
Sign-up URL:  https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/register
```

**Save changes.**

---

### **2. Test Registration**

**Buka di browser:**

URL: **https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/register**

1. Input email: `alvent88@gmail.com`
2. Centang checkbox
3. Klik "Kirim Kode OTP"
4. **Check email masuk**

---

## ⚠️ MASALAH DENGAN OPSI INI

Clerk production instance **HARUS** menggunakan domain yang matching dengan `clerk.topasli.com`.

**Error yang mungkin muncul:**
- Clerk reject karena domain mismatch
- CORS error lagi

---

## ✅ SOLUSI ALTERNATIF - Pakai Cloudflare untuk SSL

**Karena Anda beli domain di GoDaddy, Anda bisa:**

### **LANGKAH 1: Pindahkan DNS ke Cloudflare (FREE)**

1. **Daftar Cloudflare:** https://dash.cloudflare.com/sign-up (FREE)
2. **Add domain:** `topasli.com`
3. **Copy nameservers** dari Cloudflare (contoh: `ns1.cloudflare.com`, `ns2.cloudflare.com`)
4. **Login GoDaddy** → Domain Settings → Nameservers
5. **Ganti ke Cloudflare nameservers**
6. **Tunggu 1-24 jam** untuk nameserver propagate

---

### **LANGKAH 2: Setup DNS di Cloudflare**

**Setelah nameserver aktif:**

1. **Cloudflare Dashboard** → DNS → Records
2. **Add record:**
   ```
   Type:   CNAME
   Name:   app
   Target: gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev
   Proxy:  🟠 Proxied (ENABLE)
   TTL:    Auto
   ```
3. **Save**

---

### **LANGKAH 3: Cloudflare Auto Provision SSL**

**Cloudflare akan otomatis:**
- ✅ Provision SSL certificate untuk `app.topasli.com`
- ✅ Handle HTTPS
- ✅ Proxy request ke Leap

**Tunggu 10-30 menit** setelah DNS setup.

---

### **LANGKAH 4: Test**

**Setelah SSL ready:**

URL: **https://app.topasli.com/register**

1. Input email
2. Kirim OTP
3. Check email

---

## 📊 COMPARISON

| Opsi | Pros | Cons | Time |
|------|------|------|------|
| **Leap domain** | ✅ Works now<br>✅ No setup | ❌ Ugly URL<br>⚠️ Clerk might reject | 0 min |
| **Cloudflare** | ✅ Custom domain<br>✅ Free SSL<br>✅ Professional | ⏳ Need 1-24h setup | 1-24 hours |

---

## ✅ RECOMMENDED

**SEKARANG:**
1. Update Clerk Paths ke Leap domain
2. Test OTP registration
3. Verify email terkirim

**NANTI (Production):**
1. Setup Cloudflare
2. Pindahkan nameserver
3. Enable SSL
4. Update Clerk Paths ke `app.topasli.com`

---

**Mau coba test pakai Leap domain dulu?**
