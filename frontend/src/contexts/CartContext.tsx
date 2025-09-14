import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { ADD_TO_CART_MUTATION, REMOVE_FROM_CART_MUTATION, CART_QUERY } from '@/api/queries';
import { logger } from '@/utils/logger';

// Tipos
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
  };
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
}

interface CartContextType extends CartState {
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  clearError: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

// Estado inicial
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
};

// Actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: action.payload.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        isLoading: false,
      };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        totalItems: state.totalItems + action.payload.quantity,
        totalPrice: state.totalPrice + (action.payload.product.price * action.payload.quantity),
        isLoading: false,
      };
    case 'REMOVE_ITEM':
      const itemToRemove = state.items.find(item => item.product.id === action.payload);
      if (!itemToRemove) return state;
      
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalPrice: state.totalPrice - (itemToRemove.product.price * itemToRemove.quantity),
        isLoading: false,
      };
    case 'UPDATE_ITEM':
      const itemIndex = state.items.findIndex(item => item.product.id === action.payload.productId);
      if (itemIndex === -1) return state;
      
      const oldItem = state.items[itemIndex];
      const newItems = [...state.items];
      newItems[itemIndex] = { ...oldItem, quantity: action.payload.quantity };
      
      return {
        ...state,
        items: newItems,
        totalItems: state.totalItems - oldItem.quantity + action.payload.quantity,
        totalPrice: state.totalPrice - (oldItem.product.price * oldItem.quantity) + (oldItem.product.price * action.payload.quantity),
        isLoading: false,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        isLoading: false,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Queries e Mutations
  const { data: cartData, loading: cartLoading, error: cartError } = useQuery(CART_QUERY, {
    skip: !localStorage.getItem('accessToken'), // Só buscar se estiver autenticado
  });

  const [addToCartMutation] = useMutation(ADD_TO_CART_MUTATION);
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART_MUTATION);

  // Sincronizar com dados do servidor
  useEffect(() => {
    if ((cartData as any)?.cart) {
      dispatch({ type: 'SET_ITEMS', payload: (cartData as any).cart });
    }
  }, [cartData]);

  // Tratar erro da query
  useEffect(() => {
    if (cartError) {
      dispatch({ type: 'SET_ERROR', payload: cartError.message });
      logger.error('Cart query failed', 'Cart', cartError);
    }
  }, [cartError]);

  // Loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: cartLoading });
  }, [cartLoading]);

  // Add to cart
  const addToCart = async (productId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data } = await addToCartMutation({
        variables: { productId, quantity },
        update: (cache: any, { data }: any) => {
          if (data?.addToCart) {
            // Atualizar cache local
            const existingCart = cache.readQuery({ query: CART_QUERY });
            if (existingCart) {
              cache.writeQuery({
                query: CART_QUERY,
                data: {
                  cart: [...(existingCart as any).cart, data.addToCart],
                },
              });
            }
          }
        },
      });

      if ((data as any)?.addToCart) {
        dispatch({ type: 'ADD_ITEM', payload: (data as any).addToCart });
        logger.info('Item added to cart', 'Cart', { productId, quantity });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add item to cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('Add to cart failed', 'Cart', error, { productId, quantity });
      throw error;
    }
  };

  // Remove from cart
  const removeFromCart = async (productId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data } = await removeFromCartMutation({
        variables: { productId },
        update: (cache: any) => {
          // Atualizar cache local
          const existingCart = cache.readQuery({ query: CART_QUERY });
          if (existingCart) {
            cache.writeQuery({
              query: CART_QUERY,
              data: {
                cart: (existingCart as any).cart.filter((item: CartItem) => item.product.id !== productId),
              },
            });
          }
        },
      });

      if ((data as any)?.removeFromCart) {
        dispatch({ type: 'REMOVE_ITEM', payload: productId });
        logger.info('Item removed from cart', 'Cart', { productId });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove item from cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('Remove from cart failed', 'Cart', error, { productId });
      throw error;
    }
  };

  // Update quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Para simplificar, vamos remover e adicionar novamente
      await removeFromCart(productId);
      await addToCart(productId, quantity);
      
      logger.info('Item quantity updated', 'Cart', { productId, quantity });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update item quantity';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('Update quantity failed', 'Cart', error, { productId, quantity });
      throw error;
    }
  };

  // Clear cart
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    logger.info('Cart cleared', 'Cart');
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Get item quantity
  const getItemQuantity = (productId: string): number => {
    const item = state.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Check if item is in cart
  const isInCart = (productId: string): boolean => {
    return state.items.some(item => item.product.id === productId);
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearError,
    getItemQuantity,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
