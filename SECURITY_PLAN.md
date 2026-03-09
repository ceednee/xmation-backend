# Security Plan - Xmation Backend System

> Defense in depth: Multiple security layers to protect user data, X accounts, and system integrity.

---

## Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Layer 7: Application    │ Input validation, authentication, authorization  │
│  Layer 6: API            │ Rate limiting, CORS, request signing             │
│  Layer 5: Network        │ WAF, DDoS protection, TLS 1.3                    │
│  Layer 4: Infrastructure │ Container security, K8s policies, VPC            │
│  Layer 3: Data           │ Encryption at rest, token encryption             │
│  Layer 2: Secrets        │ Vault, key rotation, least privilege             │
│  Layer 1: Monitoring     │ Logging, alerting, SIEM, incident response       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication & Authorization Security

### 1.1 X OAuth Security

| Control | Implementation | Purpose |
|---------|----------------|---------|
| **PKCE** | OAuth 2.0 with PKCE | Prevent authorization code interception |
| **State Parameter** | Random nonce | Prevent CSRF attacks |
| **Scope Minimization** | Least privilege scopes | Only request necessary permissions |
| **Token Encryption** | AES-256-GCM | Protect tokens at rest |
| **Token Rotation** | Auto-refresh before expiry | Minimize exposure window |
| **Token Binding** | Tokens tied to user session | Prevent token theft reuse |

### X OAuth Flow Security
```typescript
// Secure OAuth configuration
const xOAuthConfig = {
  clientId: process.env.X_CLIENT_ID,
  clientSecret: process.env.X_CLIENT_SECRET,
  redirectUri: 'https://api.xautomation.com/auth/callback',
  
  // Security settings
  pkce: true,                    // Proof Key for Code Exchange
  state: generateSecureRandom(32), // CSRF protection
  scopes: [                     // Minimal required scopes
    'tweet.read',
    'tweet.write',
    'users.read',
    'follows.read',
    'offline.access'
  ],
  
  // Token storage
  tokenEncryption: {
    algorithm: 'aes-256-gcm',
    keyRotation: '90d',         // Rotate keys every 90 days
  }
};
```

### 1.2 Session Security

| Control | Implementation |
|---------|----------------|
| **Session Tokens** | JWT with short expiry (15 min) |
| **Refresh Tokens** | Rotating refresh tokens (7 days) |
| **Token Storage** | httpOnly, secure, sameSite=strict cookies |
| **Session Binding** | Fingerprint (IP + User-Agent hash) |
| **Concurrent Sessions** | Max 5 per user, notify on new login |
| **Session Revocation** | Instant revoke on logout/security event |

```typescript
// Session configuration
const sessionConfig = {
  accessToken: {
    expiresIn: '15m',
    algorithm: 'ES256',           // ECDSA for performance
    issuer: 'xautomation-api',
    audience: 'xautomation-client'
  },
  refreshToken: {
    expiresIn: '7d',
    rotation: true,               // New refresh token on each use
    reuseDetection: true          // Detect stolen refresh tokens
  },
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
};
```

### 1.3 Mandatory X Connection Enforcement

```typescript
// Middleware: Require X OAuth for ALL protected routes
export const requireXAuth = async ({ request, set }) => {
  // 1. Verify Convex session
  const session = await verifyConvexToken(request.headers.authorization);
  if (!session) {
    set.status = 401;
    return { error: 'Invalid session' };
  }
  
  // 2. Check X connection (MANDATORY)
  const userX = await db.users_x.getByUserId(session.userId);
  if (!userX?.xAccessToken) {
    set.status = 403;
    return { 
      error: 'X account required',
      code: 'X_NOT_CONNECTED',
      action: '/auth/x/connect'
    };
  }
  
  // 3. Verify X token not expired
  if (userX.xTokenExpiresAt < Date.now()) {
    // Auto-refresh token
    await refreshXToken(userX.userId);
  }
  
  // 4. Attach to request
  request.user = session;
  request.xAuth = userX;
};
```

---

## 2. API Security

### 2.1 Rate Limiting (Multi-Layer)

