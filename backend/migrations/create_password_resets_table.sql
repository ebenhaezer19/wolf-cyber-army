CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE
);

-- Tambahkan indeks untuk pencarian cepat berdasarkan email dan token
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token);
