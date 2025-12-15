import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

const StoryMode = ({ userId, onStartChapter }) => {
    const [progress, setProgress] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchProgress();
        }
    }, [userId]);

    const fetchProgress = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/story/progress/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setProgress(data);
            }
        } catch (error) {
            console.error('Error fetching story progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChapterSelect = async (chapterNumber) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/story/chapter/${chapterNumber}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedChapter(data);
            }
        } catch (error) {
            console.error('Error fetching chapter:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPuzzle = () => {
        if (selectedChapter && onStartChapter) {
            onStartChapter({
                chapterNumber: selectedChapter.chapter_number,
                puzzleSize: selectedChapter.puzzle_size,
                difficulty: selectedChapter.puzzle_difficulty
            });
        }
    };

    if (loading && !progress) {
        return <div className="story-mode">Loading story...</div>;
    }

    if (!progress) {
        return null;
    }

    return (
        <div className="story-mode">
            <h2>🎄 Christmas Story Mode 🎁</h2>
            
            {selectedChapter ? (
                <div className="chapter-content">
                    <h3>{selectedChapter.title}</h3>
                    <div className="narrative">{selectedChapter.narrative}</div>
                    <div className="chapter-actions">
                        <button onClick={handleStartPuzzle} className="start-chapter-button">
                            Start Chapter Puzzle
                        </button>
                        <button onClick={() => setSelectedChapter(null)} className="back-button">
                            Back to Chapters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="chapter-list">
                    <p>Select a chapter to begin your Christmas adventure!</p>
                    {progress.chapters.map((chapter) => (
                        <div
                            key={chapter.chapter_number}
                            className={`chapter-item ${chapter.unlocked ? 'unlocked' : 'locked'} ${chapter.completed ? 'completed' : ''}`}
                            onClick={() => chapter.unlocked && handleChapterSelect(chapter.chapter_number)}
                        >
                            <div className="chapter-number">Chapter {chapter.chapter_number}</div>
                            <div className="chapter-title">{chapter.title}</div>
                            {!chapter.unlocked && (
                                <div className="chapter-locked">🔒 Locked</div>
                            )}
                            {chapter.completed && (
                                <div className="chapter-completed">✓ Completed</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StoryMode;

