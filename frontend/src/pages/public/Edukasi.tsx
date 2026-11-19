import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Filter,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { EducationMaterial } from '../../types/index.js';

export const Edukasi: React.FC = () => {
  const [materials, setMaterials] = useState<EducationMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeArticle, setActiveArticle] = useState<EducationMaterial | null>(null);

  const categories = [
    'Semua',
    'Pemahaman Dasar',
    'Jenis Perundungan',
    'Dunia Digital',
    'Kesehatan Mental',
    'Aksi Nyata',
    'Panduan Lapor',
  ];

  useEffect(() => {
    setLoading(true);
    apiClient
      .getEducationMaterials(search, selectedCategory)
      .then((data) => {
        setMaterials(data);
      })
      .catch((err) => {
        console.error('Failed to load education materials', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [search, selectedCategory]);

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F9F91] border border-[#0F9F91]/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mini Learning Management System (LMS)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17324D]">
          Pusat Literasi & Edukasi Anti-Perundungan
        </h1>
        <p className="text-sm text-slate-600">
          Pahami bentuk-bentuk kekerasan, kenali hak perlindungan Anda, dan pelajari cara menjadi
          upstander yang membela sesama teman.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="rounded-3xl glass-panel p-6 border border-white/70 shadow-md space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari topik atau kata kunci (contoh: cyberbullying, upstander, fisik)..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/90 text-sm focus:ring-2 focus:ring-[#0F9F91] outline-hidden shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0F9F91] text-white shadow-md shadow-[#0F9F91]/25'
                  : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/60 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 rounded-3xl glass-panel border border-white/60">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#17324D]">Tidak Ada Materi yang Cocok</h3>
          <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((item) => (
            <article
              key={item.id}
              onClick={() => setActiveArticle(item)}
              className="flex flex-col justify-between p-6 rounded-2xl glass-card group cursor-pointer border border-white/80"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-lg font-semibold bg-[#CCFBF1] text-[#0F9F91]">
                    {item.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.reading_minutes} mnt baca</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#17324D] group-hover:text-[#0F9F91] transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F9F91] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
              <div className="space-y-1 pr-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F9F91]">
                  {activeArticle.category} • {activeArticle.reading_minutes} Menit Baca
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#17324D] leading-snug">
                  {activeArticle.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
              <div className="p-4 rounded-2xl bg-[#E0F2FE]/40 border border-sky-100 font-medium italic text-slate-700">
                "{activeArticle.summary}"
              </div>

              <div className="prose prose-slate max-w-none space-y-4 whitespace-pre-line text-sm leading-relaxed">
                {activeArticle.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Materi terverifikasi Tim Psikologi Pendidikan RUANGAMAN
              </span>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F9F91] hover:bg-[#0B7A6F]"
              >
                Tutup Pembaca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
