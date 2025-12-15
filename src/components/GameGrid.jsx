/**
 * src/components/GameGrid.jsx
 * Manages the game state, move logic, timer, and the Holiday Magic (Hint System) implementation.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Tile from './Tile';
import { isSolved, findEmptyIndex, shuffleBoard } from '../logic/puzzleUtils'; 
// puzzleUtils.js must be present for this code to work

const GameGrid = ({ initialSize = 4 }) => {
    // --- State Variables ---
    const [size, setSize] = useState(initialSize);
    const [board, setBoard] = useState([]);
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isGameWon, setIsGameWon] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); 
    const [hintTile, setHintTile] = useState(null); // Tile value to highlight

    // --- Timer Logic (Immersive Audio-Visual Experience) ---
    useEffect(() => {
        if (isGameWon || isProcessing) return; 

        const timerId = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(timerId); 
    }, [isGameWon, isProcessing]);


    // --- Initialization Function (Adaptive Gameplay Experience) ---
    const initGame = useCallback(async () => {
        setIsProcessing(true); 
        
        // MOCK: Replace with API call to server's Adaptive Logic
        const newBoard = shuffleBoard(size); 
        
        setBoard(newBoard);
        setMoves(0);
        setSeconds(0);
        setIsGameWon(false);
        setHintTile(null);
        setIsProcessing(false);
    }, [size]);

    useEffect(() => {
        initGame();
    }, [initGame]);


    // --- Win Condition Check (Celebratory Completion System) ---
    useEffect(() => {
        if (board.length > 0 && isSolved(board, size) && moves > 0 && !isGameWon) {
            setIsGameWon(true);
            setIsProcessing(true); 
            // TODO: API Call to save final session data (Comprehensive Progress Tracking)
        }
    }, [board, size, moves, isGameWon]);


    // --- Handle Tile Movement ---
    const handleTileClick = (clickedIndex) => {
        if (isGameWon || isProcessing) return;

        const emptyIndex = findEmptyIndex(board);
        const tileValue = board[clickedIndex];
        const newBoard = [...board];
        
        const sizeW = size;

        const row = Math.floor(clickedIndex / sizeW);
        const col = clickedIndex % sizeW;
        const emptyRow = Math.floor(emptyIndex / sizeW);
        const emptyCol = emptyIndex % sizeW;

        // Check adjacency
        const isAdjacent = 
            (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
            (col === emptyCol && Math.abs(row - emptyRow) === 1);

        if (isAdjacent) {
            newBoard[emptyIndex] = tileValue;
            newBoard[clickedIndex] = null;

            setBoard(newBoard);
            setMoves(prev => prev + 1);
            
            // Clear hint after any successful move
            if (hintTile !== null) {
                setHintTile(null);
            }
        }
    };


    // --- Handler for Holiday Magic Power-up (Hint System) ---
    const handleMagicHint = async () => {
        if (isProcessing || isGameWon) return;

        // Prevent button spam
        setIsProcessing(true); 

        try {
            // MOCK LOGIC: Replaced with a server API call in the final project.
            console.log("MOCK: Requesting hint from server...");
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

            // MOCK: Find an adjacent tile to the empty spot to show as the hint.
            const emptyIndex = findEmptyIndex(board);
            let tileToMove = null;

            const adjacentIndices = [emptyIndex - 1, emptyIndex + 1, emptyIndex - size, emptyIndex + size];

            for (const index of adjacentIndices) {
                if (index >= 0 && index < board.length && board[index] !== null) {
                    const emptyRow = Math.floor(emptyIndex / size);
                    const tileRow = Math.floor(index / size);
                    
                    if (Math.abs(emptyRow - tileRow) <= 1) { 
                        tileToMove = board[index];
                        break;
                    }
                }
            }

            if (tileToMove) {
                setHintTile(tileToMove); 
                // Auto-hide the hint after 4 seconds (Strategic Assistance Features)
                setTimeout(() => setHintTile(null), 4000); 
            } else {
                console.log("No moves available for hint.");
            }

        } catch (error) {
            console.error("Hint system failed:", error);
        } finally {
            // Re-enable input after a brief delay
            setTimeout(() => setIsProcessing(false), 500); 
        }
    };

    // --- Component Rendering ---
    return (
        <div className="game-container">
            <div className="stats-bar">
                <span>Time: {seconds}s</span>
                <span>Moves: {moves}</span>
            </div>

            <div 
                id="puzzle-grid" 
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${size}, 1fr)`, 
                    gap: '8px', 
                    width: '100%',
                    maxWidth: '400px', 
                    margin: '0 auto', 
                }}
            >
                {board.map((tileValue, index) => (
                    <Tile
                        key={index}
                        value={tileValue}
                        index={index}
                        size={size}
                        onTileClick={handleTileClick}
                        // Pass the hint status to the Tile component
                        isHint={tileValue === hintTile} 
                    />
                ))}
            </div>

            {isGameWon && (
                <div id="status-message">
                    🎉 Puzzle Solved in {seconds}s and {moves} moves!
                </div>
            )}

            <div className="controls">
                <button onClick={initGame} disabled={isProcessing}>Shuffle</button>
                <button onClick={initGame} disabled={isProcessing}>Reset</button> 
                <button 
                    className="magic-button" 
                    onClick={handleMagicHint} 
                    disabled={isProcessing || isGameWon}
                >
                    Use Magic (Hint)
                </button> 
            </div>
        </div>
    );
};

export default GameGrid;