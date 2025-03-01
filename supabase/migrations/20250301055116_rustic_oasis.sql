/*
  # Create initial schema for URL Shortener

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text)
      - `role` (text, check constraint for 'admin' or 'user')
      - `created_at` (timestamp)
    - `short_urls`
      - `id` (uuid, primary key)
      - `original_url` (text)
      - `short_code` (text, unique)
      - `user_id` (uuid, foreign key to users)
      - `click_count` (int)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, nullable)
    - `click_stats`
      - `id` (uuid, primary key)
      - `short_url_id` (uuid, foreign key to short_urls)
      - `ip_address` (text)
      - `user_agent` (text)
      - `clicked_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
    - Add policies for admins to read all data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT now()
);

-- Create short_urls table
CREATE TABLE IF NOT EXISTS short_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    click_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP
);

-- Create click_stats table
CREATE TABLE IF NOT EXISTS click_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_url_id UUID REFERENCES short_urls(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_stats ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read their own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Policies for short_urls table
CREATE POLICY "Users can read their own short URLs"
    ON short_urls
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own short URLs"
    ON short_urls
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own short URLs"
    ON short_urls
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own short URLs"
    ON short_urls
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for click_stats table
CREATE POLICY "Users can read stats for their own short URLs"
    ON click_stats
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM short_urls
            WHERE short_urls.id = click_stats.short_url_id
            AND short_urls.user_id = auth.uid()
        )
    );

-- Admin policies (using is_admin() function that would be defined in Supabase)
CREATE POLICY "Admins can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update all users"
    ON users
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can read all short URLs"
    ON short_urls
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update all short URLs"
    ON short_urls
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can delete all short URLs"
    ON short_urls
    FOR DELETE
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can read all click stats"
    ON click_stats
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS short_urls_user_id_idx ON short_urls(user_id);
CREATE INDEX IF NOT EXISTS short_urls_short_code_idx ON short_urls(short_code);
CREATE INDEX IF NOT EXISTS click_stats_short_url_id_idx ON click_stats(short_url_id);
CREATE INDEX IF NOT EXISTS click_stats_clicked_at_idx ON click_stats(clicked_at);