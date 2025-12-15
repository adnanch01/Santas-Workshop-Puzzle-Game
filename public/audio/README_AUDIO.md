# Audio Files Directory

This directory should contain the following audio files for the game:

## Required Files

1. **christmas-music.mp3** - Background music (looped)
   - Should be festive Christmas music
   - Recommended: Royalty-free or your own composition
   - Format: MP3
   - Length: Any (will loop)

2. **tile-move.mp3** - Sound effect for tile movement
   - Short click or slide sound
   - Duration: < 1 second
   - Format: MP3

3. **victory.mp3** - Victory celebration sound
   - Festive celebration sound (bells, fanfare, etc.)
   - Duration: 2-3 seconds
   - Format: MP3

4. **hint.mp3** - Hint system sound
   - Magical/sparkle sound
   - Duration: < 1 second
   - Format: MP3

5. **powerup.mp3** - Power-up activation sound
   - Magical/energy sound
   - Duration: < 1 second
   - Format: MP3

## Notes

- If audio files are missing, the game will continue to work but silently
- AudioManager component handles graceful degradation
- All audio is optional - game is fully playable without sounds
- Consider user accessibility preferences (volume controls included)

## Getting Audio Files

You can:
1. Use royalty-free music from sites like:
   - Freesound.org
   - Zapsplat.com
   - Incompetech.com
2. Create your own audio files
3. Use placeholder silent MP3s for development

For quick testing, you can create silent placeholder files or the game will work without them.

