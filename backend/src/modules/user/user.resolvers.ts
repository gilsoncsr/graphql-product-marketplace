import { GraphQLResolveInfo } from 'graphql';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { UserDAO, User, CartItem } from './user.dao';
import { ProductDAO } from '../product/product.dao';
import { OrderDAO } from '../order/order.dao';
import { authService } from '../../lib/auth';
import { GraphQLContext, requireAuth } from '../../lib/context';
import { logger } from '../../lib/logger';

const userDAO = new UserDAO();
const productDAO = new ProductDAO();
const orderDAO = new OrderDAO();

// Validation schemas
const RegisterInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

const LoginInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const UpdateUserInputSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

const AddToCartInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Helper function to transform database user to GraphQL user
function transformUser(user: User): any {
  return {
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
  };
}

// Helper function to transform cart item
function transformCartItem(cartItem: CartItem): any {
  return {
    id: cartItem.id,
    quantity: cartItem.quantity,
    createdAt: cartItem.created_at,
    updatedAt: cartItem.updated_at,
  };
}

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        return null;
      }

      try {
        const user = await userDAO.findById(context.user.userId);
        return user ? transformUser(user) : null;
      } catch (error) {
        logger.error({ error, userId: context.user.userId }, 'Failed to get current user');
        throw new Error('Failed to get user information');
      }
    },

    cart: async (_: any, __: any, context: GraphQLContext) => {
      const user = requireAuth(context);
      
      try {
        const cartItems = await userDAO.getCartItems(user.userId);
        return cartItems.map(transformCartItem);
      } catch (error) {
        logger.error({ error, userId: user.userId }, 'Failed to get user cart');
        throw new Error('Failed to get cart items');
      }
    },
  },

  Mutation: {
    register: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      try {
        // Validate input
        const validatedInput = RegisterInputSchema.parse(input);

        // Check if user already exists
        const existingUser = await userDAO.findByEmail(validatedInput.email);
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Hash password
        const passwordHash = await authService.hashPassword(validatedInput.password);

        // Create user
        const userId = uuidv4();
        const result = await userDAO.registerUser({
          id: userId,
          email: validatedInput.email,
          password_hash: passwordHash,
          first_name: validatedInput.firstName,
          last_name: validatedInput.lastName,
          ...(validatedInput.phone && { phone: validatedInput.phone }),
          ...(validatedInput.address && { address: validatedInput.address }),
          ...(validatedInput.city && { city: validatedInput.city }),
          ...(validatedInput.state && { state: validatedInput.state }),
          ...(validatedInput.zipCode && { zip_code: validatedInput.zipCode }),
          ...(validatedInput.country && { country: validatedInput.country }),
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        // Get created user
        const user = await userDAO.findById(userId);
        if (!user) {
          throw new Error('Failed to create user');
        }

        // Generate tokens
        const accessToken = authService.generateAccessToken({
          userId: user.id,
          email: user.email,
          isAdmin: Boolean(user.is_admin),
        });

        const sessionId = authService.generateSessionId();
        const refreshToken = authService.generateRefreshToken({
          userId: user.id,
          sessionId,
        });

        // Store session
        await userDAO.create({
          id: sessionId,
          user_id: user.id,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: context.req.ip,
          user_agent: context.req.headers['user-agent'],
        } as any);

        // Set refresh token cookie
        context.res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: transformUser(user),
          accessToken,
          refreshToken,
        };
      } catch (error) {
        logger.error({ error, input }, 'Failed to register user');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    login: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      try {
        // Validate input
        const validatedInput = LoginInputSchema.parse(input);

        // Find user by email
        const user = await userDAO.findByEmail(validatedInput.email);
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await authService.verifyPassword(
          validatedInput.password,
          user.password_hash
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Generate tokens
        const accessToken = authService.generateAccessToken({
          userId: user.id,
          email: user.email,
          isAdmin: Boolean(user.is_admin),
        });

        const sessionId = authService.generateSessionId();
        const refreshToken = authService.generateRefreshToken({
          userId: user.id,
          sessionId,
        });

        // Store session
        await userDAO.create({
          id: sessionId,
          user_id: user.id,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: context.req.ip,
          user_agent: context.req.headers['user-agent'],
        } as any);

        // Set refresh token cookie
        context.res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: transformUser(user),
          accessToken,
          refreshToken,
        };
      } catch (error) {
        logger.error({ error, input }, 'Failed to login user');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    logout: async (_: any, __: any, context: GraphQLContext) => {
      try {
        // Clear refresh token cookie
        context.res.clearCookie('refreshToken');
        return true;
      } catch (error) {
        logger.error({ error }, 'Failed to logout user');
        throw new Error('Failed to logout');
      }
    },

    updateProfile: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        const validatedInput = UpdateUserInputSchema.parse(input);

        // Transform input to database format
        const updateData: any = {};
        if (validatedInput.firstName) updateData.first_name = validatedInput.firstName;
        if (validatedInput.lastName) updateData.last_name = validatedInput.lastName;
        if (validatedInput.phone) updateData.phone = validatedInput.phone;
        if (validatedInput.address) updateData.address = validatedInput.address;
        if (validatedInput.city) updateData.city = validatedInput.city;
        if (validatedInput.state) updateData.state = validatedInput.state;
        if (validatedInput.zipCode) updateData.zip_code = validatedInput.zipCode;
        if (validatedInput.country) updateData.country = validatedInput.country;

        const updatedUser = await userDAO.update(user.userId, updateData);
        if (!updatedUser) {
          throw new Error('User not found');
        }

        return transformUser(updatedUser);
      } catch (error) {
        logger.error({ error, input }, 'Failed to update user profile');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    addToCart: async (_: any, { productId, quantity }: { productId: string; quantity: number }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        
        // Validate input
        const validatedInput = AddToCartInputSchema.parse({ productId, quantity });

        // Check if product exists
        const product = await productDAO.findById(validatedInput.productId);
        if (!product) {
          throw new Error('Product not found');
        }

        // Add to cart
        const cartItem = await userDAO.addToCart(user.userId, validatedInput.productId, validatedInput.quantity);

        return transformCartItem(cartItem);
      } catch (error) {
        logger.error({ error, productId, quantity }, 'Failed to add to cart');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    removeFromCart: async (_: any, { cartItemId }: { cartItemId: string }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        
        // TODO: Verify cart item belongs to user
        const success = await userDAO.removeFromCart(cartItemId);
        
        if (!success) {
          throw new Error('Cart item not found');
        }

        return true;
      } catch (error) {
        logger.error({ error, cartItemId }, 'Failed to remove from cart');
        throw error;
      }
    },

    updateCartItem: async (_: any, { cartItemId, quantity }: { cartItemId: string; quantity: number }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        
        // Validate input
        const validatedInput = z.object({
          cartItemId: z.string().uuid(),
          quantity: z.number().int().min(1),
        }).parse({ cartItemId, quantity });

        // TODO: Verify cart item belongs to user
        const cartItem = await userDAO.updateCartItem(validatedInput.cartItemId, validatedInput.quantity);
        
        if (!cartItem) {
          throw new Error('Cart item not found');
        }

        return transformCartItem(cartItem);
      } catch (error) {
        logger.error({ error, cartItemId, quantity }, 'Failed to update cart item');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },
  },

  User: {
    cart: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const cartItems = await context.loaders.cartItemsByUser.load(parent.id);
        return cartItems.map(transformCartItem);
      } catch (error) {
        logger.error({ error, userId: parent.id }, 'Failed to load user cart');
        return [];
      }
    },

    orders: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const orders = await context.loaders.ordersByUser.load(parent.id);
        return orders.map((order: any) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.total_amount,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        }));
      } catch (error) {
        logger.error({ error, userId: parent.id }, 'Failed to load user orders');
        return [];
      }
    },

    products: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const products = await context.loaders.productsBySeller.load(parent.id);
        return products.map((product: any) => ({
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
        }));
      } catch (error) {
        logger.error({ error, userId: parent.id }, 'Failed to load user products');
        return [];
      }
    },
  },

  CartItem: {
    user: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const user = await context.loaders.userById.load(parent.user_id);
        return user ? transformUser(user) : null;
      } catch (error) {
        logger.error({ error, userId: parent.user_id }, 'Failed to load cart item user');
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
        logger.error({ error, productId: parent.product_id }, 'Failed to load cart item product');
        return null;
      }
    },
  },
};
