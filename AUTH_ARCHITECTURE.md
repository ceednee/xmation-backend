# Authentication Architecture Decision

## Context
- **Backend**: Elysia.js (Bun runtime)
- **Database**: Convex (real-time, serverless)
- **Requirement**: Users MUST authenticate their X.com account before using any features
- **Frontend**: React (implied from question)

---

## Option 1: Convex Auth (RECOMMENDED)

### Why Convex Auth is Best

| Factor | Convex Auth |
|--------|-------------|
| **Native Integration** | Built for Convex, seamless with our DB |
| **X OAuth Support** | Native OAuth provider support |
| **Token Storage** | X tokens stored securely in Convex (encrypted) |
| **Session Management** | Built-in sessions, no external service needed |
| **Real-time** | Works with Convex subscriptions |
| **Architecture Fit** | Single stack (Convex for DB + Auth + Crons) |

### How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │────▶│  Convex Auth │────▶│   X OAuth   │
│   Client    │◀────│   (OAuth)    │◀────│   Server    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Convex    │
                    │   Database   │
                    │  (x tokens)  │
                    └──────────────┘
```

### Convex Auth + X OAuth Flow

```typescript
// 1. User clicks "Connect X Account"
// 2. Convex Auth initiates OAuth flow
const signInWithX = async () => {
  await signInWithOAuth({ 
    provider: 'x',  // or 'twitter'
    redirectTo: '/onboarding'
  });
};

// 3. X.com OAuth redirect back to app
// 4. Convex Auth stores tokens in users table
// 5. Elysia API verifies Convex session on each request
```

### Convex Schema with Auth

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth tables (users, sessions, etc.)
  ...authTables,
  
  // Extended user table with X data
  users: defineTable({
    // ... auth fields auto-added
    
    // X OAuth (REQUIRED)
    xUserId: v.string(),
    xUsername: v.string(),
    xAccessToken: v.string(),  // Encrypted
    xRefreshToken: v.string(), // Encrypted
    xTokenExpiresAt: v.number(),
    xScopes: v.array(v.string()),
    
    // X Profile (from RapidAPI)
    profile: v.object({
      displayName: v.string(),
      avatarUrl: v.string(),
      followersCount: v.number(),
      verified: v.boolean(),
    }),
    
    // Status
    xConnectedAt: v.number(),
    lastTokenRefresh: v.number(),
  })
  .index("by_xUserId", ["xUserId"])
  .index("by_xUsername", ["xUsername"]),
  
  // ... rest of schema
});
```

### React Integration

```typescript
// src/main.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConvexProvider client={convex}>
    <ConvexAuthProvider>
      <App />
    </ConvexAuthProvider>
  </ConvexProvider>
);

// src/components/ConnectXButton.tsx
import { useAuthActions } from "@convex-dev/auth/react";

export function ConnectXButton() {
  const { signIn } = useAuthActions();
  
  return (
    <button 
      onClick={() => signIn("x-oauth")}
      className="connect-x-btn"
    >
      Connect X Account (Required)
    </button>
  );
}

// src/components/ProtectedRoute.tsx
import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/connect-x" />;
  
  return children;
}
```

### Elysia + Convex Auth Integration

```typescript
// src/middleware/auth.ts
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

export const convexAuthMiddleware = async ({ request, set }) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    set.status = 401;
    return { error: 'No token provided' };
  }
  
  // Verify token with Convex Auth
  const session = await convex.query(api.auth.verifyToken, { token });
  
  if (!session || !session.xUserId) {
    set.status = 401;
    return { error: 'Invalid token or X not connected' };
  }
  
  // Attach user to request
  request.user = session;
};
```

---

## Option 2: Clerk (Alternative)

### When to Consider Clerk
- You need pre-built UI components
- You want social login options (Google, GitHub, etc.)
- You need user management dashboard

### Drawbacks vs Convex Auth
- Extra service to manage
- Need to sync Clerk users with Convex
- More complex architecture

### Clerk + X OAuth Flow
```typescript
// 1. User signs up with Clerk (email/google/github)
// 2. Post-signup, force X OAuth connection
// 3. Clerk provides JWT
// 4. Elysia validates Clerk JWT
// 5. X tokens stored separately in Convex
```

---

## Option 3: NextAuth.js (If Using Next.js)

### When to Use
- Already using Next.js frontend
- Want open-source, self-hosted auth

### Drawbacks
- Requires Next.js (not pure React)
- Need custom adapter for Convex
- More setup complexity

---

## Decision Matrix

| Criteria | Convex Auth | Clerk | NextAuth.js |
|----------|-------------|-------|-------------|
| **X OAuth Required** | ✅ Native | ✅ Yes | ✅ Yes |
| **Convex Integration** | ✅ Native | ⚠️ Sync needed | ⚠️ Custom adapter |
| **Elysia Compatibility** | ✅ JWT verify | ✅ JWT verify | ✅ JWT verify |
| **Real-time Subscriptions** | ✅ Built-in | ⚠️ Separate | ⚠️ Separate |
| **Token Storage** | ✅ Convex (encrypted) | Clerk + Convex | Convex |
| **Pre-built UI** | ⚠️ Basic | ✅ Rich components | ⚠️ Basic |
| **User Dashboard** | ❌ Build own | ✅ Included | ❌ Build own |
| **Pricing** | ✅ Free tier | Paid for scale | ✅ Free |
| **Single Stack** | ✅ Yes | ❌ No | ❌ No |

