import React from 'react';
import { useApp } from '../context/AppContext';
import './CartPillBar.css';

interface CartPillBarProps {
  onNavigateToCart: () => void;
}

const CartPillBar: React.FC<CartPillBarProps> = ({ onNavigateToCart }) => {
  const { cart } = useApp();

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Get the latest product added to cart
  const latestProduct = cart.length > 0 ? cart[cart.length - 1].product : null;

  if (cart.length === 0) return null;

  return (
    <div className="cart-pill-bar" onClick={onNavigateToCart}>
      <div className="cart-pill-content">
        {/* Latest Product Image */}
        {latestProduct && (
          <div className="cart-pill-image">
            <img src={latestProduct.image} alt={latestProduct.name} />
          </div>
        )}
        
        {/* Text Content */}
        <div className="cart-pill-text">
          <span className="cart-pill-title">Lihat Keranjang</span>
          <span className="cart-pill-items">{totalItems} barang</span>
        </div>
      </div>
      
      {/* Price on the right */}
      <div className="cart-pill-price">
        Rp {totalPrice.toLocaleString('id-ID')}
      </div>
    </div>
  );
};

export default CartPillBar;
