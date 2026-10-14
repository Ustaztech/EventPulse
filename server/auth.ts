import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'nsuk-eventpulse-jwt-super-secret-key-production-2026';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 10;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Hash a password securely using PBKDF2 with a random 16-byte salt.
 * Returns salt:hash format.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a salt:hash string.
 * Uses timing-safe equality comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  const candidateHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(originalHash, 'hex'));
}

/**
 * Generate a random cryptographically secure token.
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a 6-digit verification code.
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + crypto.randomInt(900000)).toString();
}

/**
 * Create a signed session token.
 */
export function createSessionToken(payload: { id: string; email: string; role: string; name: string }, rememberMe: boolean = false): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60); // 30 days or 24 hours
  
  const claims = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp,
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${claims}`)
    .digest('base64url');

  return `${header}.${claims}.${signature}`;
}

/**
 * Verify and decode a session token.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: any; error?: string } {
  if (!token) return { valid: false, error: 'No token provided' };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, error: 'Malformed token' };

  const [header, claims, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${claims}`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false, error: 'Invalid signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to parse payload' };
  }
}

/**
 * Rate limit checker by IP / action key.
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Reset rate limit after successful login.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
