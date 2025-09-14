import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { PRODUCT_QUERY } from '@/api/queries';
import { Card, Button, Input } from '@/components/ui';
import { useCart } from '@/contexts/CartContext';
import { logger } from '@/utils/logger';
import './ProductDetail.scss';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, getItemQuantity, isInCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data, loading, error } = useQuery(PRODUCT_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="product-detail">
        <div className="product-detail__loading">
          <div className="spinner" />
          <p>Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !(data as any)?.product) {
    logger.error('Failed to load product', 'ProductDetail', error);
    return (
      <div className="product-detail">
        <div className="product-detail__error">
          <h3>Produto não encontrado</h3>
          <p>O produto que você está procurando não existe ou foi removido.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Voltar para Produtos
          </Button>
        </div>
      </div>
    );
  }

  const product = (data as any).product;
  const images = product.images || [];
  const reviews = product.reviews || [];
  const attributes = product.attributes || [];

  const handleAddToCart = async () => {
    if (!id) return;

    try {
      await addToCart(id, quantity);
      logger.info('Product added to cart', 'ProductDetail', { productId: id, quantity });
    } catch (error) {
      logger.error('Failed to add product to cart', 'ProductDetail', error as Error, { productId: id, quantity });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, Math.min(99, value)));
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleBackClick = () => {
    navigate('/products');
  };

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="product-detail__breadcrumb">
          <button onClick={handleBackClick} className="product-detail__back">
            ← Voltar para Produtos
          </button>
        </div>

        <div className="product-detail__content">
          {/* Imagens */}
          <div className="product-detail__images">
            <div className="product-detail__main-image">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]?.url}
                  alt={images[selectedImageIndex]?.alt || product.name}
                />
              ) : (
                <div className="product-detail__placeholder">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="product-detail__thumbnails">
                {images.map((image: any, index: number) => (
                  <button
                    key={index}
                    className={`product-detail__thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => handleImageClick(index)}
                  >
                    <img src={image.url} alt={image.alt || product.name} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="product-detail__info">
            <div className="product-detail__header">
              <h1 className="product-detail__name">{product.name}</h1>
              
              {product.averageRating > 0 && (
                <div className="product-detail__rating">
                  <div className="product-detail__stars">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={i < Math.floor(product.averageRating) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    ))}
                  </div>
                  <span className="product-detail__rating-text">
                    {product.averageRating.toFixed(1)} ({product.reviewCount} avaliações)
                  </span>
                </div>
              )}

              <div className="product-detail__price">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="product-detail__description">
              <h3>Descrição</h3>
              <p>{product.description}</p>
            </div>

            {/* Atributos */}
            {attributes.length > 0 && (
              <div className="product-detail__attributes">
                <h3>Especificações</h3>
                <div className="product-detail__attributes-list">
                  {attributes.map((attr: any, index: number) => (
                    <div key={index} className="product-detail__attribute">
                      <span className="product-detail__attribute-name">{attr.name}:</span>
                      <span className="product-detail__attribute-value">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendedor */}
            <div className="product-detail__seller">
              <h3>Vendido por</h3>
              <div className="product-detail__seller-info">
                <div className="product-detail__seller-avatar">
                  {product.seller.firstName.charAt(0)}{product.seller.lastName.charAt(0)}
                </div>
                <div className="product-detail__seller-details">
                  <div className="product-detail__seller-name">
                    {product.seller.firstName} {product.seller.lastName}
                  </div>
                  <div className="product-detail__seller-label">Vendedor</div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="product-detail__actions">
              <div className="product-detail__quantity">
                <label htmlFor="quantity">Quantidade:</label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="product-detail__quantity-input"
                />
              </div>

              {isInCart(product.id) ? (
                <div className="product-detail__in-cart">
                  <span>No carrinho ({getItemQuantity(product.id)})</span>
                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={quantity === 0}
                  >
                    Adicionar {quantity} mais
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={quantity === 0}
                  fullWidth
                >
                  Adicionar ao Carrinho
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Avaliações */}
        {reviews.length > 0 && (
          <div className="product-detail__reviews">
            <h2>Avaliações ({reviews.length})</h2>
            <div className="product-detail__reviews-list">
              {reviews.map((review: any) => (
                <Card key={review.id} className="product-detail__review" variant="outlined">
                  <div className="product-detail__review-header">
                    <div className="product-detail__review-author">
                      {review.user.firstName} {review.user.lastName}
                    </div>
                    <div className="product-detail__review-rating">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={i < review.rating ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                      ))}
                    </div>
                    <div className="product-detail__review-date">
                      {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {review.comment && (
                    <div className="product-detail__review-comment">
                      {review.comment}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
