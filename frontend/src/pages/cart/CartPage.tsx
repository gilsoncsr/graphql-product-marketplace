import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/components/ui';
import { useCart } from '@/contexts/CartContext';
import { logger } from '@/utils/logger';
import './CartPage.scss';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    isLoading 
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      await updateQuantity(productId, newQuantity);
      logger.info('Cart quantity updated', 'CartPage', { productId, newQuantity });
    } catch (error) {
      logger.error('Failed to update cart quantity', 'CartPage', error as Error, { productId, newQuantity });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
      logger.info('Item removed from cart', 'CartPage', { productId });
    } catch (error) {
      logger.error('Failed to remove item from cart', 'CartPage', error as Error, { productId });
    }
  };

  const handleClearCart = () => {
    clearCart();
    logger.info('Cart cleared', 'CartPage');
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Aqui você implementaria a lógica de checkout
    // Por enquanto, vamos apenas navegar para uma página de pedidos
    navigate('/orders');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="cart-page__loading">
          <div className="spinner" />
          <p>Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-page__empty">
            <div className="cart-page__empty-icon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione alguns produtos para começar suas compras!</p>
            <Button variant="primary" size="lg" onClick={handleContinueShopping}>
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Carrinho de Compras</h1>
          <p className="cart-page__subtitle">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'} no carrinho
          </p>
        </div>

        <div className="cart-page__content">
          {/* Lista de Itens */}
          <div className="cart-page__items">
            {items.map((item) => (
              <Card key={item.id} className="cart-page__item" variant="outlined">
                <div className="cart-page__item-image">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.images[0].alt || item.product.name}
                    />
                  ) : (
                    <div className="cart-page__item-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="cart-page__item-info">
                  <h3 className="cart-page__item-name">{item.product.name}</h3>
                  <p className="cart-page__item-description">{item.product.description}</p>
                  <div className="cart-page__item-seller">
                    Vendido por: {item.product.seller.firstName} {item.product.seller.lastName}
                  </div>
                </div>

                <div className="cart-page__item-quantity">
                  <label htmlFor={`quantity-${item.id}`}>Qtd:</label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="1"
                    max="99"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                    className="cart-page__quantity-input"
                  />
                </div>

                <div className="cart-page__item-price">
                  <div className="cart-page__item-unit-price">
                    R$ {item.product.price.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="cart-page__item-total-price">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div className="cart-page__item-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="cart-page__remove-button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className="cart-page__summary">
            <Card className="cart-page__summary-card" variant="elevated" padding="lg">
              <h3 className="cart-page__summary-title">Resumo do Pedido</h3>
              
              <div className="cart-page__summary-details">
                <div className="cart-page__summary-row">
                  <span>Subtotal ({totalItems} itens):</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="cart-page__summary-row">
                  <span>Frete:</span>
                  <span>Grátis</span>
                </div>
                <div className="cart-page__summary-row cart-page__summary-total">
                  <span>Total:</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="cart-page__summary-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCheckout}
                  loading={isCheckingOut}
                  fullWidth
                >
                  Finalizar Compra
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleContinueShopping}
                  fullWidth
                >
                  Continuar Comprando
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  className="cart-page__clear-button"
                >
                  Limpar Carrinho
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
