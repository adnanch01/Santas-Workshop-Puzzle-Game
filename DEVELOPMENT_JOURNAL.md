# Development Journal - Santa's Workshop Puzzle Game

## Project Overview
Building a full-stack Christmas-themed sliding puzzle game with adaptive difficulty. Frontend in React, backend in Express/MySQL.

---

## Phase 1: Understanding What Was Already Done

### Problem: Partner Did Frontend, What's Left?
When I started, my partner had built a working frontend with the game logic, but nothing was connected to a backend. The puzzle worked locally but couldn't save progress or adapt difficulty.

**What I Found:**
- Frontend had all the UI and game logic (moving tiles, checking wins)
- Backend had some endpoints but they were incomplete (TODOs everywhere)
- No database existed at all

**Challenge:** Figuring out what data the backend needed to send and receive.

**Solution:** Read through the frontend code carefully. I found comments like "TODO: API call" which showed me exactly what the frontend expected. For example, the puzzle generation needed to return `{ sessionId, size, initialBoard }`.

---

## Phase 2: Database Design

### Problem: How to Structure the Database?
I needed tables for users, puzzles, and game sessions. But what columns should each have?

**Initial Confusion:** Should puzzle difficulty be a number? A category? How do I store the board state?

**Solution:** 
1. Looked at what the backend code was trying to query (it wanted `grid_size` and `difficulty_rating`)
2. Made difficulty a simple 1-10 integer scale
3. Stored board states as JSON text (easier than separate rows for each tile)

**Tables Created:**
- `Users`: Basic auth + a `skill_level` decimal for adaptive difficulty
- `Puzzles`: Pregenerated puzzles with different sizes and difficulties
- `Sessions`: Track each game played with moves and time

**Lesson Learned:** JSON columns are great for storing arrays/objects without making things complicated.

---

## Phase 3: Generating Puzzle Seeds

### Problem: Need 100+ Solvable Puzzles
I couldn't manually create puzzles. They had to be solvable and diverse.

**Challenge:** The frontend had a `shuffleBoard()` function that ensured solvability using inversion counting. But it was in React, not Node.js.

**Solution:** 
1. Copied the puzzle logic functions (`shuffleBoard`, `isSolvable`) into a Node script
2. Created `generateSeeds.js` that generates 20 puzzles per size (3x3, 4x4, 6x6, 8x8, 10x10)
3. Script outputs SQL INSERT statements directly

**Code Snippet:**
```javascript
const puzzles = generatePuzzles();
puzzles.forEach(puzzle => {
    console.log(`INSERT INTO Puzzles (grid_size, difficulty_rating, initial_state_json) 
                 VALUES (${puzzle.grid_size}, ${puzzle.difficulty_rating}, '${puzzle.json}');`);
});
```

**Mistake I Made:** Initially forgot to escape single quotes in JSON strings. SQL syntax errors everywhere! Fixed with `.replace(/'/g, "''")`.

---

## Phase 4: User Authentication

### Problem: How to Handle User Login?
The game needs to know who's playing to track their skill level.

**Initial Thought:** Use JWT tokens and sessions? Too complicated for my first full-stack app.

**Simpler Solution:**
1. Use `bcrypt` to hash passwords (security is still important!)
2. On login, just return the `userId`
3. Frontend stores it in `localStorage`
4. Every API call includes the `userId`

**Guest Users:** Added a special endpoint that creates temporary users with random names like `guest_1234567890`. No password needed.

**Lesson Learned:** Don't overcomplicate auth for a school project. Basic security + working functionality > perfect but broken OAuth.

---

## Phase 5: Completing the Backend Endpoints

### Problem 1: `/api/puzzle/generate` Was Half-Done
The endpoint could fetch puzzles but the adaptive difficulty logic existed without being tested.

**What It Does:**
1. Get user's current `skill_level` (starts at 1.0)
2. Map skill to puzzle size: <2.5=4x4, <5.0=6x6, <8.0=8x8, else=10x10
3. Query for a random puzzle matching that size/difficulty
4. Create a session to track the game

**Issue I Hit:** Named placeholders (`:userId`) didn't work consistently. Switched to `?` placeholders for reliability.

### Problem 2: `/api/game/end` Was Empty
When a player wins, need to save the session and update their skill level.

**Challenge:** How to calculate skill improvement?

**My Algorithm:**
```javascript
const expectedMoves = gridSize * gridSize * 5; // Rough benchmark
const efficiency = expectedMoves / actualMoves; // Better if fewer moves
const timeBonus = 1.0 - (time / 600); // Bonus if under 10 minutes
const adjustment = (difficulty / 10) * efficiency * timeBonus * 0.3;
```

