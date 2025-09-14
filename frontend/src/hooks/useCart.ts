import { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';

/**
 * Hook personalizado para acessar o contexto do carrinho
 * 
 * @returns {CartContextType} Objeto com estado e funções do carrinho
 * 
 * @example
 * ```tsx
 * const { items, totalPrice, addToCart, removeFromCart } = useCart();
 * 
 * return (
 *   <div>
 *     <p>Total: R$ {totalPrice.toFixed(2)}</p>
 *     <button onClick={() => addToCart('product-id', 1)}>
 *       Adicionar ao Carrinho
 *     </button>
 *   </div>
 * );
 * ```
 */
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};