---

## RECOMMENDATION: Convex Auth

### Why?

1. **Single Stack Simplicity**
   - Database + Auth + Crons all in Convex
   - No external auth service to manage
   - Fewer moving parts

2. **Mandatory X OAuth is Clean**
   ```typescript
   // Users table requires xUserId
   // No X connection = no workflow access
   const canCreateWorkflow = async (userId) => {
     const user = await db.get(userId);
     return !!user.xAccessToken; // Must have X token
   };
   ```

3. **Token Security**
   - X tokens encrypted in Convex
   - Automatic refresh via Convex crons
   - No token exposure to frontend

4. **Session Management**
   - Convex handles sessions
   - Elysia just verifies Convex JWT
   - Real-time auth state with subscriptions

5. **Architecture Alignment**
   - Already using Convex for everything
   - Consistent deployment model
   - Same TypeScript types throughout

### Implementation Flow

```
1. User visits app
   ↓
2. React checks Convex auth state
   ↓
3. No session? Show "Connect X" button
   ↓
4. Click → Convex Auth → X OAuth popup
   ↓
5. User authorizes on X.com
   ↓
6. Callback → Convex stores X tokens
   ↓
7. Session active, can use Elysia API
   ↓
8. API verifies Convex session
   ↓
9. All features unlocked ✓
```

---

## Updated Tech Stack with Convex Auth

| Layer | Technology |
|-------|------------|
| **Frontend Auth** | Convex Auth React SDK |
| **Backend Auth** | Convex JWT verification |
| **OAuth Provider** | X (Twitter) via Convex Auth |
| **Token Storage** | Convex (encrypted) |
| **Session** | Convex Auth sessions |
| **API Protection** | Elysia middleware verifying Convex tokens |

---

## Code Example: Complete Auth Flow

### 1. Frontend (React + Convex Auth)
```typescript
// src/App.tsx
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

function App() {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      
      <Unauthenticated>
        <ConnectXScreen />
      </Unauthenticated>
      
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}

// src/components/ConnectXScreen.tsx
import { useAuthActions } from "@convex-dev/auth/react";

export function ConnectXScreen() {
  const { signIn } = useAuthActions();
  
  return (
    <div className="connect-screen">
      <h1>Connect Your X Account</h1>
      <p>Required to create automations</p>
      <button onClick={() => signIn("x")}>
        Connect @username
      </button>
    </div>
  );
}
```

### 2. Backend (Elysia + Convex)
```typescript
// src/middleware/auth.ts
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

export const requireAuth = () => async ({ request, set }) => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    set.status = 401;
    return { error: { code: 'UNAUTHORIZED', message: 'No token' } };
  }
  
  // Verify with Convex
  const user = await convex.query(api.auth.verifySession, { token });
  
  if (!user) {
    set.status = 401;
    return { error: { code: 'INVALID_TOKEN', message: 'Invalid session' } };
  }
  
  // Check X connection (REQUIRED)
  if (!user.xAccessToken) {
    set.status = 403;
    return { error: { 
      code: 'X_NOT_CONNECTED', 
      message: 'X account required' 
    }};
  }
  
  request.user = user;
};

// src/api/routes/workflows.ts
import { Elysia } from 'elysia';
import { requireAuth } from '../../middleware/auth';

export const workflowRoutes = new Elysia({ prefix: '/workflows' })
  .guard({ beforeHandle: [requireAuth()] })
  .get('/', async ({ request }) => {
    // User is authenticated AND has X connected
    const workflows = await getWorkflows(request.user._id);
    return { success: true, data: workflows };
  });
```

### 3. Convex Functions
```typescript
// convex/auth.ts (auto-generated by Convex Auth)
// Handles OAuth, sessions, token storage

// convex/users.ts
import { query } from "./_generated/server";

export const getCurrentWithX = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;
    
    // Check if X is connected
    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_xUserId", q => q.eq("xUserId", user.xUserId))
      .unique();
    
    return {
      ...userDoc,
      xConnected: !!userDoc?.xAccessToken,
    };
  },
});
```

---

## Summary

**Use Convex Auth because:**
1. Native integration with our Convex database
2. Single stack (no external auth service)
3. Handles X OAuth natively
4. Secure token storage
5. Works seamlessly with Elysia
6. Real-time subscriptions work with auth state

**Mandatory X OAuth enforcement:**
```typescript
// Simple check in every protected route
if (!user.xAccessToken) {
  return { error: 'X account required' };
}
```

---

*Update main PLAN.md to include Convex Auth in the architecture*
