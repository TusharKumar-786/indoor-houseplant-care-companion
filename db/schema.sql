-- PlantCare Schema (PostgreSQL)
-- Additive & idempotent table definitions

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    window_direction VARCHAR(50),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Care Requirements
CREATE TABLE IF NOT EXISTS care_requirements (
    id SERIAL PRIMARY KEY,
    water_frequency_days INTEGER NOT NULL,
    sunlight_level VARCHAR(50) NOT NULL,
    fertilizing_frequency_days INTEGER DEFAULT 14,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Plants
CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    care_requirement_id INTEGER NOT NULL REFERENCES care_requirements(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Log Book
CREATE TABLE IF NOT EXISTS log_book (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Watered', 'Fertilized', 'Pruned')),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for query performance and load testing
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_room_id ON plants(room_id);
CREATE INDEX IF NOT EXISTS idx_plants_care_req_id ON plants(care_requirement_id);
CREATE INDEX IF NOT EXISTS idx_log_book_plant_id ON log_book(plant_id);
CREATE INDEX IF NOT EXISTS idx_log_book_date ON log_book(date);
