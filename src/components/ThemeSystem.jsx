import React, { useEffect, useState } from 'react';

const ThemeSystem = ({ children }) => {
    const [theme, setTheme] = useState('afternoon');

    useEffect(() => {
        const updateTheme = () => {
            const hour = new Date().getHours();
            let newTheme = 'afternoon';
            
            if (hour >= 6 && hour < 12) {
                newTheme = 'morning';
            } else if (hour >= 12 && hour < 18) {
                newTheme = 'afternoon';
            } else if (hour >= 18 && hour < 22) {
                newTheme = 'evening';
            } else {
                newTheme = 'night';
            }
            
            setTheme(newTheme);
            applyTheme(newTheme);
        };

        const applyTheme = (themeName) => {
            const root = document.documentElement;
            
            switch (themeName) {
                case 'morning':
                    root.style.setProperty('--bg-dark', '#e8f4f8');
                    root.style.setProperty('--tile-color', '#4a90e2');
                    root.style.setProperty('--accent-color', '#87ceeb');
                    root.style.setProperty('--text-light', '#1e3a5f');
                    break;
                case 'afternoon':
                    root.style.setProperty('--bg-dark', '#1e1e1e');
                    root.style.setProperty('--tile-color', '#c93c3c');
                    root.style.setProperty('--accent-color', '#4CAF50');
                    root.style.setProperty('--text-light', '#f0f0f0');
                    break;
                case 'evening':
                    root.style.setProperty('--bg-dark', '#2d1b1b');
                    root.style.setProperty('--tile-color', '#d4a574');
                    root.style.setProperty('--accent-color', '#ffb347');
                    root.style.setProperty('--text-light', '#f5e6d3');
                    break;
                case 'night':
                    root.style.setProperty('--bg-dark', '#0a0e27');
                    root.style.setProperty('--tile-color', '#6b7fd7');
                    root.style.setProperty('--accent-color', '#b19cd9');
                    root.style.setProperty('--text-light', '#e0e7ff');
                    break;
                default:
                    break;
            }
        };

        // Initial theme
        updateTheme();

        // Update theme every minute to catch time changes
        const interval = setInterval(updateTheme, 60000);

        return () => clearInterval(interval);
    }, []);

    return <>{children}</>;
};

export default ThemeSystem;

