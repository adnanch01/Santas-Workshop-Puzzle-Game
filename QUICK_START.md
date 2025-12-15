# 🎄 Santa's Workshop Puzzle Game - Quick Start Guide

## First Time Setup (2 Minutes)

### What You Need
- Node.js installed (v14+)

### Complete Setup (One Command!)

**Windows (PowerShell):**
```powershell
.\setup_project.ps1
```

This script will:
1. Install frontend dependencies
2. Install backend dependencies  
3. Create and initialize the SQLite database

**Manual Setup (if script doesn't work):**
```powershell
# 1. Install dependencies
npm install
cd server
npm install
cd ..

# 2. Create database using Node.js script
cd server
node init_db.js
cd ..
```

### Start the Application

**Terminal 1 - Backend:**
```powershell
cd server
npm start
```
Wait for: "Database connected successfully. Server running on http://localhost:3001"

**Terminal 2 - Frontend:**
```powershell
npm run dev
```
Opens automatically at http://localhost:5173

### Play!
1. Click "Play as Guest" (fastest) or register an account
2. Solve the puzzle by clicking tiles adjacent to the empty space
3. Click "Use Magic (Hint)" if you're stuck
4. Beat your time and try again!

## Troubleshooting

**"Database connection failed"**
- Make sure you ran the setup script or `node init_db.js` in the server directory
- Check that `santas_workshop.db` file exists in project root

**"Cannot find module"**
- Run `npm install` in both root and server directories

**"Table doesn't exist" errors**
- Run the database setup script again: `.\setup_database.ps1` or `cd server && node init_db.js`

**Script errors?**
- Use manual setup commands above instead

## Features

✅ Adaptive difficulty based on your skill
✅ Progress tracking (saves your games)
✅ Smart hint system
✅ Multiple puzzle sizes (3x3, 4x4, 6x6, 8x8, 10x10)
✅ Guest mode (no signup required)
✅ Timer and move counter
✅ Time-based festive themes
✅ Achievement system
✅ Gift rewards
✅ Power-ups
✅ Story mode
✅ Victory animations
✅ Smooth animations
