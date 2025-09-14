import { Request, Response } from 'express';
import { z } from 'zod';
import { UserDAO } from '../user/user.dao';
import { authService } from '../../lib/auth';
import { logger } from '../../lib/logger';

const userDAO = new UserDAO();

// Validation schemas
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class AuthController {
  // POST /auth/refresh
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token not provided' });
        return;
      }

      // Validate refresh token
      const payload = authService.verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      // Get user
      const user = await userDAO.findById(payload.userId);
      if (!user || !user.is_active) {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }

      // Generate new access token
      const accessToken = authService.generateAccessToken({
        userId: user.id,
        email: user.email,
        isAdmin: Boolean(user.is_admin),
      });

      // Generate new refresh token
      const newSessionId = authService.generateSessionId();
      const newRefreshToken = authService.generateRefreshToken({
        userId: user.id,
        sessionId: newSessionId,
      });

      // Store new session
      await userDAO.create({
        id: newSessionId,
        user_id: user.id,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      } as any);

      // Set new refresh token cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isAdmin: Boolean(user.is_admin),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to refresh token');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /auth/logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        // Verify token to get session info
        const payload = authService.verifyRefreshToken(refreshToken);
        if (payload) {
          // TODO: Invalidate session in database
          // await userDAO.invalidateSession(payload.sessionId);
        }
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      res.json({ success: true });
    } catch (error) {
      logger.error({ error }, 'Failed to logout');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /auth/me
  async me(req: Request, res: Response): Promise<void> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authService.extractTokenFromHeader(authHeader);
      if (!token) {
        res.status(401).json({ error: 'Invalid authorization header format' });
        return;
      }

      // Verify access token
      const payload = authService.verifyAccessToken(token);
      if (!payload) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      // Get user
      const user = await userDAO.findById(payload.userId);
      if (!user || !user.is_active) {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zip_code,
          country: user.country,
          isAdmin: Boolean(user.is_admin),
          isActive: Boolean(user.is_active),
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get user info');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /auth/verify-token
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const payload = authService.verifyAccessToken(token);
      if (!payload) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      res.json({
        valid: true,
        payload: {
          userId: payload.userId,
          email: payload.email,
          isAdmin: payload.isAdmin,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to verify token');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /auth/csrf-token
  async getCSRFToken(req: Request, res: Response): Promise<void> {
    try {
      const csrfToken = authService.generateCSRFToken();
      res.json({ csrfToken });
    } catch (error) {
      logger.error({ error }, 'Failed to generate CSRF token');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
