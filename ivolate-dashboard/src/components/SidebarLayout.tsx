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
} from 'lucide-react';

// ----- Navigation items -----
const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Ringkasan platform',
    },
    {
        label: 'Peta',
        href: '/dashboard/peta',
        icon: Map,
        description: 'Sebaran wilayah & stok',
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
];

// ----- Sidebar content (shared between desktop & mobile drawer) -----
function SidebarContent({
    pathname,
    onClose,
}: {
    pathname: string;
    onClose?: () => void;
}) {
    return (
        <div className="flex flex-col h-full" style={{ background: '#1F3826' }}>
            {/* Brand */}
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'rgba(127,187,84,0.15)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#7FBB54' }}>
                        <span className="text-white font-bold text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>TB</span>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>Tumbasna</p>
                        <p className="text-[10px] font-medium" style={{ color: '#7FBB54', fontFamily: 'Poppins, sans-serif' }}>Admin Dashboard</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        aria-label="Close menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Section label */}
            <div className="px-5 pt-5 pb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(127,187,84,0.6)', fontFamily: 'Poppins, sans-serif' }}>
                Menu Utama
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
                {navItems.map(({ label, href, icon: Icon, description }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                                isActive ? '' : 'hover:bg-white/5'
                            }`}
                            style={isActive ? {
                                background: 'rgba(127,187,84,0.15)',
                                borderLeft: '3px solid #7FBB54',
                            } : {
                                borderLeft: '3px solid transparent',
                            }}
                        >
                            <div
                                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200"
                                style={isActive ? {
                                    background: '#7FBB54',
                                    color: 'white',
                                } : {
                                    background: 'rgba(255,255,255,0.07)',
                                    color: 'rgba(255,255,255,0.6)',
                                }}
                            >
                                <Icon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p
                                    className="text-sm font-semibold leading-tight"
                                    style={{
                                        color: isActive ? '#7FBB54' : 'rgba(255,255,255,0.9)',
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    {label}
                                </p>
                                <p
                                    className="text-[11px] mt-0.5 font-medium"
                                    style={{
                                        color: isActive ? 'rgba(127,187,84,0.7)' : 'rgba(255,255,255,0.35)',
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    {description}
                                </p>
                            </div>

                            {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#7FBB54' }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Divider */}
            <div className="mx-4 h-px" style={{ background: 'rgba(127,187,84,0.12)' }} />

            {/* Settings */}
            <div className="px-3 py-3 space-y-0.5">
                <Link
                    href="/dashboard/pengaturan"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/5"
                    onClick={onClose}
                    style={{ borderLeft: '3px solid transparent' }}
                >
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                        <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins, sans-serif' }}>Pengaturan</span>
                </Link>
            </div>

            {/* Footer user badge */}
            <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(127,187,84,0.12)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EB9728' }}>
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins, sans-serif' }}>
                            Admin TPID
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-[10px] font-medium" style={{ color: '#7FBB54', fontFamily: 'Poppins, sans-serif' }}>
                                Online
                            </p>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
        <div className="flex h-screen w-full overflow-hidden" style={{ background: '#F4F7F2', fontFamily: 'Poppins, sans-serif' }}>
            {/* ── Desktop Sidebar (always visible ≥ lg) ── */}
            <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 z-20" style={{ boxShadow: '4px 0 24px rgba(31,56,38,0.15)' }}>
                <SidebarContent pathname={pathname} />
            </aside>

            {/* ── Mobile Sidebar Overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden" aria-modal="true" role="dialog">
                    <div
                        className="absolute inset-0"
                        style={{ background: 'rgba(31,56,38,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 h-full w-60 z-50 animate-in" style={{ boxShadow: '4px 0 40px rgba(31,56,38,0.3)' }}>
                        <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            {/* ── Main content area ── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Mobile top-bar */}
                <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b flex-shrink-0" style={{ borderColor: '#DDE5D8' }}>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#1F3826' }}
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-sm" style={{ color: '#1F3826', fontFamily: 'Poppins, sans-serif' }}>
                        Tumbasna Admin
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F4F7F2', color: '#1F3826' }}>
                            <Bell className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Desktop top header bar */}
                <header className="hidden lg:flex items-center gap-4 px-6 py-3 bg-white border-b flex-shrink-0" style={{ borderColor: '#DDE5D8' }}>
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#1F3826', fontFamily: 'Poppins, sans-serif' }}>
                            {navItems.find(n => n.href === pathname)?.label ?? 'Dashboard'}
                        </p>
                        <p className="text-xs" style={{ color: '#8DA88F', fontFamily: 'Poppins, sans-serif' }}>
                            Platform Monitoring Komoditas Pangan — Tumbasna
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#EDF2EA', color: '#1F3826', fontFamily: 'Poppins, sans-serif' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live Monitoring
                        </div>
                        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: '#F4F7F2', color: '#1F3826' }}>
                            <Bell className="w-4 h-4" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#EB9728' }} />
                        </button>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white cursor-pointer" style={{ background: '#EB9728', fontFamily: 'Poppins, sans-serif' }}>
                            A
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto" style={{ background: '#F4F7F2' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
