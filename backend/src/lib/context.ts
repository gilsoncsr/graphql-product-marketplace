import { Request, Response } from 'express';
import { JWTPayload } from './auth';
import { Loaders } from './loaders';
import { cacheService } from './cache';
import { databaseService } from './database';
import { createRequestLogger } from './logger';

export interface GraphQLContext {
  req: Request;
  res: Response;
  user: JWTPayload | null;
  loaders: Loaders;
  cache: typeof cacheService;
  db: typeof databaseService;
  logger: ReturnType<typeof createRequestLogger>;
  requestId: string;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> {
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const logger = createRequestLogger(requestId);
  
  // Initialize loaders
  const loaders = createLoaders();

  // Extract and validate JWT token
  let user: JWTPayload | null = null;
  
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authService.extractTokenFromHeader(authHeader);
      if (token) {
        user = authService.verifyAccessToken(token);
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to extract user from token');
  }

  // Log request details
  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    userId: user?.userId,
    operationName: req.body?.operationName,
  }, 'GraphQL request received');

  return {
    req,
    res,
    user,
    loaders,
    cache: cacheService,
    db: databaseService,
    logger,
    requestId,
  };
}

// Helper function to require authentication
export function requireAuth(context: GraphQLContext): JWTPayload {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
}

// Helper function to require admin privileges
export function requireAdmin(context: GraphQLContext): JWTPayload {
  const user = requireAuth(context);
  if (!user.isAdmin) {
    throw new Error('Admin privileges required');
  }
  return user;
}

// Helper function to check if user owns resource
export function requireOwnership(context: GraphQLContext, resourceUserId: string): JWTPayload {
  const user = requireAuth(context);
  if (user.userId !== resourceUserId && !user.isAdmin) {
    throw new Error('Access denied: insufficient permissions');
  }
  return user;
}

// Import the loaders function
import { createLoaders } from './loaders';
import { authService } from './auth';
