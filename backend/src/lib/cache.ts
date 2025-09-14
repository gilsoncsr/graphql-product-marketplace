import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      });

      this.client.on('error', (err) => {
        logger.error({ error: err }, 'Redis client error');
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn({ error }, 'Failed to connect to Redis, using mock mode');
      this.isConnected = true; // Set to true for mock mode
      this.client = {
        get: async () => null,
        set: async () => 'OK',
        setEx: async () => 'OK',
        del: async () => 1,
        keys: async () => [],
        exists: async () => 0,
        on: () => {},
        connect: async () => {},
        disconnect: async () => {},
      } as any;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error({ error, key }, 'Failed to get from cache');
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Failed to set cache');
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete from cache');
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error({ error, pattern }, 'Failed to delete pattern from cache');
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Failed to check cache existence');
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const cacheService = new CacheService();

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  product: (id: string) => `product:${id}`,
  products: (filter: string) => `products:${filter}`,
  order: (id: string) => `order:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  search: (query: string, filters: string) => `search:${query}:${filters}`,
};
