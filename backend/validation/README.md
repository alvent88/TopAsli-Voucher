# Username Validation API Integration

This service integrates multiple username validation APIs to verify game account User IDs before purchase.

## Supported APIs

### 1. Cek-Username API (Primary for Genshin Impact)
**Base URL:** `https://cek-username.onrender.com`

Used for real Genshin Impact UID validation with username verification.

**Genshin Impact Endpoint:** `/game/genshinimpact?uid={UID}&zone={SERVER}`

**Server Mapping:**
- America → `os_usa`
- Europe → `os_euro`
- Asia → `os_asia`
- TW, HK, MO → `os_cht`

**Free API:** No authentication required

### 2. Sandrocods API (Primary for Other Games)
**Base URL:** `https://api-cek-id-game-ten.vercel.app/api/check-id-game`

Used for most games except Arena of Valor, Free Fire, and Mobile Legends.

### 3. Isan.eu.org API (Fallback)
**Base URL:** `https://api.isan.eu.org/nickname`

Used as fallback for games not supported by Sandrocods API.

## Game Support Matrix

### Games Using Cek-Username API ✅

| Game Name | Slug | Server Required | Notes |
|-----------|------|-----------------|-------|
| Genshin Impact | `genshin-impact` | ✅ Yes | Real validation with username via cek-username API |

**Genshin Impact Validation Flow:**
1. Format validation (9-digit UID check) - instant feedback
2. If format valid → cek-username API call to get real username
3. If API succeeds → Show "✓ Username ditemukan: {username}"
4. If API fails → Fallback to format validation only

### Games Using Sandrocods API ✅

| Game Name | Slug | Type Name | Zone ID Required | Notes |
|-----------|------|-----------|------------------|-------|
| Honkai Star Rail | `honkai-star-rail` | `honkai_star_rail` | ❌ No | |
| Call of Duty Mobile | `cod-mobile` | `call_of_duty` | ❌ No | |
| Point Blank | `point-blank` | `point_blank` | ❌ No | |
| PUBG Mobile | `pubg-mobile` | `pubg_mobile` | ❌ No | |

### Games Using Isan.eu.org API ✅

| Game Name | Endpoint | Server Required | Notes |
|-----------|----------|-----------------|-------|
| Mobile Legends | `/ml` | ✅ Yes | |
| Free Fire | `/ff` | ❌ No | |
| Arena of Valor | `/aov` | ❌ No | |
| Valorant | `/valo` | ❌ No | Format: `name#tag` (auto-encoded to `name%23tag`) |
| Magic Chess | `/mcgg` | ✅ Yes | |
| Zenless Zone Zero | `/zzz` | ❌ No | |
| Honkai Impact | `/hi` | ❌ No | |

### Games Not Validated ⚠️

Games without validation support will show: "Validation not available for this game"

- League of Legends: Wild Rift
- Clash of Clans
- Clash Royale
- Roblox
- Minecraft
- Ragnarok M
- Tower of Fantasy
- Stumble Guys
- Among Us
- And other games not listed above

## How It Works

### Validation Flow

1. **User enters User ID** (and Zone/Server ID if required)
2. **System checks game slug**:
   - If Genshin Impact → Format validation + RapidAPI
   - If excluded (AOV, FF, MLBB) → Use isan.eu.org
   - Otherwise → Try sandrocods API first
3. **API call made** with User ID and Zone ID
4. **Response processed**:
   - Success → Display username
   - Error → Show error message
5. **Purchase allowed** regardless of validation result (fail-safe)

### Request Format (Sandrocods)

```typescript
GET /api/check-id-game?type_name={type}&userId={uid}&zoneId={zone}
```

**Parameters:**
- `type_name`: Game type code (e.g., `genshin_impact`)
- `userId`: User's game account ID
- `zoneId`: Zone/Server ID (empty string if not required)

### Response Format (Sandrocods)

**Success:**
```json
{
  "status": true,
  "message": "Success Requesting to API",
  "nickname": "Player Name",
  "type_name": "GENSHIN_IMPACT",
  "server_time": "2024-07-30 16:31:29"
}
```

