import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (this.jwtSecret === 'fallback-secret-key' || this.refreshSecret === 'fallback-refresh-secret-key') {
      logger.warn('Using fallback JWT secrets. Please set JWT_SECRET and JWT_REFRESH_SECRET in production!');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'marketplace-api',
      audience: 'marketplace-client',
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'marketplace-api',
      audience: 'marketplace-client',
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        issuer: 'marketplace-api',
        audience: 'marketplace-client',
      }) as JWTPayload;
      return payload;
    } catch (error) {
      logger.warn({ error }, 'Invalid access token');
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.refreshSecret, {
        issuer: 'marketplace-api',
        audience: 'marketplace-client',
      }) as RefreshTokenPayload;
      return payload;
    } catch (error) {
      logger.warn({ error }, 'Invalid refresh token');
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }

  // CSRF protection using double submit cookie pattern
  generateCSRFToken(): string {
    return jwt.sign(
      { csrf: true, timestamp: Date.now() },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  verifyCSRFToken(token: string): boolean {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      return payload.csrf === true && payload.timestamp;
    } catch (error) {
      return false;
    }
  }

  // Generate secure random string for session IDs
  generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const authService = new AuthService();
