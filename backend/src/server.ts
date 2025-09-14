import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'graphql';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createContext } from './lib/context';
import { validationRules } from './lib/validationRules';
import { apqManager } from './lib/persistedQueries';
import { cacheService } from './lib/cache';
import { databaseService } from './lib/database';
import { logger } from './lib/logger';
import { AuthController } from './modules/auth/auth.controller';

// Import resolvers
import { userResolvers } from './modules/user/user.resolvers';
import { productResolvers } from './modules/product/product.resolvers';
import { orderResolvers } from './modules/order/order.resolvers';

// Import schemas
import { readFileSync } from 'fs';
import { join } from 'path';

const userSchema = readFileSync(join(__dirname, 'modules/user/user.schema.graphql'), 'utf8');
const productSchema = readFileSync(join(__dirname, 'modules/product/product.schema.graphql'), 'utf8');
const orderSchema = readFileSync(join(__dirname, 'modules/order/order.schema.graphql'), 'utf8');

const app = express();
const authController = new AuthController();

// Security middleware
app.use(helmet({
  ...(process.env.NODE_ENV === 'production' ? {} : { contentSecurityPolicy: false }),
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/graphql', limiter);
app.use('/auth', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  }, 'Incoming request');
  
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: databaseService.isHealthy(),
    cache: cacheService.isHealthy(),
  };
  
  res.json(health);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  // Basic metrics - in production you'd use Prometheus
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    database: {
      healthy: databaseService.isHealthy(),
    },
    cache: {
      healthy: cacheService.isHealthy(),
    },
  };
  
  res.json(metrics);
});

// Auth REST endpoints
app.post('/auth/refresh', (req, res) => authController.refreshToken(req, res));
app.post('/auth/logout', (req, res) => authController.logout(req, res));
app.get('/auth/me', (req, res) => authController.me(req, res));
app.post('/auth/verify-token', (req, res) => authController.verifyToken(req, res));
app.get('/auth/csrf-token', (req, res) => authController.getCSRFToken(req, res));

// GraphQL schema
const baseSchema = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');
const typeDefs = `
  ${baseSchema}
  ${userSchema}
  ${productSchema}
  ${orderSchema}
`;

// Merge all resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...productResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
  User: userResolvers.User,
  CartItem: userResolvers.CartItem,
  Product: productResolvers.Product,
  // ProductAttribute and ProductImage resolvers are handled in the Product resolver
  Review: productResolvers.Review,
  Order: orderResolvers.Order,
  OrderItem: orderResolvers.OrderItem,
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  validationRules,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    {
      requestDidStart() {
        return {
          didResolveOperation({ request, operationName }: { request: any; operationName: any }) {
            logger.info({
              operationName,
              variables: request.variables ? Object.keys(request.variables) : [],
            }, 'GraphQL operation resolved');
          },
          didEncounterErrors({ errors }: { errors: any }) {
            logger.error({ errors }, 'GraphQL errors encountered');
          },
        } as any;
      },
    },
  ],
  // APQ (Automatic Persisted Queries) support
  persistedQueries: {
    cache: 'bounded-lru',
    ttl: 300, // 5 minutes
  } as any,
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error, url: req.url, method: req.method }, 'Unhandled error');
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.headers['x-request-id'],
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    requestId: req.headers['x-request-id'],
  });
});

async function startServer() {
  try {
    // Initialize services
    logger.info('Initializing services...');
    
    await databaseService.connect();
    logger.info('Database connected');
    
    await cacheService.connect();
    logger.info('Cache connected');
    
    // Start Apollo Server
    await server.start();
    server.applyMiddleware({ 
      app: app as any, 
      path: '/graphql',
      cors: false, // CORS is handled by Express middleware
    });
    
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      logger.info({
        port,
        environment: process.env.NODE_ENV || 'development',
        graphqlPath: server.graphqlPath,
      }, 'Server started successfully');
    });
    
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await server.stop();
    await databaseService.disconnect();
    await cacheService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await server.stop();
    await databaseService.disconnect();
    await cacheService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
});

// Start the server
startServer();
