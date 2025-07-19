# Panduan Konfigurasi Email untuk Reset Password

## Mengapa Menggunakan Email Asli Penting

Menggunakan email asli untuk reset password sangat penting untuk keamanan:

1. **Verifikasi Identitas**: Memastikan bahwa hanya pemilik email yang sah yang dapat mereset password
2. **Mencegah Penyalahgunaan**: Mencegah penyerang mereset password akun dengan email palsu/tidak valid
3. **Audit Trail**: Memberikan bukti bahwa permintaan reset password berasal dari pemilik asli akun

## Cara Konfigurasi Email Gmail untuk Aplikasi

### Langkah 1: Buat App Password di Google Account

Untuk keamanan, Gmail memerlukan "App Password" khusus untuk aplikasi pihak ketiga:

1. Buka [Google Account Security](https://myaccount.google.com/security)
2. Aktifkan verifikasi 2 langkah jika belum
3. Buka [App Passwords](https://myaccount.google.com/apppasswords)
4. Klik "Select app" dan pilih "Other (Custom name)"
5. Masukkan nama seperti "Wolf Cyber Army Forum"
6. Klik "Generate" untuk mendapatkan password 16 karakter
7. **PENTING**: Simpan password ini dengan aman, ini akan digunakan di variabel lingkungan

### Langkah 2: Konfigurasi Variabel Lingkungan

Ada dua cara untuk mengonfigurasi email:

#### Opsi 1: Menggunakan File .env (Direkomendasikan)

Tambahkan baris berikut ke file `.env` di folder backend:

```
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-app-password-here
```

#### Opsi 2: Export Variabel Lingkungan Langsung (Temporary)

Di terminal PowerShell (Windows):

```powershell
$env:EMAIL_USER="youremail@gmail.com"
$env:EMAIL_PASS="your-app-password-here"
```

### Langkah 3: Menguji Konfigurasi Email

1. Restart server backend
2. Coba fitur "Forgot Password" dengan email asli
3. Cek log server untuk memastikan email menggunakan SMTP Gmail
4. Verifikasi email diterima di kotak masuk

## Troubleshooting

### Email Tidak Terkirim

1. Periksa kredensial email di variabel lingkungan
2. Pastikan App Password sudah dikonfigurasi dengan benar
3. Periksa log server untuk error spesifik
4. Jika menggunakan Gmail, pastikan pengaturan "Less secure app access" diaktifkan
5. Coba gunakan provider email lain seperti SendGrid atau Mailgun

### Error "Username and Password not accepted"

Pastikan:
1. Email yang digunakan valid dan aktif
2. App Password telah dibuat dengan benar
3. Akun Gmail tidak memiliki batasan keamanan tambahan

## Konfigurasi SMTP Alternatif

Selain Gmail, Anda juga dapat menggunakan layanan SMTP lain dengan menambahkan variabel berikut ke file `.env`:

```
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Catatan Keamanan

- **Jangan pernah** menyimpan kredensial email di kode sumber
- **Jangan** menggunakan password akun email utama, selalu gunakan App Password
- Pertimbangkan untuk menggunakan layanan email khusus seperti SendGrid atau Mailgun untuk aplikasi produksi
- Batasi jumlah permintaan reset password untuk mencegah abuse
