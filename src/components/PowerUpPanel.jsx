import React, { useState, useEffect } from 'react';

const PowerUpPanel = ({ userId, sessionId, boardState, size, onPowerUpApplied }) => {
    const [powerups, setPowerups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchPowerUps();
        }
    }, [userId]);

    const fetchPowerUps = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/powerups/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setPowerups(data.powerups || []);
            }
        } catch (error) {
            console.error('Error fetching power-ups:', error);
            setError('Failed to load power-ups');
        } finally {
            setLoading(false);
        }
    };

    const handleUsePowerUp = async (powerupId, powerupKey) => {
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/powerups/use', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    sessionId,
                    powerupId,
                    boardState,
                    size
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to use power-up');
            }

            if (data.success && data.modifiedBoard) {
                onPowerUpApplied(data.modifiedBoard, data.message);
            }

            // Refresh power-ups to update quantities
            fetchPowerUps();
        } catch (error) {
            console.error('Error using power-up:', error);
            setError(error.message || 'Failed to use power-up');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    if (loading && powerups.length === 0) {
        return <div className="powerup-panel">Loading power-ups...</div>;
    }

    const availablePowerUps = powerups.filter(p => p.unlocked && p.quantity > 0);

    return (
        <div className="powerup-panel">
            <h4>Holiday Magic Power-Ups</h4>
            {error && <div className="error-message">{error}</div>}
            {availablePowerUps.length === 0 ? (
                <p>No power-ups available. Complete achievements to unlock them!</p>
            ) : (
                <div className="powerup-list">
                    {availablePowerUps.map((powerup) => (
                        <button
                            key={powerup.powerup_id}
                            className="powerup-button"
                            onClick={() => handleUsePowerUp(powerup.powerup_id, powerup.powerup_key)}
                            disabled={loading || powerup.quantity <= 0}
                        >
                            <div className="powerup-name">{powerup.name}</div>
                            <div className="powerup-quantity">x{powerup.quantity}</div>
                            {powerup.description && (
                                <div className="powerup-description">{powerup.description}</div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PowerUpPanel;

