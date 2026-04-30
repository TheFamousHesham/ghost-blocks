import dns from 'node:dns';
import { URL } from 'node:url';

const BLOCKED_IP_RANGES: RegExp[] = [
  /^127\./,                                       // IPv4 loopback
  /^10\./,                                        // RFC1918 Class A
  /^172\.(1[6-9]|2\d|3[01])\./,                   // RFC1918 Class B
  /^192\.168\./,                                  // RFC1918 Class C
  /^169\.254\./,                                  // Link-local (incl. cloud metadata)
  /^0\./,                                         // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,     // CGNAT
  /^::1$/,                                        // IPv6 loopback
  /^fd/i,                                         // IPv6 ULA
  /^fe80/i,                                       // IPv6 link-local
];

const DEFAULT_BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
]);

export interface UrlValidatorOptions {
  /** Additional hostnames to block (e.g. internal Docker service names) */
  extraBlockedHostnames?: string[];
  /** Skip DNS lookup (useful in tests). Default false. */
  skipDnsLookup?: boolean;
}

export class UrlValidator {
  private readonly blockedHostnames: Set<string>;
  private readonly skipDnsLookup: boolean;

  constructor(options: UrlValidatorOptions = {}) {
    this.blockedHostnames = new Set([
      ...DEFAULT_BLOCKED_HOSTNAMES,
      ...(options.extraBlockedHostnames || []).map((h) => h.toLowerCase()),
    ]);
    this.skipDnsLookup = options.skipDnsLookup === true;
  }

  /**
   * Validate a URL against SSRF risks. Throws if blocked.
   * @returns the parsed URL
   */
  async validate(urlString: string): Promise<URL> {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new Error('Invalid URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Blocked URL scheme: ${parsed.protocol}`);
    }

    if (this.blockedHostnames.has(parsed.hostname.toLowerCase())) {
      throw new Error('Blocked internal hostname');
    }

    if (!this.skipDnsLookup) {
      const ip = await this.resolveDns(parsed.hostname);
      if (this.isBlockedIp(ip)) {
        throw new Error('Blocked internal IP address');
      }
    }

    return parsed;
  }

  private resolveDns(hostname: string): Promise<string> {
    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address) => {
        if (err) reject(new Error(`DNS resolution failed for ${hostname}`));
        else resolve(address);
      });
    });
  }

  private isBlockedIp(ip: string): boolean {
    return BLOCKED_IP_RANGES.some((r) => r.test(ip));
  }
}
