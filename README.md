# 🛒 Marketplace Management System

A **full-stack marketplace application** designed to manage users, authentication, product listings, product details, purchases, and shopping cart operations.  
The solution was built with a strong focus on **performance, accessibility, scalability, and maintainability**, following modern engineering practices and industry standards.

---

## 🚀 Project Overview

This system provides a seamless integration between **frontend, backend, and database**, ensuring a reliable and optimized user experience.

- **Frontend**: Developed with **React.js** and **TypeScript**, following componentization best practices and clean architecture principles.
- **Backend**: Built on **Node.js, Express, and GraphQL**, structured with **BFF (Backend for Frontend)** to optimize data delivery to the client.
- **Database**: Designed with **PL/SQL**, ensuring robust queries, indexing, and transaction safety.
- **Testing**: Comprehensive coverage with **Jest** (unit/integration) and **Cypress** (end-to-end).
- **Performance Audits**: Optimized and validated with **Lighthouse** and **GTMetrix**.
- **Styling**: Implemented using **SASS** and **Bootstrap**, with a focus on reusability and accessibility.

---

## 📦 Tech Stack

### Frontend

- **React.js** with **TypeScript**
- **Hooks** and **Context API** for state management
- **SASS** and **Bootstrap** for styling
- **Jest** for unit testing
- **Cypress** for E2E testing
- **Lighthouse** & **GTMetrix** for performance and accessibility audits

### Backend

- **Node.js** + **Express**
- **GraphQL** (queries, mutations, fragments, caching, error handling, pagination)
- **Apollo Server / Mercurius** (depending on integration)
- **BFF layer** to optimize data retrieval
- **JWT-based authentication** (header & cookie httpOnly strategies)
- **PL/SQL** for database layer and advanced queries
- **Docker** for containerization (optional extension)
- **Kubernetes / Cloud (AWS, Azure, GCP)** support as deployment enhancement

---

## ⚙️ Features

- **User Management** (registration, login, profile update, secure authentication with JWT & cookies)
- **Product Listings** (search, filter, pagination, caching strategies)
- **Product Details** (fragments for reusable data queries)
- **Shopping Cart** (add/remove items, checkout flow)
- **Error Handling** (centralized, structured in GraphQL resolvers)
- **Testing Coverage** (unit, integration, and end-to-end)
- **Performance Optimization** (query batching, caching, DataLoader, persisted queries, complexity analysis)

---

## 🧪 Testing Strategy

- **Jest**

  - Unit tests for hooks, services, and utils
  - Integration tests for resolvers and API responses

- **Cypress**

  - End-to-end flows: authentication, add to cart, checkout
  - Intercepts and data seeding for deterministic results

- **Coverage Goals**:
  - Minimum 80% per module
  - Critical paths: 100% coverage (authentication, purchase flow)

---

## 📊 Performance & Quality

- **Lighthouse** audits for accessibility, performance, best practices, SEO.
- **GTMetrix** to validate loading times and rendering.
- **GraphQL Optimizations**: persisted queries, query depth limit, complexity analysis.
- **Security Enhancements**: JWT validation, cookie sanitization, introspection disabled in production.

---

## 🏗️ Architecture

- **Modular schema and resolvers** (GraphQL with `extend` for scalability)
- **BFF pattern** to decouple client from internal services
- **Context-based authentication** for GraphQL resolvers
- **Clean separation** of concerns:
  - `frontend/` → React application
  - `backend/` → Express + GraphQL API
  - `db/` → PL/SQL scripts & migrations

---

## 📌 Installation & Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/marketplace-system.git
   cd marketplace-system
   ```

2. Setup backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Setup frontend:

   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Run tests:

   ```bash
   npm test        # unit/integration
   npm run e2e     # Cypress tests
   ```

---

## 🎯 Why This Project

This project was designed to **demonstrate expertise** in modern frontend engineering with React & TypeScript, while also covering critical backend concerns (GraphQL, APIs, authentication, database integration, performance, testing, and deployment practices).
