-- SQLite Database Schema for Santa's Workshop Puzzle Game
-- This file creates the core tables: Users, Puzzles, and Sessions

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    skill_level REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_email ON Users(email);

-- Puzzles Table
CREATE TABLE IF NOT EXISTS Puzzles (
    puzzle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grid_size INTEGER NOT NULL CHECK(grid_size >= 3 AND grid_size <= 10),
    difficulty_rating INTEGER NOT NULL CHECK(difficulty_rating >= 1 AND difficulty_rating <= 10),
    initial_state_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grid_size ON Puzzles(grid_size);
CREATE INDEX IF NOT EXISTS idx_difficulty_rating ON Puzzles(difficulty_rating);

-- Sessions Table
CREATE TABLE IF NOT EXISTS Sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    puzzle_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
    moves INTEGER DEFAULT 0,
    time_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES Puzzles(puzzle_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_id ON Sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_id ON Sessions(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_status ON Sessions(status);
CREATE INDEX IF NOT EXISTS idx_completed_at ON Sessions(completed_at);
