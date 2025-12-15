// server/generateSeeds.js
// Generate puzzle seed data using the puzzle utility functions

// Simple puzzle utility functions (copied from frontend logic)
const getSolvedBoard = (size) => {
    const totalTiles = size * size;
    return Array.from({ length: totalTiles - 1 }, (_, i) => i + 1).concat(null);
};

const isSolvable = (board, size) => {
    const flatBoard = board.filter(tile => tile !== null);
    let inversions = 0;
    
    for (let i = 0; i < flatBoard.length; i++) {
        for (let j = i + 1; j < flatBoard.length; j++) {
            if (flatBoard[i] > flatBoard[j]) {
                inversions++;
            }
        }
    }

    if (size % 2 !== 0) {
        return inversions % 2 === 0;
    } else {
        const emptyIndex = board.findIndex(tile => tile === null);
        const emptyRowFromBottom = size - Math.floor(emptyIndex / size);
        return (inversions + emptyRowFromBottom) % 2 === 0;
    }
};

const shuffleBoard = (size) => {
    let newBoard;
    do {
        newBoard = getSolvedBoard(size);
        for (let i = newBoard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newBoard[i], newBoard[j]] = [newBoard[j], newBoard[i]];
        }
    } while (!isSolvable(newBoard, size));
    
    return newBoard;
};

// Generate puzzles for different sizes and difficulties
const generatePuzzles = () => {
    const puzzles = [];
    const sizes = [3, 4, 6, 8, 10];
    const puzzlesPerSize = 20;

    sizes.forEach(size => {
        for (let i = 0; i < puzzlesPerSize; i++) {
            const board = shuffleBoard(size);
            const jsonBoard = JSON.stringify(board);
            
            // Assign difficulty ratings based on size
            let difficulty;
            if (size === 3) difficulty = 1 + Math.floor(Math.random() * 2); // 1-2
            else if (size === 4) difficulty = 2 + Math.floor(Math.random() * 3); // 2-4
            else if (size === 6) difficulty = 4 + Math.floor(Math.random() * 3); // 4-6
            else if (size === 8) difficulty = 6 + Math.floor(Math.random() * 3); // 6-8
            else difficulty = 8 + Math.floor(Math.random() * 3); // 8-10
            
            puzzles.push({
                grid_size: size,
                difficulty_rating: difficulty,
                initial_state_json: jsonBoard
            });
        }
    });

    return puzzles;
};

// Generate SQL INSERT statements
const puzzles = generatePuzzles();
console.log('-- Generated Puzzle Seed Data');
console.log('USE santas_workshop;');
console.log('');
console.log('-- Insert Puzzles');

puzzles.forEach((puzzle, index) => {
    const escapedJson = puzzle.initial_state_json.replace(/'/g, "''");
    console.log(`INSERT INTO Puzzles (grid_size, difficulty_rating, initial_state_json) VALUES (${puzzle.grid_size}, ${puzzle.difficulty_rating}, '${escapedJson}');`);
});

console.log('');
console.log('-- Sample test user (password: test123)');
console.log("-- Password hash generated with bcrypt for 'test123'");
console.log("INSERT INTO Users (username, email, password_hash, skill_level) VALUES ('testuser', 'test@example.com', '$2b$10$rKqV3Q3Z9E.5qVnqG5YJxu7kH8YtJ3FZP9fKJvWxL5hZxJ6h3Q5JG', 1.0);");
console.log("INSERT INTO Users (username, email, password_hash, skill_level) VALUES ('guest', 'guest@example.com', '$2b$10$rKqV3Q3Z9E.5qVnqG5YJxu7kH8YtJ3FZP9fKJvWxL5hZxJ6h3Q5JG', 1.0);");