#### Layer 1: Global Rate Limiting (CloudFlare/Nginx)
```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=global:10m rate=100r/m;
limit_req zone=global burst=20 nodelay;

# Block obvious attacks
limit_req_zone $binary_remote_addr zone=aggressive:10m rate=10r/m;
```

#### Layer 2: Application Rate Limiting (Elysia)
```typescript
// src/middleware/rate-limit.ts
import { rateLimit } from 'elysia-rate-limit';

// Global API rate limit
export const globalRateLimit = rateLimit({
  max: 100,                    // requests
  duration: 60000,             // per minute
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.remoteAddress;
  },
  onReject: (req) => {
    return { 
      error: 'Rate limit exceeded',
      retryAfter: 60
    };
  }
});

// Strict rate limit for auth endpoints
export const authRateLimit = rateLimit({
  max: 5,                      // 5 attempts
  duration: 60000,             // per minute
  keyGenerator: (req) => req.body?.email || req.remoteAddress,
  skipSuccessfulRequests: true // Reset on success
});

// Per-user rate limit for workflows
export const workflowRateLimit = rateLimit({
  max: 60,                     // 60 workflow operations
  duration: 60000,             // per minute per user
  keyGenerator: (req) => req.user?.id
});

// X API proxy rate limit (respect X's limits)
export const xApiRateLimit = rateLimit({
  max: 300,                    // X's rate limit
  duration: 900000,            // per 15 minutes
  keyGenerator: (req) => req.xAuth?.xUserId
});
```

#### Rate Limit Headers
```typescript
// Response headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709817600
X-RateLimit-Retry-After: 60
```

### 2.2 Input Validation & Sanitization

```typescript
// src/validators/workflow.ts
import { z } from 'zod';

// Strict input validation
export const createWorkflowSchema = z.object({
  name: z.string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[\w\s-]+$/, 'Invalid characters'), // No special chars
  description: z.string()
    .max(500, 'Description too long')
    .transform(sanitizeHtml),    // Strip HTML/JS
  tags: z.array(z.string().regex(/^[\w-]+$/)).max(10),
  processingLimit: z.union([
    z.literal('unlimited'),
    z.number().int().min(1).max(10000)
  ])
});

// Content Security - Prevent injection
function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '')        // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JS protocols
    .replace(/on\w+=/gi, '')     // Remove event handlers
    .trim();
}

// SQL/NoSQL Injection Prevention
// Convex queries use parameterized queries by design
// Never concatenate user input into queries
```

### 2.3 CORS Configuration

```typescript
// src/config/cors.ts
export const corsConfig = {
  origin: (request: Request): string => {
    const allowedOrigins = [
      'https://app.xautomation.com',
      'https://admin.xautomation.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
    ].filter(Boolean);
    
    const origin = request.headers.get('origin');
    return allowedOrigins.includes(origin) ? origin : '';
  },
  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-API-Version'
  ],
  
  credentials: true,
  maxAge: 86400,
  
  // Security headers
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
};
```

### 2.4 Request Signing & Integrity

```typescript
// For webhook endpoints or external integrations
export const verifyRequestSignature = (req: Request) => {
  const signature = req.headers.get('x-signature');
  const timestamp = req.headers.get('x-timestamp');
  const body = JSON.stringify(req.body);
  
  // Verify timestamp (prevent replay attacks)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 300000) { // 5 min tolerance
    throw new Error('Request expired');
  }
  
  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )) {
    throw new Error('Invalid signature');
  }
};
```

---

## 3. Data Security

### 3.1 Encryption at Rest

| Data Type | Encryption | Key Management |
|-----------|------------|----------------|
| **X Access Tokens** | AES-256-GCM | Convex encrypted field |
| **X Refresh Tokens** | AES-256-GCM | Convex encrypted field |
| **User Preferences** | AES-256 | Convex standard |
| **Analytics Events** | None (non-sensitive) | - |

```typescript
// src/services/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive key from master secret
const MASTER_KEY = scryptSync(
  process.env.ENCRYPTION_KEY,
  process.env.ENCRYPTION_SALT,
  KEY_LENGTH
);

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage in Convex
export const storeXTokens = async (userId, tokens) => {
  await db.users_x.update(userId, {
    xAccessToken: encrypt(tokens.accessToken),
    xRefreshToken: encrypt(tokens.refreshToken),
    xTokenExpiresAt: tokens.expiresAt
  });
};
```

