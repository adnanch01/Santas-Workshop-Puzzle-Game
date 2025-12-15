/**
 * src/logic/puzzleUtils.js
 * Contains pure functions for puzzle initialization and solvability checks.
 */

// Function to generate the solved board state (e.g., [1, 2, 3, ..., 15, null])
export const getSolvedBoard = (size) => {
    const totalTiles = size * size;
    return Array.from({ length: totalTiles - 1 }, (_, i) => i + 1).concat(null);
};

// Check if the current board is in the solved state
export const isSolved = (board, size) => {
    const solved = getSolvedBoard(size);
    // Compares each element.
    return board.every((tile, i) => tile === solved[i]);
};

// Find the index of the empty spot
export const findEmptyIndex = (board) => board.findIndex(tile => tile === null);


/**
 * Solvability Check
 * Determines if a given board configuration can be solved by sliding tiles.
 */
export const isSolvable = (board, size) => {
    const flatBoard = board.filter(tile => tile !== null);
    let inversions = 0;
    
    // 1. Calculate Inversions
    for (let i = 0; i < flatBoard.length; i++) {
        for (let j = i + 1; j < flatBoard.length; j++) {
            if (flatBoard[i] > flatBoard[j]) {
                inversions++;
            }
        }
    }

    if (size % 2 !== 0) {
        // Odd sized grids (3x3, 5x5): Solvable if inversions is even.
        return inversions % 2 === 0;
    } else {
        // Even sized grids (4x4, 6x6): Solvable if (inversions + empty row from bottom) is even.
        const emptyIndex = board.findIndex(tile => tile === null);
        // Row of empty tile, counting from the bottom (1-indexed)
        const emptyRowFromBottom = size - Math.floor(emptyIndex / size); 

        return (inversions + emptyRowFromBottom) % 2 === 0;
    }
};


// Simple shuffling function that guarantees a solvable board
export const shuffleBoard = (size) => {
    let newBoard;
    do {
        newBoard = getSolvedBoard(size);
        // Fisher-Yates shuffle
        for (let i = newBoard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newBoard[i], newBoard[j]] = [newBoard[j], newBoard[i]];
        }
    } while (!isSolvable(newBoard, size));
    
    return newBoard;
};