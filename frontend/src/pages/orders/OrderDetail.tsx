import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { ORDER_QUERY } from '@/api/queries';
import { Card, Button } from '@/components/ui';
import { logger } from '@/utils/logger';
import './OrderDetail.scss';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(ORDER_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="order-detail">
        <div className="order-detail__loading">
          <div className="spinner" />
          <p>Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !(data as any)?.order) {
    logger.error('Failed to load order', 'OrderDetail', error);
    return (
      <div className="order-detail">
        <div className="order-detail__error">
          <h3>Pedido não encontrado</h3>
          <p>O pedido que você está procurando não existe ou foi removido.</p>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Voltar para Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const order = (data as any).order;

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

  const handleBackClick = () => {
    navigate('/orders');
  };

  return (
    <div className="order-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="order-detail__breadcrumb">
          <button onClick={handleBackClick} className="order-detail__back">
            ← Voltar para Pedidos
          </button>
        </div>

        <div className="order-detail__content">
          {/* Informações do Pedido */}
          <div className="order-detail__info">
            <Card className="order-detail__info-card" variant="elevated" padding="lg">
              <div className="order-detail__header">
                <div className="order-detail__order-info">
                  <h1 className="order-detail__order-id">Pedido #{order.id}</h1>
                  <div className="order-detail__order-date">
                    Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="order-detail__order-status">
                  <span className={`order-detail__status-badge order-detail__status-badge--${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              <div className="order-detail__details">
                <div className="order-detail__detail-row">
                  <span className="order-detail__detail-label">Status:</span>
                  <span className="order-detail__detail-value">{getStatusText(order.status)}</span>
                </div>
                <div className="order-detail__detail-row">
                  <span className="order-detail__detail-label">Total:</span>
                  <span className="order-detail__detail-value">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="order-detail__detail-row">
                  <span className="order-detail__detail-label">Método de Pagamento:</span>
                  <span className="order-detail__detail-value">{order.paymentMethod}</span>
                </div>
                <div className="order-detail__detail-row">
                  <span className="order-detail__detail-label">Endereço de Entrega:</span>
                  <span className="order-detail__detail-value">{order.shippingAddress}</span>
                </div>
                <div className="order-detail__detail-row">
                  <span className="order-detail__detail-label">Última Atualização:</span>
                  <span className="order-detail__detail-value">
                    {new Date(order.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Itens do Pedido */}
          <div className="order-detail__items">
            <Card className="order-detail__items-card" variant="outlined" padding="lg">
              <h2 className="order-detail__items-title">Itens do Pedido</h2>
              
              <div className="order-detail__items-list">
                {order.items.map((item: any) => (
                  <div key={item.id} className="order-detail__item">
                    <div className="order-detail__item-image">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt || item.product.name}
                        />
                      ) : (
                        <div className="order-detail__item-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="order-detail__item-info">
                      <h3 className="order-detail__item-name">{item.product.name}</h3>
                      <p className="order-detail__item-description">{item.product.description}</p>
                      <div className="order-detail__item-seller">
                        Vendido por: {item.product.seller.firstName} {item.product.seller.lastName}
                      </div>
                    </div>

                    <div className="order-detail__item-quantity">
                      <span className="order-detail__quantity-label">Quantidade:</span>
                      <span className="order-detail__quantity-value">{item.quantity}</span>
                    </div>

                    <div className="order-detail__item-price">
                      <span className="order-detail__price-label">Preço unitário:</span>
                      <span className="order-detail__price-value">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="order-detail__item-total">
                      <span className="order-detail__total-label">Subtotal:</span>
                      <span className="order-detail__total-value">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-detail__items-summary">
                <div className="order-detail__summary-row">
                  <span>Subtotal ({order.items.length} itens):</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="order-detail__summary-row">
                  <span>Frete:</span>
                  <span>Grátis</span>
                </div>
                <div className="order-detail__summary-row order-detail__summary-total">
                  <span>Total:</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
