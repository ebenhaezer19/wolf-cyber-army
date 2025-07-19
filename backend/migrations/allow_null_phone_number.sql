-- Migration to make phone_number nullable
ALTER TABLE users 
ALTER COLUMN phone_number DROP NOT NULL;
