import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { PRODUCTS_QUERY, SEARCH_PRODUCTS_QUERY } from '@/api/queries';
import { Card, Button, Input } from '@/components/ui';
import { useCart } from '@/contexts/CartContext';
import { logger } from '@/utils/logger';
import './ProductsList.scss';

interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
}

interface ProductSort {
  field: 'name' | 'price' | 'createdAt' | 'averageRating';
  direction: 'ASC' | 'DESC';
}

export const ProductsList: React.FC = () => {
  const { addToCart, getItemQuantity, isInCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ProductFilter>({});
  const [sort, setSort] = useState<ProductSort>({ field: 'createdAt', direction: 'DESC' });
  // const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const ITEMS_PER_PAGE = 12;

  // Query para produtos normais
  const { data: productsData, loading: productsLoading, error: productsError, fetchMore } = useQuery(PRODUCTS_QUERY, {
    variables: {
      first: ITEMS_PER_PAGE,
      filter,
      sort,
    },
    skip: isSearching,
  });

  // Query para busca
  const { data: searchData, loading: searchLoading, error: searchError } = useQuery(SEARCH_PRODUCTS_QUERY, {
    variables: {
      query: searchQuery,
      first: ITEMS_PER_PAGE,
      filter,
      sort,
    },
    skip: !searchQuery || !isSearching,
  });

  const currentData = isSearching ? searchData : productsData;
  const currentLoading = isSearching ? searchLoading : productsLoading;
  const currentError = isSearching ? searchError : productsError;

  const products = (currentData as any)?.products?.edges?.map((edge: any) => edge.node) || [];
  const pageInfo = (currentData as any)?.products?.pageInfo;
  const totalCount = (currentData as any)?.products?.totalCount || 0;

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: Partial<ProductFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    // setCurrentPage(1);
  };

  const handleSortChange = (newSort: ProductSort) => {
    setSort(newSort);
    // setCurrentPage(1);
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      logger.info('Product added to cart', 'ProductsList', { productId });
    } catch (error) {
      logger.error('Failed to add product to cart', 'ProductsList', error as Error, { productId });
    }
  };

  const handleLoadMore = () => {
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  };

  if (currentLoading && !products.length) {
    return (
      <div className="products-list">
        <div className="products-list__loading">
          <div className="spinner" />
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (currentError) {
    logger.error('Failed to load products', 'ProductsList', currentError);
    return (
      <div className="products-list">
        <div className="products-list__error">
          <h3>Erro ao carregar produtos</h3>
          <p>Tente novamente mais tarde.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-list">
      <div className="container">
        {/* Header */}
        <div className="products-list__header">
          <h1 className="products-list__title">
            {isSearching ? `Resultados para "${searchQuery}"` : 'Produtos'}
          </h1>
          <p className="products-list__subtitle">
            {totalCount} {totalCount === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="products-list__filters">
          <div className="products-list__search">
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={handleSearch}
              leftIcon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              }
            />
          </div>

          <div className="products-list__controls">
            <select
              className="products-list__sort"
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                handleSortChange({ field: field as any, direction: direction as any });
              }}
            >
              <option value="createdAt-DESC">Mais recentes</option>
              <option value="createdAt-ASC">Mais antigos</option>
              <option value="price-ASC">Menor preço</option>
              <option value="price-DESC">Maior preço</option>
              <option value="name-ASC">Nome A-Z</option>
              <option value="name-DESC">Nome Z-A</option>
              <option value="averageRating-DESC">Melhor avaliados</option>
            </select>

            <select
              className="products-list__filter"
              value={filter.category || ''}
              onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
            >
              <option value="">Todas as categorias</option>
              <option value="electronics">Eletrônicos</option>
              <option value="clothing">Roupas</option>
              <option value="books">Livros</option>
              <option value="home">Casa</option>
            </select>
          </div>
        </div>

        {/* Lista de Produtos */}
        {products.length > 0 ? (
          <>
            <div className="products-list__grid">
              {products.map((product: any) => (
                <Card
                  key={product.id}
                  className="products-list__product-card"
                  variant="elevated"
                  hover
                >
                  <div className="products-list__product-image">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="products-list__product-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="products-list__product-content">
                    <h3 className="products-list__product-name">{product.name}</h3>
                    <p className="products-list__product-description">
                      {product.description}
                    </p>
                    
                    <div className="products-list__product-meta">
                      <div className="products-list__product-price">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </div>
                      
                      {product.averageRating > 0 && (
                        <div className="products-list__product-rating">
                          <div className="products-list__stars">
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
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                              </svg>
                            ))}
                          </div>
                          <span className="products-list__rating-text">
                            {product.averageRating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="products-list__product-actions">
                      {isInCart(product.id) ? (
                        <div className="products-list__in-cart">
                          <span>No carrinho ({getItemQuantity(product.id)})</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToCart(product.id)}
                          >
                            +1
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          fullWidth
                        >
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {pageInfo?.hasNextPage && (
              <div className="products-list__load-more">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  loading={currentLoading}
                >
                  Carregar Mais Produtos
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="products-list__empty">
            <div className="products-list__empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Nenhum produto encontrado</h3>
            <p>
              {isSearching 
                ? `Não encontramos produtos para "${searchQuery}". Tente outros termos.`
                : 'Não há produtos disponíveis no momento.'
              }
            </p>
            {isSearching && (
              <Button variant="primary" onClick={() => setSearchQuery('')}>
                Limpar Busca
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
