# Convex Auth Setup Guide

> Complete guide for setting up Convex Auth with X OAuth

---

## 📋 Overview

We've replaced mock authentication with **real Convex Auth**:

### What's Implemented:
- ✅ Convex Auth with X OAuth provider
- ✅ Encrypted token storage in Convex
- ✅ Session management via Convex
- ✅ X connection verification
- ✅ Auto-refresh token support (structure ready)

---

## 🚀 Setup Instructions

### 1. Install Convex CLI

```bash
npm install -g convex
```

### 2. Initialize Convex

```bash
cd x-automation-api
npx convex dev
```

This will:
- Create a Convex deployment
- Generate `_generated/` folder with types
- Start local dev server

### 3. Set Up X OAuth App

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Add OAuth 2.0 settings:
   - **Callback URL**: `https://your-deployment.convex.site/auth/callback`
   - **Scopes**: `tweet.read`, `tweet.write`, `users.read`, `follows.read`, `follows.write`, `dm.read`, `dm.write`, `offline.access`

4. Copy credentials:
   - Client ID → `X_CLIENT_ID`
   - Client Secret → `X_CLIENT_SECRET`

### 4. Configure Environment Variables

Create `.env.local`:

```bash
# Convex
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=https://your-deployment.convex.site

# X OAuth
X_CLIENT_ID=your_x_client_id_here
X_CLIENT_SECRET=your_x_client_secret_here

# Encryption (32+ characters)
ENCRYPTION_KEY=your-super-secret-32-char-key!!
ENCRYPTION_SALT=your-random-salt

# Redis (optional, for rate limiting)
REDIS_URL=redis://localhost:6379

# RapidAPI
RAPIDAPI_KEY=your_rapidapi_key
```

### 5. Deploy Convex Functions

```bash
npx convex deploy
```

---

## 🔐 Authentication Flow

### Sign In with X

```
1. User clicks "Connect X Account"
2. Frontend calls Convex Auth: signIn("x")
3. User redirected to X OAuth page
4. User authorizes app on X.com
5. X redirects to: /auth/callback?code=xxx&state=xxx
6. Convex Auth exchanges code for tokens
7. Tokens encrypted and stored in Convex
8. Session created, user redirected to app
```

### API Authentication

All protected routes require:

```http
Authorization: Bearer <convex_session_token>
```

The middleware will:
1. Verify session with Convex
2. Check X connection status
3. Decrypt X tokens for API calls
4. Auto-refresh if needed (future)

---

## 📁 File Structure

```
convex/
├── _generated/          # Auto-generated types
├── schema.ts            # Database schema + auth tables
├── auth.ts              # Convex Auth configuration
├── http.ts              # HTTP routes for auth
└── users.ts             # User queries/mutations

src/
├── middleware/
│   ├── auth.ts          # Old mock middleware (deprecated)
│   └── convex-auth.ts   # Real Convex Auth middleware ✅
├── routes/
│   ├── auth.ts          # Auth routes (status, connect, disconnect)
│   └── workflows.ts     # Workflow API (uses convex-auth)
└── services/
    └── encryption.ts    # AES-256-GCM for X tokens
```

---

## 🔑 Encryption

X tokens are **encrypted** before storage:

```typescript
// Before storing in Convex
const encrypted = encrypt(xAccessToken);
// Format: iv:authTag:ciphertext (hex)

// When using for API calls
const decrypted = decrypt(encryptedAccessToken);
```

**Algorithm**: AES-256-GCM
- 256-bit key (derived from `ENCRYPTION_KEY`)
- Random 128-bit IV for each encryption
- Authentication tag prevents tampering

---

## 🧪 Testing

### Run All Tests
```bash
bun test
```

### Test Convex Auth Integration
```bash
bun test src/tests/convex-auth.test.ts
```

### Manual Test

1. Start dev server:
```bash
bun run dev
```

2. Open Swagger UI:
```
http://localhost:3001/swagger
```

3. Test auth endpoints:
- `GET /auth/status` - Check auth status
- `GET /auth/me` - Get current user (requires Bearer token)

---

## 🔄 Token Refresh

The system is structured to support auto-refresh:

```typescript
// In middleware/convex-auth.ts
if (user.xTokenExpiresAt && user.xTokenExpiresAt < Date.now()) {
  // Auto-refresh token
  const newTokens = await refreshXToken(user.xRefreshToken);
  // Update Convex with new tokens
}
```

**To implement**: Add `refreshXToken` function calling X API

---

## 📊 Schema Details

### users table

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Convex user ID |
| `email` | string | User email (from Convex Auth) |
| `xUserId` | string | X.com user ID |
| `xUsername` | string | @username |
| `xAccessToken` | string | **Encrypted** access token |
| `xRefreshToken` | string | **Encrypted** refresh token |
| `xTokenExpiresAt` | number | Token expiry timestamp |
| `xScopes` | string[] | Granted OAuth scopes |
| `profile` | object | X profile data |
| `preferences` | object | User preferences |
| `xConnectedAt` | number | Connection timestamp |
| `lastTokenRefresh` | number | Last refresh timestamp |

---

## 🔒 Security

### Implemented:
- ✅ AES-256-GCM encryption for X tokens
- ✅ Convex Auth session management
- ✅ X OAuth with PKCE (handled by Convex Auth)
- ✅ Rate limiting (100 req/min default)
- ✅ Input validation (Zod schemas)

### To Implement:
- ⏸️ Automatic token refresh
- ⏸️ Redis for distributed rate limiting
- ⏸️ IP blocking for suspicious activity
- ⏸️ 2FA (optional, per your decision)

---

## 🛠️ Troubleshooting

### "Invalid encrypted data format"
- Check `ENCRYPTION_KEY` is 32+ characters
- Ensure same key used for encrypt/decrypt

### "X_NOT_CONNECTED" error
- User hasn't connected X account
- Redirect to `/auth/x/connect`

### Convex connection errors
- Verify `CONVEX_URL` is correct
- Run `npx convex dev` to start local server

---

## ✅ Next Steps

1. **Set up X OAuth app** at developer.twitter.com
2. **Deploy Convex** with `npx convex deploy`
3. **Configure env vars** with real credentials
4. **Test sign-in flow** via Swagger UI
5. **Proceed to Phase 3**: Triggers implementation

---

**Questions?** Check Convex Auth docs: https://labs.convex.dev/auth