### 3.2 Encryption in Transit

| Layer | Implementation |
|-------|----------------|
| **Client ↔ API** | TLS 1.3 only, HSTS enabled |
| **API ↔ Convex** | TLS 1.3 (handled by Convex SDK) |
| **API ↔ RapidAPI** | TLS 1.3 (HTTPS) |
| **Internal Services** | mTLS in Kubernetes |

```yaml
# kubernetes/ingress-tls.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    # TLS configuration
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256"
    
    # HSTS
    nginx.ingress.kubernetes.io/hsts: "true"
    nginx.ingress.kubernetes.io/hsts-max-age: "31536000"
    nginx.ingress.kubernetes.io/hsts-include-subdomains: "true"
    
    # Security headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header X-Frame-Options "DENY" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
      add_header Content-Security-Policy "default-src 'self'" always;
```

### 3.3 Secret Management

```typescript
// src/config/secrets.ts
// NEVER commit secrets to git
// Use environment variables or secret management service

interface Secrets {
  // Database
  CONVEX_URL: string;
  
  // X OAuth
  X_CLIENT_ID: string;
  X_CLIENT_SECRET: string;
  
  // Encryption
  ENCRYPTION_KEY: string;        // 32+ characters
  ENCRYPTION_SALT: string;       // 16+ characters
  
  // JWT
  JWT_SECRET: string;
  
  // External APIs
  RAPIDAPI_KEY: string;
  
  // Webhooks
  WEBHOOK_SECRET: string;
}

// Validate all secrets on startup
export function validateSecrets(): void {
  const required = [
    'CONVEX_URL',
    'X_CLIENT_ID',
    'X_CLIENT_SECRET',
    'ENCRYPTION_KEY',
    'JWT_SECRET',
    'RAPIDAPI_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
  
  // Validate encryption key strength
  if (process.env.ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
}
```

### 3.4 Key Rotation Strategy

```typescript
// Automatic key rotation for X tokens
export const scheduleTokenRotation = () => {
  // Check for tokens expiring in next 24 hours
  const expiringTokens = await db.users_x.findExpiring(24 * 60 * 60 * 1000);
  
  for (const user of expiringTokens) {
    try {
      // Refresh X token
      const newTokens = await refreshXToken(user.xRefreshToken);
      
      // Store new tokens (automatically encrypted)
      await storeXTokens(user.userId, newTokens);
      
      // Log rotation (without tokens)
      await logSecurityEvent('token_rotated', {
        userId: user.userId,
        xUserId: user.xUserId
      });
    } catch (error) {
      // Token refresh failed - notify user to reconnect
      await notifyUserTokenExpired(user.userId);
    }
  }
};

// Run every hour via Convex cron
```

---

## 4. Infrastructure Security

### 4.1 DDoS Protection

#### Layer 1: CloudFlare (DNS/CDN)
```yaml
# CloudFlare settings
plan: Enterprise
features:
  - DDoS Protection: Automatic (always on)
  - WAF: Managed ruleset + custom rules
  - Rate Limiting: 1000 req/10s per IP
  - Bot Management: Challenge suspected bots
  - Under Attack Mode: Available for emergencies
```

#### Layer 2: Nginx Rate Limiting
```nginx
# nginx.conf
# Connection limiting
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;              # Max 10 connections per IP

# Request rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req zone=general burst=20 nodelay;

# Aggressive IP blocking
limit_req_zone $binary_remote_addr zone=strict:10m rate=1r/s;
limit_req zone=strict burst=5 nodelay;

# Block large payloads
client_max_body_size 1m;
client_body_buffer_size 1m;
```

#### Layer 3: Application Circuit Breakers
```typescript
// Circuit breaker for external APIs
import { CircuitBreaker } from 'opossum';

const xApiBreaker = new CircuitBreaker(callXApi, {
  timeout: 5000,              // 5 second timeout
  errorThresholdPercentage: 50,
  resetTimeout: 30000,        // 30 second cooldown
  volumeThreshold: 10
});

xApiBreaker.on('open', () => {
  logSecurityEvent('circuit_breaker_opened', { service: 'x_api' });
  alertOpsTeam('X API circuit breaker opened - possible attack');
});

// Usage
const result = await xApiBreaker.fire(request);
```

