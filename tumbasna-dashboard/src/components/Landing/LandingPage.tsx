'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Zap, TrendingUp, Users,
  Package, Search, Truck, Star, Plus, Minus, Menu, X,
  MessageCircle, Check, CheckCircle, Tag, CreditCard, MapPin,
  Shield, Brain, BarChart3, Leaf, Store,
  Clock, ArrowDown,
  Sprout, Warehouse, CircleCheck, HandCoins, Route, Handshake
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP CHAT — NO EMOJI
// ─────────────────────────────────────────────────────────────────────────────
const WhatsAppChatMockup = () => {
  return (
    <div className="w-[265px] sm:w-[300px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,104,55,0.14)] overflow-hidden border border-gray-100 select-none">
      {/* Header */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#8CC63F] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          TN
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xs leading-tight truncate">TumbasNa Pasokan Pangan</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-green-200 text-[10px]">online &bull; terverifikasi</p>
          </div>
        </div>
        <MessageCircle className="w-4 h-4 text-white/60 flex-shrink-0" />
      </div>

      {/* Messages list - Fixed height & stable layout */}
      <div className="bg-[#ECE5DD] px-3 py-3.5 space-y-2.5 h-[340px] overflow-hidden flex flex-col justify-end">
        {/* Date pill */}
        <div className="flex justify-center mb-1">
          <span className="bg-white/80 backdrop-blur-sm text-gray-600 text-[9px] font-semibold px-2.5 py-0.5 rounded-full">
            Hari ini
          </span>
        </div>

        {/* Message 1: Buyer */}
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none px-3 py-2 border border-black/5">
            <p className="text-[11px] text-gray-800 leading-snug">
              Mas, saya butuh cabai merah 50 kg untuk besok pagi.
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5 text-right">10:20</p>
          </div>
        </div>

        {/* Message 2: System Pill */}
        <div className="flex justify-center my-0.5">
          <div className="bg-[#006837]/12 border border-[#006837]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#006837] animate-pulse" />
            <p className="text-[9.5px] text-[#006837] font-bold">Matching supplier terdekat...</p>
          </div>
        </div>

        {/* Message 3: Supplier */}
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 border border-green-200/50">
            <p className="text-[11px] text-gray-800 leading-snug">
              Siap Bu! Stok 200 kg. Harga Rp 28.000/kg. Kirim jam 06.00 pagi.
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-gray-500">
              <span>10:21</span>
              <span className="text-[#075E54] font-bold">✓✓</span>
            </div>
          </div>
        </div>

        {/* Message 4: Buyer */}
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none px-3 py-2 border border-black/5">
            <p className="text-[11px] text-gray-800 leading-snug">
              Oke, deal 50 kg. Kirim ke Warung Mie Ayam Jl. Isdiman No. 12.
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5 text-right">10:22</p>
          </div>
        </div>

        {/* Message 5: System / Confirmation */}
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 border border-green-200/50">
            <div className="flex items-center gap-1.5 text-[#006837] font-bold text-[10px] mb-0.5">
              <CheckCircle className="w-3 h-3 text-[#006837]" />
              <span>Pesanan Dikonfirmasi</span>
            </div>
            <p className="text-[10.5px] text-gray-700 leading-snug">
              QRIS / Transfer. Tracking pengiriman dikirim otomatis.
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-gray-500">
              <span>10:22</span>
              <span className="text-[#075E54] font-bold">✓✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input footer */}
      <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">Ketik pesan...</p>
        </div>
        <div className="w-7 h-7 bg-[#075E54] rounded-full flex items-center justify-center flex-shrink-0 text-white">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FADE UP WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
const FadeUp = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
const SectionLabel = ({ children, color = 'orange' }: { children: React.ReactNode; color?: 'orange' | 'green' | 'lime' }) => {
  const colors = {
    orange: 'text-[#F7941D] border-[#F7941D]/20 bg-[#F7941D]/6',
    green:  'text-[#006837] border-[#006837]/20 bg-[#006837]/6',
    lime:   'text-[#5A8A2A] border-[#8CC63F]/20 bg-[#8CC63F]/8',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase px-3 py-1 rounded-full border ${colors[color]}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1a2e1e] font-sans antialiased overflow-x-hidden">

      {/* ─── NAVIGATION ─────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? 'py-2' : 'py-5'}`}>
          <div className={`flex items-center justify-between rounded-2xl px-5 h-[58px] transition-all duration-300 ${
            scrolled
              ? 'bg-white/96 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,104,55,0.08)] border border-[#006837]/8'
              : 'bg-transparent'
          }`}>
            <img src="/logo.png" alt="TumbasNa" className="h-9 sm:h-10 w-auto object-contain" />

            <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-[#4A5E4E]">
              {[
                { label: 'Fitur', href: '#fitur' },
                { label: 'Ekosistem', href: '#ekosistem' },
                { label: 'Tentang', href: '#tentang' },
                { label: 'FAQ', href: '#faq' },
              ].map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="hover:text-[#006837] transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://app.tumbasna.my.id"
                className="inline-flex items-center gap-2 bg-[#F7941D] text-white px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-[#d4831b] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(247,148,29,0.3)]"
              >
                Mulai Belanja
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/6285190943468"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-[#006837]/20 text-[#006837] px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-[#006837]/5 transition-all duration-200"
              >
                <Handshake className="w-3.5 h-3.5" />
                Jadi Mitra
              </a>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-[#1a2e1e] p-1 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-[68px] left-4 right-4 z-40 bg-white rounded-2xl shadow-xl p-6 border border-[#006837]/8 flex flex-col gap-4 md:hidden"
          >
            {[
              { label: 'Cara Kerja', href: '#cara-kerja' },
              { label: 'Fitur', href: '#fitur' },
              { label: 'Ekosistem', href: '#ekosistem' },
              { label: 'Tentang', href: '#tentang' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold text-[#1a2e1e] hover:text-[#006837] transition-colors py-0.5"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-1 flex flex-col gap-2">
              <a
                href="https://app.tumbasna.my.id"
                className="inline-flex items-center justify-center gap-2 bg-[#F7941D] text-white px-5 py-3 rounded-xl text-sm font-bold"
              >
                Mulai Belanja <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/6285190943468"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-[#006837]/20 text-[#006837] px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Handshake className="w-4 h-4" /> Jadi Mitra
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-12 lg:py-16 min-h-[calc(100vh-64px)] flex items-center px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#EEF6F1] via-[#F6FAF7] to-[#FBF9F4]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8CC63F]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F7941D]/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* LEFT COLUMN: Content & Conversion */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold text-[#1a2e1e] leading-[1.12] tracking-tight mb-4"
              >
                Bahan baku UMKM,<br />
                <span className="text-[#F7941D]">cukup satu chat.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base text-[#6B7A6F] mb-7 max-w-lg leading-relaxed"
              >
                Dari petani dan supplier lokal Banyumas langsung ke dapur usaha Anda.
                Harga transparan, stok terjamin, pengiriman tercatat.
              </motion.p>

              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto items-stretch sm:items-center mb-8"
              >
                <a
                  href="https://app.tumbasna.my.id"
                  id="hero-cta-primary"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#F7941D] text-white px-7 py-3.5 rounded-xl text-[15px] font-extrabold hover:bg-[#e08312] hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(247,148,29,0.35)] transition-all duration-200 active:scale-[0.98] shadow-md"
                >
                  Mulai Belanja
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/6285190943468"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="hero-cta-secondary"
                  className="inline-flex items-center justify-center gap-2.5 bg-white border-2 border-[#006837]/20 text-[#006837] px-7 py-3.5 rounded-xl text-[15px] font-bold hover:border-[#006837] hover:bg-[#006837]/5 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-sm"
                >
                  <Handshake className="w-4 h-4 text-[#006837]" />
                  Jadi Mitra
                </a>
              </motion.div>

              {/* Micro Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-wrap items-center gap-4 text-[12px] font-semibold text-[#6B7A6F] border-t border-[#006837]/8 pt-5 w-full"
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#006837]" />
                  <span>Dalam hitungan menit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006837]" />
                  <span>Supplier terverifikasi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#006837]" />
                  <span>Harga petani langsung</span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: App Mockup + WhatsApp Chat Side-by-Side */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-row items-center justify-center gap-3 sm:gap-4 relative"
              >
                {/* App mockup — real screenshot */}
                <div className="relative">
                  <img
                    src="/mockups/mockup-app.webp"
                    alt="TumbasNa Mobile App"
                    className="w-[185px] sm:w-[210px] md:w-[230px] h-auto drop-shadow-[0_24px_40px_rgba(0,0,0,0.18)] select-none pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-[#006837]/8 whitespace-nowrap">
                    <p className="text-[9px] font-bold text-[#006837]">Mobile App</p>
                  </div>
                </div>

                {/* WhatsApp simulation card */}
                <div className="relative">
                  <WhatsAppChatMockup />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-[#006837]/8 whitespace-nowrap">
                    <p className="text-[9px] font-bold text-[#006837]">via WhatsApp</p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── UNIFIED TRUST, PARTNERS & IMPACT SECTION (BEHANCE & UNICORN STARTUP STYLE) ─── */}
      <section id="tentang" className="py-24 px-4 sm:px-6 bg-[#081C10] relative overflow-hidden text-white border-y border-white/5">
        {/* Subtle Ambient Lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8CC63F]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#F7941D]/8 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Main Headline & Partner Logo Strip */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-16 pb-12 border-b border-white/10">
            <FadeUp className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.15]">
                Ketika rantai pasok lebih efisien,<br />
                <span className="text-[#8CC63F]">semua ikut bertumbuh.</span>
              </h2>
              <p className="mt-4 text-white/70 text-base leading-relaxed">
                Platform pasokan bahan pangan digital Banyumas, didukung oleh instansi dan otoritas daerah terpercaya.
              </p>
            </FadeUp>

            {/* White Full Rounded Card for Partner Logos */}
            <FadeUp delay={0.1} className="flex items-center">
              <div className="bg-white/95 backdrop-blur-md px-7 py-3.5 rounded-full shadow-lg border border-white/20 flex items-center gap-6 sm:gap-8">
                <img
                  src="/pemkab banyumas.png"
                  alt="Pemkab Banyumas"
                  className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105"
                  onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                />
                <div className="w-px h-9 bg-gray-200" />
                <img
                  src="/bank-indonesia-seeklogo.png"
                  alt="Bank Indonesia"
                  className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105"
                  onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              </div>
            </FadeUp>
          </div>

          {/* 4 Main Real Stat Cards Grid (Behance Startup Style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {[
              { value: '847+',   label: 'UMKM Tergabung',        sub: 'Warung, resto, & katering', icon: <Users className="w-5 h-5 text-[#8CC63F]" /> },
              { value: '63+',    label: 'Supplier Terverifikasi', sub: 'Petani & distributor lokal', icon: <ShieldCheck className="w-5 h-5 text-[#8CC63F]" /> },
              { value: '120+',   label: 'Komoditas Pangan',       sub: 'Sayur, buah, & bumbu',    icon: <Package className="w-5 h-5 text-[#8CC63F]" /> },
              { value: '2.400+', label: 'Transaksi Ditangani',    sub: 'Pengiriman aman ter-escrow', icon: <TrendingUp className="w-5 h-5 text-[#8CC63F]" /> },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-white/10 hover:border-[#8CC63F]/40 hover:bg-white/[0.07] transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8CC63F] bg-[#8CC63F]/10 px-2.5 py-1 rounded-full border border-[#8CC63F]/20">
                      {stat.label}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight mb-2">
                    {stat.value}
                  </p>
                  <p className="text-white/50 text-xs font-medium">{stat.sub}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* 3 Efficiency Highlights Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: <Clock className="w-4.5 h-4.5 text-[#F7941D]" />,     label: 'Belanja Bahan Baku',        value: '78% Lebih Cepat' },
              { icon: <Leaf className="w-4.5 h-4.5 text-[#8CC63F]" />,      label: 'Estimasi Food Waste',     value: 'Turun ±35%' },
              { icon: <HandCoins className="w-4.5 h-4.5 text-[#F7941D]" />, label: '94 Petani Banyumas',            value: 'Terhubung Langsung' },
            ].map((item, i) => (
              <FadeUp key={i} delay={0.3 + i * 0.08}>
                <div className="flex items-center gap-3.5 bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/20 transition-all">
                  <div className="w-10 h-10 bg-white/8 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-medium">{item.label}</p>
                    <p className="text-white font-extrabold text-sm sm:text-base">{item.value}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

        </div>
      </section>

      {/* ─── PROBLEM: GOJEK FUN STORYTELLING STYLE ────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-[#FBF9F4]">
        <div className="max-w-7xl mx-auto">

          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1a2e1e] tracking-tight leading-tight">
              Cerita pagi hari ribuan warung<br />dan usaha kuliner Banyumas.
            </h2>
            <p className="mt-3 text-[#6B7A6F] text-base max-w-lg mx-auto">
              Perjuangan berburu bahan baku sebelum pintu warung dibuka.
            </p>
          </FadeUp>

          {/* Gojek-style Story Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14">

            {/* Story Card 1: Coral Red */}
            <FadeUp delay={0.05}>
              <div className="bg-[#EF4444] rounded-[32px] p-8 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#EF4444]/20 group min-h-[340px]">
                {/* Circular Spotlight */}
                <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[#DC2626] pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
                      Masalah #01
                    </span>
                    <span className="text-2xl font-black text-white/40">04:30 WIB</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug tracking-tight">
                    Bangun jam 4 subuh cuma buat kontak 5 supplier.
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed italic border-l-2 border-white/40 pl-3">
                    &ldquo;Nomor cabai di WA A, nomor bawang di WA B. Kalau satu tutup, harus keliling pasar sendiri.&rdquo;
                  </p>
                </div>

                {/* Fun Badge Graphic */}
                <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex items-center gap-2">
                  <motion.div
                    animate={{ x: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-7 h-7 rounded-full bg-white text-[#EF4444] flex items-center justify-center font-bold flex-shrink-0 shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#EF4444]" />
                  </motion.div>
                  <p className="text-[11px] font-bold text-white">2+ Jam Waktu Terbuang Sebelum Berdagang</p>
                </div>
              </div>
            </FadeUp>

            {/* Story Card 2: Amber Orange */}
            <FadeUp delay={0.1}>
              <div className="bg-[#F7941D] rounded-[32px] p-8 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#F7941D]/20 group min-h-[340px]">
                {/* Circular Spotlight */}
                <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[#E0810F] pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
                      Masalah #02
                    </span>
                    <span className="text-2xl font-black text-white/40">Harga Liar</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug tracking-tight">
                    Harga tidak pasti, margin warung tergerus.
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed italic border-l-2 border-white/40 pl-3">
                    &ldquo;Hari ini Rp 28.000, besok bisa naik Rp 42.000 tanpa pemberitahuan. Untung jualan habis.&rdquo;
                  </p>
                </div>

                {/* Fun Badge Graphic */}
                <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="w-7 h-7 rounded-full bg-white text-[#F7941D] flex items-center justify-center font-bold flex-shrink-0 shadow-sm"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-[#F7941D]" />
                  </motion.div>
                  <p className="text-[11px] font-bold text-white">Fluktuasi Tengkulak Hingga +50%</p>
                </div>
              </div>
            </FadeUp>

            {/* Story Card 3: Deep Emerald Green */}
            <FadeUp delay={0.15}>
              <div className="bg-[#0B3C23] rounded-[32px] p-8 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#0B3C23]/20 group min-h-[340px]">
                {/* Circular Spotlight */}
                <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[#145231] pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-[#8CC63F] backdrop-blur-md">
                      Masalah #03
                    </span>
                    <span className="text-2xl font-black text-white/40">4 Tangan</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug tracking-tight">
                    Rantai pasok terlalu panjang &amp; rumit.
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed italic border-l-2 border-white/40 pl-3">
                    &ldquo;Dari petani di lereng gunung lewat 4 perantara. Petani dapat kecil, kita di warung bayar mahal.&rdquo;
                  </p>
                </div>

                {/* Fun Badge Graphic */}
                <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-7 h-7 rounded-full bg-[#8CC63F] text-[#0B3C23] flex items-center justify-center font-bold flex-shrink-0 shadow-sm"
                  >
                    <Route className="w-3.5 h-3.5 text-[#0B3C23]" />
                  </motion.div>
                  <p className="text-[11px] font-bold text-white">4 Tengkulak Memotong Keuntungan</p>
                </div>
              </div>
            </FadeUp>

          </div>

          {/* Gojek-style Comparison Bento Card (Transformasi Ekosistem) */}
          <FadeUp>
            <div className="bg-[#006837] rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-[#006837]/20 border border-[#8CC63F]/20 group">
              {/* Circular Spotlight Backdrops */}
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#8CC63F]/15 pointer-events-none blur-xl transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#F7941D]/15 pointer-events-none blur-xl" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/15">
                  <div>
                    <span className="text-[11px] font-extrabold text-[#8CC63F] uppercase tracking-widest bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                      Transformasi Ekosistem
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
                      Dulu vs Sekarang Bersama TumbasNa
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 max-w-sm leading-relaxed">
                    Memotong jalur perantara dan menghubungkan langsung petani ke dapur UMKM.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Model Lama */}
                  <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 text-red-300 font-extrabold text-xs uppercase tracking-wider mb-5">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="w-3 h-3 text-red-400" />
                      </div>
                      <span>Rantai Pasok Konvensional (Lama)</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      {[
                        { name: 'Petani', label: 'Harga awal', icon: <Sprout className="w-4 h-4 text-emerald-400" /> },
                        { name: 'Pengepul', label: '+Margin', icon: <Warehouse className="w-4 h-4 text-amber-400" /> },
                        { name: 'Distributor', label: '+Margin', icon: <Package className="w-4 h-4 text-orange-400" /> },
                        { name: 'Pasar', label: '+Margin', icon: <Store className="w-4 h-4 text-red-400" /> },
                        { name: 'UMKM', label: 'Mahal', icon: <Users className="w-4 h-4 text-red-500" /> },
                      ].map((node, i, arr) => (
                        <React.Fragment key={i}>
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold shadow-sm">
                              {node.icon}
                            </div>
                            <p className="text-[10px] font-bold text-white/90">{node.name}</p>
                            <p className={`text-[9px] font-bold ${i === 0 ? 'text-emerald-400' : 'text-red-300'}`}>
                              {node.label}
                            </p>
                          </div>
                          {i < arr.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Model TumbasNa */}
                  <div className="bg-white/10 backdrop-blur-md border-2 border-[#8CC63F]/50 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 text-[#8CC63F] font-extrabold text-xs uppercase tracking-wider">
                        <CircleCheck className="w-4.5 h-4.5 text-[#8CC63F]" />
                        <span>Model Langsung TumbasNa (Baru)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-[#8CC63F] text-[#006837] px-3 py-1 rounded-full shadow-xs">
                        Lebih Hemat 35%
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-sm">
                          <Sprout className="w-5 h-5 text-[#8CC63F]" />
                        </div>
                        <p className="text-xs font-bold text-white">Petani Lokal</p>
                        <p className="text-[9px] text-[#8CC63F] font-bold">Harga Adil</p>
                      </div>

                      <div className="flex-1 px-2 flex flex-col items-center">
                        <div className="w-full bg-white text-[#006837] rounded-xl py-2 px-4 text-center shadow-md flex items-center justify-center">
                          <img src="/logo.png" alt="TumbasNa" className="h-6 sm:h-7 object-contain" />
                        </div>
                        <p className="text-[9px] text-[#8CC63F] font-extrabold mt-1.5">Direct Chat &amp; Matching</p>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-sm">
                          <Store className="w-5 h-5 text-[#F7941D]" />
                        </div>
                        <p className="text-xs font-bold text-white">Dapur UMKM</p>
                        <p className="text-[9px] text-[#F7941D] font-bold">Terjangkau</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>



      {/* ─── PRODUCT BENTO GRID (GOJEK-STYLE FUN ANIMATIONS) ──── */}
      <section id="fitur" className="py-24 px-4 sm:px-6 bg-[#FBF9F4]">
        <div className="max-w-7xl mx-auto">

          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1a2e1e] tracking-tight">
              Teknologi yang bekerja<br />di balik bisnis Anda.
            </h2>
            <p className="mt-3 text-[#6B7A6F] text-base max-w-lg mx-auto">
              Solusi digital sederhana namun powerful yang menghubungkan seluruh ekosistem pangan.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* 1. GOJEK-STYLE CYAN CARD: WhatsApp Commerce (7 cols) */}
            <FadeUp className="lg:col-span-7">
              <div className="bg-[#1EBBDD] rounded-[32px] p-8 sm:p-10 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#1EBBDD]/20 min-h-[320px] group">
                {/* Gojek-style Circular Spotlight Backdrop */}
                <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-white/20 pointer-events-none transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-0 right-1/3 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 max-w-md">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-5 text-[11px] font-extrabold tracking-wider uppercase text-white">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Commerce</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-3 tracking-tight">
                    Tanpa perlu install aplikasi baru. Cukup via WhatsApp.
                  </h3>
                  <p className="text-white/85 text-sm sm:text-base leading-relaxed">
                    Supplier &amp; pedagang menerima order, konfirmasi stok, dan cek harga langsung di aplikasi pesan yang sudah mereka gunakan sehari-hari.
                  </p>
                </div>

                {/* Animated Graphic Element (Floating WhatsApp Chat Nodes) */}
                <div className="relative z-10 mt-8 flex items-center justify-end gap-3 pr-2">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="bg-white text-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-md text-xs font-bold flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[10px]">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <span>&ldquo;Butuh 50kg cabai merah besok&rdquo;</span>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut", delay: 0.5 }}
                    className="bg-[#DCF8C6] text-gray-900 px-4 py-2.5 rounded-2xl rounded-br-none shadow-md text-xs font-bold flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-[#075E54]" />
                    <span>Stok ada. Kirim jam 06.00</span>
                  </motion.div>
                </div>
              </div>
            </FadeUp>

            {/* 2. GOJEK-STYLE GREEN CARD: Order Delivery & Speed (5 cols) */}
            <FadeUp delay={0.1} className="lg:col-span-5">
              <div className="bg-[#45BC2E] rounded-[32px] p-8 sm:p-10 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#45BC2E]/20 min-h-[320px] group">
                {/* Circular Backdrop */}
                <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#34A020] pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-5 text-[11px] font-extrabold tracking-wider uppercase text-white">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Pengiriman Cepat</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3 tracking-tight">
                    Saat warung mulai buka, bahan baku sudah tiba.
                  </h3>
                  <p className="text-white/85 text-sm leading-relaxed">
                    Pengiriman terintegrasi langsung dari petani &amp; supplier lokal Banyumas ke dapur usaha Anda.
                  </p>
                </div>

                {/* Animated Kurir / Scooter Graphic */}
                <div className="relative z-10 mt-6 flex items-center justify-between bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-full bg-white text-[#45BC2E] flex items-center justify-center font-bold shadow-sm"
                    >
                      <Truck className="w-5 h-5" />
                    </motion.div>
                    <div>
                      <p className="text-xs font-black text-white">Status: Dalam Pengiriman</p>
                      <p className="text-[10px] text-white/80">Est. Tiba 06:15 WIB</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-white text-[#45BC2E] px-2.5 py-1 rounded-full shadow-xs">
                    Real-Time
                  </span>
                </div>
              </div>
            </FadeUp>

            {/* 3. GOJEK-STYLE ORANGE CARD: AI Supply Matching (5 cols) */}
            <FadeUp delay={0.15} className="lg:col-span-5">
              <div className="bg-[#F7941D] rounded-[32px] p-8 sm:p-10 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#F7941D]/20 min-h-[300px] group">
                {/* Circular Spotlight */}
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#E0810F] pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-5 text-[11px] font-extrabold tracking-wider uppercase text-white">
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI Matching</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2 tracking-tight">
                    Pencocokan Otomatis dalam 60 Detik.
                  </h3>
                  <p className="text-white/85 text-sm leading-relaxed">
                    Sistem kecerdasan buatan mencocokkan pesanan dengan lokasi supplier paling efektif.
                  </p>
                </div>

                {/* Animated AI Score Pills */}
                <div className="relative z-10 mt-6 flex gap-2">
                  <motion.div
                    animate={{ scale: [0.98, 1.03, 0.98] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="flex-1 bg-white text-gray-900 rounded-2xl p-3 shadow-md flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Match Rate</p>
                      <p className="text-lg font-black text-[#F7941D]">98.4%</p>
                    </div>
                    <span className="text-[9px] font-extrabold bg-[#F7941D]/15 text-[#F7941D] px-2 py-0.5 rounded-full">
                      Terdekat
                    </span>
                  </motion.div>
                </div>
              </div>
            </FadeUp>

            {/* 4. GOJEK-STYLE DEEP EMERALD CARD: Price Transparency & Escrow (7 cols) */}
            <FadeUp delay={0.2} className="lg:col-span-7">
              <div className="bg-[#0B3C23] rounded-[32px] p-8 sm:p-10 text-white h-full relative overflow-hidden flex flex-col justify-between shadow-lg shadow-[#0B3C23]/20 min-h-[300px] group">
                {/* Circular Spotlight */}
                <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#145231] pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                <div className="relative z-10 max-w-md">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-5 text-[11px] font-extrabold tracking-wider uppercase text-[#8CC63F]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Transparan &amp; Aman</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-3 tracking-tight">
                    Harga dari petani langsung. Pembayaran dijamin escrow.
                  </h3>
                  <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                    Tanpa tengkulak tersembunyi. Dana Anda ditahan secara aman dan baru diteruskan ke supplier setelah pesanan tiba dengan baik.
                  </p>
                </div>

                {/* Animated Price & Escrow Tag Graphic */}
                <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#8CC63F]" />
                    <span className="text-xs font-bold text-white">Rp 26.500/kg (Direct)</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8CC63F]" />
                    <span className="text-xs font-bold text-white">Escrow Protection</span>
                  </div>
                </div>
              </div>
            </FadeUp>

          </div>
        </div>
      </section>

      {/* ─── ECOSYSTEM ───────────────────────────────────────── */}
      <section id="ekosistem" className="py-24 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.018] pointer-events-none">
          <svg viewBox="0 0 500 320" className="w-full max-w-3xl" fill="#006837">
            <ellipse cx="250" cy="160" rx="230" ry="120" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <FadeUp className="text-center mb-18">
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1a2e1e] tracking-tight">
              Dari petani, untuk bisnis lokal.
            </h2>
            <p className="mt-3 text-[#6B7A6F] text-base max-w-xl mx-auto">
              TumbasNa menghubungkan setiap pelaku rantai pasok pangan Banyumas menjadi satu ekosistem yang efisien.
            </p>
          </FadeUp>

          {/* Desktop horizontal hub */}
          <div className="hidden lg:flex items-center justify-center gap-0 mt-14">
            {/* Left nodes */}
            <div className="flex flex-col gap-10">
              {[
                { icon: <Sprout className="w-6 h-6" />,   label: 'Petani Lokal',       sub: '94+ petani Banyumas',          bg: 'bg-[#EEF6E5]', text: 'text-[#5A8A2A]', border: 'border-[#C5E0A0]' },
                { icon: <Warehouse className="w-6 h-6" />, label: 'Supplier & Pengepul', sub: '63+ supplier terverifikasi',      bg: 'bg-[#FFF4E5]', text: 'text-[#B07020]', border: 'border-[#F5D08A]' },
              ].map((node, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="flex flex-col items-center gap-2.5">
                    <div className={`w-16 h-16 rounded-2xl ${node.bg} ${node.border} border flex items-center justify-center ${node.text} shadow-sm`}>
                      {node.icon}
                    </div>
                    <p className="text-[13px] font-bold text-[#1a2e1e] text-center">{node.label}</p>
                    <p className="text-[10px] text-[#9CA8A0] text-center">{node.sub}</p>
                  </div>
                </FadeUp>
              ))}
            </div>

            {/* Left connector */}
            <div className="relative w-24 h-36 mx-6">
              {[0, 1].map(i => (
                <div key={i} className="absolute overflow-hidden rounded-full"
                  style={{ top: i === 0 ? '12%' : '55%', left: 0, right: 0, height: '3px' }}
                >
                  <div className="w-full h-full bg-[#E0EDD6] relative overflow-hidden">
                    <motion.div
                      className="absolute top-0 h-full w-10 bg-gradient-to-r from-transparent via-[#8CC63F] to-transparent"
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', delay: i * 0.9 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Center: TumbasNa hub */}
            <FadeUp delay={0.2}>
              <div className="flex flex-col items-center gap-2 mx-2">
                <div className="py-2 flex items-center justify-center">
                  <img src="/logo.png" alt="TumbasNa" className="h-10 sm:h-12 w-auto object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#9CA8A0]">Digital Food Infrastructure</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8CC63F] animate-pulse" />
                    <p className="text-[9px] text-[#8CC63F] font-semibold">Banyumas, Jawa Tengah</p>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Right connector */}
            <div className="relative w-24 h-36 mx-6">
              {[0, 1].map(i => (
                <div key={i} className="absolute overflow-hidden rounded-full"
                  style={{ top: i === 0 ? '12%' : '55%', left: 0, right: 0, height: '3px' }}
                >
                  <div className="w-full h-full bg-[#FAE9D0] relative overflow-hidden">
                    <motion.div
                      className="absolute top-0 h-full w-10 bg-gradient-to-r from-transparent via-[#F7941D] to-transparent"
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', delay: i * 0.9 + 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right nodes */}
            <div className="flex flex-col gap-10">
              {[
                { icon: <Store className="w-6 h-6" />,    label: 'UMKM Kuliner',       sub: 'XX+ warung & restoran',         bg: 'bg-[#FFF4E5]', text: 'text-[#B07020]', border: 'border-[#F5D08A]' },
                { icon: <Users className="w-6 h-6" />,    label: 'Konsumen Akhir',     sub: 'Harga lebih terjangkau',        bg: 'bg-[#EEF6E5]', text: 'text-[#5A8A2A]', border: 'border-[#C5E0A0]' },
              ].map((node, i) => (
                <FadeUp key={i} delay={0.3 + i * 0.1}>
                  <div className="flex flex-col items-center gap-2.5">
                    <div className={`w-16 h-16 rounded-2xl ${node.bg} ${node.border} border flex items-center justify-center ${node.text} shadow-sm`}>
                      {node.icon}
                    </div>
                    <p className="text-[13px] font-bold text-[#1a2e1e] text-center">{node.label}</p>
                    <p className="text-[10px] text-[#9CA8A0] text-center">{node.sub}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

          {/* Mobile vertical */}
            <div className="lg:hidden space-y-0 mt-10">
              {[
                { icon: <Sprout className="w-5 h-5" />,    label: 'Petani Lokal',       sub: '94+ petani Banyumas',       bg: 'bg-[#EEF6E5]', text: 'text-[#5A8A2A]', border: 'border-[#C5E0A0]' },
                { icon: <Warehouse className="w-5 h-5" />, label: 'Supplier & Pengepul', sub: '63+ supplier terverifikasi', bg: 'bg-[#FFF4E5]', text: 'text-[#B07020]', border: 'border-[#F5D08A]' },
                { icon: null,                               label: 'TumbasNa',            sub: 'Digital Food Infrastructure',bg: 'bg-white',    text: 'text-[#006837]', border: 'border-[#E8EDE9]', isHub: true },
                { icon: <Store className="w-5 h-5" />,     label: 'UMKM Kuliner',        sub: '847+ warung & restoran',    bg: 'bg-[#FFF4E5]', text: 'text-[#B07020]', border: 'border-[#F5D08A]' },
                { icon: <Users className="w-5 h-5" />,     label: 'Konsumen Akhir',      sub: 'Harga lebih terjangkau',    bg: 'bg-[#EEF6E5]', text: 'text-[#5A8A2A]', border: 'border-[#C5E0A0]' },
              ].map((node, i, arr) => (
                <React.Fragment key={i}>
                  <FadeUp delay={i * 0.08}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${node.bg} ${node.border} border flex items-center justify-center ${node.text} shadow-sm flex-shrink-0`}>
                        {node.isHub ? <img src="/logo.png" alt="TumbasNa" className="h-7 w-auto object-contain" /> : node.icon}
                      </div>
                      <div className="bg-[#FAFCFA] flex-1 rounded-xl p-3.5 border border-[#E8EDE9]">
                        <p className="font-bold text-[#1a2e1e] text-[14px]">{node.label}</p>
                        <p className="text-[11px] text-[#9CA8A0] mt-0.5">{node.sub}</p>
                      </div>
                    </div>
                  </FadeUp>
                {i < arr.length - 1 && (
                  <div className="flex justify-start pl-7 h-6 overflow-hidden">
                    <div className="w-px h-full bg-[#E8EDE9] relative overflow-hidden">
                      <motion.div
                        className="absolute w-full bg-[#8CC63F] rounded-full"
                        style={{ height: '40%' }}
                        animate={{ y: ['-100%', '250%'] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'linear', delay: i * 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>


        </div>
      </section>



      {/* ─── TESTIMONIAL ─────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-[#081C10] relative overflow-hidden text-white border-y border-white/5">
        {/* Subtle Ambient Lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8CC63F]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#F7941D]/8 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-white tracking-tight leading-tight">
              &ldquo;Sekarang lebih mudah, lebih cepat.&rdquo;
            </h2>
            <p className="mt-3 text-white/70 text-base max-w-lg mx-auto">
              Pengalaman nyata dari para pemilik warung, restoran, dan petani lokal Banyumas.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                photo:   '/testimonial_ratna.jpg',
                name:    'Ratna Dewi',
                role:    'Pemilik Warung Mie Ayam',
                loc:     'Purwokerto',
                persona: 'UMKM Kuliner',
                text:    'Dulu saya harus bangun subuh dan ke pasar cari bahan sendiri. Sekarang tinggal kirim pesan, barang sampai siang. Hemat waktu, hemat bensin.',
                accent:  '#F7941D',
              },
              {
                photo:   '/testimonial_budi.jpg',
                name:    'Budi Prasetyo',
                role:    'Pemilik Restoran',
                loc:     'Purwokerto Selatan',
                persona: 'UMKM Kuliner',
                text:    'Restoran saya tidak pernah lagi kehabisan stok bahan pokok. Harga langsung bisa saya bandingkan, dan selalu kompetitif.',
                accent:  '#8CC63F',
              },
              {
                photo:   '/testimonial_sumarno.jpg',
                name:    'Pak Sumarno',
                role:    'Petani Sayur Lokal',
                loc:     'Sumbang, Banyumas',
                persona: 'Petani',
                text:    'Hasil panen saya sekarang bisa terdistribusi lebih cepat ke pembeli langsung. Tidak ada lagi sayur segar yang terbuang sia-sia.',
                accent:  '#F7941D',
              },
            ].map((t, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="bg-white/[0.04] backdrop-blur-md p-7 sm:p-8 rounded-2xl border border-white/10 hover:border-[#8CC63F]/40 hover:bg-white/[0.07] transition-all duration-300 flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex gap-1 mb-5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className="w-4 h-4 text-[#F7941D] fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-white/90 text-[14.5px] font-medium leading-relaxed mb-6 italic">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                  </div>
                  <div className="flex items-center gap-3.5 pt-5 border-t border-white/10">
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-[#8CC63F]/60 group-hover:border-[#8CC63F] transition-colors shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-[14px]">{t.name}</p>
                        <span className="text-[9px] font-extrabold text-[#081C10] bg-[#8CC63F] px-2 py-0.5 rounded-full">{t.persona}</span>
                      </div>
                      <p className="text-[11.5px] text-white/50">{t.role} &middot; {t.loc}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1a2e1e] tracking-tight">
              Pertanyaan umum
            </h2>
            <p className="mt-3 text-[#6B7A6F] text-base max-w-md mx-auto">
              Segala hal yang perlu Anda ketahui tentang platform TumbasNa.
            </p>
          </FadeUp>

          <div className="space-y-4">
            {[
              {
                q: 'Apakah TumbasNa hanya untuk UMKM di Banyumas?',
                a: 'Saat ini TumbasNa berfokus pada ekosistem pangan Banyumas dan Eks-Karesidenan Banyumas. Kami membangun ekosistem lokal yang kuat sebelum melakukan ekspansi ke wilayah lain.',
              },
              {
                q: 'Apakah supplier di TumbasNa sudah diverifikasi?',
                a: 'Ya, setiap supplier melewati proses verifikasi ketat sebelum bergabung. Trust Score membantu Anda memilih supplier berdasarkan rating, riwayat pengiriman, dan kualitas produk.',
              },
              {
                q: 'Apakah ada biaya pendaftaran untuk UMKM?',
                a: 'Tidak ada biaya pendaftaran maupun langganan. Mendaftar dan menggunakan fitur dasar TumbasNa sepenuhnya gratis untuk UMKM kuliner.',
              },
              {
                q: 'Metode pembayaran apa saja yang didukung?',
                a: 'Kami mendukung QRIS, transfer bank otomatis (BCA, Mandiri, BRI, BNI), GoPay, OVO, dan Dana. Sistem escrow memastikan dana Anda 100% aman hingga barang tiba.',
              },
              {
                q: 'Apakah supplier perlu install aplikasi khusus?',
                a: 'Tidak. Supplier dapat menerima pesanan, mengonfirmasi stok, dan memperbarui harga langsung via WhatsApp. Tanpa instalasi rumit maupun training khusus.',
              },
            ].map((faq, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="border border-[#E8EDE9] rounded-2xl overflow-hidden bg-white hover:border-[#006837]/30 hover:shadow-md transition-all duration-300">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 md:px-8 md:py-6 text-left focus-visible:outline-none group"
                  >
                    <span className="font-bold text-[#1a2e1e] text-[15px] sm:text-base md:text-[17px] pr-6 group-hover:text-[#006837] transition-colors leading-snug">
                      {faq.q}
                    </span>
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      activeFaq === i ? 'bg-[#F7941D] text-white rotate-0 shadow-sm' : 'bg-[#F0F4F0] text-[#6B7A6F] group-hover:bg-[#006837]/10 group-hover:text-[#006837]'
                    }`}>
                      {activeFaq === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-6 pb-6 md:px-8 md:pb-7 text-[#556658] text-[14px] md:text-[15px] leading-relaxed border-t border-[#E8EDE9]/80 pt-5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-[#FBF9F4]">
        <FadeUp>
          <div className="max-w-5xl mx-auto bg-[#0B1E12] border border-[#8CC63F]/20 rounded-[32px] p-8 sm:p-14 lg:p-16 text-center relative overflow-hidden shadow-[0_24px_60px_rgba(0,104,55,0.12)]">
            {/* Ambient Lighting */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#8CC63F]/12 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#F7941D]/10 blur-[120px] rounded-full pointer-events-none" />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white mb-4 leading-[1.15] tracking-tight">
                Fokus jualan usahamu.<br />
                <span className="text-[#8CC63F]">Bahan baku serahkan ke TumbasNa.</span>
              </h2>

              {/* Description */}
              <p className="text-white/70 text-base sm:text-lg mb-9 max-w-lg leading-relaxed font-normal">
                Pasokan bahan baku yang lebih cepat, transparan, dan terpercaya langsung dari petani &amp; supplier lokal.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto justify-center items-center mb-8">
                <a
                  id="final-cta-primary"
                  href="https://app.tumbasna.my.id"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#F7941D] text-white px-8 py-3.5 rounded-xl text-[15px] font-extrabold shadow-md hover:bg-[#e08312] hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(247,148,29,0.35)] transition-all duration-200 active:scale-[0.98]"
                >
                  Mulai Belanja
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  id="final-cta-secondary"
                  href="https://wa.me/6285190943468"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3.5 rounded-xl text-[15px] font-bold hover:bg-white/20 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                >
                  <Handshake className="w-4 h-4 text-white" />
                  Jadi Mitra
                </a>
              </div>

              {/* Minimalist Trust Footer */}
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[12px] font-medium text-white/60 pt-5 border-t border-white/10 w-full">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8CC63F]" /> Gratis pendaftaran</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8CC63F]" /> Supplier terverifikasi</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8CC63F]" /> Tanpa kontrak terikat</span>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="py-10 px-4 sm:px-6 border-t border-[#E8EDE9] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-7">
            <img src="/logo.png" alt="TumbasNa" className="h-10 sm:h-11 w-auto object-contain" />
            <nav className="flex flex-wrap justify-center gap-6">
              {[
                { label: 'Fitur', href: '#fitur' },
                { label: 'Ekosistem', href: '#ekosistem' },
                { label: 'Tentang', href: '#tentang' },
                { label: 'FAQ', href: '#faq' },
              ].map(item => (
                <a key={item.label} href={item.href} className="text-[12px] font-semibold text-[#9CA8A0] hover:text-[#006837] transition-colors">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex gap-5">
              {['Kebijakan Privasi', 'Syarat & Ketentuan'].map(item => (
                <a key={item} href="#" className="text-[11px] text-[#9CA8A0] hover:text-[#006837] transition-colors">{item}</a>
              ))}
            </div>
          </div>
          <div className="border-t border-[#E8EDE9] pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-[#9CA8A0] text-[11px]">
              &copy; 2026 TumbasNa. Hak Cipta Dilindungi.
            </p>
            <p className="text-[10px] text-[#9CA8A0]/60">
              Pasar Digital Komoditas Pangan &middot; Banyumas, Jawa Tengah
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
