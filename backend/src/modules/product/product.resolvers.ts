import { GraphQLResolveInfo } from 'graphql';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ProductDAO, Product, ProductAttribute, ProductImage, Review } from './product.dao';
import { UserDAO } from '../user/user.dao';
import { GraphQLContext, requireAuth, requireOwnership } from '../../lib/context';
import { logger } from '../../lib/logger';

const productDAO = new ProductDAO();
const userDAO = new UserDAO();

// Validation schemas
const ProductFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const CursorInputSchema = z.object({
  first: z.number().positive().max(100).optional(),
  after: z.string().optional(),
  last: z.number().positive().max(100).optional(),
  before: z.string().optional(),
});

const CreateProductInputSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  attributes: z.array(z.object({
    name: z.string().min(1),
    value: z.string().min(1),
  })).optional(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    altText: z.string().optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
});

const UpdateProductInputSchema = CreateProductInputSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const CreateReviewInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().optional(),
  comment: z.string().optional(),
});

// Helper functions to transform database objects to GraphQL objects
function transformProduct(product: Product): any {
  return {
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
  };
}

function transformProductAttribute(attribute: ProductAttribute): any {
  return {
    id: attribute.id,
    name: attribute.attribute_name,
    value: attribute.attribute_value,
    createdAt: attribute.created_at,
  };
}

function transformProductImage(image: ProductImage): any {
  return {
    id: image.id,
    url: image.image_url,
    altText: image.alt_text,
    isPrimary: Boolean(image.is_primary),
    sortOrder: image.sort_order,
    createdAt: image.created_at,
  };
}

function transformReview(review: Review): any {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: Boolean(review.is_verified_purchase),
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  };
}

// Cursor-based pagination helpers
function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

