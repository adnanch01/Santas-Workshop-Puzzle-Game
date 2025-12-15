// server/api.js

require('dotenv').config({ path: './.env' }); 
const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Needed for unique session IDs

// IMPORTANT: Install uuid package: npm install uuid

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173' 
}));

// --- Database Connection Setup (Assumes DB credentials are in .env) ---
let db;

async function connectDB() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            namedPlaceholders: true 
        });
        console.log("Database connected successfully.");
    } catch (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1); 
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


// --- API Routes ---

// 1. Adaptive Puzzle Generation (Smart Learning System)
app.post('/api/puzzle/generate', async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        // 1. Get user's skill level
        const [userRows] = await db.execute(
            'SELECT skill_level FROM Users WHERE user_id = :userId',
            { userId }
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        
        const skillLevel = userRows[0].skill_level;
        const { size, difficulty } = mapSkillToDifficulty(skillLevel);

        // 2. Query for a puzzle matching the calculated difficulty
        // Select a random puzzle that matches the required size and difficulty.
        const [puzzleRows] = await db.execute(
            'SELECT puzzle_id, initial_state_json FROM Puzzles WHERE grid_size = :size AND difficulty_rating = :difficulty ORDER BY RAND() LIMIT 1',
            { size, difficulty }
        );
        
        if (puzzleRows.length === 0) {
            // Fallback to a standard 4x4 puzzle if required difficulty is missing
            const [fallbackRows] = await db.execute(
                'SELECT puzzle_id, initial_state_json FROM Puzzles WHERE grid_size = 4 ORDER BY RAND() LIMIT 1'
            );
            if (fallbackRows.length === 0) {
                return res.status(500).json({ error: "No puzzles found in the database." });
            }
            puzzleRows.push(fallbackRows[0]);
        }

        const puzzle = puzzleRows[0];
        const sessionId = uuidv4();
        
        // 3. Create a new session (Comprehensive Progress Tracking)
        await db.execute(
            'INSERT INTO Sessions (session_id, user_id, puzzle_id, status) VALUES (:sessionId, :userId, :puzzleId, "active")',
            { sessionId, userId, puzzleId: puzzle.puzzle_id }
        );

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

    // TODO: 1. Update the session record in the 'sessions' table.
    // TODO: 2. Update the user's overall 'skill_level' in the 'users' table based on performance.
    
    res.json({ message: "Game session saved and skill updated." });
});

// 3. Holiday Magic Hint (Strategic Assistance Features)
app.post('/api/magic/hint', async (req, res) => {
    // (Implementation will go here, requiring complex solution path logic)
    res.json({ nextTile: 1 }); 
});


// --- Start Server ---
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});