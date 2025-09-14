import DataLoader from 'dataloader';
import { UserDAO } from '../modules/user/user.dao';
import { ProductDAO } from '../modules/product/product.dao';
import { OrderDAO } from '../modules/order/order.dao';

export interface Loaders {
  userById: DataLoader<string, any>;
  productsByIds: DataLoader<string, any>;
  productsBySeller: DataLoader<string, any>;
  ordersByUser: DataLoader<string, any>;
  orderItemsByOrder: DataLoader<string, any>;
  reviewsByProduct: DataLoader<string, any>;
  cartItemsByUser: DataLoader<string, any>;
}

export function createLoaders(): Loaders {
  const userDAO = new UserDAO();
  const productDAO = new ProductDAO();
  const orderDAO = new OrderDAO();

  return {
    userById: new DataLoader(async (ids: readonly string[]) => {
      const users = await userDAO.findByIds(ids as string[]);
      return ids.map(id => users.find(user => user.id === id) || null);
    }),

    productsByIds: new DataLoader(async (ids: readonly string[]) => {
      const products = await productDAO.findByIds(ids as string[]);
      return ids.map(id => products.find(product => product.id === id) || null);
    }),

    productsBySeller: new DataLoader(async (sellerIds: readonly string[]) => {
      const products = await productDAO.findBySellers(sellerIds as string[]);
      return sellerIds.map(sellerId => 
        products.filter(product => product.seller_id === sellerId)
      );
    }),

    ordersByUser: new DataLoader(async (userIds: readonly string[]) => {
      const orders = await orderDAO.findByUsers(userIds as string[]);
      return userIds.map(userId => 
        orders.filter(order => order.user_id === userId)
      );
    }),

    orderItemsByOrder: new DataLoader(async (orderIds: readonly string[]) => {
      const orderItems = await orderDAO.findItemsByOrders(orderIds as string[]);
      return orderIds.map(orderId => 
        orderItems.filter(item => item.order_id === orderId)
      );
    }),

    reviewsByProduct: new DataLoader(async (productIds: readonly string[]) => {
      const reviews = await productDAO.findReviewsByProducts(productIds as string[]);
      return productIds.map(productId => 
        reviews.filter(review => review.product_id === productId)
      );
    }),

    cartItemsByUser: new DataLoader(async (userIds: readonly string[]) => {
      const cartItems = await userDAO.findCartItemsByUsers(userIds as string[]);
      return userIds.map(userId => 
        cartItems.filter(item => item.user_id === userId)
      );
    }),
  };
}
