import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiGet, apiPost, apiPatch, checkApiHealth } from '../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';

// ── Interfaces ──────────────────────────────────────────────────────────────────────────────────
export interface Product {
  id: string; name: string; price: number; stock: number;
  supplierName: string; supplierLocation: string; supplierRating: number;
  image: string; description: string; shippingEstimate: string;
  category: string; priceHistory: { month: string; price: number }[];
  lat?: number | null;
  lng?: number | null;
  supplierPhone?: string;
}
export interface CartItem { product: Product; quantity: number; }
export interface TrackingStep { title: string; description: string; time: string; done: boolean; }
export interface Order {
  id: string; items: CartItem[]; supplierName: string; supplierLocation: string;
  courier: string; shippingCost: number; totalAmount: number; date: string;
  status: 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  paymentQrCode: string; trackingTimeline: TrackingStep[];
  paymentCountdown: number; fundsReleased: boolean; notes?: string; paymentMethod?: string;
}
export interface ChatMessage {
  id: string; sender: 'buyer' | 'supplier'; text: string;
  timestamp: string; status?: 'sent' | 'delivered' | 'read';
}
export interface ChatThread {
  supplierName: string; lastMessage: string; lastTime: string;
  unreadCount: number; messages: ChatMessage[];
  supplierPhone?: string;
}
export interface User {
  id?: string; ownerName: string; businessName: string; phone: string;
  email: string; address: string; businessType: string;
  bankName: string; bankAccount: string; balance: number;
  purchasesThisMonth: number; activeOrdersCount: number;
}

interface AppContextType {
  user: User | null; products: Product[]; cart: CartItem[];
  orders: Order[]; chats: ChatThread[];
  isApiOnline: boolean;
  login: (phone: string) => Promise<boolean>;
  register: (userData: Omit<User, 'balance' | 'purchasesThisMonth' | 'activeOrdersCount'>) => Promise<boolean>;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (items: CartItem[], courier: string, 
    shippingCost: number, 
    buyerCoords?: [number, number], 
    supplierCoords?: [number, number],
    buyerAddress?: string,
    supplierAddress?: string, paymentMethod?: string) => Promise<string>;
  payOrder: (orderId: string) => Promise<void>;
  confirmOrderReceived: (orderId: string) => Promise<void>;
  sendMessage: (supplierName: string, text: string, supplierPhone?: string) => void;
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
