-- Schema Migrations for Additional Features
-- Run this after the initial schema.sql has been executed
-- SQLite Database Schema

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Add theme_preference to Users table (only if column doesn't exist)
-- Note: IF NOT EXISTS requires SQLite 3.32.0+, so we handle this in application code if needed
-- For fresh database setup, this should work fine
ALTER TABLE Users ADD COLUMN theme_preference TEXT DEFAULT NULL;

-- Achievements Table
CREATE TABLE IF NOT EXISTS Achievements (
    achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    icon_emoji TEXT DEFAULT '🎁',
    requirement_type TEXT NOT NULL CHECK(requirement_type IN ('puzzle_count', 'time', 'moves', 'skill_level', 'streak', 'size_completion', 'no_hints', 'first_win', 'speed_demon', 'perfect_solve', 'skill_master', 'hint_free', 'puzzle_explorer', 'marathon')),
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievement_key ON Achievements(achievement_key);

-- UserAchievements Table
CREATE TABLE IF NOT EXISTS UserAchievements (
    user_achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES Achievements(achievement_id) ON DELETE CASCADE,
    UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_id ON UserAchievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_id ON UserAchievements(achievement_id);

-- Gifts Table
CREATE TABLE IF NOT EXISTS Gifts (
    gift_id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
    icon_emoji TEXT DEFAULT '🎁',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gift_key ON Gifts(gift_key);
CREATE INDEX IF NOT EXISTS idx_rarity ON Gifts(rarity);

-- UserGifts Table
CREATE TABLE IF NOT EXISTS UserGifts (
    user_gift_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    gift_id INTEGER NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlocked INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (gift_id) REFERENCES Gifts(gift_id) ON DELETE CASCADE,
    UNIQUE (user_id, gift_id)
);

CREATE INDEX IF NOT EXISTS idx_user_id ON UserGifts(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_id ON UserGifts(gift_id);

-- StoryProgress Table
CREATE TABLE IF NOT EXISTS StoryProgress (
    progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chapter_number INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_user_id ON StoryProgress(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_number ON StoryProgress(chapter_number);

-- Analytics Table
CREATE TABLE IF NOT EXISTS Analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    user_id INTEGER NULL,
    session_id TEXT NULL,
    puzzle_id INTEGER NULL,
    event_data TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (puzzle_id) REFERENCES Puzzles(puzzle_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_type ON Analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_id ON Analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_session_id ON Analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON Analytics(created_at);

-- PowerUps Table
CREATE TABLE IF NOT EXISTS PowerUps (
    powerup_id INTEGER PRIMARY KEY AUTOINCREMENT,
    powerup_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    cost_in_achievements INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_powerup_key ON PowerUps(powerup_key);

-- UserPowerUps Table
CREATE TABLE IF NOT EXISTS UserPowerUps (
    user_powerup_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    powerup_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (powerup_id) REFERENCES PowerUps(powerup_id) ON DELETE CASCADE,
    UNIQUE (user_id, powerup_id)
);

CREATE INDEX IF NOT EXISTS idx_user_id ON UserPowerUps(user_id);
CREATE INDEX IF NOT EXISTS idx_powerup_id ON UserPowerUps(powerup_id);
