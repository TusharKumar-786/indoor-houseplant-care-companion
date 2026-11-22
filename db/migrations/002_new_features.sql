-- Migration: 002_new_features.sql
-- Additive schema update for LeafPulse: Avatars, Public Blog, Contact Messages, Plant Library

-- 1. Add avatar_url to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- 2. Blog Posts table for care stories and plant guides
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

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);

-- 3. Contact Messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Plant Library (Reference database for one-click add to collection)
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

CREATE INDEX IF NOT EXISTS idx_plant_library_common_name ON plant_library(common_name);

-- Seed initial plant library entries if table is empty
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

-- Seed starter realistic blog posts written in warm, honest voice
INSERT INTO blog_posts (user_id, title, slug, cover_image_url, read_time, excerpt, body)
SELECT 
    1,
    'How to Tell When Your Monstera Actually Needs Water',
    'how-to-tell-when-monstera-needs-water',
    '/images/plants/monstera.webp',
    '4 min read',
    'Forget strict calendar reminders. Here is how feeling the soil depth and reading leaf posture saves roots from rot.',
    'Most houseplants die from excessive kindness rather than neglect. With Monstera deliciosa, the surface soil can look dry as a bone while the lower three inches remain saturated. Instead of sticking strictly to every Sunday morning watering rituals, insert your index finger two full knuckles into the potting mix. If soil particles cling cool and damp to your skin, wait another three to four days. Healthy Monstera petioles stand upright with slight leaf arch; limp stems drooping together usually point to thirsty roots, whereas yellowing lower leaves with brown margins signal waterlogged roots that are suffocating.'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'how-to-tell-when-monstera-needs-water');

INSERT INTO blog_posts (user_id, title, slug, cover_image_url, read_time, excerpt, body)
SELECT 
    1,
    'Understanding Window Directions in Modern Apartments',
    'understanding-window-directions-apartments',
    '/images/plants/living-room.webp',
    '5 min read',
    'East, West, North, or South? A simple guide to matching your rooms natural light with plants that will actually thrive.',
    'A north-facing window offers soft, indirect, uniform illumination throughout the day. It is an ideal perch for ferns, calatheas, and cast iron plants that scorch under midday rays. South-facing windows, conversely, deliver intense direct sunlight that bakes delicate foliage. Placing a sheer linen curtain or keeping plants three feet back from south sills balances this brilliance into golden diffused light. In this guide, we map every room in your home to its optimal plant companions.'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'understanding-window-directions-apartments');

INSERT INTO blog_posts (user_id, title, slug, cover_image_url, read_time, excerpt, body)
SELECT 
    1,
    'The Beginner Indoor Garden: Five Plants That Forgive',
    'beginner-indoor-garden-five-forgiving-plants',
    '/images/plants/pothos.webp',
    '3 min read',
    'If you have lost plants before, start with varieties built for resilient recovery. These five plants adapt to realistic homes.',
    'You do not need a greenhouse or horticultural degree to keep green life thriving in your living room. The Golden Pothos, Snake Plant, ZZ Plant, Spider Plant, and Heartleaf Philodendron possess evolutionary adaptations that handle erratic schedules and dimmer corners gracefully. Start small with one or two specimen containers, learn their seasonal rhythms, and watch your confidence grow leaf by leaf.'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'beginner-indoor-garden-five-forgiving-plants');
