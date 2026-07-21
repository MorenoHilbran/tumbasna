import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiGet, apiPost, apiPatch, checkApiHealth } from '../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';

// â”€â”€ Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Fallback produk mock (dipakai jika API offline) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-1', name: 'Cabai Rawit Merah Super', price: 48000, stock: 150,
    supplierName: 'Tani Makmur Jaya', supplierLocation: 'Magelang, Jawa Tengah',
    supplierRating: 4.8, image: '/image/produk/cabaimerah.png',
    description: 'Cabai rawit merah segar langsung dipetik dari kebun lereng gunung Merbabu.',
    shippingEstimate: '1-2 Hari', category: 'Cabai',
    priceHistory: [
      { month: 'Jan', price: 42000 }, { month: 'Feb', price: 45000 },
      { month: 'Mar', price: 55000 }, { month: 'Apr', price: 50000 },
      { month: 'Mei', price: 48000 }, { month: 'Jun', price: 46000 },
    ],
  },
  {
    id: 'prod-2', name: 'Bawang Merah Brebes Pilihan', price: 32000, stock: 500,
    supplierName: 'Koperasi Tani Brebes', supplierLocation: 'Brebes, Jawa Tengah',
    supplierRating: 4.9, image: '/image/produk/bawangmerah.png',
    description: 'Bawang merah Brebes ukuran sedang-besar. Kering jemur sempurna.',
    shippingEstimate: '2-3 Hari', category: 'Bawang',
    priceHistory: [
      { month: 'Jan', price: 28000 }, { month: 'Feb', price: 30000 },
      { month: 'Mar', price: 35000 }, { month: 'Apr', price: 34000 },
      { month: 'Mei', price: 32000 }, { month: 'Jun', price: 31000 },
    ],
  },
  {
    id: 'prod-3', name: 'Bawang Putih Kating', price: 38000, stock: 250,
    supplierName: 'Grosir Bumbu Nusantara', supplierLocation: 'Semarang, Jawa Tengah',
    supplierRating: 4.7, image: '/image/produk/bawangputih.png',
    description: 'Bawang putih jenis Kating asli dengan aroma dan rasa yang kuat.',
    shippingEstimate: '1-2 Hari', category: 'Bawang',
    priceHistory: [
      { month: 'Jan', price: 34000 }, { month: 'Feb', price: 35000 },
      { month: 'Mar', price: 36000 }, { month: 'Apr', price: 37000 },
      { month: 'Mei', price: 37500 }, { month: 'Jun', price: 38000 },
    ],
  },
  {
    id: 'prod-4', name: 'Beras Cianjur Pandan Wangi', price: 16500, stock: 1000,
    supplierName: 'Rice Mill Subur Sentosa', supplierLocation: 'Cianjur, Jawa Barat',
    supplierRating: 4.9, image: '/image/produk/beras.png',
    description: 'Beras Pandan Wangi asli Cianjur tanpa pemutih.',
    shippingEstimate: '2-4 Hari', category: 'Beras',
    priceHistory: [
      { month: 'Jan', price: 15000 }, { month: 'Feb', price: 15500 },
      { month: 'Mar', price: 17000 }, { month: 'Apr', price: 16800 },
      { month: 'Mei', price: 16500 }, { month: 'Jun', price: 16200 },
    ],
  },
  {
    id: 'prod-5', name: 'Jagung Manis Madu', price: 12000, stock: 300,
    supplierName: 'Agro Jago', supplierLocation: 'Grobogan, Jawa Tengah',
    supplierRating: 4.6, image: '/image/produk/jagung.png',
    description: 'Jagung manis segar berkualitas dari hasil panen lokal.',
    shippingEstimate: '1-3 Hari', category: 'Sayuran',
    priceHistory: [
      { month: 'Jan', price: 11000 }, { month: 'Feb', price: 11500 },
      { month: 'Mar', price: 13000 }, { month: 'Apr', price: 12500 },
      { month: 'Mei', price: 12000 }, { month: 'Jun', price: 12000 },
    ],
  },
  {
    id: 'prod-6', name: 'Jahe Gajah Segar', price: 24000, stock: 400,
    supplierName: 'Rempah Jaya', supplierLocation: 'Karanganyar, Jawa Tengah',
    supplierRating: 4.8, image: '/image/produk/jahe.png',
    description: 'Jahe gajah berukuran besar dengan kualitas terbaik.',
    shippingEstimate: '2-3 Hari', category: 'Rempah',
    priceHistory: [
      { month: 'Jan', price: 21000 }, { month: 'Feb', price: 22000 },
      { month: 'Mar', price: 25000 }, { month: 'Apr', price: 24500 },
      { month: 'Mei', price: 24000 }, { month: 'Jun', price: 24000 },
    ],
  },
];

