'use client';

import {
    Settings,
    Shield,
    Map,
    Users,
    Zap,
    Bell,
    Database,
    Globe,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';

const settingSections = [
    {
        title: 'Platform',
        icon: Settings,
        color: '#1F3826',
        bg: 'rgba(31,56,38,0.06)',
        items: ['Informasi Platform', 'Konfigurasi API', 'Mode Maintenance', 'Backup Sistem'],
    },
    {
        title: 'Manajemen Pengguna',
        icon: Users,
        color: '#697EE8',
        bg: 'rgba(105,126,232,0.08)',
        items: ['Daftar Admin', 'Role & Permission', 'Log Aktivitas', 'Reset Password'],
    },
    {
        title: 'Wilayah',
        icon: Map,
        color: '#7FBB54',
        bg: 'rgba(127,187,84,0.08)',
        items: ['Kelola Wilayah', 'Batas Administrasi', 'Zona Distribusi', 'Konfigurasi Peta'],
    },
    {
        title: 'Notifikasi',
        icon: Bell,
        color: '#EB9728',
        bg: 'rgba(235,151,40,0.08)',
        items: ['WhatsApp Bot', 'Email Alert', 'Push Notifikasi', 'Threshold Harga'],
    },
    {
        title: 'Integrasi',
        icon: Zap,
        color: '#697EE8',
        bg: 'rgba(105,126,232,0.08)',
        items: ['Bank Indonesia API', 'TPID Webhook', 'SIPD Integration', 'BPS Data Feed'],
    },
    {
        title: 'Keamanan',
        icon: Shield,
        color: '#7FBB54',
        bg: 'rgba(127,187,84,0.08)',
        items: ['SSL Certificate', 'Rate Limiting', 'IP Whitelist', 'Audit Log'],
    },
];

export default function PengaturanPage() {
    return (
        <div className="p-6 space-y-5" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1F3826' }}>Pengaturan Sistem</h1>
                <p className="text-sm mt-0.5" style={{ color: '#8DA88F' }}>
                    Konfigurasi platform, manajemen pengguna, dan integrasi sistem
                </p>
            </div>

            {/* System Status */}
            <div className="rounded-2xl p-4" style={{ background: '#1F3826' }}>
                <div className="flex flex-wrap items-center gap-6">
                    <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(127,187,84,0.8)' }}>Status Sistem</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-sm font-bold text-white">Operational</p>
                        </div>
                    </div>
                    {[
                        { label: 'API Uptime', value: '99.98%', color: '#7FBB54' },
                        { label: 'DB Response', value: '12ms', color: '#7FBB54' },
                        { label: 'Webhook', value: 'Active', color: '#697EE8' },
                        { label: 'Versi', value: '2.4.1', color: 'rgba(255,255,255,0.5)' },
                    ].map(item => (
                        <div key={item.label}>
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</p>
                            <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {settingSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div key={section.title} className="bg-white rounded-2xl p-5 border card-hover" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: section.bg }}>
                                    <Icon className="w-5 h-5" style={{ color: section.color }} />
                                </div>
                                <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>{section.title}</h2>
                            </div>
                            <div className="space-y-1">
                                {section.items.map(item => (
                                    <button
                                        key={item}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all hover:bg-opacity-100"
                                        style={{ background: '#F4F7F2' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#DDE5D8' }} />
                                            <span className="text-xs font-medium" style={{ color: '#1F3826' }}>{item}</span>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5" style={{ color: '#DDE5D8' }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Data & Storage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4" style={{ color: '#7FBB54' }} />
                        <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>Penyimpanan Data</h2>
                    </div>
                    {[
                        { label: 'Database Utama', used: 68, total: '500 GB', color: '#697EE8' },
                        { label: 'Media Storage', used: 34, total: '1 TB', color: '#7FBB54' },
                        { label: 'Backup', used: 22, total: '250 GB', color: '#EB9728' },
                    ].map(s => (
                        <div key={s.label} className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium" style={{ color: '#1F3826' }}>{s.label}</span>
                                <span className="text-[11px] font-bold" style={{ color: '#8DA88F' }}>{s.used}% dari {s.total}</span>
                            </div>
                            <div className="h-2 rounded-full" style={{ background: '#EDF2EA' }}>
                                <div className="h-full rounded-full" style={{ width: `${s.used}%`, background: s.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4" style={{ color: '#697EE8' }} />
                        <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>Integrasi Aktif</h2>
                    </div>
                    {[
                        { name: 'Bank Indonesia API', status: 'Terhubung', color: '#7FBB54' },
                        { name: 'TPID Jateng Webhook', status: 'Terhubung', color: '#7FBB54' },
                        { name: 'WhatsApp Business API', status: 'Terhubung', color: '#7FBB54' },
                        { name: 'BPS Open Data', status: 'Terhubung', color: '#7FBB54' },
                        { name: 'SIPD Kemendagri', status: 'Konfigurasi', color: '#EB9728' },
                    ].map(i => (
                        <div key={i.name} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F4F7F2' }}>
                            <span className="text-xs font-medium" style={{ color: '#1F3826' }}>{i.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: i.color === '#7FBB54' ? 'rgba(127,187,84,0.10)' : 'rgba(235,151,40,0.10)', color: i.color }}>
                                {i.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
