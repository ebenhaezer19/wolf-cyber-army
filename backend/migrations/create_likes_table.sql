-- Buat tabel likes
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    target_type VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)), -- 1 untuk like, -1 untuk dislike
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT likes_user_target_unique UNIQUE (user_id, target_id, target_type),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