### 4.2 Web Application Firewall (WAF)

#### CloudFlare Managed Rules
```yaml
ruleset:
  - id: xss_attacks
    action: block
    sensitivity: high
  
  - id: sql_injection
    action: block
    sensitivity: high
  
  - id: common_exploits
    action: block
    sensitivity: medium
  
  - id: bad_bots
    action: challenge
    
  - id: rate_limit_anomaly
    action: challenge
    threshold: 1000  # req per 5 min
```

#### Custom WAF Rules
```yaml
# Block specific attack patterns
rules:
  # Block credential stuffing attempts
  - name: "Block Auth Abuse"
    expression: '(http.request.uri.path contains "/auth") and (ip.geoip.country in {"CN" "RU"})'
    action: challenge
  
  # Block known bad user agents
  - name: "Block Bad UA"
    expression: '(http.user_agent contains "sqlmap") or (http.user_agent contains "nikto")'
    action: block
  
  # Rate limit workflow creation
  - name: "Workflow Creation Limit"
    expression: '(http.request.uri.path contains "/workflows") and (http.request.method eq "POST")'
    action: rate_limit
    limit: 10 per minute
```

### 4.3 Container Security

```dockerfile
# Dockerfile security hardening
FROM oven/bun:1.0-slim AS production

# Run as non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
USER appuser

# Minimal attack surface
WORKDIR /app
COPY --chown=appuser:appgroup . .

# No shell access
RUN rm -rf /bin/sh /bin/bash

# Read-only filesystem (in k8s)
# Mount tmp directories as emptyDir
```

```yaml
# kubernetes/security-context.yaml
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: api
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      resources:
        limits:
          cpu: "1000m"
          memory: "1Gi"
        requests:
          cpu: "100m"
          memory: "256Mi"
```

### 4.4 Network Policies (K8s)

```yaml
# kubernetes/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: xautomation-api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Only accept from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    # Only allow HTTPS outbound
    - to: []
      ports:
        - protocol: TCP
          port: 443
    # Allow DNS
    - to: []
      ports:
        - protocol: UDP
          port: 53
```

---

## 5. X API Specific Security

### 5.1 X Token Protection

| Threat | Mitigation |
|--------|------------|
| **Token Theft** | Encryption at rest, short expiry, rotation |
| **Token Replay** | Bind to session fingerprint |
| **Scope Escalation** | Minimal scopes, user approval required |
| **Revocation** | Handle X revocations gracefully |

```typescript
// Detect and handle X token issues
export const executeXAction = async (userId, action) => {
  const userX = await db.users_x.getByUserId(userId);
  
  try {
    return await action(userX.xAccessToken);
  } catch (error) {
    if (error.code === 'TOKEN_REVOKED') {
      // User revoked access on X.com
      await disconnectUserX(userId);
      await notifyUser(userId, 'X connection revoked');
      throw new Error('X authorization revoked');
    }
    
    if (error.code === 'RATE_LIMITED') {
      // X API rate limit
      await delay(error.retryAfter * 1000);
      return executeXAction(userId, action); // Retry
    }
    
    throw error;
  }
};
```

### 5.2 X API Rate Limit Compliance

```typescript
// Respect X's rate limits strictly
const X_RATE_LIMITS = {
  tweets: { max: 200, window: 3600 },      // 200/hour
  likes: { max: 1000, window: 3600 },      // 1000/hour
  follows: { max: 400, window: 86400 },    // 400/day
  dms: { max: 1000, window: 86400 }        // 1000/day
};

// Per-user rate limit tracking
export const checkXRateLimit = async (userId, action) => {
  const limit = X_RATE_LIMITS[action];
  const key = `xrate:${userId}:${action}`;
  
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, limit.window);
  }
  
  if (current > limit.max) {
    throw new Error(`X ${action} rate limit exceeded`);
  }
  
  return limit.max - current; // Remaining
};
```

