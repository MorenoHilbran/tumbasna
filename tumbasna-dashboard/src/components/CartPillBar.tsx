'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

export default function CartPillBar() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadCart();
    
    // Listen for cart updates
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('tumbasna_cart') || '[]');
    setCartItems(cart);
    setIsVisible(cart.length > 0);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedCart);
    localStorage.setItem('tumbasna_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('tumbasna_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    if (updatedCart.length === 0) {
      setIsVisible(false);
      setIsExpanded(false);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 animate-in fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Pill Bar */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="max-w-2xl mx-auto">
          {/* Collapsed View */}
          {!isExpanded && (
            <div 
              onClick={() => setIsExpanded(true)}
              className="bg-emerald-600 rounded-full shadow-2xl px-5 py-4 flex items-center gap-4 text-white cursor-pointer hover:bg-emerald-700 transition-all animate-in slide-in-from-bottom"
            >
              {/* Product Thumbnails */}
              <div className="flex -space-x-3">
                {cartItems.slice(0, 3).map((item, idx) => (
                  <div 
                    key={idx}
                    className="w-12 h-12 rounded-full bg-white border-2 border-emerald-600 overflow-hidden flex-shrink-0"
                  >
                    <Image 
                      src={item.image} 
                      alt={item.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    +{cartItems.length - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold opacity-90">
                  {totalItems} Barang
                </p>
                <p className="text-base font-bold">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Icon */}
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-bold hidden sm:inline">Lihat Keranjang</span>
              </div>
            </div>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
              {/* Header */}
              <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Keranjang Belanja</h3>
                  <p className="text-xs opacity-90">{totalItems} barang</p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-emerald-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {cartItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors"
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {item.supplierName}
                      </p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        Rp {item.price.toLocaleString('id-ID')}/kg
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      
                      <span className="w-8 text-center font-bold text-sm">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-600">Total</span>
                  <span className="text-xl font-bold text-slate-900">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Lanjut ke Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
