/**
 * src/components/GameGrid.jsx
 * Manages the game state, move logic, timer, and the Holiday Magic (Hint System) implementation.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Tile from './Tile';
import PowerUpPanel from './PowerUpPanel';
import VictoryAnimation from './VictoryAnimation';
import AudioManager from './AudioManager';
import { isSolved, findEmptyIndex, shuffleBoard } from '../logic/puzzleUtils'; 

const GameGrid = ({ initialSize = 4, userId, onAchievementsEarned }) => {
    // --- State Variables ---
    const [size, setSize] = useState(initialSize);
    const [board, setBoard] = useState([]);
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isGameWon, setIsGameWon] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); 
    const [hintTile, setHintTile] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
    const [victoryStats, setVictoryStats] = useState(null);
    const [playMoveSound, setPlayMoveSound] = useState(false);
    const [playVictorySound, setPlayVictorySound] = useState(false);
    const [playHintSound, setPlayHintSound] = useState(false);
    const [playPowerUpSound, setPlayPowerUpSound] = useState(false);
    const [timeFrozen, setTimeFrozen] = useState(false);

    // --- Timer Logic (Immersive Audio-Visual Experience) ---
    useEffect(() => {
        if (isGameWon || isProcessing || timeFrozen) return; 

        const timerId = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(timerId); 
    }, [isGameWon, isProcessing, timeFrozen]);

    // Log analytics for puzzle start
    useEffect(() => {
        if (sessionId && userId) {
            fetch('http://localhost:3001/api/analytics/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'puzzle_started',
                    userId,
                    sessionId
                })
            }).catch(err => console.error('Analytics logging failed:', err));
        }
    }, [sessionId, userId]);


    // --- Initialization Function (Adaptive Gameplay Experience) ---
    const initGame = useCallback(async () => {
        setIsProcessing(true);
        setError(null);
        
        try {
            // API call to get puzzle from backend
            const response = await fetch('http://localhost:3001/api/puzzle/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                throw new Error('Failed to generate puzzle');
            }

            const data = await response.json();
            
            setSessionId(data.sessionId);
            setSize(data.size);
            setBoard(data.initialBoard);
            setMoves(0);
            setSeconds(0);
            setIsGameWon(false);
            setHintTile(null);
            setMoveHistory([]);
            setShowVictoryAnimation(false);
            setTimeFrozen(false);
            
        } catch (error) {
            console.error("Error initializing game:", error);
            setError("Failed to load puzzle. Using local fallback.");
            // Fallback to local puzzle generation
            const newBoard = shuffleBoard(size);
            setBoard(newBoard);
            setMoves(0);
            setSeconds(0);
            setIsGameWon(false);
            setHintTile(null);
        } finally {
            setIsProcessing(false);
        }
    }, [userId, size]);

    useEffect(() => {
        initGame();
    }, [initGame]);


    // --- Win Condition Check (Celebratory Completion System) ---
    useEffect(() => {
        if (board.length > 0 && isSolved(board, size) && moves > 0 && !isGameWon) {
            setIsGameWon(true);
            setIsProcessing(true);
            setPlayVictorySound(true);
            setShowVictoryAnimation(true);
            
            // API Call to save final session data
            if (sessionId) {
                fetch('http://localhost:3001/api/game/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        sessionId, 
                        moves, 
                        time: seconds, 
                        status: 'completed' 
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Game saved:", data);
                    setVictoryStats({
                        time: seconds,
                        moves,
                        newAchievements: data.newlyEarnedAchievements || []
                    });
                    
                    // Notify parent about achievements
                    if (data.newlyEarnedAchievements && data.newlyEarnedAchievements.length > 0 && onAchievementsEarned) {
                        onAchievementsEarned(data.newlyEarnedAchievements);
                    }
                    
                    setIsProcessing(false);
                })
                .catch(error => {
                    console.error("Error saving game:", error);
                    setIsProcessing(false);
                });
            } else {
                setIsProcessing(false);
            }
        }
    }, [board, size, moves, isGameWon, sessionId, seconds, onAchievementsEarned]);


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
            // Save to move history for undo
            setMoveHistory(prev => [...prev, { board: [...board], moves, seconds }]);
            
            newBoard[emptyIndex] = tileValue;
            newBoard[clickedIndex] = null;

            setBoard(newBoard);
            setMoves(prev => prev + 1);
            setPlayMoveSound(true);
            setTimeout(() => setPlayMoveSound(false), 100);
            
            // Clear hint after any successful move
            if (hintTile !== null) {
                setHintTile(null);
            }
        }
    };


    // --- Handler for Holiday Magic Power-up (Hint System) ---
    const handleMagicHint = async () => {
        if (isProcessing || isGameWon) return;

        setIsProcessing(true);

        try {
            const response = await fetch('http://localhost:3001/api/magic/hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionId, 
                    currentBoard: board, 
                    size,
                    userId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get hint');
            }

            const data = await response.json();
            
            if (data.nextTile) {
                setHintTile(data.nextTile);
                setPlayHintSound(true);
                setTimeout(() => setPlayHintSound(false), 100);
                setTimeout(() => setHintTile(null), 4000);
            }

        } catch (error) {
            console.error("Hint system failed:", error);
            setError("Hint unavailable. Try again.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setTimeout(() => setIsProcessing(false), 500);
        }
    };

    // Handle power-up application
    const handlePowerUpApplied = (modifiedBoard, message) => {
        if (modifiedBoard) {
            setBoard(modifiedBoard);
            setPlayPowerUpSound(true);
            setTimeout(() => setPlayPowerUpSound(false), 100);
            
            // Handle time freeze power-up
            if (message && message.includes('Time frozen')) {
                setTimeFrozen(true);
                setTimeout(() => setTimeFrozen(false), 30000);
            }
        }
    };

    // Handle undo power-up (simplified - would need proper history tracking)
    const handleUndo = () => {
        if (moveHistory.length > 0) {
            const previous = moveHistory[moveHistory.length - 1];
            setBoard(previous.board);
            setMoves(previous.moves);
            setSeconds(previous.seconds);
            setMoveHistory(prev => prev.slice(0, -1));
            setPlayPowerUpSound(true);
            setTimeout(() => setPlayPowerUpSound(false), 100);
        }
    };

    // --- Component Rendering ---
    return (
        <div className="game-container">
            <AudioManager 
                playMoveSound={playMoveSound}
                playVictorySound={playVictorySound}
                playHintSound={playHintSound}
                playPowerUpSound={playPowerUpSound}
            />
            
            {showVictoryAnimation && (
                <VictoryAnimation 
                    onComplete={() => setShowVictoryAnimation(false)}
                    stats={victoryStats}
                />
            )}
            
            {error && <div className="error-banner">{error}</div>}
            
            <div className="stats-bar">
                <span>Time: {timeFrozen ? `${seconds}s (FROZEN)` : `${seconds}s`}</span>
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

            {isGameWon && !showVictoryAnimation && (
                <div id="status-message">
                    🎉 Puzzle Solved in {seconds}s and {moves} moves!
                </div>
            )}

            {userId && (
                <PowerUpPanel
                    userId={userId}
                    sessionId={sessionId}
                    boardState={board}
                    size={size}
                    onPowerUpApplied={handlePowerUpApplied}
                />
            )}

            <div className="controls">
                <button onClick={initGame} disabled={isProcessing}>Shuffle</button>
                <button onClick={initGame} disabled={isProcessing}>Reset</button> 
                {moveHistory.length > 0 && (
                    <button onClick={handleUndo} disabled={isProcessing || isGameWon}>
                        Undo
                    </button>
                )}
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