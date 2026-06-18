import React, { createContext, useContext, useState, useEffect } from 'react';

// Interfaces
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  supplierName: string;
  supplierLocation: string;
  supplierRating: number;
  image: string;
  description: string;
  shippingEstimate: string;
  category: string;
  priceHistory: { month: string; price: number }[]; // For AI price prediction
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TrackingStep {
  title: string;
  description: string;
  time: string;
  done: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  supplierName: string;
  supplierLocation: string;
  courier: string;
  shippingCost: number;
  totalAmount: number;
  date: string;
  status: 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  paymentQrCode: string;
  trackingTimeline: TrackingStep[];
  paymentCountdown: number; // in seconds
  fundsReleased: boolean;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'supplier';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatThread {
  supplierName: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface User {
  ownerName: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  bankName: string;
  bankAccount: string;
  balance: number;
  purchasesThisMonth: number;
  activeOrdersCount: number;
}

interface AppContextType {
  user: User | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  chats: ChatThread[];
  login: (phoneOrEmail: string) => Promise<boolean>;
  register: (userData: Omit<User, 'balance' | 'purchasesThisMonth' | 'activeOrdersCount'>) => Promise<boolean>;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (courier: string, shippingCost: number) => string; // returns orderId
  payOrder: (orderId: string) => void;
  confirmOrderReceived: (orderId: string) => void;
  sendMessage: (supplierName: string, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Cabai Rawit Merah Super',
    price: 48000,
    stock: 150,
    supplierName: 'Tani Makmur Jaya',
    supplierLocation: 'Magelang, Jawa Tengah',
    supplierRating: 4.8,
    image: '/image/produk/cabaimerah.png',
    description: 'Cabai rawit merah segar langsung dipetik dari kebun lereng gunung Merbabu. Tingkat kepedasan tinggi, kadar air rendah, sehingga tahan simpan hingga 7 hari di suhu ruangan. Sangat cocok untuk usaha rumah makan dan warung bakso.',
    shippingEstimate: '1-2 Hari',
    category: 'Cabai',
    priceHistory: [
      { month: 'Jan', price: 42000 },
      { month: 'Feb', price: 45000 },
      { month: 'Mar', price: 55000 },
      { month: 'Apr', price: 50000 },
      { month: 'Mei', price: 48000 },
      { month: 'Jun', price: 46000 }
    ]
  },
  {
    id: 'prod-2',
    name: 'Bawang Merah Brebes Pilihan',
    price: 32000,
    stock: 500,
    supplierName: 'Koperasi Tani Brebes',
    supplierLocation: 'Brebes, Jawa Tengah',
    supplierRating: 4.9,
    image: '/image/produk/bawangmerah.png',
    description: 'Bawang merah Brebes ukuran sedang-besar. Kering jemur matahari sempurna, aroma sangat kuat, renyah dan padat. Kadar susut rendah. Terbaik untuk bumbu dasar kuliner nusantara.',
    shippingEstimate: '2-3 Hari',
    category: 'Bawang',
    priceHistory: [
      { month: 'Jan', price: 28000 },
      { month: 'Feb', price: 30000 },
      { month: 'Mar', price: 35000 },
      { month: 'Apr', price: 34000 },
      { month: 'Mei', price: 32000 },
      { month: 'Jun', price: 31000 }
    ]
  },
  {
    id: 'prod-3',
    name: 'Bawang Putih Kating',
    price: 38000,
    stock: 250,
    supplierName: 'Grosir Bumbu Nusantara',
    supplierLocation: 'Semarang, Jawa Tengah',
    supplierRating: 4.7,
    image: '/image/produk/bawangputih.png',
    description: 'Bawang putih jenis Kating asli dengan aroma dan rasa yang kuat. Cocok untuk aneka bumbu dasar, awet disimpan lama. Siung besar-besar dan mudah dikupas.',
    shippingEstimate: '1-2 Hari',
    category: 'Bawang',
    priceHistory: [
      { month: 'Jan', price: 34000 },
      { month: 'Feb', price: 35000 },
      { month: 'Mar', price: 36000 },
      { month: 'Apr', price: 37000 },
      { month: 'Mei', price: 37500 },
      { month: 'Jun', price: 38000 }
    ]
  },
  {
    id: 'prod-4',
    name: 'Beras Cianjur Pandan Wangi',
    price: 16500,
    stock: 1000,
    supplierName: 'Rice Mill Subur Sentosa',
    supplierLocation: 'Cianjur, Jawa Barat',
    supplierRating: 4.9,
    image: '/image/produk/beras.png',
    description: 'Beras Pandan Wangi asli Cianjur tanpa pemutih, pewangi sintetik, maupun pengawet. Bulir beras bulat sedang, aromatik pandan alami tercium kuat saat dimasak. Nasi pulen sempurna.',
    shippingEstimate: '2-4 Hari',
    category: 'Beras',
    priceHistory: [
      { month: 'Jan', price: 15000 },
      { month: 'Feb', price: 15500 },
      { month: 'Mar', price: 17000 },
      { month: 'Apr', price: 16800 },
      { month: 'Mei', price: 16500 },
      { month: 'Jun', price: 16200 }
    ]
  },
  {
    id: 'prod-5',
    name: 'Jagung Manis Madu',
    price: 12000,
    stock: 300,
    supplierName: 'Agro Jago',
    supplierLocation: 'Grobogan, Jawa Tengah',
    supplierRating: 4.6,
    image: '/image/produk/jagung.png',
    description: 'Jagung manis segar berkualitas dari hasil panen lokal. Bulir padat dan rasanya manis alami. Sangat cocok direbus, dibakar, atau diolah menjadi sayur bening.',
    shippingEstimate: '1-3 Hari',
    category: 'Sayuran',
    priceHistory: [
      { month: 'Jan', price: 11000 },
      { month: 'Feb', price: 11500 },
      { month: 'Mar', price: 13000 },
      { month: 'Apr', price: 12500 },
      { month: 'Mei', price: 12000 },
      { month: 'Jun', price: 12000 }
    ]
  },
  {
    id: 'prod-6',
    name: 'Jahe Gajah Segar',
    price: 24000,
    stock: 400,
    supplierName: 'Rempah Jaya',
    supplierLocation: 'Karanganyar, Jawa Tengah',
    supplierRating: 4.8,
    image: '/image/produk/jahe.png',
    description: 'Jahe gajah berukuran besar dengan kualitas terbaik, bersih dari tanah. Rimpang segar, pedasnya pas. Ideal untuk bahan baku minuman herbal, wedang jahe, maupun bumbu masakan.',
    shippingEstimate: '2-3 Hari',
    category: 'Rempah',
    priceHistory: [
      { month: 'Jan', price: 21000 },
      { month: 'Feb', price: 22000 },
      { month: 'Mar', price: 25000 },
      { month: 'Apr', price: 24500 },
      { month: 'Mei', price: 24000 },
      { month: 'Jun', price: 24000 }
    ]
  }
];

// Initial Mock Chats
const INITIAL_CHATS: ChatThread[] = [
  {
    supplierName: 'Tumbasna AI Pintar',
    lastMessage: 'Halo! Saya asisten kecerdasan buatan Tumbasna. Silakan tanyakan apa saja tentang analisis pasar atau rekomendasi produk.',
    lastTime: '08:00',
    unreadCount: 0,
    messages: [
      { id: 'm-ai-1', sender: 'supplier', text: 'Halo! Saya asisten kecerdasan buatan Tumbasna. Saya dapat membantu menganalisis harga pasar, memperkirakan permintaan komoditas, atau mencarikan supplier terbaik untuk usaha kuliner Anda. Apa yang ingin Anda tanyakan hari ini?', timestamp: '08:00', status: 'read' }
    ]
  },
  {
    supplierName: 'Tani Makmur Jaya',
    lastMessage: 'Halo pak, pesanan cabai rawit super sudah kami siapkan. Siap kirim hari ini.',
    lastTime: '10:30',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'buyer', text: 'Pagi Pak, untuk cabai rawit super ready 100 kg?', timestamp: '09:15', status: 'read' },
      { id: 'm2', sender: 'supplier', text: 'Pagi. Siap ready banyak pak, panen baru melimpah.', timestamp: '09:20', status: 'read' },
      { id: 'm3', sender: 'buyer', text: 'Baik pak, saya buat pesanan 50kg dulu ya via aplikasi.', timestamp: '10:00', status: 'read' },
      { id: 'm4', sender: 'supplier', text: 'Halo pak, pesanan cabai rawit super sudah kami siapkan. Siap kirim hari ini.', timestamp: '10:30', status: 'delivered' }
    ]
  },
  {
    supplierName: 'Koperasi Tani Brebes',
    lastMessage: 'Untuk pemesanan di atas 200kg ada diskon khusus pak.',
    lastTime: 'Kemarin',
    unreadCount: 0,
    messages: [
      { id: 'm5', sender: 'buyer', text: 'Bawang Brebes per ton kirim ke Jakarta aman?', timestamp: 'Kemarin 14:00', status: 'read' },
      { id: 'm6', sender: 'supplier', text: 'Aman sekali pak, kami menggunakan armada berpendingin khusus untuk rute jauh.', timestamp: 'Kemarin 14:15', status: 'read' },
      { id: 'm7', sender: 'supplier', text: 'Untuk pemesanan di atas 200kg ada diskon khusus pak.', timestamp: 'Kemarin 14:16', status: 'read' }
    ]
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tumbasna_user');
    if (saved) return JSON.parse(saved);
    // Return a default mock user for demonstration so the app is instantly usable
    return {
      ownerName: 'Budi Santoso',
      businessName: 'Warung Makan Padang Selera',
      phone: '081234567890',
      email: 'budi.selera@gmail.com',
      address: 'Jl. Pemuda No. 45, Semarang Tengah, Semarang',
      businessType: 'Rumah Makan / Restoran',
      bankName: 'Bank Central Asia (BCA)',
      bankAccount: '8220987162',
      balance: 15450000,
      purchasesThisMonth: 12500000,
      activeOrdersCount: 2
    };
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('tumbasna_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[];
        return parsed.map((item) => {
          const currentProd = INITIAL_PRODUCTS.find((p) => p.id === item.product.id);
          if (currentProd) {
            return {
              ...item,
              product: currentProd
            };
          }
          return item;
        });
      } catch (e) {
        console.error('Error parsing stored cart', e);
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('tumbasna_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Order[];
        // Sanitize product details inside loaded orders to ensure they match current INITIAL_PRODUCTS (correct local images, names, prices)
        return parsed.map((order) => {
          const updatedItems = order.items.map((item) => {
            const currentProd = INITIAL_PRODUCTS.find((p) => p.id === item.product.id);
            if (currentProd) {
              return {
                ...item,
                product: currentProd
              };
            }
            return item;
          });
          return {
            ...order,
            items: updatedItems
          };
        });
      } catch (e) {
        console.error('Error parsing stored orders, falling back to mock data', e);
      }
    }

    // Initial mock orders
    const initialOrders: Order[] = [
      {
        id: 'TRX-982103',
        items: [
          {
            product: INITIAL_PRODUCTS[1], // Bawang Merah
            quantity: 30
          }
        ],
        supplierName: 'Koperasi Tani Brebes',
        supplierLocation: 'Brebes, Jawa Tengah',
        courier: 'Kurir Lokal - L300 Box',
        shippingCost: 80000,
        totalAmount: 30 * 32000 + 80000, // 1.040.000
        date: '16 Jun 2026',
        status: 'Dikirim',
        paymentQrCode: 'qris_placeholder',
        fundsReleased: false,
        paymentCountdown: 0,
        trackingTimeline: [
          { title: 'Pembayaran Dikonfirmasi', description: 'Pembayaran berhasil melalui QRIS. Saldo ditahan di rekening penampung.', time: '16 Jun, 09:00', done: true },
          { title: 'Pesanan Dikonfirmasi Supplier', description: 'Koperasi Tani Brebes sedang menyiapkan pesanan Anda.', time: '16 Jun, 11:30', done: true },
          { title: 'Sedang Dikirim', description: 'Pesanan dibawa oleh kurir lokal plat G 8812 HD. Estimasi tiba besok siang.', time: '17 Jun, 08:00', done: true },
          { title: 'Tiba di Lokasi', description: 'Pesanan dalam perjalanan akhir ke alamat Anda.', time: 'Menunggu', done: false }
        ]
      },
      {
        id: 'TRX-982104',
        items: [
          {
            product: INITIAL_PRODUCTS[0], // Cabai Rawit
            quantity: 10
          },
          {
            product: INITIAL_PRODUCTS[2], // Bawang Putih
            quantity: 15
          }
        ],
        supplierName: 'Tani Makmur Jaya',
        supplierLocation: 'Magelang, Jawa Tengah',
        courier: 'Ekspedisi Kilat (Next Day)',
        shippingCost: 45000,
        totalAmount: (10 * 48000) + (15 * 38000) + 45000, // 480k + 570k + 45k = 1.095.000
        date: '17 Jun 2026',
        status: 'Diproses',
        paymentQrCode: 'qris_placeholder',
        fundsReleased: false,
        paymentCountdown: 0,
        trackingTimeline: [
          { title: 'Pembayaran Dikonfirmasi', description: 'Pembayaran berhasil dikonfirmasi. Dana Rp1.095.000 ditahan sistem.', time: '17 Jun, 11:00', done: true },
          { title: 'Konfirmasi Supplier', description: 'Tani Makmur Jaya menyetujui pesanan & memotong stok komoditas.', time: '17 Jun, 12:15', done: true },
          { title: 'Pengemasan & QC', description: 'Barang sedang dimasukkan ke dalam keranjang plastik berventilasi khusus.', time: '17 Jun, 13:00', done: true },
          { title: 'Diserahkan ke Kurir', description: 'Ekspedisi akan menjemput paket pukul 17:00.', time: 'Menunggu', done: false }
        ]
      }
    ];
    return initialOrders;
  });

  const [chats, setChats] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('tumbasna_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  // Persist State Changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('tumbasna_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tumbasna_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tumbasna_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('tumbasna_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('tumbasna_chats', JSON.stringify(chats));
  }, [chats]);

  // Fetch products from Dashboard API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/products');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            setProducts(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products from API, using fallback data', err);
      }
    };
    fetchProducts();
  }, []);

  // Auth Operations
  const login = async (phoneOrEmail: string): Promise<boolean> => {
    // Mock login validation
    if (!phoneOrEmail) return false;
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // If there was a registered user profile, reload it or create default
    const savedProfile = localStorage.getItem('tumbasna_registered_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setUser({
        ...parsed,
        balance: 15450000,
        purchasesThisMonth: 12500000,
        activeOrdersCount: orders.filter(o => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length
      });
    } else {
      setUser({
        ownerName: 'Budi Santoso',
        businessName: 'Warung Makan Padang Selera',
        phone: phoneOrEmail.includes('@') ? '081234567890' : phoneOrEmail,
        email: phoneOrEmail.includes('@') ? phoneOrEmail : 'budi.selera@gmail.com',
        address: 'Jl. Pemuda No. 45, Semarang Tengah, Semarang',
        businessType: 'Rumah Makan / Restoran',
        bankName: 'Bank Central Asia (BCA)',
        bankAccount: '8220987162',
        balance: 15450000,
        purchasesThisMonth: 12500000,
        activeOrdersCount: orders.filter(o => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length
      });
    }
    return true;
  };

  const register = async (userData: Omit<User, 'balance' | 'purchasesThisMonth' | 'activeOrdersCount'>): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const fullProfile = {
      ...userData,
      balance: 0,
      purchasesThisMonth: 0,
      activeOrdersCount: 0
    };
    // Save to registered profile store
    localStorage.setItem('tumbasna_registered_profile', JSON.stringify(fullProfile));
    setUser(fullProfile);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  // Cart Operations
  const addToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout & Payment
  const checkout = (courier: string, shippingCost: number): string => {
    if (cart.length === 0) return '';
    const orderId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemsTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const totalAmount = itemsTotal + shippingCost;
    const supplierName = cart[0].product.supplierName;
    const supplierLocation = cart[0].product.supplierLocation;

    const newOrder: Order = {
      id: orderId,
      items: [...cart],
      supplierName,
      supplierLocation,
      courier,
      shippingCost,
      totalAmount,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Menunggu Pembayaran',
      paymentQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=tumbasna-qris-payment-trx-' + orderId,
      fundsReleased: false,
      paymentCountdown: 300, // 5 minutes countdown
      trackingTimeline: [
        { title: 'Menunggu Pembayaran', description: 'Silakan lakukan pembayaran menggunakan QRIS.', time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), done: true },
        { title: 'Pembayaran Dikonfirmasi', description: 'Menunggu konfirmasi pembayaran dari sistem.', time: 'Belum', done: false },
        { title: 'Konfirmasi Supplier', description: 'Menunggu konfirmasi ketersediaan barang oleh supplier.', time: 'Belum', done: false },
        { title: 'Pengiriman & Tracking', description: 'Menunggu penjemputan logistik.', time: 'Belum', done: false }
      ]
    };

    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    clearCart();
    
    if (user) {
      setUser({
        ...user,
        activeOrdersCount: user.activeOrdersCount + 1
      });
    }

    return orderId;
  };

  const payOrder = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          const updatedTimeline = [...order.trackingTimeline];
          updatedTimeline[0] = { ...updatedTimeline[0], title: 'Menunggu Pembayaran', done: true, time: order.trackingTimeline[0].time };
          updatedTimeline[1] = { title: 'Pembayaran Dikonfirmasi', description: `Pembayaran QRIS Berhasil. Dana sebesar Rp${order.totalAmount.toLocaleString('id-ID')} ditahan oleh Tumbasna.`, time: currentTime, done: true };
          updatedTimeline[2] = { title: 'Pesanan Diproses Supplier', description: `${order.supplierName} sedang memilah komoditas terbaik untuk Anda.`, time: 'Segera', done: false };
          
          return {
            ...order,
            status: 'Diproses',
            trackingTimeline: updatedTimeline
          };
        }
        return order;
      })
    );
  };

  const confirmOrderReceived = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          const updatedTimeline = order.trackingTimeline.map(step => ({ ...step, done: true }));
          updatedTimeline.push({
            title: 'Selesai & Dana Dicairkan',
            description: `Barang diterima oleh buyer. Dana Rp${order.totalAmount.toLocaleString('id-ID')} telah dikirimkan ke rekening ${order.supplierName}.`,
            time: currentTime,
            done: true
          });

          return {
            ...order,
            status: 'Selesai',
            fundsReleased: true,
            trackingTimeline: updatedTimeline
          };
        }
        return order;
      })
    );

    // Update user stats
    if (user) {
      const order = orders.find(o => o.id === orderId);
      const cost = order ? order.totalAmount : 0;
      setUser(prev => prev ? {
        ...prev,
        purchasesThisMonth: prev.purchasesThisMonth + cost,
        activeOrdersCount: Math.max(0, prev.activeOrdersCount - 1)
      } : null);
    }
  };

  // Chat Operations with WhatsApp synchronization simulation
  const sendMessage = (supplierName: string, text: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'buyer',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setChats((prevChats) => {
      const updated = prevChats.map((thread) => {
        if (thread.supplierName === supplierName) {
          return {
            ...thread,
            lastMessage: text,
            lastTime: newMessage.timestamp,
            messages: [...thread.messages, newMessage]
          };
        }
        return thread;
      });

      // If thread doesn't exist, create it
      const exists = prevChats.some((thread) => thread.supplierName === supplierName);
      if (!exists) {
        return [
          ...prevChats,
          {
            supplierName,
            lastMessage: text,
            lastTime: newMessage.timestamp,
            unreadCount: 0,
            messages: [newMessage]
          }
        ];
      }
      return updated;
    });

    // Simulate WhatsApp Sync / AI response
    setTimeout(() => {
      let responseText = '';
      if (supplierName === 'Tumbasna AI Pintar') {
        const query = text.toLowerCase();
        if (query.includes('harga') || query.includes('tren') || query.includes('pasar') || query.includes('prediksi')) {
          responseText = 'Analisis AI: Kentang Dieng Super diprediksi naik 12% dalam 7 hari ke depan karena penurunan pasokan regional di Jawa Barat. Disarankan untuk mengamankan stok sekarang melalui Tani Jaya Mandiri. Sebaliknya, Bawang Merah Brebes diprediksi turun 4% karena panen raya di pesisir utara.';
        } else if (query.includes('supplier') || query.includes('rekomendasi') || query.includes('terbaik') || query.includes('bagus')) {
          responseText = 'Analisis AI: Berdasarkan penilaian kepuasan pengiriman dan ulasan kualitas komoditas, Grosir Bumbu Nusantara di Semarang terpilih sebagai Supplier Bawang Putih Terbaik minggu ini dengan rating 4.9. Untuk cabai, Koperasi Tani Brebes memegang rating 4.8 dengan ketepatan pengiriman 100%.';
        } else if (query.includes('beli') || query.includes('borong') || query.includes('bersama') || query.includes('kelompok')) {
          responseText = 'Analisis AI: Program Beli Bersama Cabai Rawit Merah Super saat ini aktif untuk wilayah Cianjur. Anda dapat bergabung dengan 4 UMKM lain untuk memesan secara kolektif dengan potongan harga khusus 20% (Harga gabungan Rp38.000/kg dari harga eceran biasa Rp48.000/kg).';
        } else {
          responseText = 'Halo! Saya siap membantu bisnis kuliner Anda. Coba tanyakan hal-hal seperti:\n1. "Bagaimana tren harga kentang?"\n2. "Siapa supplier terbaik bawang?"\n3. "Info kelompok beli bersama cabai"';
        }
      } else {
        responseText = `[WhatsApp Sync] Halo, terima kasih pesanan/tanya-tanyanya. Terkait "${text.substring(0, 15)}...", akan kami proses secepatnya ya.`;
      }

      const responseMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'supplier',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setChats((prevChats) =>
        prevChats.map((thread) => {
          if (thread.supplierName === supplierName) {
            // update statuses of buyer messages to read
            const updatedMsgs = thread.messages.map(m => m.sender === 'buyer' ? { ...m, status: 'read' as const } : m);
            return {
              ...thread,
              lastMessage: responseText,
              lastTime: responseMessage.timestamp,
              unreadCount: thread.unreadCount + 1,
              messages: [...updatedMsgs, responseMessage]
            };
          }
          return thread;
        })
      );
    }, 1000);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        products,
        cart,
        orders,
        chats,
        login,
        register,
        logout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        checkout,
        payOrder,
        confirmOrderReceived,
        sendMessage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
