'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Map,
    Package,
    ArrowLeftRight,
    Truck,
    Menu,
    X,
    Bell,
    ChevronRight,
    Settings,
    LogOut,
    User,
    Wallet,
    MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ----- Navigation items -----
const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Ringkasan platform',
    },
    {
        label: 'Zona QRIS',
        href: '/dashboard/peta',
        icon: Map,
        description: 'Sebaran transaksi QRIS',
    },
    {
        label: 'Komoditas',
        href: '/dashboard/komoditas',
        icon: Package,
        description: 'Harga, stok & lokasi',
    },
    {
        label: 'Transaksi',
        href: '/dashboard/transaksi',
        icon: ArrowLeftRight,
        description: 'Aktivitas transaksi',
    },
    {
        label: 'Logistik',
        href: '/dashboard/logistik',
        icon: Truck,
        description: 'Rute & armada kirim',
    },
    {
        label: 'Pengguna',
        href: '/dashboard/pengguna',
        icon: User,
        description: 'Supplier & Buyer terdaftar',
    },
    {
        label: 'Saldo Escrow',
        href: '/dashboard/saldo',
        icon: Wallet,
        description: 'Pencairan dana supplier',
    },
    {
        label: 'Ulasan & Rating',
        href: '/dashboard/ulasan',
        icon: MessageSquare,
        description: 'Ulasan pembeli & bintang',
    },
    {
        label: 'Notifikasi',
        href: '/dashboard/notifikasi',
        icon: Bell,
        description: 'Update & pemberitahuan',
    },
];

// ----- Sidebar content (shared between desktop & mobile drawer) -----
function SidebarContent({
    pathname,
    onClose,
}: {
    pathname: string;
    onClose?: () => void;
}) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/admin-logout', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok && data.success) {
                router.push('/login');
                router.refresh();
            } else {
                console.error('Logout failed:', data.error);
                router.push('/login');
            }
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/login');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
            {/* Brand */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-600">
                        <span className="text-white font-bold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>T</span>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>Tumbasna</p>
                        <p className="text-[10px] font-medium text-slate-400" style={{ fontFamily: 'Poppins, sans-serif' }}>Monitoring Panel</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Section label */}
            <div className="px-6 pt-6 pb-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Main Menu
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4 scrollbar-thin">
                {navItems.map(({ label, href, icon: Icon, description }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative overflow-hidden ${
                                isActive 
                                    ? 'bg-slate-50 border-l-2 border-emerald-600' 
                                    : 'hover:bg-slate-50/70 border-l-2 border-transparent'
                            }`}
                        >
                            <div
                                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-slate-50 text-slate-500 group-hover:text-slate-700'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-xs font-semibold leading-tight ${
                                        isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                                    }`}
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
                                >
                                    {label}
                                </p>
                                <p
                                    className={`text-[10px] mt-0.5 ${
                                        isActive ? 'text-slate-400' : 'text-slate-400 group-hover:text-slate-500'
                                    }`}
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
                                >
                                    {description}
                                </p>
                            </div>

                            {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Divider */}
            <div className="mx-4 h-px bg-slate-100" />

            {/* Settings */}
            <div className="px-4 py-3 space-y-1">
                <Link
                    href="/dashboard/pengaturan"
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 border-l-2 border-transparent ${
                        pathname === '/dashboard/pengaturan'
                            ? 'bg-slate-50 border-emerald-600 text-slate-900'
                            : 'hover:bg-slate-50/70 text-slate-500 hover:text-slate-800'
                    }`}
                    onClick={onClose}
                >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Pengaturan</span>
                </Link>
            </div>

            {/* Footer user badge */}
            <div className="px-6 py-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Admin TPID
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-medium text-slate-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Online
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----- Main exported layout -----
export default function SidebarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {/* ── Desktop Sidebar (always visible ≥ lg) ── */}
            <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 z-20">
                <SidebarContent pathname={pathname} />
            </aside>

            {/* ── Mobile Sidebar Overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden" aria-modal="true" role="dialog">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 h-full w-60 z-50 animate-in">
                        <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            {/* ── Main content area ── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Mobile top-bar */}
                <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200/80 flex-shrink-0">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-sm text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Tumbasna
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                            <Bell className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Desktop top header bar */}
                <header className="hidden lg:flex items-center gap-4 px-8 py-4 bg-white border-b border-slate-200/80 flex-shrink-0">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {navItems.find(n => n.href === pathname)?.label ?? 'Dashboard'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Platform Monitoring Komoditas Pangan - Tumbasna
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/50" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Live Monitoring
                        </div>
                        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200/30">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                        </button>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 cursor-pointer" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            A
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto bg-[#F8FAFC]">
                    {children}
                </main>
            </div>
        </div>
    );
}






