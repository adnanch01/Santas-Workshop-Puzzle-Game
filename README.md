# 🎄 Santa's Workshop Puzzle Game 🎁

A festive, full-stack sliding puzzle game with adaptive difficulty, smart hints, and progress tracking.

## 📋 Features

- **Adaptive Difficulty System**: Puzzles get harder as you improve
- **Smart Hint System**: Get strategic suggestions when stuck
- **Progress Tracking**: All your games are saved and tracked
- **Multiple Puzzle Sizes**: 3x3, 4x4, 6x6, 8x8, and 10x10 grids
- **User Accounts**: Register or play as a guest
- **Skill Level System**: Your performance determines puzzle difficulty
- **Christmas Theme**: Festive colors and emojis throughout

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- sqlite3 command line tool (usually comes with Node.js or can be installed separately)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
cd server && npm install && cd ..
```

2. **Set up the database:**

**PowerShell (Windows):**
```powershell
.\setup_database.ps1
# Or manually:
Get-Content server/schema.sql | sqlite3 santas_workshop.db
Get-Content server/seed.sql | sqlite3 santas_workshop.db
Get-Content server/schema_migrations.sql | sqlite3 santas_workshop.db
Get-Content server/seed_additional_features.sql | sqlite3 santas_workshop.db
```

**Bash/Unix:**
```bash
sqlite3 santas_workshop.db < server/schema.sql
sqlite3 santas_workshop.db < server/seed.sql
sqlite3 santas_workshop.db < server/schema_migrations.sql
sqlite3 santas_workshop.db < server/seed_additional_features.sql
```

3. **Configure environment (optional):**
```bash
# Create server/.env (optional - defaults to ./santas_workshop.db):
DB_PATH=./santas_workshop.db
PORT=3001
```

4. **Start the servers:**
```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend  
npm run dev
```

5. **Play!** Open http://localhost:5173

📖 **See [QUICK_START.md](QUICK_START.md) for detailed instructions**

## 🎮 How to Play

1. Click tiles adjacent to the empty space to slide them
2. Arrange tiles in numerical order (1, 2, 3, ..., n)
3. Use the "Magic Hint" button if you need help
4. Beat your time and improve your skill level!

## 🏗️ Project Structure

```
├── src/                    # Frontend React app
│   ├── components/        
│   │   ├── GameGrid.jsx   # Main game component
│   │   ├── Tile.jsx       # Individual tile
│   │   └── LoginForm.jsx  # Authentication UI
│   ├── logic/             
│   │   └── puzzleUtils.js # Puzzle generation logic
│   ├── App.jsx            # Root component
│   └── App.css            # Styles
├── server/                # Backend Express API
│   ├── api.js             # All endpoints
│   ├── schema.sql         # Database schema
│   ├── seed.sql           # Puzzle data
│   └── .env.example       # Config template
└── Documentation files
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login existing user
- `POST /api/users/create-guest` - Create guest account

### Game
- `POST /api/puzzle/generate` - Get adaptive puzzle
- `POST /api/game/end` - Save game session
- `POST /api/magic/hint` - Get hint for current puzzle

## 🗄️ Database Schema

### Users
- `user_id` - Primary key
- `username` - Unique username
- `password_hash` - Bcrypt hashed password
- `skill_level` - Decimal (0.5-10.0)

### Puzzles  
- `puzzle_id` - Primary key
- `grid_size` - Puzzle dimensions (3-10)
- `difficulty_rating` - Integer (1-10)
- `initial_state_json` - JSON board state

### Sessions
- `session_id` - UUID primary key
- `user_id` - Foreign key to Users
- `puzzle_id` - Foreign key to Puzzles
- `moves`, `time_seconds` - Performance metrics
- `status` - enum: active, completed, abandoned

## 🧪 Testing

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive testing guide.

Quick test:
```bash
# Backend running on :3001
curl -X POST http://localhost:3001/api/users/create-guest

# Should return: {"userId":1,"username":"guest_..."}
```

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get up and running in 5 minutes
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Detailed database configuration
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Complete testing procedures
- **[DEVELOPMENT_JOURNAL.md](DEVELOPMENT_JOURNAL.md)** - Development process and learning
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Technical overview

## 🛠️ Tech Stack

**Frontend:**
- React 19.2.0
- Vite 7.2.4
- CSS3 (custom styling)

**Backend:**
- Express 5.2.1
- better-sqlite3 11.7.0
- bcryptjs 3.0.3
- uuid 13.0.0

**Database:**
- SQLite 3 (file-based, no server required)

## 🎯 Game Logic Highlights

### Adaptive Difficulty
```javascript
if (skillLevel < 2.5) return 4x4;      // Beginner
else if (skillLevel < 5.0) return 6x6; // Intermediate  
else if (skillLevel < 8.0) return 8x8; // Advanced
else return 10x10;                      // Expert
```

### Skill Calculation
Performance-based formula considering:
- Puzzle difficulty completed
- Move efficiency vs expected moves
- Time bonus for fast completion

### Hint Algorithm
Manhattan distance heuristic:
- Finds tiles adjacent to empty space
- Calculates distance from target position
- Suggests tile with maximum improvement potential

## 🔒 Security

- ✅ Bcrypt password hashing (10 rounds)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Input validation on all endpoints

## 🐛 Troubleshooting

**Database connection fails:**
```bash
# Check database file exists
ls santas_workshop.db

# Or verify tables
sqlite3 santas_workshop.db ".tables"

# Verify credentials in server/.env
```

**Frontend can't connect to backend:**
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify CORS origin in server/api.js

**No puzzles loading:**
- Run seed.sql to populate database
- Check: `SELECT COUNT(*) FROM Puzzles;` should return 100

## 📝 License

ISC

## 👥 Authors

Built as a full-stack web development project.

## 🎄 Happy Puzzling! 🎁
