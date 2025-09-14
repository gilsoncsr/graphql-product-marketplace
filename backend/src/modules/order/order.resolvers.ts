import { GraphQLResolveInfo } from 'graphql';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { OrderDAO, Order, OrderItem } from './order.dao';
import { ProductDAO } from '../product/product.dao';
import { UserDAO } from '../user/user.dao';
import { GraphQLContext, requireAuth, requireOwnership } from '../../lib/context';
import { logger } from '../../lib/logger';

const orderDAO = new OrderDAO();
const productDAO = new ProductDAO();
const userDAO = new UserDAO();

// Validation schemas
const PaymentInputSchema = z.object({
  method: z.string().min(1, 'Payment method is required'),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  billingAddress: z.string().min(1, 'Billing address is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  notes: z.string().optional(),
});

const OrderItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const CreateOrderInputSchema = z.object({
  items: z.array(OrderItemInputSchema).min(1, 'At least one item is required'),
  payment: PaymentInputSchema,
});

const CursorInputSchema = z.object({
  first: z.number().positive().max(100).optional(),
  after: z.string().optional(),
  last: z.number().positive().max(100).optional(),
  before: z.string().optional(),
});

// Helper functions to transform database objects to GraphQL objects
function transformOrder(order: Order): any {
  return {
    id: order.id,
    status: order.status.toUpperCase(),
    totalAmount: order.total_amount,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status.toUpperCase(),
    trackingNumber: order.tracking_number,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

function transformOrderItem(item: OrderItem): any {
  return {
    id: item.id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    totalPrice: item.total_price,
    createdAt: item.created_at,
  };
}

// Cursor-based pagination helpers
function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

export const orderResolvers = {
  Query: {
    order: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const order = await orderDAO.findById(id);
        if (!order) {
          return null;
        }

        // Check if user can access this order
        requireOwnership(context, order.user_id);

        return transformOrder(order);
      } catch (error) {
        logger.error({ error, id }, 'Failed to get order');
        throw error;
      }
    },

    myOrders: async (
      _: any,
      { pagination = {} }: { pagination?: any },
      context: GraphQLContext
    ) => {
      try {
        const user = requireAuth(context);
        const validatedPagination = CursorInputSchema.parse(pagination);

        // Determine pagination parameters
        const limit = Math.min(validatedPagination.first || validatedPagination.last || 20, 100);
        const offset = validatedPagination.after 
          ? parseInt(decodeCursor(validatedPagination.after)) 
          : 0;

        // Get orders
        const { orders, totalCount } = await orderDAO.findByUser(user.userId, { limit, offset });

        // Create edges
        const edges = orders.map((order, index) => ({
          node: transformOrder(order),
          cursor: encodeCursor((offset + index).toString()),
        }));

        // Determine page info
        const hasNextPage = offset + limit < totalCount;
        const hasPreviousPage = offset > 0;
        const startCursor = edges.length > 0 ? edges[0]?.cursor : null;
        const endCursor = edges.length > 0 ? edges[edges.length - 1]?.cursor : null;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
          },
          totalCount,
        };
      } catch (error) {
        logger.error({ error, pagination }, 'Failed to get user orders');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },
  },

  Mutation: {
    createOrder: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        const validatedInput = CreateOrderInputSchema.parse(input);

        // Validate products and calculate totals
        const orderItems = [];
        let totalAmount = 0;

        for (const item of validatedInput.items) {
          const product = await productDAO.findById(item.productId);
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          if (!product.is_active) {
            throw new Error(`Product is not available: ${product.name}`);
          }

          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
          }

          const unitPrice = product.price;
          const totalPrice = unitPrice * item.quantity;
          totalAmount += totalPrice;

          orderItems.push({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
          });
        }

        // Create order
        const orderId = uuidv4();
        const order = await orderDAO.create({
          id: orderId,
          user_id: user.userId,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: validatedInput.payment.shippingAddress,
          billing_address: validatedInput.payment.billingAddress,
          payment_method: validatedInput.payment.method,
          payment_status: 'pending',
          ...(validatedInput.payment.notes && { notes: validatedInput.payment.notes }),
        });

        // Create order items
        const createdItems = [];
        for (const item of orderItems) {
          const orderItem = await orderDAO.createOrderItem({
            order_id: orderId,
            ...item,
          });
          createdItems.push(orderItem);
        }

        // TODO: Process payment
        // TODO: Update product stock quantities
        // TODO: Clear user's cart

        return transformOrder(order);
      } catch (error) {
        logger.error({ error, input }, 'Failed to create order');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updateOrderStatus: async (_: any, { id, status }: { id: string; status: string }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);

        // Check if order exists
        const order = await orderDAO.findById(id);
        if (!order) {
          throw new Error('Order not found');
        }

        // Check permissions (admin or order owner)
        if (!user.isAdmin && order.user_id !== user.userId) {
          throw new Error('Access denied');
        }

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
          throw new Error('Invalid order status');
        }

        const updatedOrder = await orderDAO.update(id, {
          status: status.toLowerCase(),
        });

        if (!updatedOrder) {
          throw new Error('Failed to update order status');
        }

        return transformOrder(updatedOrder);
      } catch (error) {
        logger.error({ error, id, status }, 'Failed to update order status');
        throw error;
      }
    },

    cancelOrder: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);

        // Check if order exists
        const order = await orderDAO.findById(id);
        if (!order) {
          throw new Error('Order not found');
        }

        // Check permissions
        requireOwnership(context, order.user_id);

        // Check if order can be cancelled
        if (order.status === 'cancelled') {
          throw new Error('Order is already cancelled');
        }

        if (order.status === 'delivered') {
          throw new Error('Cannot cancel delivered order');
        }

        const updatedOrder = await orderDAO.update(id, {
          status: 'cancelled',
        });

        if (!updatedOrder) {
          throw new Error('Failed to cancel order');
        }

        return transformOrder(updatedOrder);
      } catch (error) {
        logger.error({ error, id }, 'Failed to cancel order');
        throw error;
      }
    },
  },

  Order: {
    user: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const user = await context.loaders.userById.load(parent.user_id);
        return user ? {
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
        } : null;
      } catch (error) {
        logger.error({ error, orderId: parent.id }, 'Failed to load order user');
        return null;
      }
    },

    items: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const items = await context.loaders.orderItemsByOrder.load(parent.id);
        return items.map(transformOrderItem);
      } catch (error) {
        logger.error({ error, orderId: parent.id }, 'Failed to load order items');
        return [];
      }
    },
  },

  OrderItem: {
    order: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const order = await orderDAO.findById(parent.order_id);
        return order ? transformOrder(order) : null;
      } catch (error) {
        logger.error({ error, orderItemId: parent.id }, 'Failed to load order item order');
        return null;
      }
    },

    product: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const product = await context.loaders.productsByIds.load(parent.product_id);
        return product ? {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          brand: product.brand,
          sku: product.sku,
          stockQuantity: product.stock_quantity,
          isActive: Boolean(product.is_active),
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        } : null;
      } catch (error) {
        logger.error({ error, productId: parent.product_id }, 'Failed to load order item product');
        return null;
      }
    },
  },
};
