# Checklist Debug Clerk Email OTP Production

## ✅ Yang Sudah Benar
1. **Frontend publishable key**: `pk_live_Y2xlcmsudG9wYXNsaS5jb20k` (production)
2. **Clerk domain**: `clerk.topasli.com`
3. **RegisterPage**: Menggunakan Clerk SDK `signUp.prepareEmailAddressVerification()`

## ⚠️ Yang Perlu Dicek di Clerk Dashboard

### 1. Secret Key Production
Buka **Clerk Dashboard** → klik profile/app → pastikan toggle di **Production** mode (bukan Development)

**Lokasi:** https://dashboard.clerk.com → pilih app "TopAsli" → API Keys

**Action:** 
- Toggle ke **Production** 
- Copy **Secret Key** (yang dimulai dengan `sk_live_...`)
- Buka **Leap Settings** → Secrets → Edit `ClerkSecretKey`
- Paste secret key production

### 2. Email Delivery Settings
**Lokasi:** Clerk Dashboard → Email & SMS

**Cek:**
- [ ] Email provider configured? (Default Clerk / Custom SMTP)
- [ ] "From" email address configured?
- [ ] Email verification enabled?
- [ ] OTP template aktif?

**Jika menggunakan default Clerk email:**
- Clerk akan kirim dari `noreply@clerk.topasli.com` atau `noreply@clerk.accounts.dev`
- Email bisa masuk **spam folder**
- Ada rate limit di production (tapi harusnya cukup untuk testing)

### 3. Domain Settings
**Lokasi:** Clerk Dashboard → Domains

**Cek:**
- [ ] Domain `clerk.topasli.com` sudah verified?
- [ ] Application URL configured?
- [ ] Satellite domains configured untuk frontend?

### 4. Email Verification Flow
**Lokasi:** Clerk Dashboard → User & Authentication → Email, Phone, Username

**Cek:**
- [ ] Email verification strategy = "Email code" (OTP)
- [ ] Require email verification for sign up?

### 5. Development vs Production Mode
**SUPER PENTING!** 

Di Clerk Dashboard, ada toggle **Development** vs **Production** di pojok kanan atas.

**Behavior berbeda:**
- **Development**: Email OTP langsung terkirim, limit rendah (100/bulan)
- **Production**: Perlu konfigurasi email provider atau domain verification

**Action:**
- Pastikan saat copy Secret Key, toggle sudah di **Production**
- Pastikan publishable key juga production (`pk_live_...`)

## 🔍 Testing Steps

### Test 1: Cek apakah Clerk bisa send email
1. Buka https://dashboard.clerk.com
2. Masuk ke app TopAsli (production mode)
3. Klik "User & Authentication" → "Email, Phone, Username"
4. Coba "Test email delivery" (biasanya ada button)

### Test 2: Test dari frontend
1. Deploy app dengan publishable key production
2. Buka `/register`
3. Input email (gunakan email yang bisa Anda akses)
4. Klik "Kirim Kode OTP"
5. **Check browser console** untuk error dari Clerk
6. **Check email inbox + spam folder**

### Test 3: Check Clerk logs
1. Buka Clerk Dashboard → Logs
2. Filter "email" events
3. Cek apakah ada log email sent/failed

## 🐛 Common Issues

### Issue 1: "Email not configured"
**Solution:** Di Clerk Dashboard → Email & SMS → Configure custom SMTP atau verify domain

### Issue 2: Email masuk spam
**Solution:** 
- Check spam folder
- Di production, setup SPF/DKIM records untuk domain
- Atau gunakan custom email provider (SendGrid, etc)

### Issue 3: "Rate limit exceeded"
**Solution:** Production mode punya rate limit lebih tinggi, tapi bisa di-upgrade di Clerk billing

### Issue 4: Email tidak terkirim sama sekali
**Possible causes:**
- Secret key masih development mode (`sk_test_...`)
- Email verification disabled di Clerk settings
- Domain belum verified
- No email provider configured

## 📝 Next Steps

1. **Verify Secret Key Production**
   - Check Settings → Secrets → `ClerkSecretKey`
   - Harus dimulai dengan `sk_live_...` (bukan `sk_test_...`)

2. **Check Clerk Dashboard Email Settings**
   - Pastikan email verification enabled
   - Check email provider status

3. **Test dengan real email**
   - Gunakan Gmail/Yahoo yang bisa diakses
   - Check spam folder
   - Check Clerk logs di dashboard

4. **Jika masih gagal:**
   - Share screenshot Clerk Dashboard → Email & SMS settings
   - Share screenshot error dari browser console
   - Check Clerk logs untuk detail error
