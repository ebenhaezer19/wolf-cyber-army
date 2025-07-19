-- Menambahkan kolom recovery_email ke tabel users
ALTER TABLE users 
ADD COLUMN recovery_email VARCHAR(255) NULL;

-- Tambahkan index pada kolom recovery_email untuk pencarian yang cepat
CREATE INDEX idx_users_recovery_email ON users(recovery_email);

-- Berikan izin pada tabel yang sudah dimodifikasi
GRANT ALL PRIVILEGES ON TABLE users TO postgres;
