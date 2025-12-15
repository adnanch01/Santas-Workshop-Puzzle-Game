import React, { useState, useEffect } from 'react';

const AchievementDisplay = ({ userId, newlyEarned, onClose }) => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchAchievements();
        }
    }, [userId]);

    useEffect(() => {
        if (newlyEarned && newlyEarned.length > 0) {
            // Show notification for newly earned achievements
            setAchievements(prev => [...newlyEarned, ...prev]);
        }
    }, [newlyEarned]);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/achievements/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setAchievements(data.achievements || []);
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="achievement-container">Loading achievements...</div>;
    }

    return (
        <div className="achievement-container">
            <h3>Achievements</h3>
            {achievements.length === 0 ? (
                <p>No achievements earned yet. Keep playing to unlock them!</p>
            ) : (
                <div className="achievement-list">
                    {achievements.map((achievement) => (
                        <div key={achievement.achievement_id} className="achievement-item">
                            <span className="achievement-icon">{achievement.icon_emoji}</span>
                            <div className="achievement-info">
                                <div className="achievement-title">{achievement.title}</div>
                                <div className="achievement-description">{achievement.description}</div>
                                {achievement.earned_at && (
                                    <div className="achievement-date">
                                        Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AchievementDisplay;

