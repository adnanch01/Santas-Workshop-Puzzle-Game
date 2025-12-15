/**
 * src/App.jsx
 * Main entry point for the React application.
 */
import React, { useState, useEffect } from 'react';
import GameGrid from './components/GameGrid';
import LoginForm from './components/LoginForm';
import ThemeSystem from './components/ThemeSystem';
import StoryMode from './components/StoryMode';
import AchievementDisplay from './components/AchievementDisplay';

function App() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('game'); // 'game' or 'story'
  const [newlyEarnedAchievements, setNewlyEarnedAchievements] = useState([]);

  // Check if user is already logged in
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
      setUsername(storedUsername || 'User');
    }
  }, []);

  const handleLogin = (id, name) => {
    setUserId(id);
    setUsername(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setUserId(null);
    setUsername('');
    setCurrentView('game');
  };

  const handleAchievementsEarned = (achievements) => {
    if (achievements && achievements.length > 0) {
      setNewlyEarnedAchievements(achievements);
      setTimeout(() => setNewlyEarnedAchievements([]), 5000);
    }
  };

  if (!userId) {
    return (
      <ThemeSystem>
        <LoginForm onLogin={handleLogin} />
      </ThemeSystem>
    );
  }

  return (
    <ThemeSystem>
      <header>
          <h1>🎄 Christmas Fifteen Puzzle 🎁</h1>
          <p>Welcome, {username}! | 
            <button className="view-toggle" onClick={() => setCurrentView(currentView === 'game' ? 'story' : 'game')}>
              {currentView === 'game' ? '📖 Story Mode' : '🎮 Play Game'}
            </button>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </p>
      </header>

      {newlyEarnedAchievements.length > 0 && (
        <div className="achievement-notification">
          {newlyEarnedAchievements.map((ach, idx) => (
            <div key={idx} className="achievement-popup">
              {ach.icon_emoji} {ach.title} Unlocked!
            </div>
          ))}
        </div>
      )}
      
      {currentView === 'story' ? (
        <StoryMode userId={userId} onStartChapter={(chapter) => {
          // Switch to game mode with story chapter config
          setCurrentView('game');
        }} />
      ) : (
        <>
          <GameGrid 
            initialSize={4} 
            userId={userId}
            onAchievementsEarned={handleAchievementsEarned}
          />
          <div className="sidebar">
            <AchievementDisplay userId={userId} newlyEarned={newlyEarnedAchievements} />
          </div>
        </>
      )}
    </ThemeSystem>
  );
}

export default App;