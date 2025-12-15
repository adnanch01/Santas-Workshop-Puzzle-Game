import React, { useEffect, useState } from 'react';

const VictoryAnimation = ({ onComplete, stats }) => {
    const [showAnimation, setShowAnimation] = useState(true);

    useEffect(() => {
        // Animation sequence: 3 seconds of celebration
        const timer = setTimeout(() => {
            setShowAnimation(false);
            if (onComplete) {
                onComplete();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!showAnimation) {
        return null;
    }

    return (
        <div className="victory-overlay">
            <div className="victory-content">
                {/* Confetti/Snow effect using CSS */}
                <div className="confetti-container">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className={`confetti confetti-${i % 5}`} />
                    ))}
                </div>

                {/* Star burst effect */}
                <div className="star-burst">
                    <div className="star">⭐</div>
                    <div className="star">⭐</div>
                    <div className="star">⭐</div>
                </div>

                {/* Victory message */}
                <div className="victory-message">
                    <h1>🎉 Congratulations! 🎉</h1>
                    <h2>Puzzle Solved!</h2>
                    {stats && (
                        <div className="victory-stats">
                            <p>Time: {stats.time}s</p>
                            <p>Moves: {stats.moves}</p>
                            {stats.newAchievements && stats.newAchievements.length > 0 && (
                                <div className="new-achievements">
                                    <p>New Achievements Earned:</p>
                                    {stats.newAchievements.map((ach, idx) => (
                                        <span key={idx} className="achievement-badge">
                                            {ach.icon_emoji} {ach.title}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VictoryAnimation;

