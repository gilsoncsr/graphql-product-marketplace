import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { userResolvers } from '../../src/modules/user/user.resolvers';
import { UserDAO } from '../../src/modules/user/user.dao';
import { ProductDAO } from '../../src/modules/product/product.dao';
import { OrderDAO } from '../../src/modules/order/order.dao';
import { authService } from '../../src/lib/auth';

// Mock dependencies
jest.mock('../../src/modules/user/user.dao');
jest.mock('../../src/modules/product/product.dao');
jest.mock('../../src/modules/order/order.dao');
jest.mock('../../src/lib/auth');

const mockUserDAO = UserDAO as jest.MockedClass<typeof UserDAO>;
const mockProductDAO = ProductDAO as jest.MockedClass<typeof ProductDAO>;
const mockOrderDAO = OrderDAO as jest.MockedClass<typeof OrderDAO>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('User Resolvers', () => {
  let mockContext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockContext = {
      user: {
        userId: 'test-user-id',
        email: 'test@example.com',
        isAdmin: false,
      },
      loaders: {
        userById: {
          load: jest.fn().mockResolvedValue({
            id: 'test-user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            is_admin: 0,
            is_active: 1,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          }),
        },
        cartItemsByUser: {
          load: jest.fn().mockResolvedValue([]),
        },
        ordersByUser: {
          load: jest.fn().mockResolvedValue([]),
        },
        productsBySeller: {
          load: jest.fn().mockResolvedValue([]),
        },
      },
      req: {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      },
      res: {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      },
    };
  });

  describe('Query.me', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_admin: 0,
        is_active: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockUserDAO.prototype.findById.mockResolvedValue(mockUser);

      const result = await userResolvers.Query.me(null, null, mockContext);

      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      });
    });

    it('should return null when not authenticated', async () => {
      mockContext.user = null;

      const result = await userResolvers.Query.me(null, null, mockContext);

      expect(result).toBeNull();
    });
  });

  describe('Mutation.register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      mockUserDAO.prototype.findByEmail.mockResolvedValue(null);
      mockUserDAO.prototype.registerUser.mockResolvedValue({
        success: true,
        message: 'SUCCESS',
      });
      mockUserDAO.prototype.findById.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
        password_hash: 'hashed-password',
        first_name: 'New',
        last_name: 'User',
        is_admin: 0,
        is_active: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      mockAuthService.hashPassword.mockResolvedValue('hashed-password');
      mockAuthService.generateAccessToken.mockReturnValue('access-token');
      mockAuthService.generateRefreshToken.mockReturnValue('refresh-token');
      mockAuthService.generateSessionId.mockReturnValue('session-id');

      const result = await userResolvers.Mutation.register(null, { input }, mockContext);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('newuser@example.com');
    });

    it('should throw error when user already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      mockUserDAO.prototype.findByEmail.mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
        first_name: 'Existing',
        last_name: 'User',
        is_admin: 0,
        is_active: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });

      await expect(
        userResolvers.Mutation.register(null, { input }, mockContext)
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('Mutation.login', () => {
    it('should login user successfully', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'Test',
        last_name: 'User',
        is_admin: 0,
        is_active: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockUserDAO.prototype.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.verifyPassword.mockResolvedValue(true);
      mockAuthService.generateAccessToken.mockReturnValue('access-token');
      mockAuthService.generateRefreshToken.mockReturnValue('refresh-token');
      mockAuthService.generateSessionId.mockReturnValue('session-id');

      const result = await userResolvers.Mutation.login(null, { input }, mockContext);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid credentials', async () => {
      const input = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserDAO.prototype.findByEmail.mockResolvedValue(null);

      await expect(
        userResolvers.Mutation.login(null, { input }, mockContext)
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Mutation.addToCart', () => {
    it('should add item to cart successfully', async () => {
      const productId = 'product-id';
      const quantity = 2;

      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        price: 100,
        is_active: 1,
        stock_quantity: 10,
      };

      const mockCartItem = {
        id: 'cart-item-id',
        user_id: 'test-user-id',
        product_id: 'product-id',
        quantity: 2,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockProductDAO.prototype.findById.mockResolvedValue(mockProduct);
      mockUserDAO.prototype.addToCart.mockResolvedValue(mockCartItem);

      const result = await userResolvers.Mutation.addToCart(
        null,
        { productId, quantity },
        mockContext
      );

      expect(result).toEqual({
        id: 'cart-item-id',
        quantity: 2,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      });
    });

    it('should throw error when product not found', async () => {
      const productId = 'non-existent-product';
      const quantity = 1;

      mockProductDAO.prototype.findById.mockResolvedValue(null);

      await expect(
        userResolvers.Mutation.addToCart(null, { productId, quantity }, mockContext)
      ).rejects.toThrow('Product not found');
    });
  });
});
