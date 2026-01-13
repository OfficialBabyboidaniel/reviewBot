// Database setup using better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

// Create or connect to database
const db = new Database(path.join(__dirname, 'bot.db'));

// Add the new column if it doesn't exist (for existing databases)
try {
    db.exec('ALTER TABLE reviews ADD COLUMN is_anonymous INTEGER DEFAULT 1');
} catch (error) {
    // Column already exists or table doesn't exist yet, ignore
}

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_anonymous INTEGER DEFAULT 1,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Database functions
const insertReview = db.prepare('INSERT INTO reviews (user_id, content, is_anonymous) VALUES (?, ?, ?)');
const getReviews = db.prepare('SELECT * FROM reviews ORDER BY timestamp DESC');
const getReviewsByUser = db.prepare('SELECT * FROM reviews WHERE user_id = ? ORDER BY timestamp DESC');

module.exports = {
    insertReview,
    getReviews,
    getReviewsByUser,
    db
};