# Username Validation API Integration

This service integrates multiple username validation APIs to verify game account User IDs before purchase.

## Supported APIs

### 1. Sandrocods API (Primary)
**Base URL:** `https://api-cek-id-game-ten.vercel.app/api/check-id-game`

Used for most games except Arena of Valor, Free Fire, and Mobile Legends.

### 2. Isan.eu.org API (Fallback)
**Base URL:** `https://api.isan.eu.org/nickname`

Used as fallback for games not supported by Sandrocods API.

## Game Support Matrix

### Games Using Sandrocods API ✅

| Game Name | Slug | Type Name | Zone ID Required |
|-----------|------|-----------|------------------|
| Genshin Impact | `genshin-impact` | `genshin_impact` | ✅ Yes |
| Honkai Star Rail | `honkai-star-rail` | `honkai_star_rail` | ❌ No |
| Call of Duty Mobile | `cod-mobile` | `call_of_duty` | ❌ No |
| Point Blank | `point-blank` | `point_blank` | ❌ No |
| Valorant | `valorant` | `valorant` | ❌ No |
| PUBG Mobile | `pubg-mobile` | `pubg_mobile` | ❌ No |

### Games Using Isan.eu.org API ✅

| Game Name | Endpoint | Server Required |
|-----------|----------|-----------------|
| Mobile Legends | `/ml` | ✅ Yes |
| Free Fire | `/ff` | ❌ No |
| Arena of Valor | `/aov` | ❌ No |
| Magic Chess | `/mcgg` | ✅ Yes |
| Zenless Zone Zero | `/zzz` | ❌ No |
| Honkai Impact | `/hi` | ❌ No |

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

1. User selects "Genshin Impact"
2. Enters User ID: `831826798`
3. Enters Server ID: `asia`
4. System validates and shows: "✓ Username ditemukan: PlayerName"
5. User proceeds to purchase

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

## Troubleshooting

### Validation Not Working

1. **Check game slug** matches `GAME_TYPE_MAP`
2. **Check API response** in backend logs
3. **Verify User ID format** is correct for the game
4. **Test API directly** using curl:

```bash
curl "https://api-cek-id-game-ten.vercel.app/api/check-id-game?type_name=genshin_impact&userId=831826798&zoneId=asia"
```

### Common Issues

**"Validation not available"**
- Game not in `GAME_TYPE_MAP`
- Add game to mapping or use isan.eu.org fallback

**"User ID not found"**
- User entered wrong ID
- Wrong server/zone selected
- API temporarily unavailable

**API Timeout**
- External API may be slow
- System will allow purchase anyway (fail-safe)

## API Credits

- **Sandrocods API**: https://github.com/sandrocods/api-cek-id-game
- **Isan.eu.org API**: https://api.isan.eu.org

Both APIs are free and open-source. No API key required.

## Future Enhancements

Potential improvements:
- Cache validation results (reduce API calls)
- Add more games to mapping
- Support batch validation
- Add validation history/logging
- Admin dashboard for validation stats
