import crypto from 'crypto';

/**
 * Derives a consistent 32-byte key from environment configuration.
 * Uses TOKEN_ENCRYPTION_KEY if set; falls back to SUPABASE_SERVICE_ROLE_KEY
 * to ensure zero crashes in development while maintaining high entropy.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'pixora-fallback-secret-key-32b!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string (e.g. refresh token) using AES-256-GCM.
 * Output format: "ivHex:authTagHex:ciphertextHex"
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM ciphertext created by encryptToken.
 */
export function decryptToken(cipherPackage: string): string {
  if (!cipherPackage) return '';
  
  // If not formatted with IV and auth tag, return as-is (e.g. unencrypted legacy token)
  const parts = cipherPackage.split(':');
  if (parts.length !== 3) {
    return cipherPackage;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('Failed to decrypt token:', err);
    return '';
  }
}

/**
 * Generates an HMAC-SHA256 signature for OAuth state validation.
 */
export function signOAuthState(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const key = getEncryptionKey();
  const sig = crypto.createHmac('sha256', key).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Verifies an HMAC-SHA256 OAuth state string and returns the payload if valid.
 */
export function verifyOAuthState<T = any>(stateString: string): T | null {
  if (!stateString || !stateString.includes('.')) return null;
  const [data, sig] = stateString.split('.');
  const key = getEncryptionKey();
  const expectedSig = crypto.createHmac('sha256', key).update(data).digest('base64url');

  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    try {
      const decoded = Buffer.from(data, 'base64url').toString('utf8');
      return JSON.parse(decoded) as T;
    } catch {
      return null;
    }
  }
  return null;
}
