import { jest } from '@jest/globals';

// Mock Oracle database
jest.mock('oracledb', () => ({
  initOracleClient: jest.fn(),
  createPool: jest.fn().mockResolvedValue({
    getConnection: jest.fn().mockResolvedValue({
      execute: jest.fn().mockResolvedValue({
        rows: [],
        rowsAffected: 0,
        outBinds: {},
      }),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
  getConnection: jest.fn().mockResolvedValue({
    execute: jest.fn().mockResolvedValue({
      rows: [],
      rowsAffected: 0,
      outBinds: {},
    }),
    close: jest.fn(),
  }),
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(0),
    on: jest.fn(),
  }),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    isAdmin: false,
  }),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '1521';
process.env.DB_SERVICE_NAME = 'XE';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
