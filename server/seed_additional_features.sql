-- Seed data for additional features
-- Run after schema_migrations.sql
-- SQLite seed data

-- Insert Achievements
INSERT INTO Achievements (achievement_key, title, description, icon_emoji, requirement_type, requirement_value) VALUES
('first_win', 'First Win', 'Complete your first puzzle!', '🎉', 'puzzle_count', 1),
('speed_demon', 'Speed Demon', 'Complete a puzzle in under 60 seconds', '⚡', 'time', 60),
('perfect_solve', 'Perfect Solver', 'Complete a puzzle with minimum moves', '⭐', 'moves', 20),
('skill_master', 'Skill Master', 'Reach skill level 5.0', '🏆', 'skill_level', 5),
('streak_champion', 'Streak Champion', 'Win 5 puzzles in a row', '🔥', 'streak', 5),
('puzzle_explorer', 'Puzzle Explorer', 'Complete puzzles of all sizes (3x3, 4x4, 6x6, 8x8, 10x10)', '🗺️', 'size_completion', 5),
('hint_free', 'Hint Free', 'Complete a puzzle without using hints', '🎯', 'no_hints', 1),
('marathon', 'Marathon Runner', 'Complete 50 total puzzles', '🏃', 'puzzle_count', 50),
('early_bird', 'Early Bird', 'Complete 10 puzzles', '🐦', 'puzzle_count', 10),
('puzzle_master', 'Puzzle Master', 'Reach skill level 8.0', '👑', 'skill_level', 8);

-- Insert Gifts
INSERT INTO Gifts (gift_key, name, description, rarity, icon_emoji) VALUES
('welcome_gift', 'Welcome Package', 'Your first gift from Santa!', 'common', '🎁'),
('speed_boost', 'Speed Boost Badge', 'Earned by solving puzzles quickly', 'rare', '⚡'),
('precision_gem', 'Precision Gem', 'For perfect puzzle solves', 'rare', '💎'),
('champion_crown', 'Champion Crown', 'Awarded to puzzle masters', 'epic', '👑'),
('explorer_map', 'Explorer Map', 'For completing all puzzle sizes', 'epic', '🗺️'),
('legendary_star', 'Legendary Star', 'The ultimate achievement gift', 'legendary', '⭐'),
('streak_trophy', 'Streak Trophy', 'For maintaining win streaks', 'rare', '🏆'),
('master_medal', 'Master Medal', 'For reaching high skill levels', 'epic', '🥇');

-- Insert PowerUps
INSERT INTO PowerUps (powerup_key, name, description, cost_in_achievements) VALUES
('undo', 'Undo Move', 'Revert your last move (limit 3 per puzzle)', 0),
('shuffle_row', 'Shuffle Row', 'Randomly rearrange one row or column', 2),
('reveal_path', 'Reveal Path', 'Show optimal next 3 moves', 5),
('time_freeze', 'Time Freeze', 'Pause timer for 30 seconds', 3),
('lucky_swap', 'Lucky Swap', 'Automatically move a tile to correct position (once per puzzle)', 7);

-- Initialize Story Progress for existing users (Chapter 1 unlocked)
INSERT OR IGNORE INTO StoryProgress (user_id, chapter_number, completed, unlocked_at)
SELECT user_id, 1, 0, CURRENT_TIMESTAMP FROM Users;

-- Grant initial power-ups to all users (undo is free, others need achievements)
INSERT OR IGNORE INTO UserPowerUps (user_id, powerup_id, quantity, unlocked_at)
SELECT u.user_id, p.powerup_id, 
    CASE WHEN p.powerup_key = 'undo' THEN 3 ELSE 0 END,
    CURRENT_TIMESTAMP
FROM Users u
CROSS JOIN PowerUps p
WHERE p.powerup_key = 'undo';
