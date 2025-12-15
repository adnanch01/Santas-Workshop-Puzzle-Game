// server/api.js

require('dotenv').config({ path: './.env' }); 
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(express.json());
// Allow all origins for simplicity in this demo deployment
app.use(cors());

// --- Database Connection Setup ---
let db;

function connectDB() {
    try {
        const dbPath = process.env.DB_PATH || './santas_workshop.db';
        db = new Database(dbPath);
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        // Ensure schema exists (auto-initialize on first run)
        initializeDatabaseIfNeeded(db);
        // Test connection
        db.prepare('SELECT 1').get();
        console.log("Database connected successfully.");
    } catch (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1); 
    }
}

// Initialize database schema and seed data if tables are missing
function initializeDatabaseIfNeeded(dbInstance) {
    try {
        const tableCheck = dbInstance.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='Users'"
        ).get();

        if (tableCheck) {
            // Schema already initialized
            return;
        }

        console.log('No Users table found. Initializing database schema...');

        const sqlFiles = [
            path.join(__dirname, 'schema.sql'),
            path.join(__dirname, 'seed.sql'),
            path.join(__dirname, 'schema_migrations.sql'),
            path.join(__dirname, 'seed_additional_features.sql')
        ];

        for (const filePath of sqlFiles) {
            if (!fsSync.existsSync(filePath)) {
                console.error(`SQL file not found during init: ${filePath}`);
                continue;
            }

            const sql = fsSync.readFileSync(filePath, 'utf8');
            dbInstance.exec(sql);
            console.log(`Executed ${path.basename(filePath)} successfully.`);
        }

        console.log('Database schema initialization complete.');
    } catch (err) {
        console.error('Database initialization error:', err);
        // Let the app continue so we can see clear error responses
    }
}

// --- Adaptive Logic Helper Function ---
// This function determines the difficulty based on the player's skill.
function mapSkillToDifficulty(skillLevel) {
    // Adaptive Gameplay Experience: Difficulty scales with player skill.
    if (skillLevel < 2.5) {
        return { size: 4, difficulty: 2 }; // Beginner/Standard 4x4
    } else if (skillLevel < 5.0) {
        return { size: 6, difficulty: 4 }; // Intermediate 6x6 (Dynamic Puzzle Mechanics)
    } else if (skillLevel < 8.0) {
        return { size: 8, difficulty: 6 }; // Advanced 8x8
    } else {
        return { size: 10, difficulty: 8 }; // Expert 10x10
    }
}

// Helper function to check and award achievements
function checkAchievements(db, userId, moves, time, puzzleId, skillLevel, hintUsed) {
    try {
        // Get user stats
        const completedCountStmt = db.prepare(`
            SELECT COUNT(*) as count FROM Sessions 
            WHERE user_id = ? AND status = 'completed'
        `);
        const completedCountResult = completedCountStmt.get(userId);
        
        const sizesStmt = db.prepare(`
            SELECT DISTINCT p.grid_size 
            FROM Sessions s
            JOIN Puzzles p ON s.puzzle_id = p.puzzle_id
            WHERE s.user_id = ? AND s.status = 'completed'
        `);
        const sizesResult = sizesStmt.all(userId);
        
        const lastWinStmt = db.prepare(`
            SELECT session_id FROM Sessions 
            WHERE user_id = ? AND status = 'completed'
            ORDER BY completed_at DESC LIMIT 5
        `);
        const lastWinResult = lastWinStmt.all(userId);
        
        const completedSizes = sizesResult.map(s => s.grid_size);
        const totalCompleted = parseInt(completedCountResult.count);
        
        // Get all achievements
        const allAchievementsStmt = db.prepare('SELECT * FROM Achievements');
        const allAchievements = allAchievementsStmt.all();
        
        // Get already earned achievements
        const earnedStmt = db.prepare(`
            SELECT achievement_id FROM UserAchievements WHERE user_id = ?
        `);
        const earnedResult = earnedStmt.all(userId);
        const earnedIds = new Set(earnedResult.map(e => e.achievement_id));
        
        const newlyEarned = [];
        
        // Check each achievement
        for (const achievement of allAchievements) {
            if (earnedIds.has(achievement.achievement_id)) {
                continue; // Already earned
            }
            
            let qualifies = false;
            
            switch (achievement.requirement_type) {
                case 'puzzle_count':
                    qualifies = totalCompleted >= achievement.requirement_value;
                    break;
                case 'time':
                    qualifies = time && time <= achievement.requirement_value;
                    break;
                case 'moves':
                    qualifies = moves && moves <= achievement.requirement_value;
                    break;
                case 'skill_level':
                    qualifies = skillLevel && skillLevel >= achievement.requirement_value;
                    break;
                case 'streak':
                    qualifies = lastWinResult.length >= achievement.requirement_value;
                    break;
                case 'size_completion':
                    qualifies = completedSizes.length >= achievement.requirement_value;
                    break;
                case 'no_hints':
                    qualifies = hintUsed === false || hintUsed === 0;
                    break;
            }
            
            if (qualifies) {
                // Award achievement
                const insertStmt = db.prepare(
                    'INSERT INTO UserAchievements (user_id, achievement_id) VALUES (?, ?)'
                );
                insertStmt.run(userId, achievement.achievement_id);
                newlyEarned.push({
                    achievement_id: achievement.achievement_id,
                    title: achievement.title,
                    icon_emoji: achievement.icon_emoji,
                    earned_at: new Date()
                });
            }
        }
        
        return newlyEarned;
    } catch (error) {
        console.error("Error checking achievements:", error);
        return [];
    }
}


