# ?? Dashboard Authentication System

## Overview
Sistem authentication telah ditambahkan ke Tumbasna Dashboard untuk keamanan akses admin.

## Features
? Login page dengan design Tumbasna
? Session-based authentication menggunakan HTTP-only cookies
? Middleware protection untuk semua route dashboard
? Logout functionality
? Automatic redirect jika belum login
? Automatic redirect ke dashboard jika sudah login

## Default Credentials

**Username:** `admin`
**Password:** `tumbasna2024`

?? **PENTING:** Ganti credentials ini di production!

## Setup

1. Copy `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` dan ganti credentials:
```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_strong_password
```

## File Structure

```
tumbasna-dashboard/
+-- src/
¦   +-- middleware.ts                          # Route protection
¦   +-- app/
¦   ¦   +-- login/
¦   ¦   ¦   +-- page.tsx                       # Login page
¦   ¦   +-- api/
¦   ¦       +-- auth/
¦   ¦           +-- admin-login/
¦   ¦           ¦   +-- route.ts               # Login API
¦   ¦           +-- admin-logout/
¦   ¦               +-- route.ts               # Logout API
¦   +-- components/
¦       +-- SidebarLayout.tsx                  # Updated dengan logout button
+-- .env.example                                # Environment template
```

## How It Works

### 1. Middleware Protection
- Semua route kecuali `/login` dan `/api/*` dilindungi
- Cek cookie `admin-token` untuk validasi session
- Redirect ke `/login` jika tidak authenticated
- Redirect ke `/dashboard` jika sudah login dan akses `/login`

### 2. Login Flow
1. User mengakses https://dashboard.tumbasna.my.id/
2. Middleware redirect ke `/login`
3. User input username & password
4. POST ke `/api/auth/admin-login`
5. Jika valid, set HTTP-only cookie `admin-token`
6. Redirect ke `/dashboard`

### 3. Logout Flow
1. User klik tombol logout di sidebar
2. POST ke `/api/auth/admin-logout`
3. Cookie `admin-token` dihapus
4. Redirect ke `/login`

## Security Features

? **HTTP-only Cookies** - Tidak bisa diakses via JavaScript (XSS protection)
? **Secure Flag** - Cookie hanya dikirim via HTTPS di production
? **SameSite: Lax** - CSRF protection
? **7 Days Expiry** - Session timeout otomatis
? **Server-side Validation** - Credentials tidak pernah ke client

## Production Recommendations

### 1. Strong Password
Gunakan password yang kuat:
- Minimal 12 karakter
- Kombinasi huruf besar, kecil, angka, simbol
- Jangan gunakan kata umum

### 2. Environment Variables
**JANGAN** commit credentials ke Git:
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 3. Password Hashing (Future Enhancement)
Untuk production yang lebih secure, implementasikan:
- bcrypt untuk hash password
- Database untuk menyimpan admin users
- Role-based access control (RBAC)

### 4. Rate Limiting
Tambahkan rate limiting untuk prevent brute force:
- Max 5 failed attempts per 15 menit
- IP blocking setelah threshold

### 5. 2FA (Two-Factor Authentication)
Untuk keamanan maksimal, tambahkan 2FA:
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification

## Testing

### Test Login
1. Akses: https://dashboard.tumbasna.my.id/
2. Should redirect ke `/login`
3. Login dengan credentials default
4. Should redirect ke `/dashboard`

### Test Protected Routes
1. Clear cookies
2. Akses: https://dashboard.tumbasna.my.id/dashboard
3. Should redirect ke `/login`

### Test Logout
1. Login terlebih dahulu
2. Klik tombol logout (icon logout di sidebar bawah)
3. Should redirect ke `/login`
4. Try access `/dashboard` - should redirect back to `/login`

## API Endpoints

### POST /api/auth/admin-login
**Request Body:**
```json
{
  "username": "admin",
  "password": "tumbasna2024"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login berhasil"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Username atau password salah"
}
```

### POST /api/auth/admin-logout
**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

## Troubleshooting

### Issue: Redirect loop
**Solution:** Clear all cookies dan refresh browser

### Issue: Login gagal terus
**Solution:** 
1. Cek credentials di `.env.local`
2. Restart dev server: `npm run dev`
3. Check browser console untuk error

### Issue: Logout tidak berfungsi
**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check Network tab untuk API call

## Design
- ? Menggunakan warna brand Tumbasna (#006837 green)
- ? Logo Tumbasna di center
- ? Responsive design
- ? Clean & modern UI
- ? Loading states
- ? Error messages

## Next Steps (Optional Enhancements)

1. **Database Integration**
   - Store admin users in database
   - Multiple admin accounts
   - Role management (Super Admin, Admin, Viewer)

2. **Audit Log**
   - Log semua login attempts
   - Track admin activities
   - Session history

3. **Password Reset**
   - Forgot password functionality
   - Email verification
   - Secure reset token

4. **Session Management**
   - Active sessions list
   - Force logout all devices
   - Session timeout notification

5. **Advanced Security**
   - IP whitelisting
   - Geo-blocking
   - Suspicious activity detection

---

Created: 2026-07-16
Version: 1.0.0
Status: ? Production Ready (with default credentials - MUST CHANGE!)
