import { logger } from './logger';
import { cacheService } from './cache';

export interface PersistedQuery {
  query: string;
  hash: string;
  addedAt: Date;
}

class PersistedQueryStore {
  private queries: Map<string, PersistedQuery> = new Map();
  private useRedis: boolean;

  constructor() {
    this.useRedis = process.env.NODE_ENV === 'production';
  }

  async addQuery(hash: string, query: string): Promise<void> {
    const persistedQuery: PersistedQuery = {
      query,
      hash,
      addedAt: new Date(),
    };

    this.queries.set(hash, persistedQuery);

    if (this.useRedis) {
      try {
        await cacheService.set(
          `persisted_query:${hash}`,
          JSON.stringify(persistedQuery),
          86400 // 24 hours
        );
      } catch (error) {
        logger.error({ error, hash }, 'Failed to store persisted query in Redis');
      }
    }
  }

  async getQuery(hash: string): Promise<string | null> {
    // Try memory store first
    const memoryQuery = this.queries.get(hash);
    if (memoryQuery) {
      return memoryQuery.query;
    }

    // Try Redis if enabled
    if (this.useRedis) {
      try {
        const cachedQuery = await cacheService.get(`persisted_query:${hash}`);
        if (cachedQuery) {
          const persistedQuery: PersistedQuery = JSON.parse(cachedQuery);
          this.queries.set(hash, persistedQuery); // Cache in memory
          return persistedQuery.query;
        }
      } catch (error) {
        logger.error({ error, hash }, 'Failed to get persisted query from Redis');
      }
    }

    return null;
  }

  async removeQuery(hash: string): Promise<void> {
    this.queries.delete(hash);

    if (this.useRedis) {
      try {
        await cacheService.del(`persisted_query:${hash}`);
      } catch (error) {
        logger.error({ error, hash }, 'Failed to remove persisted query from Redis');
      }
    }
  }

  getStats(): { totalQueries: number; memoryQueries: number } {
    return {
      totalQueries: this.queries.size,
      memoryQueries: this.queries.size,
    };
  }

  // Load persisted queries from Redis on startup
  async loadFromRedis(): Promise<void> {
    if (!this.useRedis) return;

    try {
      // This is a simplified version - in production you'd want to scan for all persisted_query:* keys
      logger.info('Loading persisted queries from Redis...');
      // Implementation would depend on your Redis key pattern
    } catch (error) {
      logger.error({ error }, 'Failed to load persisted queries from Redis');
    }
  }
}

export const persistedQueryStore = new PersistedQueryStore();

// APQ (Automatic Persisted Queries) implementation
export class APQManager {
  async handleRequest(request: any): Promise<{ query?: string; hash?: string }> {
    const { query, extensions } = request;

    // Check if this is a persisted query request
    if (extensions?.persistedQuery?.sha256Hash) {
      const hash = extensions.persistedQuery.sha256Hash;
      const persistedQuery = await persistedQueryStore.getQuery(hash);

      if (persistedQuery) {
        return { query: persistedQuery };
      } else {
        // Query not found, return error
        throw new Error(`Persisted query not found: ${hash}`);
      }
    }

    // Regular query with hash
    if (query && extensions?.persistedQuery?.sha256Hash) {
      const hash = extensions.persistedQuery.sha256Hash;
      await persistedQueryStore.addQuery(hash, query);
      return { query, hash };
    }

    // Regular query without hash
    return { query };
  }

  async registerQuery(query: string, hash: string): Promise<void> {
    await persistedQueryStore.addQuery(hash, query);
  }
}

export const apqManager = new APQManager();
