-- Menambahkan kolom OTP ke tabel password_resets
ALTER TABLE password_resets 
ADD COLUMN otp VARCHAR(6) NOT NULL DEFAULT '000000';

-- Tambahkan index pada kolom OTP untuk pencarian yang cepat
CREATE INDEX idx_password_resets_otp ON password_resets(otp);

-- Berikan izin pada tabel yang sudah dimodifikasi
GRANT ALL PRIVILEGES ON TABLE password_resets TO postgres;
