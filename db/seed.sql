-- PlantCare Seed Script
-- Populates demo data matching UI/UX screenshots

-- Clear existing data
TRUNCATE log_book, plants, care_requirements, rooms, users RESTART IDENTITY CASCADE;

-- Insert Users
-- Password is 'password123'
INSERT INTO users (id, name, email, password, is_active, created_at)
VALUES 
(1, 'Tushar Kumar', 'tushar@example.com', '$2a$10$7nIkOHsHJ0PD6p98BPQZzuOZ2g90/O1K1LnvCTVJEV/n6PNXio6Ce', true, NOW()),
(2, 'Jane Doe', 'jane@example.com', '$2a$10$7nIkOHsHJ0PD6p98BPQZzuOZ2g90/O1K1LnvCTVJEV/n6PNXio6Ce', true, NOW());

SELECT setval('users_id_seq', 2);

-- Insert Rooms for Tushar (User 1)
INSERT INTO rooms (id, name, window_direction, user_id, created_at)
VALUES 
(1, 'Living Room', 'South-facing', 1, NOW()),
(2, 'Bedroom', 'East-facing', 1, NOW()),
(3, 'Balcony', 'North-facing', 1, NOW());

-- Insert Rooms for Jane (User 2 - isolation testing)
INSERT INTO rooms (id, name, window_direction, user_id, created_at)
VALUES 
(4, 'Office', 'West-facing', 2, NOW());

SELECT setval('rooms_id_seq', 4);

-- Insert Care Requirements
INSERT INTO care_requirements (id, water_frequency_days, sunlight_level, fertilizing_frequency_days, created_at)
VALUES 
(1, 3, 'Medium', 15, NOW()),
(2, 4, 'Low', 20, NOW()),
(3, 14, 'Low', 30, NOW()),
(4, 7, 'Medium', 14, NOW()),
(5, 10, 'High', 14, NOW()),
(6, 5, 'High', 14, NOW());

SELECT setval('care_requirements_id_seq', 6);

-- Insert Plants for Tushar (User 1)
INSERT INTO plants (id, nickname, species, image_url, room_id, care_requirement_id, user_id, created_at)
VALUES 
(1, 'Money Plant', 'Epipremnum aureum', 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=500&auto=format&fit=crop&q=60', 1, 1, 1, NOW()),
(2, 'Peace Lily', 'Spathiphyllum', 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?w=500&auto=format&fit=crop&q=60', 3, 2, 1, NOW()),
(3, 'Snake Plant', 'Sansevieria trifasciata', 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?w=500&auto=format&fit=crop&q=60', 2, 3, 1, NOW()),
(4, 'Spider Plant', 'Chlorophytum comosum', 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=500&auto=format&fit=crop&q=60', 1, 4, 1, NOW()),
(5, 'Fiddle Leaf Fig', 'Ficus lyrata', 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=500&auto=format&fit=crop&q=60', 1, 5, 1, NOW());

-- Insert Plant for Jane (User 2)
INSERT INTO plants (id, nickname, species, image_url, room_id, care_requirement_id, user_id, created_at)
VALUES 
(6, 'Aloe Vera', 'Aloe barbadensis miller', 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&auto=format&fit=crop&q=60', 4, 6, 2, NOW());

SELECT setval('plants_id_seq', 6);

-- Insert Log Book entries
-- Money Plant (Plant 1): Watered 3 days ago (Due today!)
INSERT INTO log_book (id, plant_id, action, date, notes, created_at)
VALUES 
(1, 1, 'Watered', CURRENT_DATE - INTERVAL '3 days', 'Watered thoroughly until drainage', NOW() - INTERVAL '3 days'),
(2, 1, 'Fertilized', CURRENT_DATE - INTERVAL '15 days', 'Used half-strength liquid fertilizer', NOW() - INTERVAL '15 days');

-- Peace Lily (Plant 2): Watered 4 days ago (Due today!)
INSERT INTO log_book (id, plant_id, action, date, notes, created_at)
VALUES 
(3, 2, 'Watered', CURRENT_DATE - INTERVAL '4 days', 'Moistened soil, leaves were starting to droop', NOW() - INTERVAL '4 days'),
(4, 2, 'Fertilized', CURRENT_DATE - INTERVAL '18 days', 'Organic houseplant feed', NOW() - INTERVAL '18 days');

-- Snake Plant (Plant 3): Watered 8 days ago (Next watering in 6 days)
INSERT INTO log_book (id, plant_id, action, date, notes, created_at)
VALUES 
(5, 3, 'Watered', CURRENT_DATE - INTERVAL '8 days', 'Light watering, checked soil dry down to 2 inches', NOW() - INTERVAL '8 days'),
(6, 3, 'Pruned', CURRENT_DATE - INTERVAL '25 days', 'Removed dry tip', NOW() - INTERVAL '25 days');

-- Spider Plant (Plant 4): Watered yesterday, next watering in 8 days (relative to 7 + 1)
INSERT INTO log_book (id, plant_id, action, date, notes, created_at)
VALUES 
(7, 4, 'Watered', CURRENT_DATE - INTERVAL '2 days', 'Regular top watering', NOW() - INTERVAL '2 days'),
(8, 4, 'Pruned', CURRENT_DATE - INTERVAL '10 days', 'Trimmed brown tips from low humidity', NOW() - INTERVAL '10 days');

-- Fiddle Leaf Fig (Plant 5)
INSERT INTO log_book (id, plant_id, action, date, notes, created_at)
VALUES 
(9, 5, 'Watered', CURRENT_DATE - INTERVAL '6 days', 'Deep soak, wiped down leaves', NOW() - INTERVAL '6 days'),
(10, 5, 'Fertilized', CURRENT_DATE - INTERVAL '14 days', 'Standard balanced 10-10-10 fertilizer', NOW() - INTERVAL '14 days');

-- Jane's plant log
INSERT INTO log_book (id, plant_id, action, date, notes, created_at)
VALUES 
(11, 6, 'Watered', CURRENT_DATE - INTERVAL '5 days', 'Checked moisture level', NOW() - INTERVAL '5 days');

SELECT setval('log_book_id_seq', 11);
