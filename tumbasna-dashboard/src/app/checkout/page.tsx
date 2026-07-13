'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Package,
} from 'lucide-react';
import { calculateShippingCost, formatShippingCost, getDeliveryEstimate } from '@/lib/shipping';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  supplierId: string;
  supplierName: string;
  supplierCity: string;
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Pagi', time: '05.00 - 09.00', icon: '🌅' },
  { id: 'midday', label: 'Siang', time: '10.00 - 13.00', icon: '☀️' },
  { id: 'afternoon', label: 'Sore', time: '14.00 - 18.00', icon: '🌤️' },
  { id: 'evening', label: 'Malam', time: '19.00 - 21.00', icon: '🌙' },
];

const PAYMENT_METHODS = [
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Scan & bayar dengan e-wallet atau mobile banking',
    icon: '📱',
    fee: 0,
    recommended: true,
  },
  {
    id: 'va_bca',
    name: 'Virtual Account BCA',
    description: 'Transfer via ATM/Mobile Banking BCA',
    icon: '🏦',
    fee: 4000,
  },
  {
    id: 'va_bri',
    name: 'Virtual Account BRI',
    description: 'Transfer via ATM/Mobile Banking BRI',
    icon: '🏦',
    fee: 4000,
  },
  {
    id: 'va_mandiri',
    name: 'Virtual Account Mandiri',
    description: 'Transfer via ATM/Mobile Banking Mandiri',
    icon: '🏦',
    fee: 4000,
  },
  {
    id: 'cod',
    name: 'Bayar di Tempat (COD)',
    description: 'Bayar tunai saat barang sampai',
    icon: '💵',
    fee: 0,
    freeShipping: true,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Purwokerto');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  
  // Calculated values
  const [shippingCost, setShippingCost] = useState(0);
  const [adminFee, setAdminFee] = useState(0);

  useEffect(() => {
    // Load cart
    const cart = JSON.parse(localStorage.getItem('tumbasna_cart') || '[]');
    if (cart.length === 0) {
      router.push('/products');
      return;
    }
    setCartItems(cart);

    // Set default delivery date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  }, [router]);

  useEffect(() => {
    // Recalculate shipping when city or payment method changes
    if (cartItems.length > 0) {
      const itemsBySupplier = groupBySupplier(cartItems);
      const totalShipping = Object.entries(itemsBySupplier).reduce((sum, [supplierId, items]) => {
        const supplierCity = items[0].supplierCity || 'Banyumas';
        return sum + calculateShippingCost(supplierCity, city, paymentMethod);
      }, 0);
      
      setShippingCost(totalShipping);
      
      // Admin fee for VA
      const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
      setAdminFee(selectedMethod?.fee || 0);
    }
  }, [cartItems, city, paymentMethod]);

  const groupBySupplier = (items: CartItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.supplierId]) {
        acc[item.supplierId] = [];
      }
      acc[item.supplierId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = 2000;
  const total = subtotal + shippingCost + serviceFee + adminFee;

  const getDeliveryDates = () => {
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : 'Lusa',
        fullDate: date.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      });
    }
    return dates;
  };

  const handleSubmit = async () => {
    // Validation
    if (!deliveryDate || !deliveryTimeSlot || !address || !city || !phone) {
      alert('Mohon lengkapi semua data pengiriman');
      return;
    }

    // Prepare order data
    const orderData = {
      buyerUserId: localStorage.getItem('tumbasna_user_id') || '',
      buyerAddress: address,
      buyerPhone: phone,
      buyerCity: city,
      deliveryDate,
      deliveryTimeSlot,
      paymentMethod,
      cartItems: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        supplierCity: item.supplierCity,
      }))
    };

    try {
      const response = await fetch('/api/orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart
        localStorage.removeItem('tumbasna_cart');
        window.dispatchEvent(new Event('cartUpdated'));

        // Redirect to payment page
        const orderIds = result.data.summary.orderIds.join(',');
        router.push(`/payment?orders=${orderIds}&total=${total}`);
      } else {
        alert('Gagal membuat pesanan: ' + result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const deliveryDates = getDeliveryDates();
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Checkout</h1>
              <p className="text-xs text-slate-500">{cartItems.length} produk</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* 1. Delivery Date */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Tanggal Pengiriman</h2>
              <p className="text-xs text-slate-500">Pilih kapan barang dikirim</p>
            </div>
          </div>

          <div className="space-y-2">
            {deliveryDates.map((date) => (
              <label
                key={date.value}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryDate === date.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryDate"
                    value={date.value}
                    checked={deliveryDate === date.value}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{date.label}</p>
                    <p className="text-xs text-slate-500">{date.fullDate}</p>
                  </div>
                </div>
                {deliveryDate === date.value && (
                  <Check className="w-5 h-5 text-emerald-600" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 2. Cart Items */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Detail Pesanan</h2>
              <p className="text-xs text-slate-500">{cartItems.length} produk dari keranjang</p>
            </div>
          </div>

          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{item.supplierName}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">
                    {item.quantity} kg × Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Delivery Address */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Alamat Pengiriman</h2>
              <p className="text-xs text-slate-500">Lokasi pengiriman barang</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Alamat Lengkap
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kota/Kabupaten
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                >
                  <option value="Purwokerto">Purwokerto</option>
                  <option value="Banyumas">Banyumas</option>
                  <option value="Cilacap">Cilacap</option>
                  <option value="Purbalingga">Purbalingga</option>
                  <option value="Banjarnegara">Banjarnegara</option>
                  <option value="Kebumen">Kebumen</option>
                  <option value="Tegal">Tegal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Delivery Time Slot */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Waktu Pengiriman</h2>
              <p className="text-xs text-slate-500">Pilih rentang waktu pengiriman</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TIME_SLOTS.map((slot) => (
              <label
                key={slot.id}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryTimeSlot === slot.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="timeSlot"
                  value={slot.id}
                  checked={deliveryTimeSlot === slot.id}
                  onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">{slot.icon}</span>
                <p className="font-bold text-slate-900">{slot.label}</p>
                <p className="text-xs text-slate-500">{slot.time}</p>
              </label>
            ))}
          </div>

          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Waktu pengiriman disesuaikan dengan ketersediaan supplier
              </p>
            </div>
          </div>
        </div>

        {/* 5. Payment Method */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Metode Pembayaran</h2>
              <p className="text-xs text-slate-500">Pilih cara pembayaran</p>
            </div>
          </div>

          {/* QRIS (Default) */}
          <label
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all mb-3 ${
              paymentMethod === 'qris'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                value="qris"
                checked={paymentMethod === 'qris'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-5 h-5 text-emerald-600"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <p className="font-bold text-slate-900">QRIS</p>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold">
                    ⭐ DIREKOMENDASIKAN
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-10">
                  Scan & bayar dengan e-wallet atau mobile banking
                </p>
              </div>
            </div>
            {paymentMethod === 'qris' && (
              <Check className="w-5 h-5 text-emerald-600" />
            )}
          </label>

          {/* Other Methods (Collapsed) */}
          {!showPaymentOptions && (
            <button
              onClick={() => setShowPaymentOptions(true)}
              className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-sm font-semibold text-slate-600"
            >
              Lihat Metode Lainnya
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {showPaymentOptions && (
            <div className="space-y-2">
              {PAYMENT_METHODS.filter(m => m.id !== 'qris').map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-emerald-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{method.icon}</span>
                        <p className="font-bold text-sm text-slate-900">{method.name}</p>
                        {method.fee > 0 && (
                          <span className="text-xs text-slate-500">
                            (+Rp {method.fee.toLocaleString('id-ID')})
                          </span>
                        )}
                        {method.freeShipping && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                            GRATIS ONGKIR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 ml-9">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  {paymentMethod === method.id && (
                    <Check className="w-5 h-5 text-emerald-600" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 6. Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-900 mb-4">Ringkasan Pembayaran</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal Produk</span>
              <span className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Biaya Pengiriman</span>
              <span className="font-semibold">
                {shippingCost === 0 ? (
                  <span className="text-green-600">GRATIS</span>
                ) : (
                  `Rp ${shippingCost.toLocaleString('id-ID')}`
                )}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Biaya Layanan</span>
              <span className="font-semibold">Rp {serviceFee.toLocaleString('id-ID')}</span>
            </div>
            
            {adminFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Biaya Admin</span>
                <span className="font-semibold">Rp {adminFee.toLocaleString('id-ID')}</span>
              </div>
            )}
            
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Pembayaran</span>
                <span className="text-2xl font-bold text-emerald-600">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Total Pembayaran</p>
            <p className="text-xl font-bold text-slate-900">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!deliveryDate || !deliveryTimeSlot || !address || !phone}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
          >
            Lanjutkan Pembayaran
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
