import { databaseService, escapeString, buildWhereClause } from '@/lib/database';
import { logger } from '@/lib/logger';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  brand?: string;
  sku?: string;
  stock_quantity: number;
  is_active: number;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_name: string;
  attribute_value: string;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: number;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: number;
  created_at: string;
  updated_at: string;
}

export class ProductDAO {
  async findById(id: string): Promise<Product | null> {
    try {
      const result = await databaseService.executeQuery<Product>(
        'SELECT * FROM products WHERE id = :id',
        { id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to find product by ID');
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<Product>(
        'SELECT * FROM products WHERE id IN (:ids)',
        { ids }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, ids }, 'Failed to find products by IDs');
      throw error;
    }
  }

  async findBySellers(sellerIds: string[]): Promise<Product[]> {
    if (sellerIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<Product>(
        'SELECT * FROM products WHERE seller_id IN (:sellerIds) AND is_active = 1 ORDER BY created_at DESC',
        { sellerIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, sellerIds }, 'Failed to find products by sellers');
      throw error;
    }
  }

  async searchProducts(
    searchTerm: string,
    filters: {
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      isActive?: boolean;
    } = {},
    pagination: {
      limit: number;
      offset: number;
    }
  ): Promise<{ products: Product[]; totalCount: number }> {
    try {
      let whereConditions: string[] = [];
      const binds: any = {};

      // Search term
      if (searchTerm) {
        whereConditions.push(`(LOWER(name) LIKE LOWER(:searchTerm) 
                              OR LOWER(description) LIKE LOWER(:searchTerm)
                              OR LOWER(brand) LIKE LOWER(:searchTerm))`);
        binds.searchTerm = `%${escapeString(searchTerm)}%`;
      }

      // Filters
      if (filters.category) {
        whereConditions.push('category = :category');
        binds.category = escapeString(filters.category);
      }

      if (filters.brand) {
        whereConditions.push('brand = :brand');
        binds.brand = escapeString(filters.brand);
      }

      if (filters.minPrice !== undefined) {
        whereConditions.push('price >= :minPrice');
        binds.minPrice = filters.minPrice;
      }

      if (filters.maxPrice !== undefined) {
        whereConditions.push('price <= :maxPrice');
        binds.maxPrice = filters.maxPrice;
      }

      if (filters.inStock) {
        whereConditions.push('stock_quantity > 0');
      }

      if (filters.isActive !== undefined) {
        whereConditions.push('is_active = :isActive');
        binds.isActive = filters.isActive ? 1 : 0;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countResult = await databaseService.executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM products ${whereClause}`,
        binds
      );

      const totalCount = countResult.rows?.[0]?.count || 0;

      // Get products with pagination
      const productsResult = await databaseService.executeQuery<Product>(
        `SELECT * FROM products ${whereClause} 
         ORDER BY created_at DESC
         OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
        {
          ...binds,
          offset: pagination.offset,
          limit: pagination.limit,
        }
      );

      return {
        products: productsResult.rows || [],
        totalCount,
      };
    } catch (error) {
      logger.error({ error, searchTerm, filters, pagination }, 'Failed to search products');
      throw error;
    }
  }

  async create(productData: Omit<Product, 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const result = await databaseService.executeQuery<Product>(
        `INSERT INTO products (
          id, name, description, price, category, brand, sku, 
          stock_quantity, is_active, seller_id
        ) VALUES (
          :id, :name, :description, :price, :category, :brand, :sku,
          :stock_quantity, :is_active, :seller_id
        ) RETURNING *`,
        productData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, productData }, 'Failed to create product');
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | null> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = :${key}`)
        .join(', ');

      if (!setClause) {
        return this.findById(id);
      }

      const result = await databaseService.executeQuery<Product>(
        `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = :id RETURNING *`,
        { ...updates, id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id, updates }, 'Failed to update product');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await databaseService.executeQuery(
        'DELETE FROM products WHERE id = :id',
        { id }
      );

      return (result.rowsAffected || 0) > 0;
    } catch (error) {
      logger.error({ error, id }, 'Failed to delete product');
      throw error;
    }
  }

  // Product attributes
  async findAttributesByProduct(productId: string): Promise<ProductAttribute[]> {
    try {
      const result = await databaseService.executeQuery<ProductAttribute>(
        'SELECT * FROM product_attributes WHERE product_id = :productId ORDER BY created_at ASC',
        { productId }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, productId }, 'Failed to find product attributes');
      throw error;
    }
  }

  async findAttributesByProducts(productIds: string[]): Promise<ProductAttribute[]> {
    if (productIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<ProductAttribute>(
        'SELECT * FROM product_attributes WHERE product_id IN (:productIds) ORDER BY created_at ASC',
        { productIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, productIds }, 'Failed to find product attributes by products');
      throw error;
    }
  }

  async createAttribute(attributeData: Omit<ProductAttribute, 'id' | 'created_at'>): Promise<ProductAttribute> {
    try {
      const result = await databaseService.executeQuery<ProductAttribute>(
        `INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value)
         VALUES (SYS_GUID(), :product_id, :attribute_name, :attribute_value)
         RETURNING *`,
        attributeData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, attributeData }, 'Failed to create product attribute');
      throw error;
    }
  }

  // Product images
  async findImagesByProduct(productId: string): Promise<ProductImage[]> {
    try {
      const result = await databaseService.executeQuery<ProductImage>(
        'SELECT * FROM product_images WHERE product_id = :productId ORDER BY sort_order ASC, created_at ASC',
        { productId }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, productId }, 'Failed to find product images');
      throw error;
    }
  }

  async findImagesByProducts(productIds: string[]): Promise<ProductImage[]> {
    if (productIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<ProductImage>(
        'SELECT * FROM product_images WHERE product_id IN (:productIds) ORDER BY sort_order ASC, created_at ASC',
        { productIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, productIds }, 'Failed to find product images by products');
      throw error;
    }
  }

  async createImage(imageData: Omit<ProductImage, 'id' | 'created_at'>): Promise<ProductImage> {
    try {
      const result = await databaseService.executeQuery<ProductImage>(
        `INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order)
         VALUES (SYS_GUID(), :product_id, :image_url, :alt_text, :is_primary, :sort_order)
         RETURNING *`,
        imageData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, imageData }, 'Failed to create product image');
      throw error;
    }
  }

  // Reviews
  async findReviewsByProduct(productId: string): Promise<Review[]> {
    try {
      const result = await databaseService.executeQuery<Review>(
        'SELECT * FROM reviews WHERE product_id = :productId ORDER BY created_at DESC',
        { productId }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, productId }, 'Failed to find product reviews');
      throw error;
    }
  }

  async findReviewsByProducts(productIds: string[]): Promise<Review[]> {
    if (productIds.length === 0) return [];

    try {
      const result = await databaseService.executeQuery<Review>(
        'SELECT * FROM reviews WHERE product_id IN (:productIds) ORDER BY created_at DESC',
        { productIds }
      );

      return result.rows || [];
    } catch (error) {
      logger.error({ error, productIds }, 'Failed to find product reviews by products');
      throw error;
    }
  }

  async createReview(reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> {
    try {
      const result = await databaseService.executeQuery<Review>(
        `INSERT INTO reviews (id, product_id, user_id, rating, title, comment, is_verified_purchase)
         VALUES (SYS_GUID(), :product_id, :user_id, :rating, :title, :comment, :is_verified_purchase)
         RETURNING *`,
        reviewData
      );

      return result.rows?.[0]!;
    } catch (error) {
      logger.error({ error, reviewData }, 'Failed to create product review');
      throw error;
    }
  }

  async updateReview(id: string, updates: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at'>>): Promise<Review | null> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = :${key}`)
        .join(', ');

      if (!setClause) {
        return null;
      }

      const result = await databaseService.executeQuery<Review>(
        `UPDATE reviews SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = :id RETURNING *`,
        { ...updates, id }
      );

      return result.rows?.[0] || null;
    } catch (error) {
      logger.error({ error, id, updates }, 'Failed to update review');
      throw error;
    }
  }

  async deleteReview(id: string): Promise<boolean> {
    try {
      const result = await databaseService.executeQuery(
        'DELETE FROM reviews WHERE id = :id',
        { id }
      );

      return (result.rowsAffected || 0) > 0;
    } catch (error) {
      logger.error({ error, id }, 'Failed to delete review');
      throw error;
    }
  }

  async getProductStats(productId: string): Promise<{ averageRating: number; reviewCount: number }> {
    try {
      const result = await databaseService.executeQuery<{ average_rating: number; review_count: number }>(
        `SELECT 
           AVG(rating) as average_rating,
           COUNT(*) as review_count
         FROM reviews 
         WHERE product_id = :productId`,
        { productId }
      );

      const stats = result.rows?.[0];
      return {
        averageRating: stats?.average_rating || 0,
        reviewCount: stats?.review_count || 0,
      };
    } catch (error) {
      logger.error({ error, productId }, 'Failed to get product stats');
      return { averageRating: 0, reviewCount: 0 };
    }
  }
}