const INITIAL_CHATS: ChatThread[] = [
  {
    supplierName: 'Tumbasna AI Pintar',
    lastMessage: 'Halo! Saya asisten AI Tumbasna. Tanyakan apa saja tentang pasar komoditas.',
    lastTime: '08:00', unreadCount: 0,
    messages: [{ id: 'm-ai-1', sender: 'supplier', text: 'Halo! Saya asisten AI Tumbasna. Saya dapat membantu menganalisis harga pasar atau mencarikan supplier terbaik. Apa yang ingin Anda tanyakan?', timestamp: '08:00', status: 'read' }],
  },
];

// â”€â”€ Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isApiOnline, setIsApiOnline] = useState(true);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tumbasna_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('tumbasna_cart');
    if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    return [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('tumbasna_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  // â”€â”€ Persist user & cart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (user) localStorage.setItem('tumbasna_user', JSON.stringify(user));
    else localStorage.removeItem('tumbasna_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tumbasna_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('tumbasna_chats', JSON.stringify(chats));
  }, [chats]);

  // â”€â”€ Fetch supplier nyata dari DB dan merge ke daftar chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const fetchSuppliers = async () => {
      const result = await apiGet('/api/chat/suppliers', { timeout: 5000, retry: 1 });
      if (result.success && result.data?.length) {
        setChats(prev => {
          const existingNames = new Set(prev.map(c => c.supplierName));
          const newThreads: ChatThread[] = result.data
            .filter((s: any) => !existingNames.has(s.name))
            .map((s: any) => ({
              supplierName: s.name,
              supplierPhone: s.phone,
              lastMessage: s.activeProducts[0]
                ? `Menjual: ${s.activeProducts[0].commodity} ? Rp${s.activeProducts[0].price.toLocaleString('id-ID')}/kg`
                : 'Supplier terdaftar via WhatsApp',
              lastTime: '',
              unreadCount: 0,
              messages: [{
                id: `intro-${s.id}`,
                sender: 'supplier' as const,
                text: `Halo! Saya ${s.name} dari ${s.location}. ${s.activeProducts.length > 0 ? `Saat ini saya menjual: ${s.activeProducts.map((p: any) => `${p.commodity} (${p.qty}kg @ Rp${p.price.toLocaleString('id-ID')})`).join(', ')}.` : ''} Ada yang bisa saya bantu?`,
                timestamp: '',
                status: 'read' as const,
              }],
            }));
          return [...prev, ...newThreads];
        });
      }
    };
    fetchSuppliers();
  }, []);

  // â”€â”€ Fetch products dari dashboard API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const refreshProducts = async () => {
    try {
      let queryParams = '';
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 3000,
              maximumAge: 300000
            });
          });
          queryParams = `?lat=${position.coords.latitude}&lng=${position.coords.longitude}&maxDistance=100`;
        } catch (geoErr) {
          console.warn('[refreshProducts] Geolocation error:', geoErr);
        }
      }
      
      const result = await apiGet(`/api/products${queryParams}`, { timeout: 6000, retry: 1 });
      if (result.success && result.data?.length > 0) {
        setProducts(result.data);
        setIsApiOnline(true);
      } else {
        console.warn('[refreshProducts] No products from API, using fallback');
        setIsApiOnline(false);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to refresh products:', err);
      setIsApiOnline(false);
    }
  };



  useEffect(() => {
    refreshProducts();
  }, []);

  // â”€â”€ Fetch orders dari Supabase via API (saat user login) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const refreshOrders = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders?userId=${user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setOrders(json.data);
      }
    } catch {
      console.warn('[AppContext] Gagal fetch orders dari API.');
    }
  };

  // â”€â”€ Fetch profile terbaru dari Supabase (sinkronisasi multi-device) â”€â”€â”€â”€â”€â”€
  const refreshProfile = async () => {
    if (!user?.id) return;
    const result = await apiGet(`/api/auth/profile?userId=${user.id}`, { timeout: 5000 });
    if (result.success && result.data) {
      const d = result.data;
      setUser(prev => prev ? {
        ...prev,
        ownerName: d.name || prev.ownerName,
        businessName: d.businessName || prev.businessName,
        email: d.email || prev.email,
        address: d.address || prev.address,
        businessType: d.businessType || prev.businessType,
        bankName: d.bankName || prev.bankName,
        bankAccount: d.bankAccount || prev.bankAccount,
        balance: d.balance ?? prev.balance,
        activeOrdersCount: d.activeOrdersCount ?? prev.activeOrdersCount,
        purchasesThisMonth: d.purchasesThisMonth ?? prev.purchasesThisMonth,
      } : null);
    }
  };



  useEffect(() => {
    refreshOrders();
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const login = async (phone: string): Promise<boolean> => {
    if (!phone) return false;
    
    const result = await apiPost('/api/auth/login', { phone }, { timeout: 10000, retry: 2 });
    
    if (result.success && result.data) {
      const d = result.data;
      setUser({
        id: d.id,
        ownerName: d.name || d.phoneNumber,
        businessName: d.businessName || '',
        phone: d.phoneNumber,
        email: d.email || '',
        address: d.address || '',
        businessType: d.businessType || '',
        bankName: d.bankName || '',
        bankAccount: d.bankAccount || '',
        balance: d.balance ?? 0,
        purchasesThisMonth: 0,
        activeOrdersCount: d.activeOrdersCount ?? 0,
      });
      setIsApiOnline(true);
      return true;
    }
    
    console.warn('[AppContext] API login failed, using mock login');
    setUser({
      id: `mock-${Date.now()}`,
      ownerName: 'Pembeli Demo',
      businessName: 'Toko Sembako Demo',
      phone: phone,
      email: 'demo@tumbasna.com',
      address: 'Jl. Pasar Tradisional No 1',
      businessType: 'Warung Sembako',
      bankName: 'BCA',
      bankAccount: '1234567890',
      balance: 5000000,
      purchasesThisMonth: 0,
      activeOrdersCount: 0,
    });
    setIsApiOnline(false);
    return true;
  };


  const register = async (
    userData: Omit<User, 'balance' | 'purchasesThisMonth' | 'activeOrdersCount'>
  ): Promise<boolean> => {
    const result = await apiPost('/api/auth/register', {
      ownerName: userData.ownerName,
      businessName: userData.businessName,
      phone: userData.phone,
      email: userData.email,
      address: userData.address,
      businessType: userData.businessType,
      bankName: userData.bankName,
      bankAccount: userData.bankAccount,
    }, { timeout: 10000, retry: 2 });

    if (result.success && result.data) {
      const d = result.data;
      setUser({
        id: d.id,
        ownerName: userData.ownerName,
        businessName: userData.businessName,
        phone: d.phoneNumber,
        email: d.email || userData.email,
        address: userData.address,
        businessType: userData.businessType,
        bankName: userData.bankName,
        bankAccount: userData.bankAccount,
        balance: 0,
        purchasesThisMonth: 0,
        activeOrdersCount: 0,
      });
      setOrders([]);
      setCart([]);
      setIsApiOnline(true);
      return true;
    }

    console.warn('[AppContext] API register failed, using mock register');
    setUser({
      id: `mock-${Date.now()}`,
      ownerName: userData.ownerName,
      businessName: userData.businessName,
      phone: userData.phone,
      email: userData.email,
      address: userData.address,
      businessType: userData.businessType,
      bankName: userData.bankName,
      bankAccount: userData.bankAccount,
      balance: 0,
      purchasesThisMonth: 0,
      activeOrdersCount: 0,
    });
    setOrders([]);
    setCart([]);
    setIsApiOnline(false);
    return true;
  };


  const logout = () => {
    // Bersihkan semua data sesi dari localStorage agar tidak ada sisa data lama
    localStorage.removeItem('tumbasna_user');
    localStorage.removeItem('tumbasna_cart');
    localStorage.removeItem('tumbasna_chats');
    setUser(null);
    setOrders([]);
    setCart([]);
    setChats([]);
  };

  // â”€â”€ Cart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => setCart((p) => p.filter((i) => i.product.id !== productId));

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart((p) => p.map((i) => i.product.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  // â”€â”€ Checkout â€” simpan order ke Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const checkout = async (items: CartItem[], courier: string, 
    shippingCost: number, 
    buyerCoords?: [number, number], 
    supplierCoords?: [number, number],
    buyerAddress?: string,
    supplierAddress?: string, paymentMethod?: string): Promise<string> => {
    if (items.length === 0) return '';
    const orderId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemsTotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    const totalAmount = itemsTotal + shippingCost + 2000;
    const supplierName = items[0].product.supplierName;
    const supplierLocation = items[0].product.supplierLocation;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const trackingTimeline: TrackingStep[] = [
      { title: 'Menunggu Pembayaran', description: 'Silakan lakukan pembayaran menggunakan QRIS.', time: timeStr, done: true },
      { title: 'Pembayaran Dikonfirmasi', description: 'Menunggu konfirmasi pembayaran dari sistem.', time: 'Belum', done: false },
      { title: 'Konfirmasi Supplier', description: 'Menunggu konfirmasi ketersediaan barang oleh supplier.', time: 'Belum', done: false },
      { title: 'Pengiriman & Tracking', description: 'Menunggu penjemputan logistik.', time: 'Belum', done: false },
    ];

    const notesObj = { buyerCoords, supplierCoords, buyerAddress, supplierAddress };
    const notesStr = JSON.stringify(notesObj);

    const newOrder: Order = {
      id: orderId, items: [...items], supplierName, supplierLocation, courier,
      shippingCost, totalAmount,
      date: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Menunggu Pembayaran',
      paymentQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=tumbasna-qris-${orderId}`,
      fundsReleased: false, paymentCountdown: 300, trackingTimeline,
      notes: notesStr,
      paymentMethod,
    };

    // Simpan ke Supabase dengan timeout
    await apiPost('/api/orders', {
      id: orderId,
      buyerUserId: user?.id || null,
      supplierName, supplierLocation, courier,
      shippingCost, totalAmount,
      trackingTimeline,
      paymentQrCode: newOrder.paymentQrCode,
      notes: notesStr,
      items: items.map((i) => ({
        productEntryId: i.product.id.startsWith('prod-') ? null : i.product.id,
        commodity: i.product.category || i.product.name,
        price: i.product.price,
        qty: i.quantity,
        supplierName: i.product.supplierName,
      })),
    }, { timeout: 8000, retry: 1 });

    setOrders((prev) => [newOrder, ...prev]); items.forEach(item => removeFromCart(item.product.id));
    if (user) setUser({ ...user, activeOrdersCount: user.activeOrdersCount + 1 });
    return orderId;
  };

  // â”€â”€ Pay Order â€” update status ke Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const payOrder = async (orderId: string) => {
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedTimeline = [...order.trackingTimeline];
        updatedTimeline[1] = { title: 'Pembayaran Dikonfirmasi', description: `Pembayaran QRIS berhasil. Dana Rp${order.totalAmount.toLocaleString('id-ID')} ditahan Tumbasna.`, time: currentTime, done: true };
        updatedTimeline[2] = { title: 'Pesanan Diproses Supplier', description: `${order.supplierName} sedang memilah komoditas terbaik.`, time: 'Segera', done: false };
        return { ...order, status: 'Diproses', trackingTimeline: updatedTimeline };
      })
    );
    const order = orders.find((o) => o.id === orderId);
    const updatedTimeline = order ? [...order.trackingTimeline] : [];
    await apiPatch(`/api/orders/${orderId}`, { status: 'DIPROSES', trackingTimeline: updatedTimeline }, { timeout: 5000 });
    await refreshProducts();
  };

  // â”€â”€ Confirm Received â€” selesaikan order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const confirmOrderReceived = async (orderId: string) => {
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedTimeline = order.trackingTimeline.map((s) => ({ ...s, done: true }));
        updatedTimeline.push({ title: 'Selesai & Dana Dicairkan', description: `Barang diterima. Dana Rp${order.totalAmount.toLocaleString('id-ID')} dikirim ke ${order.supplierName}.`, time: currentTime, done: true });
        return { ...order, status: 'Selesai', fundsReleased: true, trackingTimeline: updatedTimeline };
      })
    );
    if (user) {
      const order = orders.find((o) => o.id === orderId);
      const cost = order?.totalAmount ?? 0;
      setUser((prev) => prev ? { ...prev, purchasesThisMonth: prev.purchasesThisMonth + cost, activeOrdersCount: Math.max(0, prev.activeOrdersCount - 1) } : null);
    }
    await apiPatch(`/api/orders/${orderId}`, { status: 'SELESAI', fundsReleased: true }, { timeout: 5000 });
  };

  // â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendMessage = (supplierName: string, text: string, supplierPhone?: string) => {
    const newMessage: ChatMessage = { id: `msg-${Date.now()}`, sender: 'buyer', text, timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: 'sent' };
    setChats((prev) => {
      const exists = prev.some((t) => t.supplierName === supplierName);
      if (exists) return prev.map((t) => t.supplierName === supplierName ? { ...t, supplierPhone: t.supplierPhone || supplierPhone, lastMessage: text, lastTime: newMessage.timestamp, messages: [...t.messages, newMessage] } : t);
      return [...prev, { supplierName, supplierPhone, lastMessage: text, lastTime: newMessage.timestamp, unreadCount: 0, messages: [newMessage] }];
    });

    if (supplierName === 'Tumbasna AI Pintar') {
      (async () => {
        try {
          const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
          const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
          
          // Mempersiapkan data dari state (database lokal/API) untuk AI
          const productContext = products.map(p => 
            `- ${p.name} (Harga: Rp${p.price.toLocaleString('id-ID')}, Stok: ${p.stock}, Supplier: ${p.supplierName} - ${p.supplierLocation})`
          ).join('\n');

          const prompt = `Anda adalah "Tumbasna AI Pintar", perwakilan mitra bisnis profesional resmi di aplikasi Tumbasna (pasar komoditas untuk warung/toko).
Jawablah dengan gaya bahasa pebisnis yang profesional, hangat, sopan, efisien, dan berorientasi pada perdagangan komoditas. Hindari gaya bicara robotik atau bahasa asisten AI umum (seperti "Sebagai AI...", "Saya adalah model...", "Tentu, saya bisa bantu..."). Bicaralah selayaknya rekan bisnis atau pengelola pasar yang berpengalaman. Gunakan sapaan hangat seperti "Juragan" untuk pembeli. Gunakan format cetak tebal dengan tanda bintang tunggal seperti *Kata* untuk menyoroti hal penting seperti nama supplier, harga, dan nama komoditas (seperti gaya format WhatsApp). Hindari tanda bintang ganda (**) atau format markdown lain.

Berikut adalah data produk terkini yang ada di sistem database Tumbasna:
${productContext}

Tugas Anda:
1. Jika pengguna bertanya tentang harga, ketersediaan, atau mencari barang, gunakan data produk di atas untuk merekomendasikannya.
2. Jika barang tidak ada di data, beritahu dengan sopan bahwa barang saat ini belum tersedia di Tumbasna.

Pertanyaan pengguna: ${text}`;
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const reply: ChatMessage = { id: `msg-${Date.now() + 1}`, sender: 'supplier', text: responseText, timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: 'read' };
          setChats((prev) => prev.map((t) => t.supplierName === supplierName ? { ...t, lastMessage: responseText, lastTime: reply.timestamp, unreadCount: t.unreadCount + 1, messages: [...t.messages, reply] } : t));
        } catch (error: any) {
          console.warn("Gemini AI error, attempting fallback to Groq...", error);
          try {
            const productContext = products.map(p => 
              `- ${p.name} (Harga: Rp${p.price.toLocaleString('id-ID')}, Stok: ${p.stock}, Supplier: ${p.supplierName} - ${p.supplierLocation})`
            ).join('\n');

            const prompt = `Anda adalah "Tumbasna AI Pintar", perwakilan mitra bisnis profesional resmi di aplikasi Tumbasna (pasar komoditas untuk warung/toko).
Jawablah dengan gaya bahasa pebisnis yang profesional, hangat, sopan, efisien, dan berorientasi pada perdagangan komoditas. Hindari gaya bicara robotik atau bahasa asisten AI umum (seperti "Sebagai AI...", "Saya adalah model...", "Tentu, saya bisa bantu..."). Bicaralah selayaknya rekan bisnis atau pengelola pasar yang berpengalaman. Gunakan sapaan hangat seperti "Juragan" untuk pembeli. Gunakan format cetak tebal dengan tanda bintang tunggal seperti *Kata* untuk menyoroti hal penting seperti nama supplier, harga, dan nama komoditas (seperti gaya format WhatsApp). Hindari tanda bintang ganda (**) atau format markdown lain.

Berikut adalah data produk terkini yang ada di sistem database Tumbasna:
${productContext}

Tugas Anda:
1. Jika pengguna bertanya tentang harga, ketersediaan, atau mencari barang, gunakan data produk di atas untuk merekomendasikannya.
2. Jika barang tidak ada di data, beritahu dengan sopan bahwa barang saat ini belum tersedia di Tumbasna.

Pertanyaan pengguna: ${text}`;

            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`
              },
              body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2
              })
            });

            if (!groqRes.ok) throw new Error(`Groq API returned status ${groqRes.status}`);
            const groqData = await groqRes.json();
            const responseText = groqData.choices[0].message.content;

            const reply: ChatMessage = { id: `msg-${Date.now() + 1}`, sender: 'supplier', text: responseText, timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: 'read' };
            setChats((prev) => prev.map((t) => t.supplierName === supplierName ? { ...t, lastMessage: responseText, lastTime: reply.timestamp, unreadCount: t.unreadCount + 1, messages: [...t.messages, reply] } : t));
          } catch (groqError: any) {
            console.error("Groq fallback also failed:", groqError);
            let fallbackMsg = "Maaf, koneksi ke asisten AI sedang terganggu.";
            if (error.message && error.message.includes("503")) {
              fallbackMsg = "Maaf, asisten AI saat ini sedang menerima banyak permintaan (sibuk). Silakan coba lagi dalam beberapa saat ya.";
            }
            const reply: ChatMessage = { id: `msg-${Date.now() + 1}`, sender: 'supplier', text: fallbackMsg, timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: 'read' };
            setChats((prev) => prev.map((t) => t.supplierName === supplierName ? { ...t, lastMessage: fallbackMsg, lastTime: reply.timestamp, unreadCount: t.unreadCount + 1, messages: [...t.messages, reply] } : t));
          }
        }
      })();
    } else {
      // â”€â”€ Relay pesan ke supplier nyata via WA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      (async () => {
        try {
          const thread = chats.find(c => c.supplierName === supplierName);
          let finalSupplierPhone = supplierPhone || thread?.supplierPhone || '';
          if (!finalSupplierPhone) {
            const matchedProduct = products.find(p => p.supplierName === supplierName);
            if (matchedProduct?.supplierPhone) {
              finalSupplierPhone = matchedProduct.supplierPhone;
            }
          }
          const buyerPhone = user?.phone || '';
          console.log('[sendMessage] Relay WA debug:', {
            supplierName,
            supplierPhone,
            threadSupplierPhone: thread?.supplierPhone,
            finalSupplierPhone,
            buyerPhone,
            text
          });
          if (finalSupplierPhone && buyerPhone) {
            const res = await fetch(`${API_BASE}/api/chat/suppliers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ buyerPhone, supplierPhone: finalSupplierPhone, message: text }),
            });
            console.log('[sendMessage] Relay WA response status:', res.status);
            const resJson = await res.json();
            console.log('[sendMessage] Relay WA response body:', resJson);
            
            // Update status pesan jadi delivered setelah berhasil dikirim ke WA
            setChats((prev) => prev.map((t) => {
              if (t.supplierName !== supplierName) return t;
              const msgs = [...t.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.sender === 'buyer') msgs[lastIdx] = { ...msgs[lastIdx], status: 'delivered' };
              return { ...t, messages: msgs };
            }));
          } else {
            console.warn('[sendMessage] Skip relay WA because phone is missing:', { finalSupplierPhone, buyerPhone });
          }
        } catch (err: any) {
          console.error('[sendMessage] Gagal relay ke WA supplier:', err.message);
        }
      })();
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'User not logged in' };

    const result = await apiPatch(`/api/auth/profile/${user.id}`, {
      name: userData.ownerName,
      businessName: userData.businessName,
      email: userData.email,
      address: userData.address,
      businessType: userData.businessType,
      bankName: userData.bankName,
      bankAccount: userData.bankAccount,
    }, { timeout: 8000, retry: 1 });

    if (result.success) {
      setUser(prev => prev ? { ...prev, ...userData } : null);
      return { success: true };
    }

    return { success: false, error: result.error || 'Failed to update profile' };
  };


  return (
    <AppContext.Provider value={{ user, products, cart, orders, chats, isApiOnline, login, register, logout, addToCart, removeFromCart, updateCartQuantity, clearCart, checkout, payOrder, confirmOrderReceived, sendMessage, refreshOrders, refreshProducts, updateProfile }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};





