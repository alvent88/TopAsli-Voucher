# Cara Setup Email OTP di Clerk (Production)

## Masalah
Email OTP tidak terkirim saat user registrasi karena **Clerk production instance** belum dikonfigurasi untuk mengirim email.

## Penyebab
Clerk menggunakan email provider mereka sendiri untuk mengirim OTP, tapi di **production mode**, Clerk memerlukan konfigurasi tambahan:
1. Custom email provider (Gmail/SendGrid/AWS SES)
2. Domain verification
3. Email template configuration

## Solusi

### Opsi 1: Gunakan Development Mode (Quick Fix)
Sementara untuk testing, gunakan development Clerk instance:

1. Buka Clerk Dashboard → API Keys
2. Toggle dari **Production** ke **Development**
3. Copy **Publishable Key** yang dimulai dengan `pk_test_...`
4. Update di `frontend/App.tsx` line 36:
   ```typescript
   const PUBLISHABLE_KEY = "pk_test_aGVscGluZy1rYW5nYXJvby03Ny5jbGVyay5hY2NvdW50cy5kZXYk";
   ```
5. Copy **Secret Key** development (`sk_test_...`)
6. Update di Settings → Secrets → `ClerkSecretKey`

**Note:** Development mode punya limit lebih rendah, tapi email OTP akan terkirim.

---

### Opsi 2: Setup Custom Email Provider (Production)

#### A. Gunakan Gmail SMTP
1. Buka Clerk Dashboard → **Emails** → **Email Settings**
2. Pilih **Custom Email Provider**
3. Pilih **SMTP**
4. Isi konfigurasi:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   Username: your-email@gmail.com
   Password: [App Password dari Gmail]
   From Email: your-email@gmail.com
   From Name: TopAsli
   ```

**Cara buat Gmail App Password:**
1. Buka Google Account → Security
2. Enable 2-Step Verification
3. Search "App Passwords"
4. Generate password untuk "Mail"
5. Copy password tersebut dan paste ke Clerk SMTP config

#### B. Verify Domain (Optional untuk production quality)
1. Clerk Dashboard → **Domains**
2. Add custom domain: `topasli.com`
3. Add DNS records sesuai instruksi Clerk
4. Tunggu verification (~5-60 menit)

#### C. Customize Email Templates
1. Clerk Dashboard → **Emails** → **Templates**
2. Pilih **Email OTP**
3. Customize template sesuai brand TopAsli
4. Save changes

---

### Opsi 3: Alternative - Gunakan Phone OTP (WhatsApp)
Kalau email OTP terlalu ribet, bisa full switch ke WhatsApp OTP yang sudah jalan:

1. Di RegisterPage, ganti flow dari email ke phone
2. Gunakan endpoint `/otp/send` yang sudah ada
3. User registrasi pakai nomor HP, bukan email

---

## Testing
Setelah setup salah satu opsi di atas:
1. Buka `/register`
2. Masukkan email
3. Klik "Kirim Kode OTP"
4. Cek inbox email (juga spam folder)
5. Masukkan kode 6 digit yang diterima
6. Lengkapi profil

---

## Debug Checklist
- [ ] Publishable key di `frontend/App.tsx` sesuai mode (dev/prod)
- [ ] Secret key di Settings sesuai mode (dev/prod)
- [ ] Email provider configured di Clerk Dashboard
- [ ] Check spam folder
- [ ] Test dengan email Gmail/Yahoo yang berbeda
- [ ] Browser console tidak ada error dari Clerk SDK
