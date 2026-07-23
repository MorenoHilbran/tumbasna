/**
 * Notification Service - Helper functions to create notifications
 */

import { Notification } from '../types/notification';

export const notificationTemplates = {
  // CATEGORY 1: PAYMENT
  paymentPending: (orderId: string, amount: number): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'payment',
    category: 'urgent',
    title: 'Pembayaran Tertunda',
    message: `Selesaikan pembayaran untuk order #${orderId}. Total: Rp ${amount.toLocaleString('id-ID')}`,
    icon: 'time-outline',
    color: '#E53935',
    actionType: 'navigate',
    actionTarget: `/order/${orderId}`,
    metadata: { orderId }
  }),

  paymentSuccess: (orderId: string, supplierName: string): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'payment',
    category: 'success',
    title: 'Pembayaran Berhasil',
    message: `Pembayaran berhasil! Order #${orderId} sedang diproses oleh ${supplierName}`,
    icon: 'checkmark-circle',
    color: '#006837',
    actionType: 'navigate',
    actionTarget: `/order/${orderId}`,
    metadata: { orderId }
  }),

  paymentFailed: (orderId: string): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'payment',
    category: 'urgent',
    title: 'Pembayaran Gagal',
    message: 'Pembayaran gagal atau kadaluarsa. Silakan buat pesanan baru.',
    icon: 'close-circle',
    color: '#E53935',
    actionType: 'navigate',
    actionTarget: '/pasar',
    metadata: { orderId }
  }),

  // CATEGORY 2: ORDER STATUS
  orderConfirmed: (orderId: string, supplierName: string, productName: string): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'order',
    category: 'important',
    title: 'Pesanan Dikonfirmasi',
    message: `Pesanan Anda dikonfirmasi! ${supplierName} sedang menyiapkan ${productName}`,
    icon: 'cube-outline',
    color: '#2196F3',
    actionType: 'navigate',
    actionTarget: `/order/${orderId}`,
    metadata: { orderId }
  }),

  orderShipped: (orderId: string, courier: string, estimasi: string): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'order',
    category: 'important',
    title: 'Pesanan Dalam Pengiriman',
    message: `Pesanan Anda dalam perjalanan! Estimasi tiba: ${estimasi} (kurir: ${courier})`,
    icon: 'car-outline',
    color: '#2196F3',
    actionType: 'navigate',
    actionTarget: `/order/${orderId}`,
    metadata: { orderId }
  }),

  orderNeedConfirmation: (orderId: string, supplierName: string): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'order',
    category: 'important',
    title: 'Butuh Konfirmasi Penerimaan',
    message: `Sudah menerima pesanan dari ${supplierName}? Konfirmasi penerimaan untuk mencairkan dana`,
    icon: 'checkmark-done-outline',
    color: '#FF8C00',
    actionType: 'navigate',
    actionTarget: `/order/${orderId}`,
    metadata: { orderId }
  }),

  orderCompleted: (orderId: string, amount: number, supplierName: string): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'order',
    category: 'success',
    title: 'Transaksi Selesai',
    message: `Terima kasih! Dana Rp ${amount.toLocaleString('id-ID')} telah dicairkan ke ${supplierName}`,
    icon: 'trophy-outline',
    color: '#006837',
    actionType: 'navigate',
    actionTarget: `/order/${orderId}`,
    metadata: { orderId }
  }),

  // CATEGORY 3: SYSTEM
  welcome: (): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'system',
    category: 'system',
    title: 'Selamat Datang di Tumbasna',
    message: 'Temukan komoditas segar langsung dari petani terbaik!',
    icon: 'notifications-outline',
    color: '#006837',
    actionType: 'dismiss'
  })
};

export const createNotification = (
  template: keyof typeof notificationTemplates,
  ...args: any[]
): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => {
  const templateFn = notificationTemplates[template];
  return (templateFn as any)(...args);
};
