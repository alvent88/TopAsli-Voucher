# ⚠️ FIX ERROR 400 CLERK - CORS ISSUE

## 🔴 MASALAH

Error 400 dari `clerk.topasli.com` disebabkan oleh **CORS policy**.

Clerk domain Anda **tidak mengizinkan** request dari:
```
https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev
```

---

## ✅ SOLUSI - Tambah Allowed Origins di Clerk Dashboard

### **LANGKAH 1: Buka Clerk Dashboard**

1. **Login:** https://dashboard.clerk.com
2. **Pilih instance:** **clerk.topasli.com** (production)

---

### **LANGKAH 2: Configure Allowed Origins**

1. **Klik sidebar kiri:** **"Domains"**
2. **Scroll ke bawah:** Cari section **"Allowed origins"** atau **"Cross-origin settings"**
3. **Klik "Add origin"** atau **"+"**
4. **Input URL:**
   ```
   https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev
   ```
5. **Save/Apply changes**

---

### **ALTERNATIVE: Jika tidak ada "Allowed origins" section**

Coba cek di:
- **Settings** → **General** → **Home URL**
- **Settings** → **Paths** → **Application URL**

**Set salah satu ke:**
```
https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev
```

---

### **LANGKAH 3: Test Lagi**

Setelah save changes di Clerk Dashboard:

1. **Hard refresh browser:** `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. **Buka:** https://gaming-top-up-platform-d3pg4ec82vjikj791feg.lp.dev/register
3. **Coba kirim OTP**
4. **Check Network tab** → request ke `clerk.topasli.com` seharusnya **200 OK**, bukan 400

---

## 📸 Screenshot yang Dibutuhkan

**Setelah Anda buka Clerk Dashboard → Domains:**

Screenshot:
1. **Section "Allowed origins"** (jika ada)
2. **Section "Home URL"** atau "Application URL"
3. **Semua field yang berhubungan dengan domain/origin**

Saya akan bantu verifikasi konfigurasinya benar!

---

## 🔍 Alternatif Debugging

**Jika tidak bisa menemukan setting "Allowed origins":**

Screenshot **SELURUH PAGE** dari:
- Clerk Dashboard → **Settings** → **General**
- Clerk Dashboard → **Settings** → **Paths**
- Clerk Dashboard → **Domains**

Saya akan bantu cari dimana setting CORS nya!

---

## ⚠️ CATATAN PENTING

**Publishable key SUDAH BENAR:** `pk_live_Y2xlcmsudG9wYXNsaS5jb20k` ✅

**Secret key SUDAH BENAR:** `sk_live_...` (yang kedua) ✅

**Masalahnya HANYA:** CORS policy di Clerk instance!

Setelah fix CORS, email OTP akan terkirim! 🚀
