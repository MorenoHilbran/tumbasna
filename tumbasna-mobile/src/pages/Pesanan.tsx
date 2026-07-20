import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonBadge,
  IonCard
} from '@ionic/react';
import {
  calendarOutline,
  storefrontOutline,
  chevronForwardOutline,
  alertCircleOutline,
  cubeOutline
} from 'ionicons/icons';
import { useApp, Order } from '../context/AppContext';
import './Pesanan.css';

interface PesananProps {
  onSelectOrder: (orderId: string) => void;
  onNavigateToPayment: (orderId: string) => void;
}

const Pesanan: React.FC<PesananProps> = ({ onSelectOrder, onNavigateToPayment }) => {
  const { orders } = useApp();
  const [activeSegment, setActiveSegment] = useState<
    'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan'
  >('Menunggu Pembayaran');

  const segments: ('Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan')[] = [
    'Menunggu Pembayaran',
    'Diproses',
    'Dikirim',
    'Selesai',
    'Dibatalkan'
  ];

  const filteredOrders = orders.filter((order) => order.status === activeSegment);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return 'warning';
      case 'Diproses':
        return 'info';
      case 'Dikirim':
        return 'secondary';
      case 'Selesai':
        return 'success';
      case 'Dibatalkan':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getStatusLabelText = (status: Order['status']) => {
    if (status === 'Diproses') {
      return 'Diproses (Dana Ditahan)';
    }
    return status;
  };

  const handleOrderClick = (order: Order) => {
    if (order.status === 'Menunggu Pembayaran') {
      onNavigateToPayment(order.id);
    } else {
      onSelectOrder(order.id);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="orders-toolbar">
          <div className="orders-toolbar-inner">
            <div className="orders-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="orders-header-logo-only" />
            </div>
          </div>
        </IonToolbar>
        
        <div className="orders-tabs-scroll">
          {segments.map((seg) => {
            const count = orders.filter((o) => o.status === seg).length;
            const isActive = activeSegment === seg;
            return (
              <button
                key={seg}
                className={isActive ? 'orders-tab-btn active' : 'orders-tab-btn'}
                onClick={() => setActiveSegment(seg)}
              >
                <span>{seg === 'Diproses' ? 'Diproses' : seg}</span>
                {count > 0 && <span className="tab-badge-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </IonHeader>

      <IonContent className="orders-content">
        <div className="orders-list-container">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const primaryItem = order.items[0];
              const remainingItemsCount = order.items.length - 1;

              return (
                <div
                  key={order.id}
                  className="order-history-card"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="history-card-header">
                    <div className="history-header-left">
                      <IonIcon icon={storefrontOutline} />
                      <span className="history-supplier-name">{order.supplierName}</span>
                    </div>
                    <IonBadge color={getStatusColor(order.status)} className="history-status-badge">
                      {getStatusLabelText(order.status)}
                    </IonBadge>
                  </div>

                  <div className="history-card-body">
                    <div className="history-item-img-wrapper">
                      <img 
                        src={primaryItem.product.image || '/logotum.png'} 
                        alt={primaryItem.product.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logotum.png';
                        }}
                      />
                    </div>

                    <div className="history-item-details">
                      <h4 className="history-item-title">{primaryItem.product.name}</h4>
                      <p className="history-item-qty">{primaryItem.quantity} kg x Rp {primaryItem.product.price.toLocaleString('id-ID')}</p>
                      {remainingItemsCount > 0 && (
                        <p className="history-extra-items">+{remainingItemsCount} produk lainnya</p>
                      )}
                    </div>
                  </div>

                  <div className="history-card-footer">
                    <div className="history-footer-left">
                      <span className="history-date-label">
                        <IonIcon icon={calendarOutline} /> {order.date}
                      </span>
                      <div className="history-price-column">
                        <span className="price-label">Total Belanja</span>
                        <span className="price-val">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    
                    <div className="history-action-buttons">
                      {order.status === 'Menunggu Pembayaran' ? (
                        <IonButton
                          color="tertiary"
                          size="small"
                          className="history-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToPayment(order.id);
                          }}
                        >
                          Bayar Sekarang
                        </IonButton>
                      ) : (
                        <IonButton
                          fill="outline"
                          color="primary"
                          size="small"
                          className="history-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(order.id);
                          }}
                        >
                          Lihat Detail <IonIcon icon={chevronForwardOutline} slot="end" />
                        </IonButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-orders-container">
              <div className="empty-orders-icon">
                <IonIcon icon={alertCircleOutline} />
              </div>
              <h3>Belum Ada Transaksi</h3>
              <p>Tidak ada transaksi yang berstatus "{activeSegment}" untuk saat ini.</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Pesanan;
