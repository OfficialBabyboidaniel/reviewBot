// Database setup using sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to database
const db = new sqlite3.Database(path.join(__dirname, 'bot.db'));

// Create tables if they don't exist
db.serialize(() => {
    // Create table
    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            rating INTEGER DEFAULT 5,
            is_anonymous INTEGER DEFAULT 1,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Add columns if they don't exist (for existing databases)
    db.run('ALTER TABLE reviews ADD COLUMN is_anonymous INTEGER DEFAULT 1', (err) => {
        // Column already exists or table doesn't exist yet, ignore
    });

    db.run('ALTER TABLE reviews ADD COLUMN rating INTEGER DEFAULT 5', (err) => {
        // Column already exists or table doesn't exist yet, ignore
    });
});

// Database functions using callbacks
const insertReview = {
    run: (userId, content, rating, isAnonymous) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO reviews (user_id, content, rating, is_anonymous) VALUES (?, ?, ?, ?)',
                [userId, content, rating, isAnonymous],
                function (err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID });
                }
            );
        });
    }
};

const getReviews = {
    all: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM reviews ORDER BY timestamp DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

const getReviewsByUser = {
    all: (userId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM reviews WHERE user_id = ? ORDER BY timestamp DESC', [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = {
    insertReview,
    getReviews,
    getReviewsByUser,
    db
};