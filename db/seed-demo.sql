-- ============================================================================
-- LeafPulse Demo Seed Data (seed-demo.sql)
-- Populates rich demo user, rooms, plants, care logs, and blog posts.
-- Fully idempotent with sequence resets for zero insert collisions.
-- ============================================================================

-- 1. Demo User (email: demo@leafpulse.app)
INSERT INTO users (id, name, email, password, is_active, city, avatar_url, weekly_digest, language)
VALUES (
    99,
    'Aarav Sharma',
    'demo@leafpulse.app',
    '$2a$10$//cccFMd4nECXb1f5rYmH.Cj.FJBZq1pRVzkXf7QmXjfEHNBDcEJy',
    true,
    'Bengaluru',
    '/images/plants/monstera.webp',
    true,
    'en'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    city = EXCLUDED.city,
    avatar_url = EXCLUDED.avatar_url;

-- 2. Demo Rooms across multiple window orientations
INSERT INTO rooms (id, name, window_direction, user_id)
VALUES 
    (901, 'Sunlit Living Room', 'South', 99),
    (902, 'Balcony Garden', 'East', 99),
    (903, 'Reading Study', 'West', 99),
    (904, 'Master Bedroom', 'North', 99)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    window_direction = EXCLUDED.window_direction;

-- 3. Care Requirements for Demo Collection
INSERT INTO care_requirements (id, water_frequency_days, sunlight_level, fertilizing_frequency_days)
VALUES
    (901, 7, 'High', 14),
    (902, 14, 'Low', 30),
    (903, 6, 'Medium', 14),
    (904, 10, 'High', 21),
    (905, 5, 'Low', 14),
    (906, 18, 'Low', 45),
    (907, 7, 'Medium', 14),
    (908, 12, 'High', 30),
    (909, 4, 'High', 10),
    (910, 8, 'Medium', 14)
ON CONFLICT (id) DO UPDATE SET
    water_frequency_days = EXCLUDED.water_frequency_days,
    sunlight_level = EXCLUDED.sunlight_level,
    fertilizing_frequency_days = EXCLUDED.fertilizing_frequency_days;

-- 4. 10 Curated Plants for Demo Collection
INSERT INTO plants (id, nickname, species, image_url, room_id, care_requirement_id, user_id, created_at)
VALUES
    (901, 'Big Swiss Cheese', 'Monstera deliciosa', '/images/plants/monstera.webp', 901, 901, 99, NOW() - INTERVAL '60 days'),
    (902, 'Sword of Sansevieria', 'Sansevieria trifasciata', '/images/plants/snake-plant.webp', 904, 902, 99, NOW() - INTERVAL '55 days'),
    (903, 'Trailing Golden Pothos', 'Epipremnum aureum', '/images/plants/pothos.webp', 902, 903, 99, NOW() - INTERVAL '50 days'),
    (904, 'Figgy Central', 'Ficus lyrata', '/images/plants/fiddle-leaf.webp', 901, 904, 99, NOW() - INTERVAL '45 days'),
    (905, 'Serene Lily', 'Spathiphyllum wallisii', '/images/plants/peace-lily.webp', 903, 905, 99, NOW() - INTERVAL '40 days'),
    (906, 'Zenith ZZ', 'Zamioculcas zamiifolia', '/images/plants/zz-plant.webp', 904, 906, 99, NOW() - INTERVAL '35 days'),
    (907, 'Emerald Cascades', 'Epipremnum aureum', '/images/plants/pothos.webp', 902, 907, 99, NOW() - INTERVAL '30 days'),
    (908, 'Sun Succulent Trio', 'Echeveria elegans', '/images/plants/succulent-shelf.webp', 901, 908, 99, NOW() - INTERVAL '25 days'),
    (909, 'Velvet Foliage', 'Calathea ornata', '/images/plants/leaf-texture.webp', 903, 909, 99, NOW() - INTERVAL '20 days'),
    (910, 'Green Oasis Fig', 'Ficus elastica', '/images/plants/fiddle-leaf.webp', 901, 910, 99, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    species = EXCLUDED.species,
    image_url = EXCLUDED.image_url,
    room_id = EXCLUDED.room_id,
    care_requirement_id = EXCLUDED.care_requirement_id;

-- 5. Growth Journal Milestones
INSERT INTO growth_journal (plant_id, date, notes, height_cm, image_url)
SELECT 901, (CURRENT_DATE - INTERVAL '45 days')::date, 'Repotted into 12-inch terracotta planter with coarse bark mix.', 42.0, '/images/plants/monstera.webp'
WHERE NOT EXISTS (SELECT 1 FROM growth_journal WHERE plant_id = 901 AND notes LIKE 'Repotted into 12-inch%');

INSERT INTO growth_journal (plant_id, date, notes, height_cm, image_url)
SELECT 901, (CURRENT_DATE - INTERVAL '20 days')::date, 'Massive new leaf unfurled with 5 distinct fenestrations on each side.', 51.5, '/images/plants/monstera.webp'
WHERE NOT EXISTS (SELECT 1 FROM growth_journal WHERE plant_id = 901 AND notes LIKE 'Massive new leaf unfurled%');

INSERT INTO growth_journal (plant_id, date, notes, height_cm, image_url)
SELECT 904, (CURRENT_DATE - INTERVAL '30 days')::date, 'Rotated 90 degrees to balance light exposure towards the south glass.', 85.0, '/images/plants/fiddle-leaf.webp'
WHERE NOT EXISTS (SELECT 1 FROM growth_journal WHERE plant_id = 904 AND notes LIKE 'Rotated 90 degrees%');

INSERT INTO growth_journal (plant_id, date, notes, height_cm, image_url)
SELECT 904, (CURRENT_DATE - INTERVAL '5 days')::date, 'Two glossy top leaves opened in unison. Beautiful upright posture.', 92.0, '/images/plants/fiddle-leaf.webp'
WHERE NOT EXISTS (SELECT 1 FROM growth_journal WHERE plant_id = 904 AND notes LIKE 'Two glossy top leaves%');

-- 6. Comprehensive Historical Care Logs for Realistic Dashboard & Insights
DELETE FROM log_book WHERE plant_id IN (901, 902, 903, 904, 905, 906, 907, 908, 909, 910);

-- Plant 901: Monstera (watered every 7 days, due today)
INSERT INTO log_book (plant_id, action, date, notes) VALUES
(901, 'Watered', (CURRENT_DATE - INTERVAL '49 days')::date, 'Deep soak with rainwater'),
(901, 'Fertilized', (CURRENT_DATE - INTERVAL '42 days')::date, 'Half strength seaweed feed'),
(901, 'Watered', (CURRENT_DATE - INTERVAL '35 days')::date, 'Weekly hydration check'),
(901, 'Pruned', (CURRENT_DATE - INTERVAL '28 days')::date, 'Trimmed lower damaged leaf'),
(901, 'Watered', (CURRENT_DATE - INTERVAL '21 days')::date, 'Thorough bottom watering'),
(901, 'Fertilized', (CURRENT_DATE - INTERVAL '14 days')::date, 'Balanced organic feed'),
(901, 'Watered', (CURRENT_DATE - INTERVAL '7 days')::date, 'Pot felt light, watered well');

-- Plant 902: Snake plant (watered every 14 days, hydrated)
INSERT INTO log_book (plant_id, action, date, notes) VALUES
(902, 'Watered', (CURRENT_DATE - INTERVAL '50 days')::date, 'Monthly light watering'),
(902, 'Pruned', (CURRENT_DATE - INTERVAL '36 days')::date, 'Cleaned base soil'),
(902, 'Watered', (CURRENT_DATE - INTERVAL '22 days')::date, 'Soaked and drained thoroughly'),
(902, 'Watered', (CURRENT_DATE - INTERVAL '8 days')::date, 'Moistened root zone lightly');

-- Plant 903: Pothos (watered every 6 days, overdue by 2 days)
INSERT INTO log_book (plant_id, action, date, notes) VALUES
(903, 'Watered', (CURRENT_DATE - INTERVAL '48 days')::date, 'Shower soak'),
(903, 'Fertilized', (CURRENT_DATE - INTERVAL '42 days')::date, 'Diluted foliar spray'),
(903, 'Watered', (CURRENT_DATE - INTERVAL '36 days')::date, 'Routine watering'),
(903, 'Pruned', (CURRENT_DATE - INTERVAL '30 days')::date, 'Propagated 3 vine cuttings'),
(903, 'Watered', (CURRENT_DATE - INTERVAL '24 days')::date, 'Watered thoroughly'),
(903, 'Watered', (CURRENT_DATE - INTERVAL '18 days')::date, 'Hydrated hanging pot'),
(903, 'Fertilized', (CURRENT_DATE - INTERVAL '14 days')::date, 'Added bio-humus'),
(903, 'Watered', (CURRENT_DATE - INTERVAL '8 days')::date, 'Watered well');

-- Plant 904: Fiddle Leaf Fig
INSERT INTO log_book (plant_id, action, date, notes) VALUES
(904, 'Watered', (CURRENT_DATE - INTERVAL '40 days')::date, 'Deep watering with filtered tap'),
(904, 'Pruned', (CURRENT_DATE - INTERVAL '30 days')::date, 'Wiped leaves with neem water'),
(904, 'Fertilized', (CURRENT_DATE - INTERVAL '20 days')::date, 'High nitrogen formula'),
(904, 'Watered', (CURRENT_DATE - INTERVAL '10 days')::date, 'Checked top 3 inches dry, watered');

-- Plant 905: Peace Lily (watered every 5 days, due today)
INSERT INTO log_book (plant_id, action, date, notes) VALUES
(905, 'Watered', (CURRENT_DATE - INTERVAL '35 days')::date, 'Perked up immediately'),
(905, 'Watered', (CURRENT_DATE - INTERVAL '30 days')::date, 'Regular drink'),
(905, 'Fertilized', (CURRENT_DATE - INTERVAL '25 days')::date, 'Bloom booster solution'),
(905, 'Watered', (CURRENT_DATE - INTERVAL '20 days')::date, 'Bottom water tray fill'),
(905, 'Watered', (CURRENT_DATE - INTERVAL '15 days')::date, 'Hydrated soil'),
(905, 'Watered', (CURRENT_DATE - INTERVAL '10 days')::date, 'Moderate watering'),
(905, 'Watered', (CURRENT_DATE - INTERVAL '5 days')::date, 'Leaves drooping slightly, watered');

-- Plants 906-910: Additional recent care logs
INSERT INTO log_book (plant_id, action, date, notes) VALUES
(906, 'Watered', (CURRENT_DATE - INTERVAL '32 days')::date, 'Infrequent hydration'),
(906, 'Watered', (CURRENT_DATE - INTERVAL '14 days')::date, 'Small cup of water poured'),
(907, 'Watered', (CURRENT_DATE - INTERVAL '28 days')::date, 'Balcony morning watering'),
(907, 'Fertilized', (CURRENT_DATE - INTERVAL '21 days')::date, 'General liquid feed'),
(907, 'Watered', (CURRENT_DATE - INTERVAL '14 days')::date, 'Watered thoroughly'),
(907, 'Watered', (CURRENT_DATE - INTERVAL '6 days')::date, 'Weekly maintenance'),
(908, 'Watered', (CURRENT_DATE - INTERVAL '24 days')::date, 'Succulent soak & dry cycle'),
(908, 'Watered', (CURRENT_DATE - INTERVAL '11 days')::date, 'Bottom saucer soak'),
(909, 'Watered', (CURRENT_DATE - INTERVAL '18 days')::date, 'Misted and soaked'),
(909, 'Watered', (CURRENT_DATE - INTERVAL '13 days')::date, 'Rainwater replenishment'),
(909, 'Watered', (CURRENT_DATE - INTERVAL '4 days')::date, 'High humidity watering'),
(910, 'Watered', (CURRENT_DATE - INTERVAL '14 days')::date, 'First watering after potting'),
(910, 'Fertilized', (CURRENT_DATE - INTERVAL '7 days')::date, 'Micro-nutrient boost');

-- 7. Botanical Blog Articles Written in Warm Editorial Voice
INSERT INTO blog_posts (user_id, title, slug, cover_image_url, read_time, excerpt, body)
SELECT 
    99,
    'Reviving a Drooping Fiddle Leaf Fig in an East-Facing Room',
    'reviving-drooping-fiddle-leaf-fig',
    '/images/plants/fiddle-leaf.webp',
    '4 min read',
    'When your fiddle leaf drops lower leaves and looks limp, check these three common culprit conditions before repotting.',
    'Two months ago, my Fiddle Leaf Fig was dropping three leaves a week in our reading room. The mistake I made was moving it right in front of an air circulation draft while letting the root ball dry unevenly. Here is the step-by-step recovery process that restored active branch bud growth.'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'reviving-drooping-fiddle-leaf-fig');

INSERT INTO blog_posts (user_id, title, slug, cover_image_url, read_time, excerpt, body)
SELECT 
    99,
    'The 60-Day Soil Dampness Experiment',
    'sixty-day-soil-dampness-experiment',
    '/images/plants/watering-hands.webp',
    '5 min read',
    'We tracked moisture meters versus wooden skewer readings across 10 common houseplants. The results surprised us.',
    'Many commercial moisture meters give false readings when soil is dense or has high dissolved salts from fertilizer. In this log, we compare physical skewer depth resistance with plant leaf posture across 60 days of seasonal transition.'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'sixty-day-soil-dampness-experiment');

