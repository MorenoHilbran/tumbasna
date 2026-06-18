'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, ShieldCheck, Zap, Globe, TrendingUp, Users, Activity, CheckCircle2, Package, ShoppingCart } from 'lucide-react';

const LandingPage = () => {
  const waLink = "https://wa.me/6285190859889";

  const [activeStepTab, setActiveStepTab] = React.useState<'supplier' | 'buyer'>('supplier');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-emerald-500/30 antialiased overflow-x-hidden" style={{ fontFamily: '"Mona Sans", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      
      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="tumbasna logo" className="h-10 w-auto" />
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
            <a href="#" className="hover:text-emerald-400 transition-colors">Beranda</a>
            <a href="#fitur" className="hover:text-emerald-400 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-emerald-400 transition-colors">Cara Pakai</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2.5 rounded-full text-[14px] font-bold shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
          >
            Hubungkan WA <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] bg-emerald-600/5 blur-[100px] rounded-full -z-10 animate-pulse"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full mb-8 border border-white/10 shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[12px] font-bold text-emerald-400 tracking-[0.2em] uppercase">Masa Depan Perdagangan Hasil Bumi</p>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[72px] font-extrabold text-white leading-[1.05] mb-8 tracking-tighter italic">
              Hubungkan Hasil Bumi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-green-500">Ke Pembeli Terbaik</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Pasarkan stok hasil panen Anda ke jaringan pembeli terpercaya secara instan. Tidak perlu aplikasi rumit, cukup chat di WhatsApp dan biar AI kami yang mencarikan mitra bisnis terbaik untuk Anda.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black px-12 py-4 rounded-2xl text-lg font-bold hover:bg-slate-200 hover:scale-[1.02] transition-all active:scale-95 shadow-2xl shadow-white/5"
              >
                Mulai Gratis Sekarang
              </a>
              <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 backdrop-blur-md text-white border border-white/10 px-12 py-4 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all">
                Pelajari Fitur
              </button>
            </div>
          </motion.div>
        </div>

        {/* Mockup Preview - Synthetic Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-24 w-full max-w-6xl mx-auto p-4 rounded-[40px] bg-gradient-to-b from-white/10 to-transparent border border-white/10 backdrop-blur-sm relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="bg-[#0b1120] rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
             <div className="h-10 border-b border-white/5 px-6 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                <div className="ml-4 text-[11px] text-slate-500 font-medium">tumbasna-dashboard-v2.0</div>
             </div>
             <div className="p-8 grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4 space-y-6">
                   <div className="h-40 bg-white/5 rounded-3xl p-6 border border-white/5">
                      <p className="text-slate-500 text-xs font-bold mb-1">TOTAL DEMAND</p>
                      <h4 className="text-3xl font-bold text-white mb-4">41,510 <span className="text-emerald-500 text-sm">TON</span></h4>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                         <div className="bg-emerald-500 h-full w-[65%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      </div>
                   </div>
                   <div className="h-40 bg-white/5 rounded-3xl p-6 border border-white/5">
                      <p className="text-slate-500 text-xs font-bold mb-1">HARGA RATA-RATA</p>
                      <h4 className="text-3xl font-bold text-white mb-4">Rp 12.344 <span className="text-emerald-500 text-sm">/KG</span></h4>
                      <div className="flex items-end gap-1 h-12">
                         {[40, 70, 45, 90, 65, 80, 50, 75].map((h, i) => (
                           <div key={i} className="flex-1 bg-emerald-500/30 rounded-t-sm" style={{ height: `${h}%` }}></div>
                         ))}
                      </div>
                   </div>
                </div>
                 <div className="col-span-12 md:col-span-8 bg-white/5 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl"></div>
                   <div className="flex justify-between items-center mb-8">
                      <h5 className="text-lg font-bold">Tren Pasar Real-Time</h5>
                      <div className="flex gap-2">
                         <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-slate-400">Week</div>
                         <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400">Month</div>
                      </div>
                   </div>
                   <div className="h-64 flex items-end gap-4">
                      {[60, 40, 75, 45, 90, 65, 100, 80, 55, 70, 40, 85].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/5 to-emerald-500/40 rounded-t-lg group-hover:from-emerald-500/20 transition-all duration-500" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* How to Use (Cara Pakai) - Dynamic Transition */}
      <section id="cara-kerja" className="py-40 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full -z-10"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 italic">
             <p className="text-emerald-400 text-xs font-black tracking-widest mb-4 uppercase">User Guide</p>
             <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Panduan Penggunaan</h2>
             
             {/* Mode Selector */}
             <div className="flex justify-center gap-4 bg-white/5 p-2 rounded-[24px] w-fit mx-auto border border-white/5 mb-20 shadow-2xl">
                <button 
                  onClick={() => setActiveStepTab('supplier')}
                  className={`px-10 py-4 rounded-[18px] text-xs font-black tracking-widest transition-all ${activeStepTab === 'supplier' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  SEBAGAI SUPPLIER
                </button>
                <button 
                  onClick={() => setActiveStepTab('buyer')}
                  className={`px-10 py-4 rounded-[18px] text-xs font-black tracking-widest transition-all ${activeStepTab === 'buyer' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  SEBAGAI BUYER
                </button>
             </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {(activeStepTab === 'supplier' ? [
              { title: "Input Data", desc: "Informasikan stok barang Anda lewat chat WhatsApp Bot.", icon: <Package className="w-8 h-8" /> },
              { title: "Verifikasi Lokasi", desc: "AI akan memetakan lokasi barang Anda secara presisi.", icon: <Globe className="w-8 h-8" /> },
              { title: "Matching Mitra", desc: "Dapatkan notifikasi pembeli yang paling cocok dengan stok Anda.", icon: <Users className="w-8 h-8" /> },
              { title: "Closing Order", desc: "Hubungi pembeli secara langsung dan selesaikan transaksi.", icon: <CheckCircle2 className="w-8 h-8" /> }
            ] : [
              { title: "Cari Komoditas", desc: "Ketik barang yang Anda cari (misal: 'Beras Pandan Wangi').", icon: <ShoppingCart className="w-8 h-8" /> },
              { title: "Cek Penawaran", desc: "Lihat daftar stok terdekat beserta harga terupdate hari ini.", icon: <Activity className="w-8 h-8" /> },
              { title: "Hubungi Supplier", desc: "AI kami menghubungkan Anda langsung ke nomor supplier.", icon: <MessageCircle className="w-8 h-8" /> },
              { title: "Terima Barang", desc: "Stok sampai tepat waktu dengan harga yang kompetitif.", icon: <ShieldCheck className="w-8 h-8" /> }
            ]).map((step, i) => (
              <motion.div 
                key={`${activeStepTab}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[48px] bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-emerald-500/20 transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeStepTab === 'supplier' ? 'from-emerald-500/20 to-green-500/20 text-emerald-400' : 'from-emerald-500/20 to-teal-500/20 text-emerald-400'} flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <h4 className="text-xl font-bold mb-4">{step.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed italic">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Clean Accordion Style */}
      <section id="faq" className="py-40 px-6 relative border-t border-white/5 bg-white/[0.01]">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-24 italic">
               <p className="text-emerald-400 text-xs font-black tracking-widest mb-4 uppercase">Support Center</p>
               <h2 className="text-4xl md:text-5xl font-black mb-8 italic italic tracking-tighter">Bantuan & Pertanyaan</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               {[
                 { q: "Apakah tumbasna mengenakan biaya?", a: "Tidak. Penggunaan WhatsApp Bot tumbasna untuk pencarian mitra saat ini disediakan secara gratis untuk seluruh pengguna." },
                 { q: "Bagaimana cara bot bekerja?", a: "AI kami menggunakan algoritma matching berbasis lokasi, volume stok, dan riwayat reputasi untuk menemukan partner terbaik." },
                 { q: "Data apa saja yang diperlukan?", a: "Cukup nama barang, volume, harga, dan lokasi. Data Anda aman dan hanya dibagikan ke mitra potensial." },
                 { q: "Apakah bisa kirim barang lewat tumbasna?", a: "tumbasna fokus pada matching dan pemesanan. Untuk pengiriman, Anda tetap bekerjasama langsung dengan mitra pilihan." },
                 { q: "Kenapa harus pakai tumbasna?", a: "Karena lebih cepat, berbasis data real-time, dan tidak perlu mengunduh aplikasi lain—cukup pakai WhatsApp." },
                 { q: "Apakah tersedia di seluruh Indonesia?", a: "Ya, sistem kami menjangkau seluruh wilayah Indonesia selama tersedia jaringan internet dan WhatsApp." }
               ].map((item, i) => (
                 <motion.div 
                   key={i} 
                   whileHover={{ y: -5 }}
                   className="p-10 rounded-[40px] bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all shadow-2xl"
                 >
                    <h5 className="text-lg font-extrabold mb-4 flex items-center gap-3 text-emerald-400">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                       {item.q}
                    </h5>
                    <p className="text-slate-400 text-sm leading-relaxed font-light italic opacity-80">{item.a}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Final Action */}
      <section className="py-48 px-6 text-center">
         <motion.div
           whileInView={{ opacity: [0, 1], scale: [0.95, 1] }}
           viewport={{ once: true }}
           className="max-w-4xl mx-auto"
         >
            <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tighter italic">Ready to scale?</h2>
            <p className="text-xl text-slate-400 mb-16 font-light max-w-xl mx-auto italic">
               Bergabunglah dengan ekosistem digital hasil bumi terbesar di Indonesia. Cepat, Berbasis AI, dan 100% via WhatsApp.
            </p>
            <a href={waLink} className="inline-flex items-center gap-6 bg-gradient-to-r from-emerald-500 to-green-600 px-16 py-7 rounded-[32px] text-2xl font-black text-white shadow-[0_0_60px_-15px_rgba(16,185,129,0.5)] hover:scale-105 transition-all active:scale-95 group">
               Get Started Now
               <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </a>
         </motion.div>
      </section>

      {/* Modern Dark Footer */}
      <footer className="py-24 px-6 border-t border-white/5 bg-black/20">
         <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
            <div className="col-span-1 md:col-span-2 space-y-8">
               <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="tumbasna logo" className="h-10 w-auto" />
               </div>
               <p className="text-slate-500 text-lg leading-relaxed max-w-sm italic">
                  Digitalisasi rantai pasok hasil bumi Indonesia dengan kecerdasan buatan.
               </p>
            </div>
            <div className="space-y-8">
               <h5 className="text-sm font-bold uppercase tracking-widest text-emerald-400 italic">Platform</h5>
               <ul className="space-y-4 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors italic">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors italic">How it works</a></li>
                  <li><a href="#" className="hover:text-white transition-colors italic">Market Insights</a></li>
               </ul>
            </div>
            <div className="space-y-8">
               <h5 className="text-sm font-bold uppercase tracking-widest text-emerald-400 italic">Company</h5>
               <ul className="space-y-4 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors italic">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors italic">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors italic">Terms of Service</a></li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-slate-600 text-sm italic">© 2026 tumbasna. Leading the Agricultural Revolution.</p>
            <div className="flex gap-8">
               {['Twitter', 'Instagram', 'LinkedIn'].map(s => <span key={s} className="text-slate-500 text-xs hover:text-white cursor-pointer transition-colors italic uppercase font-black">{s}</span>)}
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
