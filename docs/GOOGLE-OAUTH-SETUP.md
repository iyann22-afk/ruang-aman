# GOOGLE OAUTH SETUP — RUANGAMAN Week 3

Panduan lengkap mengaktifkan Google Login untuk RUANGAMAN.

---

## BAGIAN 1 — GOOGLE CLOUD CONSOLE

### 1.1 Buat Project (jika belum ada)

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik dropdown project → **New Project**
3. Nama: `RUANGAMAN`
4. Klik **Create**

### 1.2 Aktifkan Google Identity

1. Di sidebar: **APIs & Services → OAuth consent screen**
2. User Type: **External** → klik **Create**
3. Isi:
   - App name: `RUANGAMAN`
   - User support email: email Anda
   - Developer contact: email Anda
4. Klik **Save and Continue** (lewati Scopes dan Test Users)
5. Klik **Back to Dashboard**

### 1.3 Buat OAuth Credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `RUANGAMAN Web`
4. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://your-frontend.vercel.app
   ```
5. **Authorized redirect URIs:**
   ```
   https://your-ref.supabase.co/auth/v1/callback
   ```
   *(Ganti `your-ref` dengan Supabase project reference Anda)*
6. Klik **Create**
7. Salin **Client ID** dan **Client Secret**

---

## BAGIAN 2 — SUPABASE DASHBOARD

### 2.1 Aktifkan Google Provider

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project RUANGAMAN
3. Sidebar: **Authentication → Providers**
4. Klik **Google** → toggle **Enable**
5. Isi:
   - **Client ID**: (dari Google Cloud Console)
   - **Client Secret**: (dari Google Cloud Console)
6. Klik **Save**

### 2.2 Konfigurasi Site URL

1. **Authentication → URL Configuration**
2. **Site URL**: `https://your-frontend.vercel.app`
3. **Redirect URLs** (tambahkan semua):
   ```
   http://localhost:5173/auth/callback
   https://your-frontend.vercel.app/auth/callback
   ```
4. Klik **Save**

---

## BAGIAN 3 — BUAT AKUN ADMIN PERTAMA

Admin tidak bisa membuat akun sendiri. Super Admin harus mendaftarkan manual.

### 3.1 Login Google terlebih dahulu

Minta calon admin login sekali di RUANGAMAN menggunakan Google.
Ini membuat entri di tabel `auth.users` Supabase.

### 3.2 Dapatkan auth_user_id

Di Supabase Dashboard:
1. **Authentication → Users**
2. Temukan user berdasarkan email
3. Salin **User UID** (ini adalah `auth_user_id`)

### 3.3 Insert ke tabel admins

Buka **SQL Editor** di Supabase, jalankan:

```sql
INSERT INTO admins (id, auth_user_id, full_name, email, role, is_active)
VALUES (
  gen_random_uuid(),
  'USER_UID_DARI_LANGKAH_3.2',   -- Ganti ini
  'Nama Lengkap Admin',
  'email@domain.com',
  'super_admin',                  -- atau 'case_manager' / 'counselor'
  true
);
```

> ⚠️ Ganti `USER_UID_DARI_LANGKAH_3.2` dengan UID asli dari langkah sebelumnya.

---

## BAGIAN 4 — TEST ALUR LOGIN

### Login Publik (navbar)
1. Klik tombol **Masuk dengan Google** di navbar publik
2. Pilih akun Google
3. Setelah callback, nama/foto muncul di navbar

### Login Admin
1. Buka `/admin/login`
2. Klik **Masuk dengan Google (Petugas)**
3. Jika akun terdaftar sebagai admin → redirect ke dashboard
4. Jika bukan admin → pesan penolakan jelas

### Logout
1. Klik ikon logout di navbar
2. Session dihapus, tampilan kembali ke kondisi tidak login
