# ✅ SOLUSI FINAL - Cloudflare Workers untuk Proxy dengan SSL

## 📋 MASALAH

1. ✅ Clerk production instance **HARUS** pakai domain `*.topasli.com` untuk Paths
2. ❌ `app.topasli.com` dengan CNAME direct ke Leap **tidak bisa pakai Cloudflare Proxied mode** (Error 1014)
3. ❌ `app.topasli.com` dengan DNS only **tidak punya SSL certificate** (Leap tidak provision SSL untuk custom domain)

---

## ✅ SOLUSI - Cloudflare Workers (Reverse Proxy)

**Gunakan Cloudflare Workers sebagai reverse proxy:**

- ✅ `app.topasli.com` pakai **Cloudflare SSL** (Proxied mode ON)
- ✅ Cloudflare Workers **forward request** ke Leap backend
- ✅ Clerk happy karena domain matching
- ✅ User akses via HTTPS dengan SSL valid

---

## 🔧 SETUP CLOUDFLARE WORKERS

### **STEP 1: Create Worker**

1. **Login Cloudflare Dashboard**
2. **Klik "Workers & Pages"** di sidebar kiri
3. **Klik "Create application"**
4. **Klik "Create Worker"**
5. **Name:** `topasli-proxy` (atau nama apapun)
6. **Klik "Deploy"**

---

### **STEP 2: Edit Worker Code**

**Setelah deploy, klik "Edit code":**

**Paste code ini:**

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Target Leap backend
    const targetUrl = 'https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev';
    
    // Rewrite URL
    const proxyUrl = targetUrl + url.pathname + url.search;
    
    // Forward request
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    // Fetch from Leap
    const response = await fetch(modifiedRequest);
    
    // Return response
    return response;
  }
}
```

**Klik "Save and Deploy"**

---

### **STEP 3: Add Custom Domain to Worker**

1. **Di Worker page, klik tab "Triggers"**
2. **Scroll ke "Custom Domains"**
3. **Klik "Add Custom Domain"**
4. **Input:** `app.topasli.com`
5. **Klik "Add Custom Domain"**

**Cloudflare akan:**
- ✅ Otomatis provision SSL certificate untuk `app.topasli.com`
- ✅ Route traffic dari `app.topasli.com` → Worker → Leap backend
- ✅ Handle HTTPS

---

### **STEP 4: Update Clerk Paths**

**Buka Clerk Dashboard → Paths:**

```
Home URL:     https://app.topasli.com
Sign-in URL:  https://app.topasli.com/login
Sign-up URL:  https://app.topasli.com/register
```

**Save changes.**

---

### **STEP 5: Test**

**Setelah SSL ready (10-30 menit):**

1. **Buka:** https://app.topasli.com/register
2. **Input email:** `alvent88@gmail.com`
3. **Klik "Kirim Kode OTP"**
4. **Check email masuk**

✅ **DONE!**

---

## 📊 ARCHITECTURE

```
User Browser
    ↓ HTTPS (SSL by Cloudflare)
app.topasli.com (Cloudflare Worker)
    ↓ HTTPS
gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev (Leap Backend)
    ↓ API Call
clerk.topasli.com (Clerk Production)
```

---

## 🎯 BENEFITS

- ✅ Custom domain `app.topasli.com` dengan SSL valid
- ✅ Clerk production instance works (domain matching)
- ✅ Cloudflare CDN & caching
- ✅ Cloudflare DDoS protection
- ✅ No Error 1014 (Worker bukan CNAME)
- ✅ Gratis (Cloudflare Workers free tier: 100k requests/day)

---

## ⏱️ TIMELINE

- **Setup Worker:** 5 menit
- **Add custom domain:** 2 menit
- **SSL provision:** 10-30 menit
- **TOTAL:** 15-40 menit

---

## 🆘 TROUBLESHOOTING

### **Jika Worker error:**

**Check Worker Logs:**
1. Cloudflare Dashboard → Workers & Pages
2. Klik worker name
3. Klik tab "Logs"
4. Lihat error messages

### **Jika SSL tidak provision:**

**Force SSL:**
1. Cloudflare Dashboard → SSL/TLS
2. Set mode: **Full (strict)**
3. Tunggu 10 menit

---

## 📝 ALTERNATIVE: Cloudflare Page Rules (Simpler)

**Jika Workers terlalu kompleks, pakai Page Rules:**

1. **Cloudflare Dashboard** → **Rules** → **Page Rules**
2. **Klik "Create Page Rule"**
3. **URL:** `app.topasli.com/*`
4. **Setting:** Forwarding URL
5. **Status code:** 301 - Permanent Redirect
6. **Destination:** `https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/$1`
7. **Save**

**CONS:** User akan lihat Leap URL di address bar (tidak professional).

---

## ✅ RECOMMENDED

**Pakai Cloudflare Workers** (reverse proxy) - lebih professional, user tetap lihat `app.topasli.com` di address bar.

---

**Silakan setup Cloudflare Workers sekarang, lalu screenshot konfirmasinya!** 🚀