**Error:**
```json
{
  "status": false,
  "message": "userIDNotEligibleError",
  "type_name": "GENSHIN_IMPACT",
  "server_time": "2024-07-30 16:32:24"
}
```

## Frontend Integration

The validation is automatically triggered when user fills in:
- User ID field
- Server ID field (if required)

After 800ms debounce, validation API is called.

### Visual Feedback

- 🔵 **Validating**: Spinner icon
- ✅ **Valid**: Green checkmark + username displayed
- ❌ **Invalid**: Red X + error message

### Example User Flow

**Genshin Impact:**
1. User selects "Genshin Impact"
2. Enters User ID: `831826798`
3. Server auto-detected: `Asia`
4. System validates format and calls RapidAPI
5. System shows: "✓ Username ditemukan: PlayerName"
6. User proceeds to purchase

**Valorant:**
1. User selects "Valorant"
2. Enters User ID: `regards#66762`
3. System automatically converts `#` to `%23`: `regards%2366762`
4. System validates and shows: "✓ Username ditemukan: PlayerName"
5. User proceeds to purchase

> **Note for Valorant:** Users should enter their Riot ID in the format `name#tag` (e.g., `regards#66762`). The system will automatically encode the `#` character to `%23` for API compatibility.

## Error Handling

### Graceful Degradation

If validation fails due to:
- API timeout
- Network error
- Invalid response

The system will:
1. Log the error
2. Show warning to user
3. **Allow purchase to continue** (fail-safe behavior)

This ensures users can always complete purchases even if validation is temporarily unavailable.

## Testing

### Test Validation Manually

1. Go to a supported game product page
2. Enter a test User ID
3. Enter Server/Zone ID if required
4. Observe validation result

### Check Logs

Backend logs will show:
- `🎮 Using RapidAPI for Genshin validation`
- `🎮 Using Sandrocods API for validation`
- `✅ Username found: [name]`
- `❌ Username not found: [error]`

## Adding New Games

To add validation for a new game:

### 1. Check if Sandrocods API Supports It

Visit: https://github.com/sandrocods/api-cek-id-game

### 2. Add to Game Type Map

Edit `/backend/validation/sandrocods_api.ts`:

```typescript
const GAME_TYPE_MAP: Record<string, string> = {
  // ... existing games
  "your-game-slug": "api_type_name",
};
```

### 3. Test the Integration

1. Create test product with the slug
2. Test validation with real User ID
3. Verify username is returned correctly

## Special User ID Formats

### Genshin Impact UID

Genshin Impact uses a 9-digit UID system with server-based prefix.

**Validation Method:** Format Validation + RapidAPI Username Verification

**UID Format Rules:**
- Must contain only numbers
- Can be any length (not restricted to 9 digits)
- First digit indicates server region (if starts with 6-9):
  - `6` = America Server
  - `7` = Europe Server
  - `8` = Asia Server
  - `9` = TW/HK/MO Server

**Examples:**
- `831826798` - Asia Server ✅ (9 digits)
- `6123456` - America Server ✅ (7 digits)
- `700123456` - Europe Server ✅ (9 digits)
- `12345` - Valid UID ✅ (5 digits, server not auto-detected)
- `abc123` - Invalid ❌ (contains letters)

**How it works:**
1. User enters UID: `831826798` (or any length)
2. User selects server: `Asia` (auto-detected if UID starts with 6-9)
3. System validates format:
   - Contains only numbers ✅
   - If starts with 6-9 → Auto-detect server ✅
4. System calls cek-username API:
   - URL: `https://cek-username.onrender.com/game/genshinimpact?uid=831826798&zone=os_asia`
   - Response: `{ "message": "Success", "data": "h***n" }`
5. Display result:
   - "✓ Username ditemukan: h***n"

**Why cek-username API instead of other options:**

✅ **cek-username API:**
- Real username verification
- Returns masked username for privacy
- Free API, no authentication
- TypeScript compatible
- Good reliability
- Maintained by ilhamjaya08

❌ **akasha.cv:**
- No public API available
- Website is SPA (difficult to scrape)
- Would violate their terms of service

