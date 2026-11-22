-- Migration: 001_growth_journal.sql
-- Create Growth Journal table for plant milestones & visual progression tracking

CREATE TABLE IF NOT EXISTS growth_journal (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT NOT NULL,
    image_url VARCHAR(500),
    height_cm NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_growth_journal_plant_id ON growth_journal(plant_id);
CREATE INDEX IF NOT EXISTS idx_growth_journal_date ON growth_journal(date);