-- ============================================================================
-- Sequence Resets (Guarantees zero primary key collisions on subsequent inserts)
-- ============================================================================
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE((SELECT MAX(id) FROM rooms), 1));
SELECT setval(pg_get_serial_sequence('care_requirements', 'id'), COALESCE((SELECT MAX(id) FROM care_requirements), 1));
SELECT setval(pg_get_serial_sequence('plants', 'id'), COALESCE((SELECT MAX(id) FROM plants), 1));
SELECT setval(pg_get_serial_sequence('log_book', 'id'), COALESCE((SELECT MAX(id) FROM log_book), 1));
SELECT setval(pg_get_serial_sequence('growth_journal', 'id'), COALESCE((SELECT MAX(id) FROM growth_journal), 1));
SELECT setval(pg_get_serial_sequence('blog_posts', 'id'), COALESCE((SELECT MAX(id) FROM blog_posts), 1));
SELECT setval(pg_get_serial_sequence('contact_messages', 'id'), COALESCE((SELECT MAX(id) FROM contact_messages), 1));
SELECT setval(pg_get_serial_sequence('plant_library', 'id'), COALESCE((SELECT MAX(id) FROM plant_library), 1));
SELECT setval(pg_get_serial_sequence('password_resets', 'id'), COALESCE((SELECT MAX(id) FROM password_resets), 1));
