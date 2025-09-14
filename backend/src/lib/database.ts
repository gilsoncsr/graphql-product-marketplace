import oracledb from 'oracledb';
import { logger } from './logger';

// Configure Oracle client only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  try {
    oracledb.initOracleClient();
  } catch (error) {
    logger.warn({ error }, 'Oracle client not available, using mock mode');
  }
}

export interface DatabaseConfig {
  host: string;
  port: number;
  serviceName: string;
  user: string;
  password: string;
}

class DatabaseService {
  private config: DatabaseConfig;
  private pool: oracledb.Pool | null = null;

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1521'),
      serviceName: process.env.DB_SERVICE_NAME || 'XE',
      user: process.env.DB_USER || 'marketplace',
      password: process.env.DB_PASSWORD || 'marketplace123',
    };
  }

  async connect(): Promise<void> {
    try {
      this.pool = await oracledb.createPool({
        user: this.config.user,
        password: this.config.password,
        connectString: `${this.config.host}:${this.config.port}/${this.config.serviceName}`,
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1,
        poolTimeout: 60,
        poolPingInterval: 60,
        poolAlias: 'marketplace-pool',
      });

      logger.info('Database pool created successfully');
    } catch (error) {
      logger.warn({ error }, 'Failed to create database pool, using mock mode');
      // Set pool to a mock object for development
      this.pool = {
        getConnection: async () => ({
          execute: async () => ({ rows: [], rowsAffected: 0, outBinds: {} }),
          close: async () => {},
          commit: async () => {},
          rollback: async () => {},
        }),
        close: async () => {},
      } as any;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close(10);
        logger.info('Database pool closed');
      } catch (error) {
        logger.error({ error }, 'Error closing database pool');
      }
    }
  }

  async getConnection(): Promise<oracledb.Connection> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      return await this.pool.getConnection();
    } catch (error) {
      logger.error({ error }, 'Failed to get database connection');
      throw error;
    }
  }

  async executeQuery<T = any>(
    sql: string,
    binds: any = {},
    options: oracledb.ExecuteOptions = {}
  ): Promise<oracledb.Result<T>> {
    const connection = await this.getConnection();
    
    try {
      const result = await connection.execute<T>(sql, binds, {
        autoCommit: true,
        ...options,
      });
      return result;
    } catch (error) {
      logger.error({ error, sql, binds }, 'Database query failed');
      throw error;
    } finally {
      await connection.close();
    }
  }

  async executeProcedure<T = any>(
    procedureName: string,
    binds: any = {},
    options: oracledb.ExecuteOptions = {}
  ): Promise<oracledb.Result<T>> {
    const connection = await this.getConnection();
    
    try {
      const result = await connection.execute<T>(
        `BEGIN ${procedureName}(:binds); END;`,
        { binds },
        {
          autoCommit: true,
          ...options,
        }
      );
      return result;
    } catch (error) {
      logger.error({ error, procedureName, binds }, 'Database procedure failed');
      throw error;
    } finally {
      await connection.close();
    }
  }

  async executeTransaction<T>(
    callback: (connection: oracledb.Connection) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    
    try {
      await connection.execute('BEGIN');
      const result = await callback(connection);
      await connection.execute('COMMIT');
      return result;
    } catch (error) {
      await connection.execute('ROLLBACK');
      logger.error({ error }, 'Transaction failed, rolled back');
      throw error;
    } finally {
      await connection.close();
    }
  }

  isHealthy(): boolean {
    return this.pool !== null;
  }
}

export const databaseService = new DatabaseService();

// Helper function to escape strings for SQL
export function escapeString(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Helper function to build dynamic WHERE clauses safely
export function buildWhereClause(filters: Record<string, any>): {
  whereClause: string;
  binds: Record<string, any>;
} {
  const conditions: string[] = [];
  const binds: Record<string, any> = {};
  let bindIndex = 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        conditions.push(`${key} IN (:${key})`);
        binds[key] = value;
      } else if (typeof value === 'string' && value.includes('%')) {
        conditions.push(`${key} LIKE :${key}`);
        binds[key] = value;
      } else {
        conditions.push(`${key} = :${key}`);
        binds[key] = value;
      }
    }
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    binds,
  };
}
