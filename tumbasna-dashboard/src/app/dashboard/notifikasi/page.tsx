'use client';

import { Bell, Package, Truck, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'delivery';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const notifications: Notification[] = [
    {
        id: '1',
        type: 'success',
        title: 'Transaksi Berhasil',
        message: 'Pembayaran QRIS sebesar Rp 250.000 telah diterima',
        time: '5 menit yang lalu',
        read: false,
    },
    {
        id: '2',
        type: 'delivery',
        title: 'Pengiriman Dalam Perjalanan',
        message: 'Pesanan #TBS-2024-0123 sedang dalam perjalanan ke lokasi',
        time: '15 menit yang lalu',
        read: false,
    },
    {
        id: '3',
        type: 'warning',
        title: 'Stok Menipis',
        message: 'Stok Beras Premium di Gudang A tersisa 10 kg',
        time: '1 jam yang lalu',
        read: true,
    },
    {
        id: '4',
        type: 'info',
        title: 'Supplier Baru Terdaftar',
        message: 'Supplier "Toko Sembako Jaya" telah bergabung',
        time: '2 jam yang lalu',
        read: true,
    },
    {
        id: '5',
        type: 'success',
        title: 'Pencairan Dana',
        message: 'Dana escrow sebesar Rp 1.500.000 telah dicairkan',
        time: '3 jam yang lalu',
        read: true,
    },
];

export default function NotifikasiPage() {
    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5" />;
            case 'delivery':
                return <Truck className="w-5 h-5" />;
            default:
                return <Package className="w-5 h-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'warning':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'delivery':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        Tandai Semua Dibaca
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-5 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-emerald-50/30' : ''
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${getColor(notification.type)}`}>
                                    {getIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className={`font-semibold text-sm ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.read && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{notification.time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Empty state jika tidak ada notifikasi */}
            {notifications.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak Ada Notifikasi</h3>
                    <p className="text-sm text-slate-500">Semua notifikasi akan muncul di sini</p>
                </div>
            )}
        </div>
    );
}
