# DEPLOYMENT GUIDE — RUANGAMAN Week 3

Panduan deployment ke Vercel menggunakan satu repository GitHub dengan dua project Vercel.

---

## PERSIAPAN

### 1. Push ke GitHub

```bash
cd c:\laragon\www\ruang-aman

# Pastikan branch sudah dibuat
git branch  # harus di feat/week-3-supabase-google-vercel

# Commit semua perubahan
git add .
git commit -m "feat: week 3 - supabase, google oauth, vercel config"

# Push branch (JANGAN push ke main dulu tanpa review)
git push origin feat/week-3-supabase-google-vercel
```

Setelah review dan tes, merge ke main:
```bash
git checkout main
git merge feat/week-3-supabase-google-vercel
git push origin main
```

---

## PROJECT 1 — FRONTEND

### Setup di Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import repository GitHub RUANGAMAN
3. Konfigurasi:

| Setting | Nilai |
|---------|-------|
| **Project Name** | `ruangaman-frontend` |
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Environment Variables Frontend

Di Vercel project → **Settings → Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://ruangaman-backend.vercel.app/api/v1` |
| `VITE_SUPABASE_URL` | `https://your-ref.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...anon-key` |

4. Klik **Deploy**
5. Catat URL production yang diberikan Vercel

---

## PROJECT 2 — BACKEND

### Setup di Vercel

1. Vercel Dashboard → **Add New Project**
2. Import **repository yang sama**
3. Konfigurasi:

| Setting | Nilai |
|---------|-------|
| **Project Name** | `ruangaman-backend` |
| **Framework Preset** | Other |
| **Root Directory** | `backend` |
| **Build Command** | `npm run build` |
| **Output Directory** | *(kosongkan)* |

### Environment Variables Backend

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://ruangaman-frontend.vercel.app` |
| `SUPABASE_URL` | `https://your-ref.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `eyJ...anon-key` |
| `SUPABASE_SECRET_KEY` | `eyJ...service-role-key` |
| `USE_SUPABASE` | `true` |

4. Klik **Deploy**
5. Catat URL backend yang diberikan Vercel

---

## SETELAH DEPLOY — UPDATE URL

### Update Frontend env di Vercel
Ubah `VITE_API_BASE_URL` ke URL backend yang sebenarnya (didapat setelah deploy backend).

### Update Supabase Auth Settings
Di Supabase → **Authentication → URL Configuration**:
- Site URL: `https://your-frontend.vercel.app`
- Redirect URLs: `https://your-frontend.vercel.app/auth/callback`

### Update Google Cloud Console
Di **Authorized redirect URIs**, tambahkan:
```
https://your-ref.supabase.co/auth/v1/callback
```

---

## VERIFIKASI DEPLOYMENT

```bash
# Health check backend
curl https://your-backend.vercel.app/api/v1/health

# Kategori laporan
curl https://your-backend.vercel.app/api/v1/public/categories
```

Checklist manual:
- [ ] Frontend terbuka di URL Vercel
- [ ] Form laporan bisa disubmit dan data tersimpan di Supabase
- [ ] Tracking code berfungsi
- [ ] Tombol Google Login muncul di navbar
- [ ] Admin login Google redirect ke dashboard (jika akun terdaftar)
- [ ] Halaman admin terbuka dan data tampil dari Supabase
