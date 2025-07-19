# Register API

{
  "username": "admin1",
  "email": "admin1@wolfcyberarmy.com",
  "password": "asdfghjkl6689",
  "role": "admin"
}

  "email": "admin1@wolfcyberarmy.com",
  "password": "asdfghjkl6689"

  "email": "krisoprasebenhaezer@gmail.com",
  "password": "lkjhgfdsa6689"

  Untuk menjalankan aplikasi setelah reset database, Anda bisa login dengan:

Admin: admin@wolfcyberarmy.com / admin123

{
  "email": "admin@wolfcyberarmy.com",
  "password": "admin123"
}
User: user@wolfcyberarmy.com / user123

{
  "email": "user@wolfcyberarmy.com",
  "password": "user123"
}

http://localhost:5002/api-docs

// Prioritas selanjutnya 

Foto profil user (user experience & brand) Done 
Relasi file ke post/thread (forum lebih hidup) Done  
Notifikasi (engagement) Done 
Like/dislike (interaksi) Done
Reset password (keamanan) Done
Pagination & search (scalability) Not done
Rate limiting (keamanan) Done
Audit log/statistik (admin/monitoring) Not done

Get-Process -Id (Get-NetTCPConnection -LocalPort 5002 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force

psql -U postgres
\c wolfcyberarmy
ALTER TABLE notifications OWNER TO kriso;
\d notifications

-- Melihat daftar tabel (tanpa menggunakan pager)
\pset pager off
\dt

-- Melihat detail tabel likes
\d likes

-- Mengubah kepemilikan tabel likes
ALTER TABLE likes OWNER TO kriso;

-- Jika ada sequence untuk ID likes, ubah juga kepemilikannya
ALTER SEQUENCE likes_id_seq OWNER TO kriso;

-- Memberikan semua hak akses
GRANT ALL PRIVILEGES ON TABLE likes TO kriso;
GRANT ALL PRIVILEGES ON SEQUENCE likes_id_seq TO kriso;

-- Verifikasi perubahan
\d likes


npm install -g vercel
vercel login

Cara deploy frontend:
cd c:/Users/kriso/OneDrive/Desktop/WCA/frontend
vercel

vercel