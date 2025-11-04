# 📋 Daftar Game dengan Fungsi Pemeriksaan User ID

Berikut adalah daftar lengkap game yang **SUDAH MEMILIKI** fungsi pemeriksaan User ID/Username validation.

---

## ✅ **API #1: Genshin Impact (cek-username API)**
**Source:** `/backend/validation/cek_username_api.ts`

| No | Game Name | Needs Server ID? | Status |
|----|-----------|------------------|--------|
| 1  | Genshin Impact | ❌ No | ✅ Active |

**Catatan:** Menggunakan format validation + API validation untuk Genshin UID

---

## ✅ **API #2: Velixs API**
**Source:** `/backend/validation/velixs_api.ts`  
**API URL:** `https://api.velixs.com/idgames-checker`

| No | Game Name | Game Slug | Needs Server ID? | Status |
|----|-----------|-----------|------------------|--------|
| 1  | Arena of Valor | `arena-of-valor` | ❌ No | ✅ Active |
| 2  | Call of Duty Mobile | `call-of-duty-mobile`, `cod-mobile` | ❌ No | ✅ Active |

---

## ✅ **API #3: Sandrocods API**
**Source:** `/backend/validation/sandrocods_api.ts`  
**API URL:** `https://api-cek-id-game-ten.vercel.app/api/check-id-game`

| No | Game Name | Game Slug | Type Name | Needs Server ID? | Status |
|----|-----------|-----------|-----------|------------------|--------|
| 1  | Genshin Impact | `genshin-impact` | `genshin_impact` | ❌ No | ✅ Active (Fallback) |
| 2  | Honkai Star Rail | `honkai-star-rail` | `honkai_star_rail` | ❌ No | ✅ Active |
| 3  | Call of Duty | `cod-mobile` | `call_of_duty` | ❌ No | ✅ Active |
| 4  | Point Blank | `point-blank` | `point_blank` | ❌ No | ✅ Active |
| 5  | PUBG Mobile | `pubg-mobile` | `pubg_mobile` | ❌ No | ✅ Active |

---

## ✅ **API #4: Isan.eu.org API**
**Source:** `/backend/validation/validate_username.ts` (function `getGameEndpoint`)  
**API URL:** `https://api.isan.eu.org/nickname`

| No | Game Name | Endpoint | Needs Server ID? | Status |
|----|-----------|----------|------------------|--------|
| 1  | Mobile Legends | `/ml` | ✅ **Yes** | ✅ Active |
| 2  | Free Fire | `/ff` | ❌ No | ✅ Active |
| 3  | PUBG Mobile | `/pubgm` | ❌ No | ✅ Active |
| 4  | Call of Duty Mobile | `/codm` | ❌ No | ✅ Active |
| 5  | Arena of Valor | `/aov` | ❌ No | ✅ Active |
| 6  | Honkai Star Rail | `/hsr` | ❌ No | ✅ Active |
| 7  | Honkai Impact | `/hi` | ❌ No | ✅ Active |
| 8  | Zenless Zone Zero | `/zzz` | ❌ No | ✅ Active |
| 9  | Valorant | `/valo` | ❌ No | ✅ Active |
| 10 | Point Blank | `/pb` | ❌ No | ✅ Active |
| 11 | Magic Chess Go Go | `/mcgg` | ✅ **Yes** | ✅ Active |

---

## ❌ **Game yang TIDAK DIVALIDASI (Excluded)**

Game-game berikut **TIDAK AKAN** divalidasi karena sudah ada di excluded list atau tidak tersedia API-nya:

| No | Game Name | Alasan |
|----|-----------|--------|
| 1  | Honor of Kings | ⚠️ API tidak tersedia / tidak stabil |
| 2  | Free Fire (via isan.eu.org) | ⚠️ Di-exclude karena sudah di fallback |
| 3  | Mobile Legends (via isan.eu.org) | ⚠️ Di-exclude karena sudah di fallback |
| 4  | Valorant (via isan.eu.org) | ⚠️ Di-exclude karena sudah di fallback |
| 5  | Arena of Valor (via isan.eu.org) | ⚠️ Di-exclude karena sudah pakai Velixs API |

**File:** `/backend/validation/validate_username.ts` line 164
```typescript
const excludedGames = ["arena-of-valor", "free-fire", "mobile-legends", "valorant", "honor-of-kings"];
```

---

## 🔄 **Alur Validasi**

Untuk setiap produk, sistem akan mencoba validasi dengan urutan berikut:

1. **Genshin Impact** → Pakai **cek-username API** (dedicated)
2. **Arena of Valor** → Pakai **Velixs API** (dedicated)
3. **Games lain (tidak di excluded)** → Pakai **Sandrocods API**
4. **Jika Sandrocods tidak support** → Fallback ke **Isan.eu.org API**
5. **Jika tidak ada API** → Return "Validation not available for this game"

---

## 📝 **Catatan Penting**

1. **Server ID Required:** Hanya Mobile Legends dan Magic Chess Go Go yang membutuhkan Server ID
2. **Multiple Validation:** Beberapa game seperti PUBG Mobile, COD Mobile, dan Honkai Star Rail bisa divalidasi oleh **lebih dari 1 API**
3. **Fallback System:** Jika satu API gagal, sistem akan mencoba API lain
4. **Format Khusus:** Valorant perlu encode karakter `#` menjadi `%23`

---

## 🛠️ **Cara Menambahkan Game Baru ke Validasi**

### **Option 1: Tambah ke Isan.eu.org (Paling mudah)**
Edit file `/backend/validation/validate_username.ts` di function `getGameEndpoint()`:

```typescript
if (lowerName.includes("nama game")) {
  return { endpoint: "/endpoint-game", needsServer: false };
}
```

### **Option 2: Tambah ke Sandrocods API**
Edit file `/backend/validation/sandrocods_api.ts` di `GAME_TYPE_MAP`:

```typescript
const GAME_TYPE_MAP: Record<string, string> = {
  "game-slug": "game_type_name",
};
```

### **Option 3: Tambah ke Velixs API**
Edit file `/backend/validation/velixs_api.ts` di `GAME_SLUG_MAP`:

```typescript
const GAME_SLUG_MAP: Record<string, string> = {
  "game-slug": "game-code",
};
```

---

## 🚫 **Cara Menonaktifkan Validasi untuk Game Tertentu**

### **Backend:**
Edit `/backend/validation/validate_username.ts` line 164:

```typescript
const excludedGames = ["game-slug-1", "game-slug-2"];
```

### **Frontend:**
Edit `/frontend/pages/ProductPage.tsx` line 67-75:

```typescript
const isExcluded = product?.name?.toLowerCase().includes("nama game");
if (isExcluded) {
  setValidationStatus("idle");
  return;
}
```

---

**File ini dibuat untuk memudahkan review dan testing validasi User ID.**
