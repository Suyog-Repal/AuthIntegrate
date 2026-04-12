-- Migration: Add password reset fields to user_profiles table
-- Description: Adds reset_token and reset_token_expiry columns for password reset functionality

ALTER TABLE user_profiles
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expiry TIMESTAMP;

-- Create index on reset_token for fast lookups
CREATE INDEX idx_reset_token ON user_profiles(reset_token);

-- Create index on reset_token_expiry for cleanup queries
CREATE INDEX idx_reset_token_expiry ON user_profiles(reset_token_expiry);
