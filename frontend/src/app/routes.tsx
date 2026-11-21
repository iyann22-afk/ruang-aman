import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.js';
import { AdminLayout } from '../layouts/AdminLayout.js';

// Public Pages
import { Beranda } from '../pages/public/Beranda.js';
import { Tentang } from '../pages/public/Tentang.js';
import { BuatLaporan } from '../pages/public/BuatLaporan.js';
import { LacakLaporan } from '../pages/public/LacakLaporan.js';
import { Edukasi } from '../pages/public/Edukasi.js';
import { Pendampingan } from '../pages/public/Pendampingan.js';

// Auth Callback (lazy — jarang diakses)
const AuthCallback = lazy(() => import('../pages/public/AuthCallback.js'));

// Admin Pages
import { LoginAdmin } from '../pages/admin/LoginAdmin.js';
import { DashboardAdmin } from '../pages/admin/DashboardAdmin.js';
import { DaftarLaporan } from '../pages/admin/DaftarLaporan.js';
import { DetailLaporan } from '../pages/admin/DetailLaporan.js';
import { RiwayatStatus } from '../pages/admin/RiwayatStatus.js';
import { ProfilAdmin } from '../pages/admin/ProfilAdmin.js';
import { ManajemenPetugas } from '../pages/admin/ManajemenPetugas.js';

export const router = createBrowserRouter([
  // Public Route Group with PublicLayout
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Beranda /> },
      { path: 'tentang', element: <Tentang /> },
      { path: 'lapor', element: <BuatLaporan /> },
      { path: 'lacak', element: <LacakLaporan /> },
      { path: 'edukasi', element: <Edukasi /> },
      { path: 'pendampingan', element: <Pendampingan /> },
    ],
  },

  // OAuth Callback (Supabase Google Login) — tanpa layout
  {
    path: '/auth/callback',
    element: (
      <React.Suspense fallback={<div className="min-h-screen bg-[#17324D]" />}>
        <AuthCallback />
      </React.Suspense>
    ),
  },

  // Admin Auth Route (Without AdminLayout)
  {
    path: '/admin/login',
    element: <LoginAdmin />,
  },

  // Admin Protected Route Group with AdminLayout
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardAdmin /> },
      { path: 'laporan', element: <DaftarLaporan /> },
      { path: 'laporan/:id', element: <DetailLaporan /> },
      { path: 'riwayat-status', element: <RiwayatStatus /> },
      { path: 'petugas', element: <ManajemenPetugas /> },
      { path: 'profil', element: <ProfilAdmin /> },
    ],
  },

  // 404 Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