### 5.3 Abuse Prevention

```typescript
// Prevent spam/automation abuse
const ABUSE_CHECKS = {
  // Max workflows per user
  maxWorkflows: 50,
  
  // Max actions per workflow
  maxActionsPerWorkflow: 25,
  
  // Min time between similar actions
  actionCooldown: 60000, // 1 minute
  
  // Max daily actions per user
  maxDailyActions: 1000
};

export const validateWorkflow = async (userId, workflow) => {
  // Check workflow count
  const workflowCount = await db.workflows.countByUser(userId);
  if (workflowCount >= ABUSE_CHECKS.maxWorkflows) {
    throw new Error('Maximum workflows reached');
  }
  
  // Check action count
  if (workflow.actions.length > ABUSE_CHECKS.maxActionsPerWorkflow) {
    throw new Error('Too many actions in workflow');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /follow.*unfollow/i,       // Follow/unfollow loops
    /spam|bot/i,               // Suspicious keywords
    /(.)\1{10,}/              // Repeated characters
  ];
  
  const content = JSON.stringify(workflow);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      await flagForReview(userId, workflow, 'suspicious_pattern');
      throw new Error('Workflow flagged for review');
    }
  }
};
```

---

## 6. Monitoring & Incident Response

### 6.1 Security Logging

| Event | Log Level | Data Retention |
|-------|-----------|----------------|
| **Failed login** | WARN | 90 days |
| **X OAuth connect/disconnect** | INFO | 1 year |
| **Token refresh** | DEBUG | 30 days |
| **Rate limit hit** | WARN | 90 days |
| **Suspicious activity** | ERROR | 1 year |
| **Data export** | INFO | 1 year |
| **Permission change** | INFO | 1 year |

```typescript
// src/utils/security-logger.ts
interface SecurityEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  event: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  // NEVER log: tokens, passwords, PII
}

export const logSecurityEvent = (event: SecurityEvent) => {
  // Sanitize - remove sensitive fields
  const sanitized = {
    ...event,
    metadata: redactSensitive(event.metadata)
  };
  
  // Log to stdout (collected by Fluentd/Vector)
  console.log(JSON.stringify(sanitized));
  
  // Critical events → PagerDuty
  if (event.level === 'critical') {
    alertPagerDuty(event);
  }
  
  // High-risk events → SIEM
  if (['suspicious_login', 'token_theft_detected'].includes(event.event)) {
    sendToSIEM(sanitized);
  }
};

// Usage
logSecurityEvent({
  level: 'warn',
  event: 'failed_login',
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  metadata: { 
    username: req.body.username,
    reason: 'invalid_password'
    // NOT: password, token, etc.
  }
});
```

### 6.2 Intrusion Detection

```typescript
// Anomaly detection
export const detectAnomalies = () => {
  // Unusual login locations
  const unusualLogins = await db.securityEvents.find({
    event: 'login_success',
    timestamp: { $gt: Date.now() - 3600000 },
    location: { $ne: '$user.usualLocation' }
  });
  
  // Brute force attempts
  const bruteForceIPs = await db.securityEvents.aggregate([
    { $match: { event: 'failed_login', timestamp: { $gt: Date.now() - 300000 } } },
    { $group: { _id: '$ip', count: { $sum: 1 } } },
    { $match: { count: { $gt: 10 } } }
  ]);
  
  // Suspicious workflow patterns
  const spamWorkflows = await db.workflows.find({
    createdAt: { $gt: Date.now() - 60000 },
    'actions.type': { $in: ['FOLLOW_USER', 'SEND_DM'] },
    createdBy: { $in: '$newUsers' }
  });
  
  // Alert on findings
  for (const ip of bruteForceIPs) {
    await blockIP(ip._id);
    logSecurityEvent({
      level: 'critical',
      event: 'brute_force_detected',
      metadata: { ip: ip._id, attempts: ip.count }
    });
  }
};
```

### 6.3 Incident Response Plan