❌ **genshinstats (Python library):**
- Python-only (not TypeScript)
- Requires HoyoLab authentication cookies
- Rate limits (1 req/sec max)
- Privacy settings dependent
- Library deprecated/yanked

❌ **HL Gaming Official API:**
- Only provides game data (characters, weapons, artifacts)
- Does NOT validate player UIDs
- Different use case entirely

❌ **RapidAPI Check ID Game:**
- Requires API key and subscription
- Not confirmed to support Genshin Impact
- Potential rate limits and costs

**Fallback behavior:** If cek-username API fails or times out, the system falls back to format validation only with message "Valid UID format (username not available)". This ensures validation always works.

### Valorant Riot ID

Valorant uses Riot ID format: `username#tagline` (e.g., `yuyun#123`)

**API Used:** isan.eu.org (ihsangan/valid) - `/valo` endpoint  
**GitHub:** https://github.com/ihsangan/valid

**How it's handled:**
1. User enters: `yuyun#123`
2. Frontend displays: `yuyun#123` (unchanged)
3. Backend detects Valorant by product slug OR product name
4. Backend encodes `#` to `%23`: `yuyun%23123`
5. API call: `https://api.isan.eu.org/nickname/valo?id=yuyun%23123`
6. Validation completes successfully

**Example API call:**
```bash
curl "https://api.isan.eu.org/nickname/valo?id=yuyun%23123"
```

**Expected Response:**
```json
{
  "success": true,
  "game": "VALORANT",
  "id": "yuyun#123",
  "server": "Indonesia",
  "name": "YUYUN #123"
}
```

**Detection Logic:**
```typescript
const isValorant = product.slug === "valorant" || 
                   product.name.toLowerCase().includes("valorant");
```

**Frontend behavior:**
- User inputs `#` normally in the field
- Placeholder shows example: "Masukkan Riot ID (contoh: yuyun#123)"
- Value stored as-is with `#` character
- No visual encoding in the input field
- Encoding happens automatically during API call in backend

## Setup Instructions

No setup required! All validation APIs used are free and do not require authentication.

### cek-username API (Genshin Impact)
- **No API key needed**
- **No configuration required**
- Works out of the box

### Sandrocods API & Isan.eu.org API
- **No API key needed**
- **No configuration required**
- Free and open-source

## Troubleshooting

### Validation Not Working

1. **Check game slug** matches `GAME_TYPE_MAP`
2. **Check API response** in backend logs
3. **Verify User ID format** is correct for the game
4. **Test API directly** using curl:

```bash
# cek-username API (Genshin Impact)
curl "https://cek-username.onrender.com/game/genshinimpact?uid=831826798&zone=os_asia"

# Sandrocods API
curl "https://api-cek-id-game-ten.vercel.app/api/check-id-game?type_name=honkai_star_rail&userId=123456789&zoneId="

# Valorant (isan.eu.org API - note the %23 encoding)
curl "https://api.isan.eu.org/nickname/valo?id=yuyun%23123"

# Mobile Legends (isan.eu.org API)
curl "https://api.isan.eu.org/nickname/ml?id=123456789&server=1234"
```

### Common Issues

**"Validation not available"**
- Game not in `GAME_TYPE_MAP`
- Add game to mapping or use isan.eu.org fallback

**"User ID not found"**
- User entered wrong ID
- Wrong server/zone selected
- API temporarily unavailable

**Valorant validation fails**
- Check user entered `#` character (e.g., `name#tag`)
- Verify tagline is correct
- System auto-encodes `#` to `%23`

**cek-username API timeout/error**
- Genshin validation falls back to format check only
- Message: "Valid UID format (username not available)"

**API Timeout**
- External API may be slow
- System will allow purchase anyway (fail-safe)

## API Credits

- **cek-username API**: https://cek-username.vercel.app (Free, maintained by ilhamjaya08)
- **Sandrocods API**: https://github.com/sandrocods/api-cek-id-game (Free, no key)
- **Isan.eu.org API**: https://api.isan.eu.org (Free, no key)

## Future Enhancements

Potential improvements:
- Cache validation results (reduce API calls)
- Add more games using cek-username API (supports 10+ games)
- Support batch validation
- Add validation history/logging
- Admin dashboard for validation stats
