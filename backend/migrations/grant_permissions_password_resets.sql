-- Grant all privileges on password_resets table to the postgres user
-- Ganti 'postgres' dengan nama pengguna database yang sebenarnya jika berbeda
GRANT ALL PRIVILEGES ON TABLE password_resets TO postgres;
GRANT USAGE, SELECT ON SEQUENCE password_resets_id_seq TO postgres;
