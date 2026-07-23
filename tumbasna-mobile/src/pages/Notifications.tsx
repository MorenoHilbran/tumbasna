import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonIcon } from '@ionic/react';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

interface NotificationsProps {
  onBack?: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;
    return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="notifications-toolbar">
          <div className="notifications-toolbar-inner">
            <IonButtons slot="start">
              {onBack ? (
                <button className="notifications-back-btn-custom" onClick={onBack}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
              ) : (
                <IonBackButton defaultHref="/home" text="" className="notifications-back-btn" />
              )}
            </IonButtons>
            <div className="notifications-title-row">
              <h1 className="notifications-header-title">Notifikasi</h1>
            </div>
            <IonButtons slot="end">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-btn" 
                  onClick={markAllAsRead}
                >
                  <i className="fa-solid fa-check-double"></i>
                </button>
              )}
            </IonButtons>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="notifications-page">
        <div className="notifications-container">
          {unreadCount > 0 && (
            <div className="notifications-summary">
              <i className="fa-solid fa-bell"></i>
              <span>{unreadCount} notifikasi belum dibaca</span>
            </div>
          )}

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <i className="fa-regular fa-bell-slash" style={{ fontSize: 64, color: '#ccc' }}></i>
                <h3>Belum Ada Notifikasi</h3>
                <p>Semua notifikasi akan muncul di sini</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notification-icon" style={{ backgroundColor: notif.color + '20', color: notif.color }}>
                    <IonIcon icon={notif.icon} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4 className="notification-title">{notif.title}</h4>
                      {!notif.isRead && <div className="notification-unread-dot"></div>}
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    <div className="notification-footer">
                      <span className="notification-time">
                        <i className="fa-regular fa-clock"></i>
                        {formatTimestamp(notif.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