export const productResolvers = {
  Query: {
    product: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const product = await productDAO.findById(id);
        return product ? transformProduct(product) : null;
      } catch (error) {
        logger.error({ error, id }, 'Failed to get product');
        throw new Error('Failed to get product');
      }
    },

    products: async (
      _: any,
      { filter = {}, pagination = {} }: { filter?: any; pagination?: any },
      context: GraphQLContext
    ) => {
      try {
        // Validate inputs
        const validatedFilter = ProductFilterSchema.parse(filter);
        const validatedPagination = CursorInputSchema.parse(pagination);

        // Determine pagination parameters
        const limit = Math.min(validatedPagination.first || validatedPagination.last || 20, 100);
        const offset = validatedPagination.after 
          ? parseInt(decodeCursor(validatedPagination.after)) 
          : 0;

        // Search products
        const { products, totalCount } = await productDAO.searchProducts(
          '', // No search term for general products query
          {
            ...(validatedFilter.category && { category: validatedFilter.category }),
            ...(validatedFilter.brand && { brand: validatedFilter.brand }),
            ...(validatedFilter.minPrice && { minPrice: validatedFilter.minPrice }),
            ...(validatedFilter.maxPrice && { maxPrice: validatedFilter.maxPrice }),
            ...(validatedFilter.inStock !== undefined && { inStock: validatedFilter.inStock }),
            ...(validatedFilter.isActive !== undefined && { isActive: validatedFilter.isActive }),
          },
          { limit, offset }
        );

        // Create edges
        const edges = products.map((product, index) => ({
          node: transformProduct(product),
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
        logger.error({ error, filter, pagination }, 'Failed to get products');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    searchProducts: async (
      _: any,
      { q, filter = {}, pagination = {} }: { q: string; filter?: any; pagination?: any },
      context: GraphQLContext
    ) => {
      try {
        // Validate inputs
        const validatedFilter = ProductFilterSchema.parse(filter);
        const validatedPagination = CursorInputSchema.parse(pagination);

        // Determine pagination parameters
        const limit = Math.min(validatedPagination.first || validatedPagination.last || 20, 100);
        const offset = validatedPagination.after 
          ? parseInt(decodeCursor(validatedPagination.after)) 
          : 0;

        // Search products
        const { products, totalCount } = await productDAO.searchProducts(
          q,
          {
            ...(validatedFilter.category && { category: validatedFilter.category }),
            ...(validatedFilter.brand && { brand: validatedFilter.brand }),
            ...(validatedFilter.minPrice && { minPrice: validatedFilter.minPrice }),
            ...(validatedFilter.maxPrice && { maxPrice: validatedFilter.maxPrice }),
            ...(validatedFilter.inStock !== undefined && { inStock: validatedFilter.inStock }),
            ...(validatedFilter.isActive !== undefined && { isActive: validatedFilter.isActive }),
          },
          { limit, offset }
        );

        // Create edges
        const edges = products.map((product, index) => ({
          node: transformProduct(product),
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
        logger.error({ error, q, filter, pagination }, 'Failed to search products');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },
  },

  Mutation: {
    createProduct: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        const validatedInput = CreateProductInputSchema.parse(input);

        // Create product
        const productId = uuidv4();
        const product = await productDAO.create({
          id: productId,
          name: validatedInput.name,
          ...(validatedInput.description && { description: validatedInput.description }),
          price: validatedInput.price,
          category: validatedInput.category,
          ...(validatedInput.brand && { brand: validatedInput.brand }),
          ...(validatedInput.sku && { sku: validatedInput.sku }),
          stock_quantity: validatedInput.stockQuantity,
          is_active: 1,
          seller_id: user.userId,
        });

        // Create attributes
        if (validatedInput.attributes && validatedInput.attributes.length > 0) {
          for (const attr of validatedInput.attributes) {
            await productDAO.createAttribute({
              product_id: productId,
              attribute_name: attr.name,
              attribute_value: attr.value,
            });
          }
        }

        // Create images
        if (validatedInput.images && validatedInput.images.length > 0) {
          for (const img of validatedInput.images) {
            await productDAO.createImage({
              product_id: productId,
              image_url: img.url,
              ...(img.altText && { alt_text: img.altText }),
              is_primary: img.isPrimary ? 1 : 0,
              sort_order: img.sortOrder || 0,
            });
          }
        }

        return transformProduct(product);
      } catch (error) {
        logger.error({ error, input }, 'Failed to create product');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updateProduct: async (_: any, { id, input }: { id: string; input: any }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        const validatedInput = UpdateProductInputSchema.parse(input);

        // Check if product exists and user owns it
        const existingProduct = await productDAO.findById(id);
        if (!existingProduct) {
          throw new Error('Product not found');
        }

        requireOwnership(context, existingProduct.seller_id);

        // Update product
        const updateData: any = {};
        if (validatedInput.name) updateData.name = validatedInput.name;
        if (validatedInput.description !== undefined) updateData.description = validatedInput.description;
        if (validatedInput.price) updateData.price = validatedInput.price;
        if (validatedInput.category) updateData.category = validatedInput.category;
        if (validatedInput.brand !== undefined) updateData.brand = validatedInput.brand;
        if (validatedInput.sku !== undefined) updateData.sku = validatedInput.sku;
        if (validatedInput.stockQuantity !== undefined) updateData.stock_quantity = validatedInput.stockQuantity;
        if (validatedInput.isActive !== undefined) updateData.is_active = validatedInput.isActive ? 1 : 0;

        const updatedProduct = await productDAO.update(id, updateData);
        if (!updatedProduct) {
          throw new Error('Failed to update product');
        }

        return transformProduct(updatedProduct);
      } catch (error) {
        logger.error({ error, id, input }, 'Failed to update product');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    deleteProduct: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);

        // Check if product exists and user owns it
        const existingProduct = await productDAO.findById(id);
        if (!existingProduct) {
          throw new Error('Product not found');
        }

        requireOwnership(context, existingProduct.seller_id);

        const success = await productDAO.delete(id);
        return success;
      } catch (error) {
        logger.error({ error, id }, 'Failed to delete product');
        throw error;
      }
    },

    createReview: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        const validatedInput = CreateReviewInputSchema.parse(input);

        // Check if product exists
        const product = await productDAO.findById(validatedInput.productId);
        if (!product) {
          throw new Error('Product not found');
        }

        // Create review
        const review = await productDAO.createReview({
          product_id: validatedInput.productId,
          user_id: user.userId,
          rating: validatedInput.rating,
          ...(validatedInput.title && { title: validatedInput.title }),
          ...(validatedInput.comment && { comment: validatedInput.comment }),
          is_verified_purchase: 0, // TODO: Implement verification logic
        });

        return transformReview(review);
      } catch (error) {
        logger.error({ error, input }, 'Failed to create review');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updateReview: async (_: any, { id, input }: { id: string; input: any }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);
        const validatedInput = CreateReviewInputSchema.parse(input);

        // Check if review exists and user owns it
        const existingReview = await productDAO.findReviewsByProduct(validatedInput.productId)
          .then(reviews => reviews.find(r => r.id === id));
        
        if (!existingReview) {
          throw new Error('Review not found');
        }

        requireOwnership(context, existingReview.user_id);

        // Update review
        const updatedReview = await productDAO.updateReview(id, {
          rating: validatedInput.rating,
          ...(validatedInput.title && { title: validatedInput.title }),
          ...(validatedInput.comment && { comment: validatedInput.comment }),
        });

        if (!updatedReview) {
          throw new Error('Failed to update review');
        }

        return transformReview(updatedReview);
      } catch (error) {
        logger.error({ error, id, input }, 'Failed to update review');
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    deleteReview: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const user = requireAuth(context);

        // Find review to check ownership
        const reviews = await productDAO.findReviewsByProducts([id]);
        const review = reviews.find(r => r.id === id);
        
        if (!review) {
          throw new Error('Review not found');
        }

        requireOwnership(context, review.user_id);

        const success = await productDAO.deleteReview(id);
        return success;
      } catch (error) {
        logger.error({ error, id }, 'Failed to delete review');
        throw error;
      }
    },
  },

  Product: {
    seller: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const user = await context.loaders.userById.load(parent.seller_id);
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
        logger.error({ error, productId: parent.id }, 'Failed to load product seller');
        return null;
      }
    },

    attributes: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const attributes = await context.loaders.productsByIds.load(parent.id)
          .then(() => productDAO.findAttributesByProduct(parent.id));
        return attributes.map(transformProductAttribute);
      } catch (error) {
        logger.error({ error, productId: parent.id }, 'Failed to load product attributes');
        return [];
      }
    },

    images: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const images = await context.loaders.productsByIds.load(parent.id)
          .then(() => productDAO.findImagesByProduct(parent.id));
        return images.map(transformProductImage);
      } catch (error) {
        logger.error({ error, productId: parent.id }, 'Failed to load product images');
        return [];
      }
    },

    reviews: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const reviews = await context.loaders.reviewsByProduct.load(parent.id);
        return reviews.map(transformReview);
      } catch (error) {
        logger.error({ error, productId: parent.id }, 'Failed to load product reviews');
        return [];
      }
    },

    averageRating: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const stats = await productDAO.getProductStats(parent.id);
        return stats.averageRating;
      } catch (error) {
        logger.error({ error, productId: parent.id }, 'Failed to load product average rating');
        return 0;
      }
    },

    reviewCount: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const stats = await productDAO.getProductStats(parent.id);
        return stats.reviewCount;
      } catch (error) {
        logger.error({ error, productId: parent.id }, 'Failed to load product review count');
        return 0;
      }
    },
  },

  Review: {
    product: async (parent: any, __: any, context: GraphQLContext) => {
      try {
        const product = await context.loaders.productsByIds.load(parent.product_id);
        return product ? transformProduct(product) : null;
      } catch (error) {
        logger.error({ error, productId: parent.product_id }, 'Failed to load review product');
        return null;
      }
    },

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
        logger.error({ error, userId: parent.user_id }, 'Failed to load review user');
        return null;
      }
    },
  },
};
