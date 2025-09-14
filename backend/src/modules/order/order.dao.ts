import { databaseService, escapeString } from '@/lib/database';
import { logger } from '@/lib/logger';

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  billing_address: string;
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export class OrderDAO {
  async findById(id: string): Promise<Order | null> {
    try {
      const result = await databaseService.executeQuery<Order>(
        'SELECT * FROM orders WHERE id = :id',
        { id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to find order by ID');
      throw error;
    }
  }

  async findByUser(userId: string, pagination: { limit: number; offset: number }): Promise<{ orders: Order[]; totalCount: number }> {
    try {
      // Get total count
      const countResult = await databaseService.executeQuery<{ count: number }>(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = :userId',
        { userId }
      );

      const totalCount = countResult.rows?.[0]?.count || 0;

      // Get orders with pagination
      const ordersResult = await databaseService.executeQuery<Order>(
        `SELECT * FROM orders 
         WHERE user_id = :userId 
         ORDER BY created_at DESC
         OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
        { userId, ...pagination }
      );

      return {
        orders: ordersResult.rows || [],
        totalCount,
      };
    } catch (error) {
      logger.error({ error, userId, pagination }, 'Failed to find orders by user');
      throw error;
    }
  }

  async findByUsers(userIds: string[]): Promise<Order[]> {
    if (userIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<Order>(
        'SELECT * FROM orders WHERE user_id IN (:userIds) ORDER BY created_at DESC',
        { userIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, userIds }, 'Failed to find orders by users');
      throw error;
    }
  }

  async create(orderData: Omit<Order, 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      const result = await databaseService.executeQuery<Order>(
        `INSERT INTO orders (
          id, user_id, status, total_amount, shipping_address, 
          billing_address, payment_method, payment_status, 
          tracking_number, notes
        ) VALUES (
          :id, :user_id, :status, :total_amount, :shipping_address,
          :billing_address, :payment_method, :payment_status,
          :tracking_number, :notes
        ) RETURNING *`,
        orderData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, orderData }, 'Failed to create order');
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>): Promise<Order | null> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = :${key}`)
        .join(', ');

      if (!setClause) {
        return this.findById(id);
      }

      const result = await databaseService.executeQuery<Order>(
        `UPDATE orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = :id RETURNING *`,
        { ...updates, id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id, updates }, 'Failed to update order');
      throw error;
    }
  }

  async createOrderWithItems(
    orderData: Omit<Order, 'created_at' | 'updated_at'>,
    items: Omit<OrderItem, 'id' | 'created_at'>[]
  ): Promise<{ order: Order; items: OrderItem[] }> {
    try {
      return await databaseService.executeTransaction(async (connection) => {
        // Create order
        const orderResult = await connection.execute<Order>(
          `INSERT INTO orders (
            id, user_id, status, total_amount, shipping_address, 
            billing_address, payment_method, payment_status, 
            tracking_number, notes
          ) VALUES (
            :id, :user_id, :status, :total_amount, :shipping_address,
            :billing_address, :payment_method, :payment_status,
            :tracking_number, :notes
          ) RETURNING *`,
          orderData
        );

        const order = orderResult.rows?.[0]!;

        // Create order items
        const createdItems: OrderItem[] = [];
        for (const item of items) {
          const itemResult = await connection.execute<OrderItem>(
            `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
             VALUES (SYS_GUID(), :order_id, :product_id, :quantity, :unit_price, :total_price)
             RETURNING *`,
            { ...item, order_id: order.id }
          );

          createdItems.push(itemResult.rows?.[0]!);
        }

        return { order, items: createdItems };
      });
    } catch (error) {
      logger.error({ error, orderData, items }, 'Failed to create order with items');
      throw error;
    }
  }

  // Order items
  async findItemsByOrder(orderId: string): Promise<OrderItem[]> {
    try {
      const result = await databaseService.executeQuery<OrderItem>(
        'SELECT * FROM order_items WHERE order_id = :orderId ORDER BY created_at ASC',
        { orderId }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to find order items by order');
      throw error;
    }
  }

  async findItemsByOrders(orderIds: string[]): Promise<OrderItem[]> {
    if (orderIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<OrderItem>(
        'SELECT * FROM order_items WHERE order_id IN (:orderIds) ORDER BY created_at ASC',
        { orderIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, orderIds }, 'Failed to find order items by orders');
      throw error;
    }
  }

  async createOrderItem(itemData: Omit<OrderItem, 'id' | 'created_at'>): Promise<OrderItem> {
    try {
      const result = await databaseService.executeQuery<OrderItem>(
        `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
         VALUES (SYS_GUID(), :order_id, :product_id, :quantity, :unit_price, :total_price)
         RETURNING *`,
        itemData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, itemData }, 'Failed to create order item');
      throw error;
    }
  }

  // Use PL/SQL procedures for complex operations
  async createOrderViaProcedure(
    orderId: string,
    userId: string,
    totalAmount: number,
    shippingAddress: string,
    billingAddress: string,
    paymentMethod: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await databaseService.executeQuery<{ result: string }>(
        'BEGIN proc_create_order(:orderId, :userId, :totalAmount, :shippingAddress, :billingAddress, :paymentMethod, :notes, :result); END;',
        {
          orderId,
          userId,
          totalAmount,
          shippingAddress: escapeString(shippingAddress),
          billingAddress: escapeString(billingAddress),
          paymentMethod: escapeString(paymentMethod),
          notes: notes ? escapeString(notes) : null,
          result: { dir: 2, type: 2003, maxSize: 1000 } // OUT parameter
        }
      );

      const message = result.outBinds?.result || 'UNKNOWN_ERROR';
      return {
        success: message === 'SUCCESS',
        message
      };
    } catch (error) {
      logger.error({ error, orderId, userId }, 'Failed to create order via procedure');
      throw error;
    }
  }

  async addOrderItemViaProcedure(
    itemId: string,
    orderId: string,
    productId: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await databaseService.executeQuery<{ result: string }>(
        'BEGIN proc_add_order_item(:itemId, :orderId, :productId, :quantity, :unitPrice, :totalPrice, :result); END;',
        {
          itemId,
          orderId,
          productId,
          quantity,
          unitPrice,
          totalPrice,
          result: { dir: 2, type: 2003, maxSize: 1000 } // OUT parameter
        }
      );

      const message = result.outBinds?.result || 'UNKNOWN_ERROR';
      return {
        success: message === 'SUCCESS',
        message
      };
    } catch (error) {
      logger.error({ error, itemId, orderId, productId }, 'Failed to add order item via procedure');
      throw error;
    }
  }

  // Get order statistics
  async getOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }> {
    try {
      const result = await databaseService.executeQuery<{
        total_orders: number;
        total_spent: number;
        average_order_value: number;
      }>(
        `SELECT 
           COUNT(*) as total_orders,
           COALESCE(SUM(total_amount), 0) as total_spent,
           COALESCE(AVG(total_amount), 0) as average_order_value
         FROM orders 
         WHERE user_id = :userId`,
        { userId }
      );

      const stats = result.rows?.[0];
      return {
        totalOrders: stats?.total_orders || 0,
        totalSpent: stats?.total_spent || 0,
        averageOrderValue: stats?.average_order_value || 0,
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get order stats');
      return { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 };
    }
  }
}