```yaml
# Security Incident Response
severity_levels:
  P1 (Critical): System breach, data exfiltration, token theft
  P2 (High): DDoS in progress, credential stuffing, API abuse
  P3 (Medium): Suspicious activity, policy violations
  P4 (Low): Minor violations, false positives

response_procedures:
  P1:
    - Immediately: Isolate affected systems
    - Within 5 min: Assemble incident response team
    - Within 15 min: Assess scope of breach
    - Within 1 hour: Begin containment
    - Within 4 hours: Notify affected users (if required)
    - Post-incident: Full post-mortem within 48 hours
  
  P2:
    - Within 5 min: Enable additional protections
    - Within 15 min: Identify attack source
    - Within 30 min: Implement blocks/mitigations
    - Within 2 hours: Monitor for recurrence

contact_tree:
  on_call_engineer: pager
  security_lead: pager + sms
  cto: pager (P1 only)
  legal: email (data breach only)
```

### 6.4 Automated Responses

```typescript
// Automated security responses
export const automatedResponse = async (event: SecurityEvent) => {
  switch (event.event) {
    case 'brute_force_detected':
      // Temporarily block IP
      await redis.setex(`block:${event.ip}`, 3600, '1');
      await sendSlackAlert(`Blocked IP ${event.ip} for brute force`);
      break;
    
    case 'suspicious_token_usage':
      // Revoke session
      await revokeSession(event.userId, event.sessionId);
      await notifyUser(event.userId, 'Suspicious activity detected');
      break;
    
    case 'rate_limit_anomaly':
      // Enable stricter rate limiting for user
      await enableStrictRateLimit(event.userId);
      break;
    
    case 'ddos_detected':
      // Enable "Under Attack" mode in CloudFlare
      await enableUnderAttackMode();
      await scaleUpWorkers();
      break;
  }
};
```

---

## 7. Compliance & Best Practices

### 7.1 Security Headers

```typescript
// Elysia security middleware
app.use((app) =>
  app.onResponse(({ set }) => {
    // Prevent clickjacking
    set.headers['X-Frame-Options'] = 'DENY';
    
    // Prevent MIME sniffing
    set.headers['X-Content-Type-Options'] = 'nosniff';
    
    // XSS protection
    set.headers['X-XSS-Protection'] = '1; mode=block';
    
    // Referrer policy
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    
    // Content Security Policy
    set.headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.xautomation.com"
    ].join('; ');
    
    // Permissions policy
    set.headers['Permissions-Policy'] = 
      'camera=(), microphone=(), geolocation=()';
  })
);
```

### 7.2 Data Retention & Privacy

```typescript
// GDPR/CCPA compliance
const DATA_RETENTION = {
  // User data
  userProfile: '7 years',           // Or until account deletion
  xTokens: 'until revocation',
  sessionLogs: '90 days',
  analyticsEvents: '1 year',
  
  // Security logs
  failedLogins: '90 days',
  securityIncidents: '7 years',
  
  // Workflow data
  workflows: 'until deletion',
  workflowRuns: '1 year',
  actionExecutions: '90 days'
};

// Automated cleanup
export const cleanupOldData = async () => {
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year
  
  await db.analyticsEvents.deleteMany({
    timestamp: { $lt: cutoff }
  });
  
  await db.actionExecutions.deleteMany({
    startedAt: { $lt: cutoff }
  });
};

// User data export (GDPR right to portability)
export const exportUserData = async (userId: string) => {
  const data = await collectUserData(userId);
  
  // Sanitize - remove internal IDs, tokens
  const sanitized = {
    profile: data.profile,
    workflows: data.workflows,
    analytics: data.analytics,
    exportDate: new Date().toISOString()
  };
  
  return sanitized;
};

// User account deletion (GDPR right to erasure)
export const deleteUserAccount = async (userId: string) => {
  // 1. Revoke X tokens
  await revokeXTokens(userId);
  
  // 2. Delete workflows
  await db.workflows.deleteMany({ userId });
  
  // 3. Anonymize analytics (keep for stats, remove PII)
  await db.analyticsEvents.updateMany(
    { userId },
    { $set: { userId: 'ANONYMIZED', metadata: {} } }
  );
  
  // 4. Delete user record
  await db.users.delete(userId);
  
  // 5. Log deletion
  logSecurityEvent({
    level: 'info',
    event: 'user_account_deleted',
    metadata: { userId: hash(userId) } // Hashed for audit
  });
};
```