// --- API Routes ---

// === USER AUTHENTICATION ===

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Insert user
        const stmt = db.prepare(
            'INSERT INTO Users (username, email, password_hash, skill_level) VALUES (?, ?, ?, 1.0)'
        );
        const info = stmt.run(username, email || null, passwordHash);

        return res.status(201).json({
            userId: info.lastInsertRowid,
            username,
            message: "User registered successfully."
        });

    } catch (error) {
        console.error("Error registering user:", error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: "Username or email already exists." });
        }
        return res.status(500).json({ error: "Server error during registration." });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const stmt = db.prepare(
            'SELECT user_id, username, password_hash, skill_level FROM Users WHERE username = ?'
        );
        const user = stmt.get(username);

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password." });
        }
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        return res.json({
            userId: user.user_id,
            username: user.username,
            skillLevel: user.skill_level,
            message: "Login successful."
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Server error during login." });
    }
});

// Create guest user
app.post('/api/users/create-guest', async (req, res) => {
    try {
        const guestUsername = `guest_${Date.now()}`;
        const guestPassword = Math.random().toString(36).substring(7);
        const passwordHash = await bcrypt.hash(guestPassword, 10);
        
        const stmt = db.prepare(
            'INSERT INTO Users (username, password_hash, skill_level) VALUES (?, ?, 1.0)'
        );
        const info = stmt.run(guestUsername, passwordHash);

        return res.status(201).json({
            userId: info.lastInsertRowid,
            username: guestUsername,
            message: "Guest user created."
        });

    } catch (error) {
        console.error("Error creating guest user:", error);
        return res.status(500).json({ error: "Server error creating guest user." });
    }
});

// === PUZZLE GAME ===

// 1. Adaptive Puzzle Generation (Smart Learning System)
app.post('/api/puzzle/generate', async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        // 1. Get user's skill level
        const userStmt = db.prepare(
            'SELECT skill_level FROM Users WHERE user_id = ?'
        );
        const user = userStmt.get(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        
        const skillLevel = user.skill_level;
        const { size, difficulty } = mapSkillToDifficulty(skillLevel);

        // 2. Query for a puzzle matching the calculated difficulty
        // Select a random puzzle that matches the required size and difficulty.
        const puzzleStmt = db.prepare(
            'SELECT puzzle_id, initial_state_json FROM Puzzles WHERE grid_size = ? AND difficulty_rating = ? ORDER BY RANDOM() LIMIT 1'
        );
        let puzzle = puzzleStmt.get(size, difficulty);
        
        if (!puzzle) {
            // Fallback to a standard 4x4 puzzle if required difficulty is missing
            const fallbackStmt = db.prepare(
                'SELECT puzzle_id, initial_state_json FROM Puzzles WHERE grid_size = 4 ORDER BY RANDOM() LIMIT 1'
            );
            puzzle = fallbackStmt.get();
            if (!puzzle) {
                return res.status(500).json({ error: "No puzzles found in the database." });
            }
        }

        const sessionId = uuidv4();
        
        // 3. Create a new session (Comprehensive Progress Tracking)
        const sessionInsertStmt = db.prepare(
            "INSERT INTO Sessions (session_id, user_id, puzzle_id, status) VALUES (?, ?, ?, 'active')"
        );
        sessionInsertStmt.run(sessionId, userId, puzzle.puzzle_id);

        // Log analytics (non-blocking)
        try {
            const analyticsStmt = db.prepare(
                'INSERT INTO Analytics (event_type, user_id, session_id, puzzle_id) VALUES (?, ?, ?, ?)'
            );
            analyticsStmt.run('puzzle_started', userId, sessionId, puzzle.puzzle_id);
        } catch (analyticsError) {
            console.error("Analytics logging failed:", analyticsError);
        }

        // 4. Send the puzzle data back to the client
        return res.json({
            sessionId,
            size: size,
            initialBoard: JSON.parse(puzzle.initial_state_json),
            difficultyRating: difficulty
        });

    } catch (error) {
        console.error("Error generating puzzle:", error);
        return res.status(500).json({ error: "Server error during puzzle generation." });
    }
});


