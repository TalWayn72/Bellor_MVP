-- ==========================================================
-- Bellor MVP - PostgreSQL Initialization Script
-- ==========================================================
-- This script runs when the PostgreSQL container is first created
-- It sets up performance optimizations and extensions
-- ==========================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- For exclusion constraints

-- Create indexes for common queries (if not exists)
-- Note: Prisma will create the main indexes, these are additional optimizations

-- Performance settings (applied at runtime via command line, this is for documentation)
-- shared_buffers = 1GB
-- effective_cache_size = 3GB
-- work_mem = 16MB
-- maintenance_work_mem = 256MB
-- max_connections = 500

-- Grant permissions for the bellor user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO CURRENT_USER;

-- Log message
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL initialized for Bellor MVP - High Performance Mode';
END $$;