**Result:** Players improve faster if they solve hard puzzles quickly with few moves.

**Lesson Learned:** Game balance is hard! My formula might not be perfect but it's better than nothing. Can tweak later.

### Problem 3: `/api/magic/hint` Needed AI-Like Logic
The hint system should suggest the "best" tile to move next.

**Challenge:** A proper solution uses A* pathfinding which is complex.

**Simpler Approach:**
1. Find all tiles adjacent to the empty space
2. Calculate Manhattan distance (how far each tile is from its goal position)
3. Suggest the tile that would move closer to its target

**Code Logic:**
```javascript
const targetIndex = solvedBoard.indexOf(tileValue);
const currentDistance = Math.abs(row - targetRow) + Math.abs(col - targetCol);
const improvement = currentDistance - newDistance;
// Pick tile with max improvement
```

**Lesson Learned:** You don't always need the perfect algorithm. A "good enough" heuristic works fine for a game.

---

## Phase 6: Frontend Integration

### Problem: Frontend Was Using Mock Data
All the fetch calls were commented out with "TODO" notes.

**What I Changed:**
1. **App.jsx:** Added login state management and conditional rendering (show LoginForm if not logged in)
2. **GameGrid.jsx:** Replaced all `shuffleBoard()` calls with fetch to `/api/puzzle/generate`
3. **Win Detection:** Added fetch to `/api/game/end` when puzzle is solved
4. **Hint Button:** Replaced mock logic with fetch to `/api/magic/hint`

**Key Learning:** Always add error handling! The first time I tested, backend wasn't running = blank screen. Added try/catch with fallbacks.

**Example:**
```javascript
try {
    const response = await fetch('http://localhost:3001/api/puzzle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    const data = await response.json();
    setBoard(data.initialBoard);
} catch (error) {
    console.error(error);
    // Fallback: use local puzzle generation
    setBoard(shuffleBoard(size));
}
```

---

## Phase 7: Styling & Polish

### Problem: Login Form Looked Bad
Default HTML form styling is ugly. Needed to match the Christmas theme.

**Solution:**
1. Added CSS in `App.css` with same color scheme (dark bg, red/green accents)
2. Made inputs and buttons consistent with game controls
3. Added error messages that show/hide automatically

**Small Detail:** The logout button in the header looks like a link but acts like a button. Used border styling to make it obvious it's clickable.

---

## Challenges Overcome

### 1. PowerShell vs Bash
**Problem:** `cd server && npm install` doesn't work in PowerShell.
**Solution:** Use semicolon instead: `cd server; npm install`

### 2. MySQL Connection Errors
**Problem:** Backend crashed with "Cannot connect to database"
**Solution:** Created `.env.example` as a template and clear setup instructions. Users need to create their own `.env` file.

### 3. CORS Errors
**Problem:** Frontend couldn't talk to backend (blocked by browser)
**Solution:** Already had `cors` middleware but made sure origin was set to `http://localhost:5173` (Vite's default port)

### 4. Skill Level Not Updating
**Problem:** Skill level stayed at 1.0 even after winning
**Solution:** My formula gave tiny adjustments (0.01). Multiplied by larger factors to make progress visible.

---

## What I Learned

1. **Read the existing code first.** My partner's comments and function signatures told me exactly what to build.

2. **Start simple, add complexity later.** My hint algorithm isn't perfect but it works. Auth isn't OAuth but it's secure enough.

3. **Error handling is not optional.** Every fetch call needs try/catch. Every database query needs error checking.

4. **Testing is iterative.** I didn't get everything right the first time. Console.log() is your best friend.

5. **Documentation matters.** I created DATABASE_SETUP.md because I knew future me (or a teammate) would forget the steps.

---

## Future Enhancements (Not Done Yet)

- Time-based festive themes (morning vs evening)
- Gift/achievement system for completing puzzles
- Background music
- Story mode with narrative
- Better hint visualization (show the actual move path)

---

## Final Thoughts

The hardest part wasn't writing code - it was figuring out HOW the pieces fit together. Once I understood the data flow (frontend sends userId → backend picks puzzle → frontend displays it), everything else was just implementation details.

**Total Time:** About 6-8 hours (including debugging and testing)

**Most Satisfying Moment:** Seeing the adaptive difficulty actually work - beating an easy puzzle and getting a harder one next time!