// 2. Comprehensive Progress Tracking (Game Sessions)
app.post('/api/game/end', async (req, res) => {
    const { sessionId, moves, time, status } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required." });
    }

    try {
        // Get session and puzzle info
        const sessionStmt = db.prepare(
            'SELECT s.user_id, s.puzzle_id, p.grid_size, p.difficulty_rating FROM Sessions s JOIN Puzzles p ON s.puzzle_id = p.puzzle_id WHERE s.session_id = ?'
        );
        const session = sessionStmt.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        const userId = session.user_id;
        const difficulty = session.difficulty_rating;
        const gridSize = session.grid_size;

        // Update session
        const updateSessionStmt = db.prepare(
            'UPDATE Sessions SET status = ?, moves = ?, time_seconds = ?, completed_at = CURRENT_TIMESTAMP WHERE session_id = ?'
        );
        updateSessionStmt.run(status || 'completed', moves || 0, time || 0, sessionId);

        // Calculate skill level adjustment
        // Get current skill level
        const userStmt = db.prepare(
            'SELECT skill_level FROM Users WHERE user_id = ?'
        );
        const user = userStmt.get(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const currentSkill = parseFloat(user.skill_level);
        
        // Skill calculation: reward efficiency and difficulty
        // Base adjustment on difficulty completed
        let skillAdjustment = 0;
        
        if (status === 'completed' && moves > 0) {
            // Better performance (fewer moves, less time) = higher skill increase
            const expectedMoves = gridSize * gridSize * 5; // Rough heuristic
            const efficiency = Math.max(0.1, expectedMoves / moves);
            const timeBonus = Math.max(0.5, 1.0 - (time / 600)); // Time bonus (under 10 min)
            
            skillAdjustment = (difficulty / 10) * efficiency * timeBonus * 0.3;
            skillAdjustment = Math.min(skillAdjustment, 1.0); // Cap increase at 1.0
        }
        
        const newSkill = Math.max(0.5, Math.min(10.0, currentSkill + skillAdjustment));

        // Update user skill level
        const updateUserStmt = db.prepare(
            'UPDATE Users SET skill_level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        );
        updateUserStmt.run(newSkill, userId);

        // Check for achievements (non-blocking)
        let newlyEarned = [];
        if (status === 'completed') {
            try {
                // Get hint usage for this session
                const hintUsageStmt = db.prepare(
                    'SELECT COUNT(*) as count FROM Analytics WHERE session_id = ? AND event_type = ?'
                );
                const hintUsageResult = hintUsageStmt.get(sessionId, 'hint_used');
                const hintUsed = parseInt(hintUsageResult.count) > 0;

                // Check achievements using helper function
                newlyEarned = checkAchievements(db, userId, moves, time, session.puzzle_id, newSkill, hintUsed);
                
                // Log achievement events
                for (const achievement of newlyEarned) {
                    try {
                        const achievementAnalyticsStmt = db.prepare(
                            'INSERT INTO Analytics (event_type, user_id, session_id, event_data) VALUES (?, ?, ?, ?)'
                        );
                        achievementAnalyticsStmt.run('achievement_earned', userId, sessionId, JSON.stringify({ achievement_id: achievement.achievement_id }));
                    } catch (analyticsError) {
                        console.error("Achievement analytics logging failed:", analyticsError);
                    }
                }
            } catch (achievementError) {
                console.error("Achievement check failed (non-critical):", achievementError);
            }
        }

        // Log analytics
        try {
            const analyticsStmt = db.prepare(
                'INSERT INTO Analytics (event_type, user_id, session_id, puzzle_id, event_data) VALUES (?, ?, ?, ?, ?)'
            );
            analyticsStmt.run('puzzle_completed', userId, sessionId, session.puzzle_id, JSON.stringify({ moves, time, status }));
        } catch (analyticsError) {
            console.error("Analytics logging failed:", analyticsError);
        }

        return res.json({
            message: "Game session saved and skill updated.",
            oldSkill: currentSkill,
            newSkill: newSkill,
            adjustment: skillAdjustment,
            newlyEarnedAchievements: newlyEarned
        });

    } catch (error) {
        console.error("Error ending game:", error);
        return res.status(500).json({ error: "Server error ending game." });
    }
});

// 3. Holiday Magic Hint (Strategic Assistance Features)
app.post('/api/magic/hint', async (req, res) => {
    const { sessionId, currentBoard, size, userId } = req.body;
    
    if (!currentBoard || !size) {
        return res.status(400).json({ error: "Current board state and size are required." });
    }

    try {
        // Find the empty tile position
        const emptyIndex = currentBoard.findIndex(tile => tile === null);
        
        if (emptyIndex === -1) {
            return res.status(400).json({ error: "Invalid board state: no empty tile found." });
        }

        // Get solved board state
        const solvedBoard = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat(null);

        // Find adjacent tiles and calculate which one is most out of place (Manhattan distance)
        const emptyRow = Math.floor(emptyIndex / size);
        const emptyCol = emptyIndex % size;

        const adjacentPositions = [
            { row: emptyRow - 1, col: emptyCol, index: emptyIndex - size }, // Up
            { row: emptyRow + 1, col: emptyCol, index: emptyIndex + size }, // Down
            { row: emptyRow, col: emptyCol - 1, index: emptyIndex - 1 },    // Left
            { row: emptyRow, col: emptyCol + 1, index: emptyIndex + 1 }     // Right
        ];

        let bestTile = null;
        let maxDistance = -1;

        for (const pos of adjacentPositions) {
            // Check bounds
            if (pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
                continue;
            }
            
            // Check if move is valid (same row or column)
            const sameRow = pos.row === emptyRow;
            const sameCol = pos.col === emptyCol;
            
            if (!sameRow && !sameCol) {
                continue;
            }

            const tileValue = currentBoard[pos.index];
            
            if (tileValue === null) {
                continue;
            }

            // Calculate Manhattan distance from current position to target position
            const targetIndex = solvedBoard.indexOf(tileValue);
            const targetRow = Math.floor(targetIndex / size);
            const targetCol = targetIndex % size;
            
            const currentDistance = Math.abs(pos.row - targetRow) + Math.abs(pos.col - targetCol);
            const newDistance = Math.abs(emptyRow - targetRow) + Math.abs(emptyCol - targetCol);
            
            // If moving this tile closer to its target position
            const improvement = currentDistance - newDistance;
            
            if (improvement > maxDistance) {
                maxDistance = improvement;
                bestTile = tileValue;
            }
        }

        // Fallback: if no improvement found, just suggest any adjacent tile
        if (bestTile === null) {
            for (const pos of adjacentPositions) {
                if (pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size) {
                    const tileValue = currentBoard[pos.index];
                    if (tileValue !== null) {
                        bestTile = tileValue;
                        break;
                    }
                }
            }
        }

        // Log analytics (non-blocking)
        try {
            const analyticsStmt = db.prepare(
                'INSERT INTO Analytics (event_type, user_id, session_id, event_data) VALUES (?, ?, ?, ?)'
            );
            analyticsStmt.run('hint_used', userId || null, sessionId || null, JSON.stringify({ size }));
        } catch (analyticsError) {
            console.error("Analytics logging failed:", analyticsError);
        }

        return res.json({ nextTile: bestTile });

    } catch (error) {
        console.error("Error generating hint:", error);
        return res.status(500).json({ error: "Server error generating hint." });
    }
});

// === ANALYTICS ===

// Log analytics event (non-blocking)
app.post('/api/analytics/log', async (req, res) => {
    const { eventType, userId, sessionId, puzzleId, eventData } = req.body;
    
    try {
        const stmt = db.prepare(
            'INSERT INTO Analytics (event_type, user_id, session_id, puzzle_id, event_data) VALUES (?, ?, ?, ?, ?)'
        );
        stmt.run(eventType, userId || null, sessionId || null, puzzleId || null, eventData ? JSON.stringify(eventData) : null);
        
        return res.json({ success: true });
    } catch (error) {
        // Analytics logging should never break game flow - log error but return success
        console.error("Analytics logging error:", error);
        return res.json({ success: true }); // Fire-and-forget pattern
    }
});

// Get puzzle popularity
app.get('/api/analytics/puzzle-popularity', async (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                p.puzzle_id,
                COUNT(s.session_id) as completion_count,
                AVG(s.time_seconds) as average_time,
                AVG(s.moves) as average_moves
            FROM Puzzles p
            LEFT JOIN Sessions s ON p.puzzle_id = s.puzzle_id AND s.status = 'completed'
            GROUP BY p.puzzle_id
            ORDER BY completion_count DESC
            LIMIT 10
        `);
        
        return res.json({ puzzles: stmt.all() });
    } catch (error) {
        console.error("Error fetching puzzle popularity:", error);
        return res.status(500).json({ error: "Server error fetching analytics." });
    }
});

// Get player behavior
app.get('/api/analytics/player-behavior/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const statsStmt = db.prepare(`
            SELECT 
                COUNT(DISTINCT s.session_id) as total_puzzles,
                SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                AVG(CASE WHEN s.status = 'completed' THEN s.time_seconds ELSE NULL END) as average_time,
                AVG(CASE WHEN s.status = 'completed' THEN s.moves ELSE NULL END) as average_moves,
                (SELECT grid_size FROM Sessions s2 
                 JOIN Puzzles p2 ON s2.puzzle_id = p2.puzzle_id 
                 WHERE s2.user_id = ? AND s2.status = 'completed' 
                 GROUP BY p2.grid_size 
                 ORDER BY COUNT(*) DESC LIMIT 1) as favorite_size
            FROM Sessions s
            WHERE s.user_id = ?
        `);
        
        const hintUsageStmt = db.prepare(`
            SELECT COUNT(*) as hint_count
            FROM Analytics
            WHERE user_id = ? AND event_type = 'hint_used'
        `);
        
        const stats = statsStmt.get(userId);
        const hintUsage = hintUsageStmt.get(userId);
        const completionRate = stats.total_puzzles > 0 
            ? (stats.completed_count / stats.total_puzzles) * 100 
            : 0;
        
        return res.json({
            total_puzzles: parseInt(stats.total_puzzles) || 0,
            completion_rate: completionRate,
            average_time: parseFloat(stats.average_time) || 0,
            average_moves: parseFloat(stats.average_moves) || 0,
            favorite_size: parseInt(stats.favorite_size) || 4,
            hint_usage_count: parseInt(hintUsage.hint_count) || 0
        });
    } catch (error) {
        console.error("Error fetching player behavior:", error);
        return res.status(500).json({ error: "Server error fetching player behavior." });
    }
});

// Get system performance
app.get('/api/analytics/system-performance', async (req, res) => {
    try {
        const usersStmt = db.prepare('SELECT COUNT(*) as total FROM Users');
        const sessionsStmt = db.prepare('SELECT COUNT(*) as total FROM Sessions');
        const avgTimeStmt = db.prepare(`
            SELECT AVG(time_seconds) as avg_time 
            FROM Sessions 
            WHERE status = 'completed' AND time_seconds > 0
        `);
        const commonDiffStmt = db.prepare(`
            SELECT difficulty_rating, COUNT(*) as count
            FROM Sessions s
            JOIN Puzzles p ON s.puzzle_id = p.puzzle_id
            WHERE s.status = 'completed'
            GROUP BY difficulty_rating
            ORDER BY count DESC
            LIMIT 1
        `);
        
        const usersResult = usersStmt.get();
        const sessionsResult = sessionsStmt.get();
        const avgTimeResult = avgTimeStmt.get();
        const commonDiffResult = commonDiffStmt.get();
        
        return res.json({
            total_users: parseInt(usersResult.total),
            total_sessions: parseInt(sessionsResult.total),
            average_completion_time: parseFloat(avgTimeResult?.avg_time) || 0,
            most_common_difficulty: parseInt(commonDiffResult?.difficulty_rating) || 0
        });
    } catch (error) {
        console.error("Error fetching system performance:", error);
        return res.status(500).json({ error: "Server error fetching system performance." });
    }
});

// === ACHIEVEMENTS ===

// Get user achievements
app.get('/api/achievements/user/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const stmt = db.prepare(`
            SELECT 
                a.achievement_id,
                a.achievement_key,
                a.title,
                a.description,
                a.icon_emoji,
                ua.earned_at
            FROM Achievements a
            INNER JOIN UserAchievements ua ON a.achievement_id = ua.achievement_id
            WHERE ua.user_id = ?
            ORDER BY ua.earned_at DESC
        `);
        
        return res.json({ achievements: stmt.all(userId) });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return res.status(500).json({ error: "Server error fetching achievements." });
    }
});

// Check and award achievements
app.post('/api/achievements/check', async (req, res) => {
    const { userId, moves, time, puzzleId, skillLevel, hintUsed } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }
    
    try {
        // Get user stats
        const completedCountStmt = db.prepare(`
            SELECT COUNT(*) as count FROM Sessions 
            WHERE user_id = ? AND status = 'completed'
        `);
        
        const sizesStmt = db.prepare(`
            SELECT DISTINCT p.grid_size 
            FROM Sessions s
            JOIN Puzzles p ON s.puzzle_id = p.puzzle_id
            WHERE s.user_id = ? AND s.status = 'completed'
        `);
        
        const lastWinStmt = db.prepare(`
            SELECT session_id FROM Sessions 
            WHERE user_id = ? AND status = 'completed'
            ORDER BY completed_at DESC LIMIT 5
        `);
        
        const completedCountResult = completedCountStmt.get(userId);
        const sizesResult = sizesStmt.all(userId);
        const lastWinResult = lastWinStmt.all(userId);
        
        const completedSizes = sizesResult.map(s => s.grid_size);
        const totalCompleted = parseInt(completedCountResult.count);
        
        // Get all achievements
        const allAchievementsStmt = db.prepare('SELECT * FROM Achievements');
        const allAchievements = allAchievementsStmt.all();
        
        // Get already earned achievements
        const earnedStmt = db.prepare(`
            SELECT achievement_id FROM UserAchievements WHERE user_id = ?
        `);
        const earnedResult = earnedStmt.all(userId);
        const earnedIds = new Set(earnedResult.map(e => e.achievement_id));
        
        const newlyEarned = [];
        
        // Check each achievement
        for (const achievement of allAchievements) {
            if (earnedIds.has(achievement.achievement_id)) {
                continue; // Already earned
            }
            
            let qualifies = false;
            
            switch (achievement.requirement_type) {
                case 'puzzle_count':
                    qualifies = totalCompleted >= achievement.requirement_value;
                    break;
                case 'time':
                    qualifies = time && time <= achievement.requirement_value;
                    break;
                case 'moves':
                    qualifies = moves && moves <= achievement.requirement_value;
                    break;
                case 'skill_level':
                    qualifies = skillLevel && skillLevel >= achievement.requirement_value;
                    break;
                case 'streak':
                    qualifies = lastWinResult.length >= achievement.requirement_value;
                    break;
                case 'size_completion':
                    qualifies = completedSizes.length >= achievement.requirement_value;
                    break;
                case 'no_hints':
                    qualifies = hintUsed === false || hintUsed === 0;
                    break;
            }
            
            if (qualifies) {
                // Award achievement
                const insertStmt = db.prepare(
                    'INSERT INTO UserAchievements (user_id, achievement_id) VALUES (?, ?)'
                );
                insertStmt.run(userId, achievement.achievement_id);
                newlyEarned.push({
                    achievement_id: achievement.achievement_id,
                    title: achievement.title,
                    icon_emoji: achievement.icon_emoji,
                    earned_at: new Date()
                });
            }
        }
        
        return res.json({ newlyEarned });
    } catch (error) {
        console.error("Error checking achievements:", error);
        return res.status(500).json({ error: "Server error checking achievements." });
    }
});

// === GIFTS ===

// Get user gifts
app.get('/api/gifts/user/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const stmt = db.prepare(`
            SELECT 
                g.gift_id,
                g.gift_key,
                g.name,
                g.description,
                g.rarity,
                g.icon_emoji,
                ug.unlocked,
                ug.earned_at
            FROM Gifts g
            INNER JOIN UserGifts ug ON g.gift_id = ug.gift_id
            WHERE ug.user_id = ?
            ORDER BY ug.earned_at DESC
        `);
        
        return res.json({ gifts: stmt.all(userId) });
    } catch (error) {
        console.error("Error fetching gifts:", error);
        return res.status(500).json({ error: "Server error fetching gifts." });
    }
});

// Unlock gift (called automatically when achievement milestone reached)
app.post('/api/gifts/unlock', async (req, res) => {
    const { userId, giftKey } = req.body;
    
    if (!userId || !giftKey) {
        return res.status(400).json({ error: "User ID and gift key are required." });
    }
    
    try {
        // Get gift
        const giftsStmt = db.prepare('SELECT gift_id FROM Gifts WHERE gift_key = ?');
        const giftRow = giftsStmt.get(giftKey);
        
        if (!giftRow) {
            return res.status(404).json({ error: "Gift not found." });
        }
        
        const giftId = giftRow.gift_id;
        
        // Check if already unlocked
        const existingStmt = db.prepare(
            'SELECT * FROM UserGifts WHERE user_id = ? AND gift_id = ?'
        );
        const existing = existingStmt.get(userId, giftId);
        
        if (existing) {
            // Update to unlocked
            const updateStmt = db.prepare(
                'UPDATE UserGifts SET unlocked = 1 WHERE user_id = ? AND gift_id = ?'
            );
            updateStmt.run(userId, giftId);
        } else {
            // Insert new
            const insertStmt = db.prepare(
                'INSERT INTO UserGifts (user_id, gift_id, unlocked) VALUES (?, ?, 1)'
            );
            insertStmt.run(userId, giftId);
        }
        
        const giftStmt = db.prepare(`
            SELECT g.*, ug.unlocked, ug.earned_at 
            FROM Gifts g
            JOIN UserGifts ug ON g.gift_id = ug.gift_id
            WHERE g.gift_id = ? AND ug.user_id = ?
        `);
        
        return res.json({ gift: giftStmt.get(giftId, userId) });
    } catch (error) {
        console.error("Error unlocking gift:", error);
        return res.status(500).json({ error: "Server error unlocking gift." });
    }
});

// === POWER-UPS ===

// Get user power-ups
app.get('/api/powerups/user/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const stmt = db.prepare(`
            SELECT 
                p.powerup_id,
                p.powerup_key,
                p.name,
                p.description,
                up.quantity,
                up.unlocked_at,
                CASE WHEN up.user_powerup_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
            FROM PowerUps p
            LEFT JOIN UserPowerUps up ON p.powerup_id = up.powerup_id AND up.user_id = ?
            ORDER BY p.powerup_id
        `);
        
        return res.json({ powerups: stmt.all(userId) });
    } catch (error) {
        console.error("Error fetching power-ups:", error);
        return res.status(500).json({ error: "Server error fetching power-ups." });
    }
});

// Use power-up
app.post('/api/powerups/use', async (req, res) => {
    const { userId, sessionId, powerupId, boardState, size } = req.body;
    
    if (!userId || !powerupId || !boardState || !size) {
        return res.status(400).json({ error: "User ID, power-up ID, board state, and size are required." });
    }
    
    try {
        // Check if user has power-up available
        const userPowerupStmt = db.prepare(`
            SELECT quantity, powerup_key FROM UserPowerUps up
            JOIN PowerUps p ON up.powerup_id = p.powerup_id
            WHERE up.user_id = ? AND up.powerup_id = ?
        `);
        const userPowerup = userPowerupStmt.get(userId, powerupId);
        
        if (!userPowerup || userPowerup.quantity <= 0) {
            return res.status(403).json({ error: "Power-up not available or insufficient quantity." });
        }
        
        const powerupKey = userPowerup.powerup_key;
        let modifiedBoard = [...boardState];
        let message = '';
        
        // Apply power-up effect
        switch (powerupKey) {
            case 'undo':
                // Undo logic would need to track move history - simplified for now
                message = 'Undo move applied (implementation requires move history tracking)';
                break;
                
            case 'shuffle_row':
                // Shuffle a random row
                const row = Math.floor(Math.random() * size);
                const rowStart = row * size;
                const rowEnd = rowStart + size;
                const rowTiles = modifiedBoard.slice(rowStart, rowEnd).filter(t => t !== null);
                const shuffled = rowTiles.sort(() => Math.random() - 0.5);
                let idx = 0;
                for (let i = rowStart; i < rowEnd; i++) {
                    if (modifiedBoard[i] !== null) {
                        modifiedBoard[i] = shuffled[idx++];
                    }
                }
                message = `Row ${row + 1} shuffled`;
                break;
                
            case 'reveal_path':
                // Return hint for next moves (same logic as hint endpoint)
                message = 'Path revealed - check hint system';
                break;
                
            case 'time_freeze':
                // Timer freeze handled on frontend
                message = 'Time frozen for 30 seconds';
                break;
                
            case 'lucky_swap':
                // Find a tile that's not in correct position and move it
                const solvedBoard = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat(null);
                for (let i = 0; i < modifiedBoard.length; i++) {
                    if (modifiedBoard[i] !== solvedBoard[i] && modifiedBoard[i] !== null) {
                        const targetIdx = solvedBoard.indexOf(modifiedBoard[i]);
                        if (targetIdx !== -1 && modifiedBoard[targetIdx] === null) {
                            modifiedBoard[targetIdx] = modifiedBoard[i];
                            modifiedBoard[i] = null;
                            message = `Tile moved to correct position`;
                            break;
                        }
                    }
                }
                if (!message) message = 'Lucky swap applied';
                break;
                
            default:
                return res.status(400).json({ error: "Unknown power-up type." });
        }
        
        // Decrement quantity
        const updateStmt = db.prepare(
            'UPDATE UserPowerUps SET quantity = quantity - 1 WHERE user_id = ? AND powerup_id = ?'
        );
        updateStmt.run(userId, powerupId);
        
        // Log analytics
        try {
            const analyticsStmt = db.prepare(
                'INSERT INTO Analytics (event_type, user_id, session_id, event_data) VALUES (?, ?, ?, ?)'
            );
            analyticsStmt.run('powerup_used', userId, sessionId || null, JSON.stringify({ powerup_id: powerupId, powerup_key: powerupKey }));
        } catch (analyticsError) {
            console.error("Analytics logging failed:", analyticsError);
        }
        
        return res.json({ 
            success: true, 
            modifiedBoard, 
            message,
            powerupKey
        });
    } catch (error) {
        console.error("Error using power-up:", error);
        return res.status(500).json({ error: "Server error using power-up." });
    }
});

// Unlock power-up
app.post('/api/powerups/unlock', async (req, res) => {
    const { userId, powerupKey } = req.body;
    
    if (!userId || !powerupKey) {
        return res.status(400).json({ error: "User ID and power-up key are required." });
    }
    
    try {
        const powerupsStmt = db.prepare('SELECT powerup_id FROM PowerUps WHERE powerup_key = ?');
        const powerupRow = powerupsStmt.get(powerupKey);
        
        if (!powerupRow) {
            return res.status(404).json({ error: "Power-up not found." });
        }
        
        const powerupId = powerupRow.powerup_id;
        
        // Check if already unlocked
        const existingStmt = db.prepare(
            'SELECT * FROM UserPowerUps WHERE user_id = ? AND powerup_id = ?'
        );
        const existing = existingStmt.get(userId, powerupId);
        
        if (!existing) {
            const insertStmt = db.prepare(
                'INSERT INTO UserPowerUps (user_id, powerup_id, quantity) VALUES (?, ?, 1)'
            );
            insertStmt.run(userId, powerupId);
        }
        
        const powerupStmt = db.prepare(`
            SELECT p.*, up.quantity, up.unlocked_at 
            FROM PowerUps p
            JOIN UserPowerUps up ON p.powerup_id = up.powerup_id
            WHERE p.powerup_id = ? AND up.user_id = ?
        `);
        
        return res.json({ powerup: powerupStmt.get(powerupId, userId) });
    } catch (error) {
        console.error("Error unlocking power-up:", error);
        return res.status(500).json({ error: "Server error unlocking power-up." });
    }
});

// === STORY MODE ===

// Get story progress
app.get('/api/story/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const storyPath = path.join(__dirname, 'story_content.json');
        const storyContent = JSON.parse(await fs.readFile(storyPath, 'utf8'));
        
        const progressStmt = db.prepare(
            'SELECT chapter_number, completed FROM StoryProgress WHERE user_id = ? ORDER BY chapter_number'
        );
        const progressRows = progressStmt.all(userId);
        
        const progressMap = new Map(progressRows.map(p => [p.chapter_number, p.completed === 1]));
        
        const chapters = storyContent.chapters.map(chapter => ({
            chapter_number: chapter.chapter_number,
            title: chapter.title,
            description: chapter.narrative.substring(0, 100) + '...',
            completed: progressMap.get(chapter.chapter_number) || false,
            unlocked: progressMap.has(chapter.chapter_number)
        }));
        
        const currentChapter = chapters.find(c => c.unlocked && !c.completed)?.chapter_number || 
                               chapters[chapters.length - 1]?.chapter_number || 1;
        
        return res.json({ currentChapter, chapters });
    } catch (error) {
        console.error("Error fetching story progress:", error);
        return res.status(500).json({ error: "Server error fetching story progress." });
    }
});

// Get chapter content
app.get('/api/story/chapter/:chapterNumber', async (req, res) => {
    const { chapterNumber } = req.params;
    
    try {
        const storyPath = path.join(__dirname, 'story_content.json');
        const storyContent = JSON.parse(await fs.readFile(storyPath, 'utf8'));
        
        const chapter = storyContent.chapters.find(c => c.chapter_number === parseInt(chapterNumber));
        
        if (!chapter) {
            return res.status(404).json({ error: "Chapter not found." });
        }
        
        return res.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return res.status(500).json({ error: "Server error fetching chapter." });
    }
});

// Unlock story chapter
app.post('/api/story/unlock-chapter', async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }
    
    try {
        const storyPath = path.join(__dirname, 'story_content.json');
        const storyContent = JSON.parse(await fs.readFile(storyPath, 'utf8'));
        
        // Get user stats
        const completedCountStmt = db.prepare(`
            SELECT COUNT(*) as count FROM Sessions 
            WHERE user_id = ? AND status = 'completed'
        `);
        
        const userSkillStmt = db.prepare(
            'SELECT skill_level FROM Users WHERE user_id = ?'
        );
        
        const completedCountResult = completedCountStmt.get(userId);
        const userSkillResult = userSkillStmt.get(userId);
        
        const totalCompleted = parseInt(completedCountResult.count);
        const skillLevel = parseFloat(userSkillResult?.skill_level) || 1.0;
        
        // Check which chapters should be unlocked
        const existingStmt = db.prepare(
            'SELECT * FROM StoryProgress WHERE user_id = ? AND chapter_number = ?'
        );
        const insertStmt = db.prepare(
            'INSERT INTO StoryProgress (user_id, chapter_number) VALUES (?, ?)'
        );
        
        for (const chapter of storyContent.chapters) {
            const existing = existingStmt.get(userId, chapter.chapter_number);
            
            if (!existing) {
                let shouldUnlock = false;
                const req = chapter.unlock_requirement;
                
                if (req.type === 'none' || 
                    (req.type === 'puzzle_count' && totalCompleted >= req.value) ||
                    (req.type === 'skill_level' && skillLevel >= req.value)) {
                    shouldUnlock = true;
                }
                
                if (shouldUnlock) {
                    insertStmt.run(userId, chapter.chapter_number);
                }
            }
        }
        
        // Get updated progress
        const progressStmt = db.prepare(
            'SELECT chapter_number FROM StoryProgress WHERE user_id = ? ORDER BY chapter_number DESC LIMIT 1'
        );
        const progressResult = progressStmt.get(userId);
        
        const latestChapter = parseInt(progressResult?.chapter_number) || 1;
        
        return res.json({ 
            unlocked: true, 
            latestChapter,
            message: "Story progress updated." 
        });
    } catch (error) {
        console.error("Error unlocking chapter:", error);
        return res.status(500).json({ error: "Server error unlocking chapter." });
    }
});

// === THEME ===

// Get current theme (optional server-side, mostly client-side)
app.get('/api/theme/current', (req, res) => {
    const hour = new Date().getHours();
    let theme = 'afternoon';
    
    if (hour >= 6 && hour < 12) theme = 'morning';
    else if (hour >= 12 && hour < 18) theme = 'afternoon';
    else if (hour >= 18 && hour < 22) theme = 'evening';
    else theme = 'night';
    
    return res.json({ theme, hour });
});

// --- Start Server ---
connectDB();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
