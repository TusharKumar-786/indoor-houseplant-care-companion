-- ============================================================================
-- LeafPulse Database Initialization (init.sql)
-- Self-contained, idempotent schema setup for fresh PostgreSQL deployments
-- Includes all core tables, constraints, foreign keys, and optimized indexes
-- ============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    avatar_url VARCHAR(500),
    city VARCHAR(100),
    weekly_digest BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    window_direction VARCHAR(50),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Care Requirements Table
CREATE TABLE IF NOT EXISTS care_requirements (
    id SERIAL PRIMARY KEY,
    water_frequency_days INTEGER NOT NULL,
    sunlight_level VARCHAR(50) NOT NULL,
    fertilizing_frequency_days INTEGER DEFAULT 14,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Plants Table
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

-- 5. Log Book Table (Care Activities)
CREATE TABLE IF NOT EXISTS log_book (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Watered', 'Fertilized', 'Pruned')),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Growth Journal Table (Milestones, Height & Photographic Notes)
CREATE TABLE IF NOT EXISTS growth_journal (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT NOT NULL,
    image_url VARCHAR(500),
    height_cm NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Blog Posts Table (Botanical Guides and Community Articles)
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    cover_image_url VARCHAR(500),
    read_time VARCHAR(20) DEFAULT '4 min read',
    excerpt TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Contact Messages Table (Visitor Inquiries & Feedback)
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Plant Library Table (Curated Houseplant Species Directory)
CREATE TABLE IF NOT EXISTS plant_library (
    id SERIAL PRIMARY KEY,
    common_name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    water_frequency_days INTEGER NOT NULL,
    sunlight_level VARCHAR(50) NOT NULL,
    humidity VARCHAR(50) DEFAULT 'Average',
    pet_safe BOOLEAN DEFAULT false,
    care_tip TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Password Resets Table (Time-limited Secure Tokens)
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_room_id ON plants(room_id);
CREATE INDEX IF NOT EXISTS idx_plants_care_req_id ON plants(care_requirement_id);
CREATE INDEX IF NOT EXISTS idx_log_book_plant_id ON log_book(plant_id);
CREATE INDEX IF NOT EXISTS idx_log_book_date ON log_book(date);
-- Composite index for fast user-scoped watering checks:
CREATE INDEX IF NOT EXISTS idx_log_book_plant_action_date ON log_book(plant_id, action, date);
CREATE INDEX IF NOT EXISTS idx_growth_journal_plant_id ON growth_journal(plant_id);
CREATE INDEX IF NOT EXISTS idx_growth_journal_date ON growth_journal(date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_library_common_name ON plant_library(common_name);
CREATE INDEX IF NOT EXISTS idx_password_resets_hash ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- ============================================================================
-- Standard Plant Library Seed Data (Self-contained, idempotent)
-- ============================================================================
INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Monstera Deliciosa', 'Monstera deliciosa', '/images/plants/monstera.webp', 7, 'High', 'High', false, 'Wipe the broad leaves monthly with a damp cloth to remove household dust and support photosynthesis.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Monstera Deliciosa');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Snake Plant', 'Sansevieria trifasciata', '/images/plants/snake-plant.webp', 14, 'Low', 'Low', false, 'Thrives on neglect. Allow soil to dry completely through the pot between waterings.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Snake Plant');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Golden Pothos', 'Epipremnum aureum', '/images/plants/pothos.webp', 7, 'Medium', 'Average', false, 'Trailing vines grow quickly in gentle indirect light. Trim leggy vines to encourage bushier root crowns.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Golden Pothos');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Fiddle Leaf Fig', 'Ficus lyrata', '/images/plants/fiddle-leaf.webp', 10, 'High', 'Moderate', false, 'Keep away from drafty doorways and air conditioning vents. Rotate quarter-turn weekly for even branch balance.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Fiddle Leaf Fig');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Peace Lily', 'Spathiphyllum wallisii', '/images/plants/peace-lily.webp', 5, 'Low', 'High', false, 'Tells you when it is thirsty by softly drooping. Waters perk leaves back up within hours.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Peace Lily');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'ZZ Plant', 'Zamioculcas zamiifolia', '/images/plants/zz-plant.webp', 18, 'Low', 'Low', false, 'Stores reserve water in bulbous underground rhizomes. When in doubt, hold watering for another week.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'ZZ Plant');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Spider Plant', 'Chlorophytum comosum', '/images/plants/plant-shop.webp', 6, 'Medium', 'Average', true, 'Produces graceful arching runners with baby plantlets. Non-toxic and completely pet safe.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Spider Plant');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Boston Fern', 'Nephrolepis exaltata', '/images/plants/lush-corner.webp', 4, 'Medium', 'High', true, 'Loves ambient humidity and moist soil. Thrives near bathrooms or well-ventilated kitchens.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Boston Fern');

INSERT INTO plant_library (common_name, scientific_name, image_url, water_frequency_days, sunlight_level, humidity, pet_safe, care_tip)
SELECT 'Calathea Ornata', 'Calathea ornata', '/images/plants/leaf-texture.webp', 5, 'Medium', 'High', true, 'Known as the prayer plant for its evening leaf folding. Use filtered or rainwater to protect delicate pinstripes.'
WHERE NOT EXISTS (SELECT 1 FROM plant_library WHERE common_name = 'Calathea Ornata');
