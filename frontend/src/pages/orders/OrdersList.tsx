import React from 'react';
import { useQuery } from '@apollo/client/react';
import { ORDERS_QUERY } from '@/api/queries';
import { Card, Button } from '@/components/ui';
import { logger } from '@/utils/logger';
import './OrdersList.scss';

export const OrdersList: React.FC = () => {
  const { data, loading, error } = useQuery(ORDERS_QUERY, {
    variables: {
      first: 20,
    },
  });

  if (loading) {
    return (
      <div className="orders-list">
        <div className="orders-list__loading">
          <div className="spinner" />
          <p>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load orders', 'OrdersList', error);
    return (
      <div className="orders-list">
        <div className="orders-list__error">
          <h3>Erro ao carregar pedidos</h3>
          <p>Tente novamente mais tarde.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  const orders = (data as any)?.orders?.edges?.map((edge: any) => edge.node) || [];
  const totalCount = (data as any)?.orders?.totalCount || 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="orders-list">
        <div className="container">
          <div className="orders-list__empty">
            <div className="orders-list__empty-icon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2>Nenhum pedido encontrado</h2>
            <p>Você ainda não fez nenhum pedido.</p>
            <Button variant="primary" size="lg" onClick={() => window.location.href = '/products'}>
              Começar a Comprar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-list">
      <div className="container">
        <div className="orders-list__header">
          <h1 className="orders-list__title">Meus Pedidos</h1>
          <p className="orders-list__subtitle">
            {totalCount} {totalCount === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
          </p>
        </div>

        <div className="orders-list__content">
          {orders.map((order: any) => (
            <Card key={order.id} className="orders-list__order" variant="outlined">
              <div className="orders-list__order-header">
                <div className="orders-list__order-info">
                  <h3 className="orders-list__order-id">Pedido #{order.id}</h3>
                  <div className="orders-list__order-date">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="orders-list__order-status">
                  <span className={`orders-list__status-badge orders-list__status-badge--${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              <div className="orders-list__order-items">
                {order.items.map((item: any) => (
                  <div key={item.id} className="orders-list__order-item">
                    <div className="orders-list__item-image">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt || item.product.name}
                        />
                      ) : (
                        <div className="orders-list__item-placeholder">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="orders-list__item-info">
                      <div className="orders-list__item-name">{item.product.name}</div>
                      <div className="orders-list__item-quantity">Qtd: {item.quantity}</div>
                    </div>
                    <div className="orders-list__item-price">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="orders-list__order-footer">
                <div className="orders-list__order-total">
                  <span>Total: R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="orders-list__order-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/orders/${order.id}`}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
