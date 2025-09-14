import { databaseService, escapeString } from '@/lib/database';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_admin: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export class UserDAO {
  async findById(id: string): Promise<User | null> {
    try {
      const result = await databaseService.executeQuery<User>(
        'SELECT * FROM users WHERE id = :id',
        { id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to find user by ID');
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<User>(
        'SELECT * FROM users WHERE id IN (:ids)',
        { ids }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, ids }, 'Failed to find users by IDs');
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await databaseService.executeQuery<User>(
        'SELECT * FROM users WHERE email = :email',
        { email: escapeString(email) }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, email }, 'Failed to find user by email');
      throw error;
    }
  }

  async create(userData: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    try {
      const result = await databaseService.executeQuery<User>(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name,
          phone, address, city, state, zip_code, country, is_admin, is_active
        ) VALUES (
          :id, :email, :password_hash, :first_name, :last_name,
          :phone, :address, :city, :state, :zip_code, :country, :is_admin, :is_active
        ) RETURNING *`,
        userData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, userData }, 'Failed to create user');
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = :${key}`)
        .join(', ');

      if (!setClause) {
        return this.findById(id);
      }

      const result = await databaseService.executeQuery<User>(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = :id RETURNING *`,
        { ...updates, id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id, updates }, 'Failed to update user');
      throw error;
    }
  }

  async registerUser(userData: {
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const result = await databaseService.executeQuery<{ result: string }>(
        'BEGIN proc_register_user(:id, :email, :password_hash, :first_name, :last_name, :phone, :address, :city, :state, :zip_code, :country, :result); END;',
        {
          id: userData.id,
          email: escapeString(userData.email),
          password_hash: userData.password_hash,
          first_name: escapeString(userData.first_name),
          last_name: escapeString(userData.last_name),
          phone: userData.phone ? escapeString(userData.phone) : null,
          address: userData.address ? escapeString(userData.address) : null,
          city: userData.city ? escapeString(userData.city) : null,
          state: userData.state ? escapeString(userData.state) : null,
          zip_code: userData.zip_code ? escapeString(userData.zip_code) : null,
          country: userData.country ? escapeString(userData.country) : null,
          result: { dir: 2, type: 2003, maxSize: 1000 } // OUT parameter
        }
      );

      const message = result.outBinds?.result || 'UNKNOWN_ERROR';
      return {
        success: message === 'SUCCESS',
        message
      };
    } catch (error) {
      logger.error({ error, userData }, 'Failed to register user via procedure');
      throw error;
    }
  }

  async authenticateUser(email: string, password_hash: string): Promise<{
    success: boolean;
    user?: User;
    message: string;
  }> {
    try {
      const result = await databaseService.executeQuery<{
        user_id: string;
        first_name: string;
        last_name: string;
        is_admin: number;
        result: string;
      }>(
        'BEGIN proc_authenticate_user(:email, :password_hash, :user_id, :first_name, :last_name, :is_admin, :result); END;',
        {
          email: escapeString(email),
          password_hash,
          user_id: { dir: 2, type: 2003, maxSize: 1000 },
          first_name: { dir: 2, type: 2003, maxSize: 1000 },
          last_name: { dir: 2, type: 2003, maxSize: 1000 },
          is_admin: { dir: 2, type: 2003, maxSize: 1000 },
          result: { dir: 2, type: 2003, maxSize: 1000 }
        }
      );

      const message = result.outBinds?.result || 'UNKNOWN_ERROR';
      
      if (message === 'SUCCESS' && result.outBinds) {
        const user: User = {
          id: result.outBinds.user_id,
          email,
          password_hash,
          first_name: result.outBinds.first_name,
          last_name: result.outBinds.last_name,
          is_admin: result.outBinds.is_admin,
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          success: true,
          user,
          message
        };
      }

      return {
        success: false,
        message
      };
    } catch (error) {
      logger.error({ error, email }, 'Failed to authenticate user via procedure');
      throw error;
    }
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const result = await databaseService.executeQuery<CartItem>(
        'SELECT * FROM cart_items WHERE user_id = :userId ORDER BY created_at DESC',
        { userId }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get cart items');
      throw error;
    }
  }

  async findCartItemsByUser(userId: string): Promise<CartItem[]> {
    try {
      const result = await databaseService.executeQuery<CartItem>(
        'SELECT * FROM cart_items WHERE user_id = :userId ORDER BY created_at DESC',
        { userId }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to find cart items by user');
      throw error;
    }
  }

  async findCartItemsByUsers(userIds: string[]): Promise<CartItem[]> {
    if (userIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<CartItem>(
        'SELECT * FROM cart_items WHERE user_id IN (:userIds) ORDER BY created_at DESC',
        { userIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, userIds }, 'Failed to find cart items by users');
      throw error;
    }
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    try {
      const result = await databaseService.executeQuery<CartItem>(
        `INSERT INTO cart_items (id, user_id, product_id, quantity)
         VALUES (SYS_GUID(), :userId, :productId, :quantity)
         ON DUPLICATE KEY UPDATE quantity = quantity + :quantity
         RETURNING *`,
        { userId, productId, quantity }
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, userId, productId, quantity }, 'Failed to add to cart');
      throw error;
    }
  }

  async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem | null> {
    try {
      const result = await databaseService.executeQuery<CartItem>(
        'UPDATE cart_items SET quantity = :quantity, updated_at = CURRENT_TIMESTAMP WHERE id = :cartItemId RETURNING *',
        { cartItemId, quantity }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, cartItemId, quantity }, 'Failed to update cart item');
      throw error;
    }
  }

  async removeFromCart(cartItemId: string): Promise<boolean> {
    try {
      const result = await databaseService.executeQuery(
        'DELETE FROM cart_items WHERE id = :cartItemId',
        { cartItemId }
      );

      return (result.rowsAffected || 0) > 0;
    } catch (error) {
      logger.error({ error, cartItemId }, 'Failed to remove from cart');
      throw error;
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      const result = await databaseService.executeQuery(
        'DELETE FROM cart_items WHERE user_id = :userId',
        { userId }
      );

      return (result.rowsAffected || 0) > 0;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to clear cart');
      throw error;
    }
  }
}
