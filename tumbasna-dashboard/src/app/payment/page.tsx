'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Package,
  CreditCard,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIds = searchParams.get('orders')?.split(',') || [];
  const totalAmount = parseInt(searchParams.get('total') || '0');

  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'expired'>('pending');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    if (orderIds.length === 0) {
      router.push('/products');
      return;
    }

    generatePayment();
  }, [orderIds]);

  useEffect(() => {
    // Countdown timer
    if (paymentStatus !== 'pending') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentStatus]);

  useEffect(() => {
    // Poll payment status every 5 seconds
    if (paymentStatus !== 'pending') return;

    const pollInterval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [paymentStatus, orderIds]);

  const generatePayment = async () => {
    try {
      setLoading(true);

      // Get order details
      const ordersData = await Promise.all(
        orderIds.map(async (orderId) => {
          const res = await fetch(`/api/orders/${orderId}`);
          return res.json();
        })
      );
      setOrders(ordersData.filter(o => o.success).map(o => o.data));

      // Generate QRIS payment
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderIds[0], // Primary order ID
          orderIds: orderIds, // All order IDs
          totalAmount,
        }),
      });

      const result = await response.json();

      if (result.qrString) {
        setQrCode(result.qrString);
      } else {
        // Fallback: Generate dummy QR for testing
        setQrCode(`00020101021226670016COM.MIDTRANS.WWW01189360050300000898540204935703UME51440014ID.CO.QRIS.WWW0215ID10200898540300303UME5204839953033605802ID5925Tumbasna Platform6007Jakarta61051234062070703A016304${Math.random().toString(36).substring(7).toUpperCase()}`);
      }

      setLoading(false);
    } catch (error) {
      console.error('Payment generation error:', error);
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status?orderId=${orderIds[0]}`);
      const result = await response.json();

      if (result.status === 'SETTLEMENT' || result.status === 'CAPTURE') {
        setPaymentStatus('success');
      } else if (result.status === 'EXPIRE' || result.status === 'CANCEL') {
        setPaymentStatus('expired');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyQRCode = () => {
    navigator.clipboard.writeText(qrCode);
    alert('Kode QR berhasil disalin!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-slate-600 font-semibold">Memproses pembayaran...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-slate-600 mb-6">
            Pesanan Anda sedang diproses oleh supplier
          </p>
          <button
            onClick={() => router.push('/orders')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all"
          >
            Lihat Pesanan
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pembayaran Expired</h1>
          <p className="text-slate-600 mb-6">
            Waktu pembayaran telah habis. Silakan buat pesanan baru.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="w-full py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Kembali ke Produk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">Menunggu Pembayaran</h1>
          <p className="text-xs text-slate-500">Order ID: {orderIds[0]}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Countdown Timer */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Waktu Pembayaran</span>
            </div>
            <span className="text-xs opacity-90">Selesaikan sebelum expired</span>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-1">{formatTime(timeLeft)}</div>
            <div className="text-sm opacity-90">/ 15:00</div>
          </div>
          {timeLeft < 300 && (
            <div className="mt-4 p-3 bg-white/20 rounded-lg text-sm text-center">
              ⚠️ Segera selesaikan pembayaran Anda
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Scan QRIS</h2>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
              QRIS
            </div>
          </div>

          {/* QR Code Display */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 mb-4">
            <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
              {qrCode ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {/* In production, use QR code library */}
                    <div className="w-64 h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center text-white text-xs p-4 break-all">
                      {qrCode.substring(0, 100)}...
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Scan dengan aplikasi e-wallet atau mobile banking
                  </p>
                </div>
              ) : (
                <Loader2 className="w-12 h-12 animate-spin text-slate-400" />
              )}
            </div>
          </div>

          {/* Supported Payment Methods */}
          <div className="mb-4">
            <p className="text-xs text-slate-600 font-semibold mb-2">Bisa dibayar dengan:</p>
            <div className="flex flex-wrap gap-2">
              {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'BCA Mobile', 'BRI Mobile'].map((app) => (
                <div key={app} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                  {app}
                </div>
              ))}
            </div>
          </div>

          {/* Copy QR Code */}
          <button
            onClick={copyQRCode}
            className="w-full py-2 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-sm text-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Salin Kode QR
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-900">Cara Pembayaran</h2>
            </div>
            {showInstructions ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showInstructions && (
            <div className="px-5 pb-5 space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-600">
                  1
                </div>
                <p className="text-sm text-slate-700">
                  Buka aplikasi e-wallet atau mobile banking Anda
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-600">
                  2
                </div>
                <p className="text-sm text-slate-700">
                  Pilih menu <strong>Scan QR</strong> atau <strong>QRIS</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-600">
                  3
                </div>
                <p className="text-sm text-slate-700">
                  Arahkan kamera ke kode QR di atas
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-600">
                  4
                </div>
                <p className="text-sm text-slate-700">
                  Konfirmasi pembayaran sebesar <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-600">
                  5
                </div>
                <p className="text-sm text-slate-700">
                  Tunggu notifikasi pembayaran berhasil
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <button
            onClick={() => setShowOrderDetails(!showOrderDetails)}
            className="w-full p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Ringkasan Pesanan</h2>
                <p className="text-xs text-slate-500">{orders.length} pesanan</p>
              </div>
            </div>
            {showOrderDetails ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showOrderDetails && orders.length > 0 && (
            <div className="px-5 pb-5 space-y-4">
              {orders.map((order, idx) => (
                <div key={idx} className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">
                    Order #{idx + 1}: {order.id}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {order.supplierName}
                  </p>
                  {order.items?.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">
                        {item.commodity} ({item.qty} kg)
                      </span>
                      <span className="font-semibold">
                        Rp {(Number(item.price) * Number(item.qty)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">Rp {(totalAmount - 2000).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Biaya Layanan</span>
                  <span className="font-semibold">Rp 2.000</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total Pembayaran</span>
                  <span className="text-xl font-bold text-emerald-600">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Menunggu Pembayaran</p>
              <p className="text-xs text-blue-700 mt-1">
                Halaman ini akan otomatis update setelah pembayaran berhasil
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
