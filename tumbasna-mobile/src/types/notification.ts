/**
 * Notification Types for Tumbasna
 */

export type NotificationType = 'payment' | 'order' | 'price' | 'promo' | 'system' | 'chat';

export type NotificationCategory = 'urgent' | 'important' | 'info' | 'success' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  icon: string; // ionicons name
  color: string; // hex color
  timestamp: Date;
  isRead: boolean;
  actionType: 'navigate' | 'dismiss';
  actionTarget?: string; // route or orderId
  metadata?: {
    orderId?: string;
    productId?: string;
    supplierId?: string;
    priceChange?: number;
    expiresIn?: number; // seconds
  };
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
}
