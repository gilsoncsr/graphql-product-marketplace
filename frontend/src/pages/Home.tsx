import React from 'react';
// import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { PRODUCTS_QUERY } from '@/api/queries';
import { Card, Button } from '@/components/ui';
import { logger } from '@/utils/logger';
import './Home.scss';

export const Home: React.FC = () => {
  const { data, loading, error } = useQuery(PRODUCTS_QUERY, {
    variables: {
      first: 8,
      sort: { field: 'createdAt', direction: 'DESC' },
    },
  });

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-page__hero">
          <div className="home-page__hero-content">
            <h1 className="home-page__title">Marketplace</h1>
            <p className="home-page__subtitle">
              Encontre os melhores produtos com os melhores preços
            </p>
            <div className="home-page__loading">
              <div className="spinner" />
              <p>Carregando produtos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load products', 'Home', error);
    return (
      <div className="home-page">
        <div className="home-page__hero">
          <div className="home-page__hero-content">
            <h1 className="home-page__title">Marketplace</h1>
            <p className="home-page__subtitle">
              Encontre os melhores produtos com os melhores preços
            </p>
            <div className="home-page__error">
              <p>Erro ao carregar produtos. Tente novamente.</p>
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                Recarregar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const products = (data as any)?.products?.edges?.map((edge: any) => edge.node) || [];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-page__hero">
        <div className="home-page__hero-content">
          <h1 className="home-page__title">Marketplace</h1>
          <p className="home-page__subtitle">
            Encontre os melhores produtos com os melhores preços
          </p>
          <div className="home-page__hero-actions">
            <Button variant="primary" size="lg" onClick={() => window.location.href = '/products'}>
              Ver Produtos
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/about'}>
              Sobre Nós
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-page__featured">
        <div className="container">
          <div className="home-page__section-header">
            <h2 className="home-page__section-title">Produtos em Destaque</h2>
            <p className="home-page__section-subtitle">
              Confira os produtos mais populares da nossa plataforma
            </p>
          </div>

          {products.length > 0 ? (
            <div className="home-page__products-grid">
              {products.map((product: any) => (
                <Card
                  key={product.id}
                  className="home-page__product-card"
                  variant="elevated"
                  hover
                  clickable
                  onClick={() => window.location.href = `/products/${product.id}`}
                >
                  <div className="home-page__product-image">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="home-page__product-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                          <polyline
                            points="21,15 16,10 5,21"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="home-page__product-content">
                    <h3 className="home-page__product-name">{product.name}</h3>
                    <p className="home-page__product-description">
                      {product.description}
                    </p>
                    
                    <div className="home-page__product-meta">
                      <div className="home-page__product-price">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </div>
                      
                      {product.averageRating > 0 && (
                        <div className="home-page__product-rating">
                          <div className="home-page__stars">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={i < Math.floor(product.averageRating) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                              </svg>
                            ))}
                          </div>
                          <span className="home-page__rating-text">
                            {product.averageRating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="home-page__product-seller">
                      <span>Vendido por: {product.seller.firstName} {product.seller.lastName}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="home-page__empty">
              <div className="home-page__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                  <polyline
                    points="21,15 16,10 5,21"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3>Nenhum produto encontrado</h3>
              <p>Não há produtos disponíveis no momento.</p>
            </div>
          )}

          <div className="home-page__section-footer">
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/products'}>
              Ver Todos os Produtos
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-page__features">
        <div className="container">
          <div className="home-page__features-grid">
            <div className="home-page__feature">
              <div className="home-page__feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 12h3a2 2 0 0 1 2 2v1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 21v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Qualidade Garantida</h3>
              <p>Todos os produtos passam por rigoroso controle de qualidade</p>
            </div>

            <div className="home-page__feature">
              <div className="home-page__feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Melhores Preços</h3>
              <p>Encontre os melhores preços do mercado em um só lugar</p>
            </div>

            <div className="home-page__feature">
              <div className="home-page__feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="8"
                    y="2"
                    width="8"
                    height="4"
                    rx="1"
                    ry="1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3>Entrega Rápida</h3>
              <p>Receba seus produtos rapidamente com nossa rede de entregas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