### 7.3 Dependency Security

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    open-pull-requests-limit: 10
    labels:
      - dependencies
      - security
    
  # Automerge security patches
  - package-ecosystem: npm
    directory: /
    target-branch: main
    allowed_updates:
      - match:
          update_type: security
    automerge: true
```

```bash
# Security scanning
bunx audit               # Check for known vulnerabilities
bunx snyk test           # Snyk security scan
docker scan image        # Container scanning
```

### 7.4 Security Checklist

#### Pre-Deployment
- [ ] All secrets in environment variables (not code)
- [ ] Encryption keys are 32+ characters, randomly generated
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured with specific origins
- [ ] Security headers configured
- [ ] TLS 1.3 enforced
- [ ] Container running as non-root
- [ ] Network policies in place
- [ ] Logging configured (no sensitive data)
- [ ] WAF rules active
- [ ] DDoS protection enabled
- [ ] Dependabot enabled

#### Ongoing
- [ ] Weekly dependency audits
- [ ] Monthly penetration tests
- [ ] Quarterly security reviews
- [ ] Annual third-party security audit
- [ ] Incident response drills (quarterly)
- [ ] Security training for team (annual)

---

## 8. Security Testing

### 8.1 Automated Security Tests

```typescript
// tests/security/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should block after 100 requests per minute', async () => {
    const requests = Array(110).fill(null).map(() => 
      fetch('/api/v1/workflows')
    );
    
    const responses = await Promise.all(requests);
    const blocked = responses.filter(r => r.status === 429);
    
    expect(blocked.length).toBeGreaterThan(0);
  });
  
  it('should have correct rate limit headers', async () => {
    const res = await fetch('/api/v1/workflows');
    
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// tests/security/auth.test.ts
describe('Authentication', () => {
  it('should reject requests without X connection', async () => {
    const user = await createTestUser({ xConnected: false });
    const token = await generateToken(user);
    
    const res = await fetch('/api/v1/workflows', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: { code: 'X_NOT_CONNECTED' }
    });
  });
  
  it('should encrypt X tokens', async () => {
    const userX = await db.users_x.getByUserId(userId);
    
    // Token should be encrypted (not plaintext)
    expect(userX.xAccessToken).not.toContain('AAAA'); // Not JWT format
    expect(userX.xAccessToken).toContain(':'); // Encrypted format
  });
});

// tests/security/headers.test.ts
describe('Security Headers', () => {
  it('should include all security headers', async () => {
    const res = await fetch('/api/v1/workflows');
    
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Strict-Transport-Security')).toBeDefined();
  });
});
```

### 8.2 Penetration Testing Scope

```yaml
# Annual pen test scope
areas:
  - Authentication & Session Management
  - Authorization & Access Control
  - Input Validation & Injection
  - Business Logic Flaws
  - API Security
  - Cryptography
  - Infrastructure Security

tools:
  - OWASP ZAP
  - Burp Suite Pro
  - SQLMap
  - Nmap
  - Nikto

deliverables:
  - Executive summary
  - Detailed findings with CVSS scores
  - Proof of concepts
  - Remediation roadmap
  - Re-test results
```

---

## Summary

### Security Layers Applied

| Layer | Controls |
|-------|----------|
| **Application** | Input validation, auth, authz, rate limiting |
| **API** | CORS, request signing, circuit breakers |
| **Network** | TLS 1.3, WAF, DDoS protection |
| **Infrastructure** | Container security, K8s policies, network isolation |
| **Data** | AES-256 encryption, secure key management |
| **Monitoring** | Logging, SIEM, automated response, incident plan |

### Key Security Decisions

1. **Convex Auth** - Single-stack auth with native X OAuth
2. **Token Encryption** - AES-256-GCM for all X tokens
3. **Multi-layer Rate Limiting** - CloudFlare → Nginx → Application
4. **Defense in Depth** - Multiple security layers
5. **Zero Trust** - Verify every request, encrypt everything
6. **Monitoring First** - Log everything, alert on anomalies

---

*This security plan should be reviewed quarterly and updated as threats evolve.*
