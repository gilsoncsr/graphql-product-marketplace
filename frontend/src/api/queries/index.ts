import { gql } from '@apollo/client';

// Fragments
export const PRODUCT_CARD_FRAGMENT = gql`
  fragment ProductCard on Product {
    id
    name
    price
    description
    images {
      id
      url
      alt
    }
    seller {
      id
      firstName
      lastName
    }
    averageRating
    reviewCount
    createdAt
  }
`;

export const USER_FRAGMENT = gql`
  fragment UserInfo on User {
    id
    email
    firstName
    lastName
    phone
    address
    createdAt
  }
`;

export const CART_ITEM_FRAGMENT = gql`
  fragment CartItem on CartItem {
    id
    quantity
    product {
      ...ProductCard
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const ORDER_ITEM_FRAGMENT = gql`
  fragment OrderItem on OrderItem {
    id
    quantity
    price
    product {
      ...ProductCard
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const ORDER_FRAGMENT = gql`
  fragment OrderInfo on Order {
    id
    status
    total
    shippingAddress
    paymentMethod
    createdAt
    updatedAt
    items {
      ...OrderItem
    }
  }
  ${ORDER_ITEM_FRAGMENT}
`;

// Queries
export const ME_QUERY = gql`
  query Me {
    me {
      ...UserInfo
    }
  }
  ${USER_FRAGMENT}
`;

export const PRODUCTS_QUERY = gql`
  query Products($first: Int, $after: String, $filter: ProductFilter, $sort: ProductSort) {
    products(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          ...ProductCard
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const PRODUCT_QUERY = gql`
  query Product($id: ID!) {
    product(id: $id) {
      ...ProductCard
      attributes {
        name
        value
      }
      reviews {
        id
        rating
        comment
        user {
          firstName
          lastName
        }
        createdAt
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const SEARCH_PRODUCTS_QUERY = gql`
  query SearchProducts($query: String!, $first: Int, $after: String, $filter: ProductFilter, $sort: ProductSort) {
    searchProducts(query: $query, first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          ...ProductCard
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const CART_QUERY = gql`
  query Cart {
    cart {
      ...CartItem
    }
  }
  ${CART_ITEM_FRAGMENT}
`;

export const ORDER_QUERY = gql`
  query Order($id: ID!) {
    order(id: $id) {
      ...OrderInfo
    }
  }
  ${ORDER_FRAGMENT}
`;

export const ORDERS_QUERY = gql`
  query Orders($first: Int, $after: String) {
    orders(first: $first, after: $after) {
      edges {
        node {
          ...OrderInfo
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${ORDER_FRAGMENT}
`;

// Mutations
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ...UserInfo
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...UserInfo
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
      ...CartItem
    }
  }
  ${CART_ITEM_FRAGMENT}
`;

export const REMOVE_FROM_CART_MUTATION = gql`
  mutation RemoveFromCart($productId: ID!) {
    removeFromCart(productId: $productId) {
      ...CartItem
    }
  }
  ${CART_ITEM_FRAGMENT}
`;

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      ...OrderInfo
    }
  }
  ${ORDER_FRAGMENT}
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      ...ProductCard
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
