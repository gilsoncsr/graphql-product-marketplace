import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'graphql';
import { createContext } from '../../src/lib/context';
import { validationRules } from '../../src/lib/validationRules';

// Import schemas and resolvers
import userSchema from '../../src/modules/user/user.schema.graphql';
import productSchema from '../../src/modules/product/product.schema.graphql';
import orderSchema from '../../src/modules/order/order.schema.graphql';
import { userResolvers } from '../../src/modules/user/user.resolvers';
import { productResolvers } from '../../src/modules/product/product.resolvers';
import { orderResolvers } from '../../src/modules/order/order.resolvers';

// Mock all external dependencies
jest.mock('../../src/lib/database');
jest.mock('../../src/lib/cache');
jest.mock('../../src/modules/user/user.dao');
jest.mock('../../src/modules/product/product.dao');
jest.mock('../../src/modules/order/order.dao');

describe('GraphQL Integration Tests', () => {
  let app: express.Application;
  let server: ApolloServer;

  beforeEach(async () => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Build GraphQL schema
    const typeDefs = `
      ${userSchema}
      ${productSchema}
      ${orderSchema}
    `;

    const resolvers = {
      Query: {
        ...userResolvers.Query,
        ...productResolvers.Query,
        ...orderResolvers.Query,
      },
      Mutation: {
        ...userResolvers.Mutation,
        ...productResolvers.Mutation,
        ...orderResolvers.Mutation,
      },
      User: userResolvers.User,
      CartItem: userResolvers.CartItem,
      Product: productResolvers.Product,
      Review: productResolvers.Review,
      Order: orderResolvers.Order,
      OrderItem: orderResolvers.OrderItem,
    };

    // Create Apollo Server
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: createContext,
      validationRules,
      introspection: true,
      playground: true,
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('User Queries', () => {
    it('should return null for me query when not authenticated', async () => {
      const query = `
        query {
          me {
            id
            email
            firstName
            lastName
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.me).toBeNull();
    });

    it('should return user data for me query when authenticated', async () => {
      const query = `
        query {
          me {
            id
            email
            firstName
            lastName
            isAdmin
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', 'Bearer valid-token')
        .send({ query })
        .expect(200);

      // This will depend on your mock setup
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Product Queries', () => {
    it('should return products with pagination', async () => {
      const query = `
        query {
          products(pagination: { first: 10 }) {
            edges {
              node {
                id
                name
                price
                category
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            totalCount
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.products.edges).toBeInstanceOf(Array);
      expect(response.body.data.products.pageInfo).toBeDefined();
    });

    it('should search products with query', async () => {
      const query = `
        query {
          searchProducts(q: "test", pagination: { first: 10 }) {
            edges {
              node {
                id
                name
                price
              }
            }
            totalCount
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.searchProducts).toBeDefined();
    });
  });

  describe('User Mutations', () => {
    it('should register a new user', async () => {
      const mutation = `
        mutation {
          register(input: {
            email: "newuser@example.com"
            password: "password123"
            firstName: "New"
            lastName: "User"
          }) {
            user {
              id
              email
              firstName
              lastName
            }
            accessToken
            refreshToken
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.register).toBeDefined();
      expect(response.body.data.register.user).toBeDefined();
      expect(response.body.data.register.accessToken).toBeDefined();
    });

    it('should login user', async () => {
      const mutation = `
        mutation {
          login(input: {
            email: "test@example.com"
            password: "password123"
          }) {
            user {
              id
              email
              firstName
              lastName
            }
            accessToken
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.login).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return validation errors for invalid input', async () => {
      const mutation = `
        mutation {
          register(input: {
            email: "invalid-email"
            password: "123"
            firstName: ""
            lastName: ""
          }) {
            user {
              id
              email
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Validation error');
    });

    it('should return GraphQL errors for malformed queries', async () => {
      const query = `
        query {
          me {
            id
            email
            # Missing closing brace
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected queries', async () => {
      const query = `
        query {
          myOrders {
            edges {
              node {
                id
                status
                totalAmount
              }
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Authentication required');
    });
  });
});
