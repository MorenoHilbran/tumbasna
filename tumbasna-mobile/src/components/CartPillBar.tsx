import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import './CartPillBar.css';

interface CartPillBarProps {
  onNavigateToCart: () => void;
}

const CartPillBar: React.FC<CartPillBarProps> = ({ onNavigateToCart }) => {
  const { cart: cartItems } = useApp();
  const [animatePop, setAnimatePop] = useState(false);

  // Safely calculate totalItems and totalPrice handling both { product: Product, quantity } & flat cart items
  const totalItems = cartItems.reduce((acc, item) => {
    const qty = Number(item.quantity ?? 1);
    return acc + (isNaN(qty) ? 0 : qty);
  }, 0);

  const totalPrice = cartItems.reduce((acc, item) => {
    const price = Number(item.product?.price ?? (item as any).price ?? 0);
    const qty = Number(item.quantity ?? 1);
    const itemTotal = isNaN(price * qty) ? 0 : price * qty;
    return acc + itemTotal;
  }, 0);

  // Extract last added product image safely
  const lastItem = cartItems[cartItems.length - 1];
  const rawImage = lastItem?.product?.image || (lastItem as any)?.image || '';
  const thumbImage = rawImage ? rawImage : '/logotum.png';

  useEffect(() => {
    if (totalItems > 0) {
      setAnimatePop(true);
      const timer = setTimeout(() => setAnimatePop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalItems, totalPrice]);

  if (totalItems === 0) return null;

  return (
    <div className="cart-pill-wrapper">
      <button
        className={`cart-pill-button ${animatePop ? 'pop-bounce' : ''}`}
        onClick={onNavigateToCart}
        aria-label="Lihat Keranjang"
      >
        <div className="cart-pill-left">
          <div className="cart-pill-thumb">
            <img
              src={thumbImage}
              alt="Produk"
              onError={(e) => {
                e.currentTarget.src = '/logotum.png';
              }}
            />
          </div>
          <div className="cart-pill-info">
            <span className="cart-pill-title">Lihat Keranjang</span>
            <span className="cart-pill-subtitle">{totalItems} Barang</span>
          </div>
        </div>
        <div className="cart-pill-right">
          <span className="cart-pill-price">Rp {totalPrice.toLocaleString('id-ID')}</span>
        </div>
      </button>
    </div>
  );
};

export default CartPillBar;
