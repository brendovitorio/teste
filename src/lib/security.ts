// Security utilities for the application

import crypto from 'crypto';

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32);
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, saltBuffer, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt: saltBuffer.toString('hex')
      });
    });
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: newHash } = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format with additional security checks
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Basic format check
  if (!emailRegex.test(email)) return false;
  
  // Length check
  if (email.length > 254) return false;
  
  // Domain part checks
  const [, domain] = email.split('@');
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }
  
  return true;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Use pelo menos 8 caracteres');
  
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Inclua letras minúsculas');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Inclua letras maiúsculas');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Inclua números');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Inclua caracteres especiais');
  
  // Common patterns check
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Evite repetir caracteres');
  
  return { score, feedback };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return 0;
    
    const remaining = attempt.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}

/**
 * CSRF token utilities
 */
export class CSRFProtection {
  private static tokens: Map<string, number> = new Map();
  
  static generateToken(): string {
    const token = generateSecureToken(32);
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour
    this.tokens.set(token, expires);
    return token;
  }
  
  static validateToken(token: string): boolean {
    const expires = this.tokens.get(token);
    if (!expires) return false;
    
    if (Date.now() > expires) {
      this.tokens.delete(token);
      return false;
    }
    
    return true;
  }
  
  static cleanupExpiredTokens(): void {
    const now = Date.now();
    this.tokens.forEach((expires, token) => {
      if (now > expires) {
        this.tokens.delete(token);
      }
    });
  }
}

/**
 * Input validation helpers
 */
export const ValidationHelpers = {
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
  
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },
  
  isValidURL: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },
  
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }
};

