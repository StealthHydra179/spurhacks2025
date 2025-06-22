-- No database changes needed - using existing mode column for personality
-- mode is INTEGER: 0 = normal, -1 = less aggressive, 1 = more aggressive

-- Create budget table for user budget management
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    overall DOUBLE PRECISION,
    housing DOUBLE PRECISION,
    food DOUBLE PRECISION,
    transportation DOUBLE PRECISION,
    health DOUBLE PRECISION,
    personal DOUBLE PRECISION,
    entertainment DOUBLE PRECISION,
    financial DOUBLE PRECISION,
    gifts DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);