-- Migration to create reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  target_id INTEGER NOT NULL,
  target_type VARCHAR(20) NOT NULL, -- 'thread' atau 'post'
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
