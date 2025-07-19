-- Migration to add ip_address column to logs table
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL;
