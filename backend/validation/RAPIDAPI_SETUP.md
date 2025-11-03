# RapidAPI ID Game Checker Setup

## COD Mobile ID Validation

Aplikasi ini menggunakan RapidAPI ID Game Checker untuk validasi COD Mobile ID.

### Setup Instructions

1. **Buka Settings di Sidebar**
   - Klik icon Settings/Gear

2. **Pilih Tab "Secrets"**

3. **Tambah Secret Baru:**
   - **Name:** `RapidAPIKeyIDGameChecker`
   - **Value:** `5019e58fbdmsh0b0b3b64cd7181ep162b29jsn3a652080aad4`

4. **Save & Restart**
   - Klik "Save"
   - Aplikasi akan otomatis menggunakan API key

### Test Validation

Setelah setup, test dengan:
- **Game:** Call of Duty Mobile ID
- **User ID:** `8370310025568788107`
- **Expected Result:** Username ditemukan

### API Details

- **Endpoint:** `https://id-game-checker.p.rapidapi.com/cod-mobile/{userId}`
- **Method:** GET
- **Headers:**
  - `x-rapidapi-host: id-game-checker.p.rapidapi.com`
  - `x-rapidapi-key: {your-api-key}`

### Supported Games

Currently integrated:
- ✅ Call of Duty Mobile ID

### Troubleshooting

**Error: "COD Mobile validation requires RapidAPI configuration"**
- API key belum di-set di Secrets
- Follow setup instructions di atas

**Error: "Rate limit exceeded"**
- API key mencapai batas request
- Upgrade RapidAPI plan atau tunggu reset

**Error: "User ID tidak ditemukan atau tidak valid"**
- User ID salah atau tidak terdaftar
- Pastikan format User ID benar
