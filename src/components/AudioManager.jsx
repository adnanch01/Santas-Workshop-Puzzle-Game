import React, { useState, useEffect, useRef } from 'react';

const AudioManager = ({ playMoveSound, playVictorySound, playHintSound, playPowerUpSound }) => {
    const [musicEnabled, setMusicEnabled] = useState(() => {
        const saved = localStorage.getItem('musicEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('volume');
        return saved !== null ? parseFloat(saved) : 0.5;
    });

    const musicRef = useRef(null);
    const moveSoundRef = useRef(null);
    const victorySoundRef = useRef(null);
    const hintSoundRef = useRef(null);
    const powerUpSoundRef = useRef(null);

    useEffect(() => {
        // Initialize audio elements
        try {
            musicRef.current = new Audio('/audio/christmas-music.mp3');
            musicRef.current.loop = true;
            musicRef.current.volume = volume;

            moveSoundRef.current = new Audio('/audio/tile-move.mp3');
            moveSoundRef.current.volume = volume * 0.5;

            victorySoundRef.current = new Audio('/audio/victory.mp3');
            victorySoundRef.current.volume = volume;

            hintSoundRef.current = new Audio('/audio/hint.mp3');
            hintSoundRef.current.volume = volume * 0.7;

            powerUpSoundRef.current = new Audio('/audio/powerup.mp3');
            powerUpSoundRef.current.volume = volume * 0.7;
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }

        // Play background music if enabled
        if (musicEnabled && musicRef.current) {
            const playPromise = musicRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Autoplay was prevented - user interaction required
                    console.log('Autoplay prevented:', error);
                });
            }
        }

        return () => {
            // Cleanup: stop music when component unmounts
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Update music state
        if (musicRef.current) {
            musicRef.current.volume = volume;
            if (musicEnabled) {
                const playPromise = musicRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            } else {
                musicRef.current.pause();
            }
        }

        // Update sound effect volumes
        [moveSoundRef, victorySoundRef, hintSoundRef, powerUpSoundRef].forEach(ref => {
            if (ref.current) {
                ref.current.volume = volume * (ref === moveSoundRef ? 0.5 : ref === victorySoundRef ? 1 : 0.7);
            }
        });

        localStorage.setItem('musicEnabled', JSON.stringify(musicEnabled));
        localStorage.setItem('volume', volume.toString());
    }, [musicEnabled, volume]);

    // Play sound effects when triggered
    useEffect(() => {
        if (playMoveSound && moveSoundRef.current) {
            moveSoundRef.current.play().catch(() => {});
        }
    }, [playMoveSound]);

    useEffect(() => {
        if (playVictorySound && victorySoundRef.current) {
            victorySoundRef.current.play().catch(() => {});
        }
    }, [playVictorySound]);

    useEffect(() => {
        if (playHintSound && hintSoundRef.current) {
            hintSoundRef.current.play().catch(() => {});
        }
    }, [playHintSound]);

    useEffect(() => {
        if (playPowerUpSound && powerUpSoundRef.current) {
            powerUpSoundRef.current.play().catch(() => {});
        }
    }, [playPowerUpSound]);

    return (
        <div className="audio-controls">
            <button
                className="audio-toggle"
                onClick={() => setMusicEnabled(!musicEnabled)}
                title={musicEnabled ? 'Mute music' : 'Unmute music'}
            >
                {musicEnabled ? '🔊' : '🔇'}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
                title="Volume"
            />
        </div>
    );
};

export default AudioManager;

