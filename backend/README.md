# Marketplace GraphQL BFF

A professional GraphQL Backend for Frontend (BFF) implementation for a marketplace application, built with TypeScript, Express, Apollo Server, and Oracle Database.

## 🚀 Features

### Core Functionality
- **GraphQL API** with comprehensive schema for users, products, orders, and cart
- **Oracle Database** integration with PL/SQL procedures
- **JWT Authentication** with refresh tokens and secure cookies
- **DataLoader** implementation to prevent N+1 queries
- **Redis Caching** for improved performance
- **Cursor-based Pagination** for efficient data loading

### Security & Performance
- **CSRF Protection** using double submit cookie pattern
- **Rate Limiting** to prevent abuse
- **Input Validation** with Zod schemas
- **SQL Injection Protection** with parameterized queries
- **GraphQL Security** with depth limits and complexity analysis
- **Persisted Queries (APQ)** support for optimized queries

### Developer Experience
- **TypeScript** with strict type checking
- **Comprehensive Testing** with Jest (unit + integration)
- **Docker Support** with multi-stage builds
- **ESLint & Prettier** for code quality
- **Structured Logging** with Pino
- **Health Checks** and metrics endpoints

## 📋 Prerequisites

- Node.js 18+ 
- Oracle Database 21c XE (or compatible)
- Redis 6+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd marketplace-graphql-bff
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to be ready**
   ```bash
   # Check logs
   docker-compose logs -f api
   
   # Check health
   curl http://localhost:4000/healthz
   ```

### Manual Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Oracle Database**
   - Install Oracle Database 21c XE
   - Create user and run initialization scripts:
     ```sql
     -- Connect as sysdba
     sqlplus sys/password@localhost:1521/XE as sysdba
     
     -- Run initialization script
     @db/init.sql
     @db/seed.sql
     ```

3. **Set up Redis**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install locally
   # Follow Redis installation guide for your OS
   ```

4. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `4000` |
| `DB_HOST` | Oracle host | `localhost` |
| `DB_PORT` | Oracle port | `1521` |
| `DB_SERVICE_NAME` | Oracle service name | `XE` |
| `DB_USER` | Database user | `marketplace` |
| `DB_PASSWORD` | Database password | `marketplace123` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | **Required** |
| `JWT_REFRESH_SECRET` | Refresh token secret | **Required** |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

### Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `products` - Product catalog
- `product_attributes` - Product specifications
- `product_images` - Product photos
- `reviews` - Product reviews and ratings
- `cart_items` - Shopping cart
- `orders` - Order records
- `order_items` - Order line items
- `sessions` - User sessions for refresh tokens

## 📚 API Documentation

### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Playground**: `http://localhost:4000/graphql` (development only)

### REST Endpoints
- **Health Check**: `GET /healthz`
- **Metrics**: `GET /metrics`
- **Refresh Token**: `POST /auth/refresh`
- **Logout**: `POST /auth/logout`
- **User Info**: `GET /auth/me`

### Example Queries

#### Get Current User
```graphql
query {
  me {
    id
    email
    firstName
    lastName
    cart {
      id
      quantity
      product {
        id
        name
        price
      }
    }
  }
}
```

#### Search Products
```graphql
query {
  searchProducts(
    q: "laptop"
    filter: { category: "Electronics", minPrice: 500 }
    pagination: { first: 10 }
  ) {
    edges {
      node {
        id
        name
        price
        averageRating
        reviewCount
        images {
          url
          altText
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

#### Create Order
```graphql
mutation {
  createOrder(input: {
    items: [
      { productId: "product-1", quantity: 2 }
      { productId: "product-2", quantity: 1 }
    ]
    payment: {
      method: "credit_card"
      billingAddress: "123 Main St, City, State 12345"
      shippingAddress: "123 Main St, City, State 12345"
    }
  }) {
    id
    status
    totalAmount
    items {
      product {
        name
        price
      }
      quantity
      totalPrice
    }
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration
```

### Test Coverage
The project maintains 80%+ test coverage across:
- GraphQL resolvers
- Database operations
- Authentication flows
- Input validation
- Error handling

## 🐳 Docker

### Build Image
```bash
docker build -t marketplace-api .
```

### Run Container
```bash
docker run -p 4000:4000 \
  -e DB_HOST=oracle-host \
  -e REDIS_HOST=redis-host \
  -e JWT_SECRET=your-secret \
  marketplace-api
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## 📊 Monitoring & Observability

### Health Checks
- **Application**: `GET /healthz`
- **Database**: Included in health check
- **Cache**: Included in health check

### Metrics
- **Endpoint**: `GET /metrics`
- **Memory usage**: Process memory consumption
- **Database status**: Connection health
- **Cache status**: Redis connection health

### Logging
- **Structured logging** with Pino
- **Request tracing** with unique request IDs
- **Error tracking** with stack traces
- **Performance monitoring** with operation timing

## 🔒 Security Features

### Authentication
- **JWT Access Tokens** (15-minute expiry)
- **Refresh Tokens** in httpOnly cookies (7-day expiry)
- **Session Management** with database storage
- **Password Hashing** with bcrypt (12 rounds)

### Authorization
- **Role-based access** (admin/user)
- **Resource ownership** validation
- **GraphQL field-level** security

### Input Validation
- **Zod schemas** for all inputs
- **SQL injection** prevention with parameterized queries
- **XSS protection** with input sanitization

### Rate Limiting
- **IP-based limiting** (100 requests/15 minutes)
- **GraphQL operation** complexity limits
- **Query depth** limits (max 6 levels)

## 🚀 Performance Optimizations

### Caching Strategy
- **Redis caching** for frequently accessed data
- **Query result caching** for expensive operations
- **Cache invalidation** on data updates

### Database Optimizations
- **Connection pooling** for Oracle
- **Prepared statements** for repeated queries
- **Indexed queries** for fast lookups

### GraphQL Optimizations
- **DataLoader** for N+1 query prevention
- **Persisted Queries** for reduced payload
- **Query complexity** analysis and limits

## 🛠️ Development

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Management
```bash
# Run migrations (if any)
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## 📈 Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure Oracle Database with proper security
3. Set up Redis with persistence
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates
6. Configure monitoring and alerting

### Scaling Considerations
- **Horizontal scaling** with multiple API instances
- **Database connection pooling** optimization
- **Redis clustering** for high availability
- **Load balancing** with sticky sessions for GraphQL subscriptions

### Security Checklist
- [ ] Change default JWT secrets
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up database encryption
- [ ] Enable audit logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases for usage examples

## 🎯 Roadmap

### Planned Features
- [ ] GraphQL Subscriptions for real-time updates
- [ ] Advanced search with Elasticsearch
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] API versioning
- [ ] OpenAPI documentation

### Performance Improvements
- [ ] Query optimization
- [ ] Caching strategies
- [ ] Database indexing
- [ ] CDN integration

---

**Built with ❤️ for the marketplace of the future**
