# RapidAPI Integration for Genshin Impact Validation

This integration uses RapidAPI's check-id-game service to validate Genshin Impact user IDs.

## Setup

### 1. Get RapidAPI Key

1. Sign up for RapidAPI account at https://rapidapi.com
2. Subscribe to the "Check ID Game" API at https://rapidapi.com/hub
3. Copy your API key from the dashboard

### 2. Configure the API Key in Leap

Open **Settings** in the Leap sidebar and add:

- **Secret Name**: `RapidApiKey`
- **Secret Value**: Your RapidAPI key

## How It Works

### API Endpoint

The validation uses the following RapidAPI endpoint:

```
GET https://check-id-game.p.rapidapi.com/api/rapid_api/test_game_genshin/{userId}/{server}
```

### Parameters

- `userId`: The Genshin Impact UID entered by the user (e.g., `831826798`)
- `server`: The game server region (default: `asia`)
  - Supported servers: `asia`, `america`, `europe`, `cht`

### Response Format

Success response:
```json
{
  "status": "success",
  "data": {
    "username": "Player Name",
    "uid": "831826798",
    "server": "asia"
  }
}
```

Error response:
```json
{
  "status": "error",
  "message": "User ID not found or invalid server"
}
```

## Integration Points

### Backend Validation

The validation is integrated into the existing validation system at:
- `/backend/validation/genshin_rapidapi.ts` - RapidAPI client
- `/backend/validation/validate_username.ts` - Main validation endpoint

When a user validates their Genshin Impact UID:
1. System detects "Genshin" in product name
2. Calls RapidAPI with UID and server region
3. Returns username if found, or error message if not

### Frontend Usage

The frontend calls the validation endpoint:

```typescript
POST /validation/username
{
  "productId": 4, // Genshin Impact product ID
  "userId": "831826798",
  "serverId": "asia" // Optional, defaults to "asia"
}
```

## Server Regions

Genshin Impact has different servers:
- `asia` - Asia Pacific (default)
- `america` - North America
- `europe` - Europe
- `cht` - Taiwan/Hong Kong/Macau

Users should select their server region for accurate validation.

## Error Handling

The validation gracefully handles errors:
- If RapidAPI key is not configured, validation is skipped with a warning
- If API call fails, returns user-friendly error message
- Transaction can still proceed even if validation fails (fail-safe)

## Testing

### Test the Validation

1. Configure RapidAPI key in Settings
2. Go to Genshin Impact product page
3. Enter a valid UID (e.g., `831826798`)
4. Select server region (e.g., `asia`)
5. Click validate to check username

### Check Logs

Backend logs will show:
- `🎮 Using RapidAPI for Genshin Impact validation`
- `✅ Genshin username found: [username]`
- `❌ Genshin validation failed: [error]`

## Troubleshooting

### API Key Not Working

1. Verify API key is correctly set in Settings
2. Check RapidAPI subscription is active
3. Ensure you're subscribed to "Check ID Game" API

### User ID Not Found

1. Verify the UID is correct
2. Check the server region matches the user's account
3. Try different server regions if unsure

### Validation Disabled

If you see "RapidApiKey not configured":
1. Go to Settings in Leap sidebar
2. Add secret `RapidApiKey` with your API key
3. Restart validation

## Cost & Limits

- Check your RapidAPI plan for request limits
- Free tier may have limited requests per month
- Monitor usage in RapidAPI dashboard

## Future Enhancements

Potential improvements:
- Cache validation results to reduce API calls
- Support for additional game servers
- Batch validation for multiple UIDs
