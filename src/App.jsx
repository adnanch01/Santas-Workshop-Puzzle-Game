/**
 * src/App.jsx
 * Main entry point for the React application.
 */
import React from 'react';
import GameGrid from './components/GameGrid';
// import ThemeSystem from './components/ThemeSystem'; // Placeholder for Custom Feature

function App() {
  return (
    <>
      <header>
          <h1>🎄 Christmas Fifteen Puzzle 🎁</h1>
          <p>Version 1: Santa's Workshop | Festive & Engaging</p>
          {/* TODO: Add Festive Theme System component here */}
      </header>
      
      {/* GameGrid will render the 4x4 puzzle by default */}
      <GameGrid initialSize={4} />

      {/* TODO: Add Gift & Reward System display */}
    </>
  );
}

export default App;