const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');

// Remove existing database if it exists (for fresh start)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      process.exit(1);
    }
    console.log('Cards table created successfully.');
    
    // Insert some sample cards
    const sampleCards = [
      { front: 'What is the capital of France?', back: 'Paris' },
      { front: 'What is 2 + 2?', back: '4' },
      { front: 'What is the largest planet?', back: 'Jupiter' }
    ];
    
    const stmt = db.prepare('INSERT INTO cards (front, back) VALUES (?, ?)');
    sampleCards.forEach(card => {
      stmt.run(card.front, card.back);
    });
    stmt.finalize();
    
    console.log('Sample cards inserted.');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database initialized successfully.');
      }
      process.exit(0);
    });
  });
});

