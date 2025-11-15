# Panduan Initial Setup - Gaming Top Up Platform

## Cara Setup Pertama Kali di AWS atau Deployment Baru

Setelah deploy ke AWS atau environment baru yang database-nya masih kosong, ikuti langkah berikut:

### 1. Akses Halaman Setup

Buka browser dan akses:
```
https://your-domain.com/setup
```

### 2. Isi Form Setup

Form setup akan meminta informasi berikut:

#### **Informasi Admin (Required)**
- **Nomor WhatsApp Admin**: Format 628xxx (contoh: 6282140264050)
  - Nomor ini akan menjadi superadmin
  - Akan menerima OTP WhatsApp untuk login
  
- **Password Admin**: Minimal 6 karakter
  - Password untuk login sebagai superadmin
  
- **Konfirmasi Password**: Ketik ulang password

#### **API Configuration - Fonnte (Required)**
- **Fonnte API Token**: Token dari [fonnte.com](https://fonnte.com)
  - **WAJIB diisi** agar OTP WhatsApp bisa berfungsi
  - Cara dapatkan token:
    1. Daftar di fonnte.com
    2. Hubungkan WhatsApp device
    3. Copy token dari dashboard

#### **API Configuration - Uniplay (Optional)**
- **Uniplay API Key**: API Key dari Uniplay
- **Uniplay Pincode**: Pincode untuk Uniplay API
- Bisa dikosongkan dan diisi nanti lewat admin panel

### 3. Klik "Setup Sekarang"

Sistem akan:
- Membuat user superadmin dengan nomor yang diinput
- Menyimpan konfigurasi API Fonnte
- Menyimpan konfigurasi Uniplay (jika diisi)
- Menandai setup sebagai complete

### 4. Login Sebagai Superadmin

Setelah setup berhasil:
1. Redirect otomatis ke halaman login
2. Login dengan:
   - **Nomor WA**: Yang tadi diinput di setup
   - **Password**: Yang tadi dibuat di setup
3. Masuk ke admin panel

### 5. Lengkapi Konfigurasi di Admin Panel

Setelah login, Anda bisa:
- Mengubah konfigurasi API di menu **Dashboard**
- Sync produk dari Uniplay di menu **UniPlay Sync**
- Menambah nomor CS WhatsApp
- Mengelola user, produk, transaksi, dll

---

## FAQ

### Q: Bagaimana jika saya lupa password admin?
A: Gunakan endpoint `/admin/set-default-password` untuk reset semua user ke password default "halo123"

### Q: Bisa setup ulang?
A: Setup hanya bisa dilakukan sekali. Setelah itu gunakan admin panel untuk mengubah konfigurasi.

### Q: Bagaimana jika tidak punya token Fonnte?
A: Setup tidak bisa dilakukan tanpa token Fonnte karena diperlukan untuk OTP. Daftar dulu di fonnte.com.

### Q: Bagaimana jika belum punya API Uniplay?
A: Bisa dikosongkan saat setup, lalu diisi nanti di admin panel menu Dashboard.

---

## Akses via API (Alternative)

Jika tidak bisa akses via browser, bisa setup via API:

```bash
curl -X POST https://your-domain.api.lp.dev/admin/initial-setup \
  -H "Content-Type: application/json" \
  -d '{
    "adminPhone": "6282140264050",
    "adminPassword": "password123",
    "fonnteToken": "YOUR_FONNTE_TOKEN",
    "uniplayApiKey": "YOUR_UNIPLAY_KEY",
    "uniplayPincode": "YOUR_PINCODE"
  }'
```

Check status setup:
```bash
curl https://your-domain.api.lp.dev/admin/setup-status
```

Response:
```json
{
  "setupComplete": false,
  "needsSetup": true
}
```
