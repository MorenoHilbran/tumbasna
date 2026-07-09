'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, TrendingUp, Users, Activity, Package, Search, Cpu, Truck, Star, Plus, Minus, Menu, X } from 'lucide-react';

const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1a2e1e] font-sans antialiased overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="fixed top-6 left-0 right-0 mx-auto w-[90%] max-w-4xl z-50"
      >
        <div className="bg-[#FBF9F4]/90 backdrop-blur-xl border border-[#006837]/10 rounded-full px-6 md:px-8 h-14 md:h-16 flex items-center justify-between shadow-[0_8px_30px_rgb(0,104,55,0.08)] relative">
          
          <div className="flex items-center z-10">
            <img src="/logo.png" alt="Tumbasna logo" className="h-7 md:h-8 w-auto" />
          </div>
          
          <div className="hidden md:flex absolute inset-y-0 left-0 right-0 justify-center items-center gap-10 text-[13px] font-bold text-[#006837] uppercase tracking-wider z-0">
            <a href="#" className="hover:text-[#F7941D] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#F7941D] hover:after:w-full after:transition-all after:duration-300">Beranda</a>
            <a href="#cara-kerja" className="hover:text-[#F7941D] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#F7941D] hover:after:w-full after:transition-all after:duration-300">Cara Kerja</a>
            <a href="#fitur" className="hover:text-[#F7941D] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#F7941D] hover:after:w-full after:transition-all after:duration-300">Fitur AI</a>
            <a href="#faq" className="hover:text-[#F7941D] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#F7941D] hover:after:w-full after:transition-all after:duration-300">Bantuan</a>
          </div>

          <div className="md:hidden flex items-center z-10">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#006837] focus:outline-none">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className="hidden md:flex w-[120px] z-10 justify-end">
             {/* Spacer to keep center menu centered */}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-0 right-0 mx-auto w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-40 border border-[#006837]/10 flex flex-col gap-4 text-center md:hidden"
          >
            <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[#006837] hover:text-[#F7941D]">Beranda</a>
            <a href="#cara-kerja" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[#006837] hover:text-[#F7941D]">Cara Kerja</a>
            <a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[#006837] hover:text-[#F7941D]">Fitur AI</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[#006837] hover:text-[#F7941D]">Bantuan</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 flex flex-col items-center">
        {/* Soft Background Accents */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#8CC63F]/20 blur-[120px] rounded-full -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-[#006837] leading-[1.1] mb-6 md:mb-8 tracking-tight">
              Pasar Digital <span className="font-serif italic font-semibold text-[#8CC63F]">Terpercaya</span> <br />
              <span className="text-[#F7941D]">di Kabupaten </span>
              <span className="font-serif italic font-semibold text-[#F7941D]">Banyumas</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-[#6B7A6F] mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Menghubungkan <strong className="text-[#006837]">Pembeli (UMKM Banyumas)</strong> dan <strong className="text-[#F7941D]">Petani/Supplier Lokal Banyumas</strong> secara langsung. Belanja kolektif bahan pangan segar dengan sistem harga transparan dan logistik cerdas terintegrasi AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <a
                href="https://mobile.tumbasna.my.id"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#006837] text-white px-8 py-4 rounded-xl text-sm md:text-base font-bold hover:bg-[#005b30] hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-[#006837]/20"
              >
                Aplikasi Buyer (Mobile)
              </a>
              <a 
                href="https://wa.me/6285190859889"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#F7941D] text-white px-8 py-4 rounded-xl text-sm md:text-base font-bold hover:bg-[#d4831b] hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-[#F7941D]/20"
              >
                Supplier via WhatsApp
              </a>
            </div>
          </motion.div>
        </div>

        {/* Mockup Preview - Dashboard Snippet */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-12 md:mt-20 w-full max-w-5xl mx-auto p-3 md:p-4 rounded-3xl bg-white border border-[#006837]/10 shadow-2xl relative overflow-hidden"
        >
          <div className="bg-[#FBF9F4] rounded-2xl overflow-hidden border border-[#006837]/5">
             <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-1 md:col-span-4 space-y-4 md:space-y-6">
                   <div className="bg-[#006837] rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-[#006837]/20">
                      <p className="text-[#F7941D] text-[10px] font-bold mb-2 tracking-widest">PESANAN TERDAFTAR</p>
                      <h4 className="text-2xl font-bold text-white mb-4 italic font-serif">12 Pesanan Aktif</h4>
                      <button className="bg-[#F7941D] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#d4831b] transition-colors">PANTAU STATUS</button>
                      <Package className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5 rotate-[-15deg]" />
                   </div>
                   <div className="bg-white rounded-2xl p-6 border border-[#006837]/10 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FDF4E9] text-[#F7941D] flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[#9EA8A2] text-[10px] font-bold tracking-widest mb-1">PENGELUARAN BULAN INI</p>
                        <h4 className="text-xl font-bold text-[#006837]">Rp 15.420.000</h4>
                      </div>
                   </div>
                </div>
                 <div className="col-span-1 md:col-span-8 bg-white rounded-2xl p-4 md:p-6 border border-[#006837]/10 shadow-sm relative">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#006837] text-[#F7941D] flex items-center justify-center shadow-md">
                          <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-[#006837] font-bold text-sm">TUMBASNA AI</h5>
                            <span className="bg-[#EFF8F0] text-[#8CC63F] text-[9px] font-bold px-2 py-0.5 rounded border border-[#8CC63F]/30">PINTAR</span>
                          </div>
                          <p className="text-[#6B7A6F] text-[11px]">Rekomendasi Rantai Pasok UMKM</p>
                        </div>
                      </div>
                   </div>
                   <div className="bg-[#FFF9F3] border border-[#F7941D]/20 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-[#F7941D]" />
                        <h6 className="font-bold text-[#006837] text-sm">Prediksi Harga Cabai & Kentang di Banyumas</h6>
                      </div>
                      <p className="text-[#5C675F] text-xs leading-relaxed mb-4">
                        Harga Kentang Dieng Super di pasar Banyumas diprediksi naik sebesar 12% dalam 7 hari ke depan karena penurunan pasokan regional di Jawa Tengah. Disarankan mengamankan stok sekarang via supplier terverifikasi.
                      </p>
                      <button className="w-full bg-[#006837] text-white text-[10px] md:text-xs font-bold py-3 md:py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-[#005b30] transition-colors">
                        BELI KOMODITAS SEKARANG <ArrowRight className="w-3 h-3" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Mitra Kami */}
      <section className="py-12 border-y border-[#006837]/5 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-[#6B7A6F] tracking-widest uppercase mb-8">Telah Dipercaya Oleh</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="text-xl font-bold font-serif text-[#006837]">Pemkab Banyumas</div>
             <div className="text-xl font-bold font-serif text-[#006837]">TPID Banyumas</div>
             <div className="text-xl font-bold font-serif text-[#006837]">Dinkop UKM Banyumas</div>
             <div className="text-xl font-bold font-serif text-[#006837]">BI Purwokerto</div>
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="py-24 px-6 relative bg-[#FBF9F4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <p className="text-[#F7941D] text-xs font-bold tracking-widest mb-3 uppercase">Alur Proses</p>
             <h2 className="text-3xl md:text-5xl font-extrabold text-[#006837] tracking-tight">
               Cara Kerja <span className="font-serif italic font-semibold text-[#F7941D]">Tumbasna</span> Banyumas
             </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
             {/* Line connecting steps */}
             <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-gradient-to-r from-[#006837]/10 via-[#F7941D]/30 to-[#006837]/10 -z-10"></div>
             
             {[
               { icon: <Search className="w-8 h-8" />, title: "Cari Komoditas", desc: "Temukan komoditas pangan yang Anda butuhkan dengan harga grosir terbaik di pasar." },
               { icon: <Cpu className="w-8 h-8" />, title: "AI Matching", desc: "Sistem cerdas kami akan mencocokkan Anda dengan supplier terverifikasi atau kelompok beli bersama." },
               { icon: <Truck className="w-8 h-8" />, title: "Transaksi & Kirim", desc: "Lakukan pembayaran dengan aman dan pantau status pengiriman langsung dari dashboard." }
             ].map((step, i) => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ delay: i * 0.2, duration: 0.6 }}
                 className="relative text-center"
               >
                 <div className="w-24 h-24 mx-auto bg-white border border-[#006837]/10 rounded-full flex items-center justify-center text-[#006837] mb-6 shadow-xl shadow-[#006837]/5 hover:scale-110 transition-transform duration-300">
                   <div className="w-16 h-16 bg-[#FDF4E9] rounded-full flex items-center justify-center text-[#F7941D]">
                      {step.icon}
                   </div>
                 </div>
                 <div className="absolute top-0 right-1/3 translate-x-8 bg-[#006837] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                   {i + 1}
                 </div>
                 <h4 className="text-xl font-bold text-[#006837] mb-3">{step.title}</h4>
                 <p className="text-[#6B7A6F] text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section className="py-20 px-6 bg-[#006837] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8CC63F]/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F7941D]/20 blur-[100px] rounded-full"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 relative z-10 text-center">
          {[
            { value: "5.000+", label: "UMKM Tergabung" },
            { value: "300+", label: "Supplier Terverifikasi" },
            { value: "Rp 10M+", label: "Transaksi Sukses" },
            { value: "99%", label: "Tingkat Kepuasan" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-3 font-serif italic">{stat.value}</h3>
              <p className="text-[#8CC63F] font-bold text-xs md:text-sm uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features AI */}
      <section id="fitur" className="py-24 px-6 relative bg-white border-y border-[#006837]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <p className="text-[#F7941D] text-xs font-bold tracking-widest mb-3 uppercase">Fitur Unggulan</p>
             <h2 className="text-3xl md:text-5xl font-extrabold text-[#006837] tracking-tight">
               Kekuatan AI <span className="font-serif italic font-semibold text-[#8CC63F]">Tumbasna</span>
             </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Prediksi Tren Harga", 
                desc: "Antisipasi fluktuasi harga komoditas pangan di pasar berkat algoritma prediksi AI yang akurat untuk menjaga margin keuntungan.", 
                icon: <TrendingUp className="w-8 h-8" /> 
              },
              { 
                title: "Supplier Terbaik", 
                desc: "Dapatkan rekomendasi pemasok terpercaya berdasarkan tingkat kepuasan, kualitas produk, dan ketepatan waktu pengiriman.", 
                icon: <ShieldCheck className="w-8 h-8" /> 
              },
              { 
                title: "Program Beli Bersama", 
                desc: "Gabung bersama UMKM lain untuk membeli komoditas secara kolektif agar mendapatkan harga grosir terbaik.", 
                icon: <Users className="w-8 h-8" /> 
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="p-8 rounded-3xl bg-[#FBF9F4] border border-[#006837]/10 hover:border-[#F7941D]/40 hover:shadow-xl hover:shadow-[#F7941D]/5 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#006837] text-[#F7941D] flex items-center justify-center mb-6 shadow-lg shadow-[#006837]/20 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-[#006837] mb-3">{feature.title}</h4>
                <p className="text-[#6B7A6F] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <section className="py-24 px-6 bg-white border-y border-[#006837]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <p className="text-[#F7941D] text-xs font-bold tracking-widest mb-3 uppercase">Testimoni</p>
             <h2 className="text-3xl md:text-5xl font-extrabold text-[#006837] tracking-tight">
               Kisah Sukses <span className="font-serif italic font-semibold text-[#F7941D]">UMKM</span>
             </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Budi Santoso", role: "Pemilik Resto Padang Purwokerto", text: "Semenjak pakai Tumbasna, restoran saya di Purwokerto tidak pernah kehabisan stok cabai. AI rekomendasinya sangat akurat dan harga selalu bersaing." },
              { name: "Siti Aminah", role: "Pengusaha Katering Baturraden", text: "Fitur Beli Bersama benar-benar menyelamatkan margin keuntungan katering saya di Baturraden. Bisa beli bahan baku lebih murah tanpa harus menimbun banyak stok." },
              { name: "Hendra Wijaya", role: "Petani Sayur Sumbang", text: "Sebagai supplier sayur dari Sumbang Banyumas, Tumbasna membantu saya mendistribusikan hasil panen dengan cepat. Tidak ada lagi sayur segar yang terbuang sia-sia." }
            ].map((testi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-[#FBF9F4] p-8 rounded-3xl border border-[#006837]/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-6 text-[#F7941D]">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-[#1a2e1e] font-medium leading-relaxed mb-8 italic text-sm">"{testi.text}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#006837]/10 rounded-full flex items-center justify-center text-[#006837] font-bold text-lg">
                    {testi.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-[#006837] text-sm">{testi.name}</h5>
                    <p className="text-xs text-[#6B7A6F]">{testi.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-[#FBF9F4]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
             <p className="text-[#F7941D] text-xs font-bold tracking-widest mb-3 uppercase">Tanya Jawab</p>
             <h2 className="text-3xl md:text-5xl font-extrabold text-[#006837] tracking-tight">
               Pertanyaan <span className="font-serif italic font-semibold text-[#F7941D]">Umum</span>
             </h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Apakah supplier di Tumbasna sudah diverifikasi?", a: "Ya, seluruh supplier yang tergabung dalam Tumbasna telah melewati proses verifikasi ketat untuk memastikan kualitas dan keandalan pengiriman." },
              { q: "Bagaimana cara kerja fitur Beli Bersama?", a: "Fitur ini menggabungkan permintaan dari beberapa UMKM untuk komoditas yang sama. Dengan volume yang besar, Anda akan mendapatkan harga grosir langsung dari petani atau supplier besar." },
              { q: "Apakah ada biaya pendaftaran untuk UMKM?", a: "Tidak ada biaya pendaftaran. Membuat akun dan menggunakan fitur AI Tumbasna sepenuhnya gratis untuk UMKM." },
              { q: "Metode pembayaran apa saja yang didukung?", a: "Kami mendukung berbagai metode pembayaran aman termasuk transfer bank, virtual account, dan e-wallet yang terintegrasi langsung dalam platform." }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white border border-[#006837]/10 rounded-2xl overflow-hidden shadow-sm"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-bold text-[#006837] text-sm md:text-base">{faq.q}</span>
                  {activeFaq === i ? <Minus className="w-5 h-5 text-[#F7941D] flex-shrink-0" /> : <Plus className="w-5 h-5 text-[#006837] flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6 pt-0 text-[#6B7A6F] text-sm leading-relaxed border-t border-[#006837]/5 mt-2 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Action */}
      <section id="keunggulan" className="py-32 px-6 text-center bg-white border-t border-[#006837]/5">
         <motion.div
           whileInView={{ opacity: [0, 1], scale: [0.95, 1] }}
           viewport={{ once: true }}
           className="max-w-4xl mx-auto bg-[#006837] rounded-[40px] p-8 md:p-20 shadow-2xl relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8CC63F]/30 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F7941D]/30 blur-3xl rounded-full"></div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 relative z-10 font-serif italic">
               Pilih Peran Anda
            </h2>
            <p className="text-base sm:text-lg text-[#EFF8F0]/90 mb-10 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
               Sebagai <strong className="text-white">Buyer (UMKM Banyumas)</strong>, nikmati fitur AI (Tren Harga & Supplier Terbaik) dan gabung di Program Beli Bersama di aplikasi Mobile. <br/> Sebagai <strong className="text-[#F7941D]">Supplier Perorangan</strong> (Petani/Pengepul Banyumas), mulai pasarkan stok Anda ke jaringan UMKM kami langsung melalui WhatsApp.
            </p>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-center items-center">
              <a href="https://mobile.tumbasna.my.id" className="w-full md:w-auto inline-flex items-center justify-center gap-4 bg-white px-10 py-5 rounded-2xl text-lg font-bold text-[#006837] shadow-xl hover:bg-[#FBF9F4] hover:scale-105 transition-all active:scale-95 group">
                 Buka Aplikasi Buyer
                 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="https://wa.me/6285190859889" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto inline-flex items-center justify-center gap-4 bg-[#F7941D] px-10 py-5 rounded-2xl text-lg font-bold text-white shadow-xl hover:bg-[#d4831b] hover:scale-105 transition-all active:scale-95 group">
                 Mulai Jadi Supplier (WA)
                 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
         </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#006837]/10 bg-white">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <img src="/logo.png" alt="Tumbasna logo" className="h-8 w-auto opacity-90" />
            </div>
            <div className="flex gap-6">
              {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Bantuan'].map(item => (
                <a key={item} href="#" className="text-xs font-semibold text-[#6B7A6F] hover:text-[#006837] transition-colors">{item}</a>
              ))}
            </div>
            <p className="text-[#6B7A6F] text-xs font-medium">© 2026 Tumbasna. Hak Cipta Dilindungi.</p>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
