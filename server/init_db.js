// Database initialization script using better-sqlite3
// This script reads SQL files and executes them to set up the database

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'santas_workshop.db');
console.log(`Database path: ${dbPath}`);

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
    console.log('Removing existing database...');
    fs.unlinkSync(dbPath);
}

console.log('Creating new database...');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Function to execute SQL file
function executeSQLFile(filePath) {
    console.log(`\nExecuting ${path.basename(filePath)}...`);
    try {
        const buffer = fs.readFileSync(filePath);
        let sql;
        
        // Detect encoding by checking BOM
        if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
            // UTF-16LE BOM
            sql = buffer.slice(2).toString('utf16le');
        } else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            // UTF-8 BOM
            sql = buffer.slice(3).toString('utf8');
        } else {
            // Try UTF-8 first
            sql = buffer.toString('utf8');
            // Check if it looks like UTF-16 (has many null bytes between characters)
            const nullCount = (buffer.toString('utf8').match(/\0/g) || []).length;
            if (nullCount > buffer.length / 4) {
                // Likely UTF-16LE without BOM
                sql = buffer.toString('utf16le');
            }
        }
        
        // Strip null bytes
        sql = sql.replace(/\0/g, '');
        
        // Execute as a single script (SQLite's exec handles multiple statements)
        // PRAGMA statements work fine with exec()
        db.exec(sql);
        
        console.log(`✓ ${path.basename(filePath)} executed successfully`);
        return true;
    } catch (err) {
        console.error(`✗ Error executing ${path.basename(filePath)}:`, err.message);
        return false;
    }
}

// Execute SQL files in order
const sqlFiles = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, 'seed.sql'),
    path.join(__dirname, 'schema_migrations.sql'),
    path.join(__dirname, 'seed_additional_features.sql')
];

let success = true;
for (const sqlFile of sqlFiles) {
    if (!fs.existsSync(sqlFile)) {
        console.error(`✗ File not found: ${sqlFile}`);
        success = false;
        continue;
    }
    
    if (!executeSQLFile(sqlFile)) {
        success = false;
        break;
    }
}

db.close();

if (success) {
    console.log('\n✓ Database initialization complete!');
    process.exit(0);
} else {
    console.error('\n✗ Database initialization failed!');
    process.exit(1);
}

