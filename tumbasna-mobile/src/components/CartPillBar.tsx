import React from 'react';
import { IonIcon } from '@ionic/react';
import { cart } from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './CartPillBar.css';

interface CartPillBarProps {
  onNavigateToCart: () => void;
}

const CartPillBar: React.FC<CartPillBarProps> = ({ onNavigateToCart }) => {
  const { cart: cartItems } = useApp();

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <button className="cart-fab-button" onClick={onNavigateToCart} aria-label="Lihat Keranjang">
      <IonIcon icon={cart} className="cart-fab-icon" />
      <span className="cart-fab-badge">{totalItems}</span>
    </button>
  );
};

export default CartPillBar;
