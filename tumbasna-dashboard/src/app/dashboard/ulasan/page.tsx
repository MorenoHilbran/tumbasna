"use client";

import React, { useEffect, useState } from "react";
import { Star, MessageSquare, RefreshCw, Filter, ShoppingBag, User } from "lucide-react";

interface ReviewItem {
  id: string;
  orderId: string;
  supplierName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  order?: {
    id: string;
    buyer?: {
      name: string | null;
      phoneNumber: string | null;
      businessName: string | null;
    } | null;
  } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("ALL");
  const [filterRating, setFilterRating] = useState<number>(0);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reviews");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil ulasan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const suppliers = Array.from(new Set(reviews.map((r) => r.supplierName)));

  const filteredReviews = reviews.filter((r) => {
    const matchSupplier = selectedSupplier === "ALL" || r.supplierName === selectedSupplier;
    const matchRating = filterRating === 0 || r.rating === filterRating;
    return matchSupplier && matchRating;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-[#006837]" />
            Ulasan & Rating Pembeli
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau kualitas layanan supplier & kepuasan pembeli komoditas Tumbasna.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#006837]/10 text-[#006837] rounded-xl text-sm font-semibold hover:bg-[#006837]/20 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-6 h-6 fill-amber-400 stroke-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rata-rata Rating</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{avgRating} / 5.0</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#006837] flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Ulasan</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{reviews.length} Ulasan</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Supplier Diulas</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{suppliers.length} Supplier</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Filter className="w-4 h-4" /> Filter Supplier:
          </span>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#006837]"
          >
            <option value="ALL">Semua Supplier</option>
            {suppliers.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Rating:</span>
          {[0, 5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterRating === r
                  ? "bg-[#006837] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r === 0 ? "Semua" : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#006837]" />
            Memuat ulasan...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            Belum ada ulasan yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Tanggal & Transaksi</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Pembeli</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Ulasan Komentar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{rev.orderId}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[#006837]">{rev.supplierName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-800">
                            {rev.order?.buyer?.name || rev.order?.buyer?.businessName || "Pembeli Tumbasna"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {rev.order?.buyer?.phoneNumber || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= rev.rating
                                ? "fill-amber-400 text-amber-500"
                                : "text-gray-200 fill-gray-100"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs font-bold text-gray-700">{rev.rating}.0</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {rev.comment ? (
                        <p className="text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 italic text-xs">
                          "{rev.comment}"
                        </p>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Tanpa ulasan teks</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
