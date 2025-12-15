// src/components/Tile.jsx

import React, { useState } from 'react';
import '../App.css'; 

const Tile = ({ value, index, size, onTileClick, isHint }) => { 
    const isEmpty = value === null;
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        if (!isEmpty) {
            onTileClick(index);
        }
    };

    const handleMouseDown = () => {
        if (!isEmpty) {
            setIsPressed(true);
        }
    };

    const handleMouseUp = () => {
        setIsPressed(false);
    };

    const handleMouseLeave = () => {
        setIsPressed(false);
    };

    return (
        <div
            className={`tile ${isEmpty ? 'empty' : ''} ${!isEmpty && isHint ? 'hint-glow' : ''} ${isPressed ? 'pressed' : ''}`} 
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ 
                transition: 'all 0.2s ease-in-out',
                transform: isPressed ? 'scale(0.95) translateY(2px)' : 'scale(1) translateY(0)'
            }}
        >
            {value}
        </div>
    );
};

export default Tile;