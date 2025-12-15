// src/components/Tile.jsx

import React from 'react';
import '../App.css'; 

// Added new prop: isHint
const Tile = ({ value, index, size, onTileClick, isHint }) => { 
    const isEmpty = value === null;

    const handleClick = () => {
        if (!isEmpty) {
            onTileClick(index);
        }
    };

    return (
        <div
            // CRITICAL FIX: Only apply the hint-glow class IF the tile is NOT empty.
            className={`tile ${isEmpty ? 'empty' : ''} ${!isEmpty && isHint ? 'hint-glow' : ''}`} 
            onClick={handleClick}
            style={{ 
                // ... (existing styles) ...
            }}
        >
            {value}
        </div>
    );
};

export default Tile;