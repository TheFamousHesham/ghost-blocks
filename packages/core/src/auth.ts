import jwt from 'jsonwebtoken';

export class GhostAuth {
  private readonly keyId: string;
  private readonly secret: Buffer;
  private readonly apiVersion: string;

  constructor(adminKey: string, apiVersion = 'v5.0') {
    const parts = adminKey.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('GHOST_ADMIN_KEY must be in format {id}:{hex_secret}');
    }
    this.keyId = parts[0];
    this.secret = Buffer.from(parts[1], 'hex');
    this.apiVersion = apiVersion;
  }

  /**
   * Generate a short-lived JWT (5 min expiry) signed with the admin key secret.
   * Ghost requires a fresh token per request batch.
   */
  generateToken(): string {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      { iat: now, exp: now + 300, aud: '/admin/' },
      this.secret,
      {
        algorithm: 'HS256',
        header: { alg: 'HS256', typ: 'JWT', kid: this.keyId },
      },
    );
  }

  getHeaders(): Record<string, string> {
    return {
      Authorization: `Ghost ${this.generateToken()}`,
      'Accept-Version': this.apiVersion,
      'Content-Type': 'application/json',
    };
  }
}
