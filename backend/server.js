const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;
const dbPath = path.join(__dirname, 'database.db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Ensure tables exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    folder_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
  )`);

  // Add folder_id column if it doesn't exist (migration for existing DBs)
  db.run(`ALTER TABLE cards ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE`, (err) => {
    // Ignore error if column already exists
  });
});

// Routes

// ─── FOLDER ROUTES ───

// Get all folders (with card count)
app.get('/api/folders', (req, res) => {
  db.all(
    `SELECT f.*, COUNT(c.id) as cardCount
     FROM folders f
     LEFT JOIN cards c ON c.folder_id = f.id
     GROUP BY f.id
     ORDER BY f.created_at DESC`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Create a folder
app.post('/api/folders', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Folder name is required' });
    return;
  }
  db.run('INSERT INTO folders (name) VALUES (?)', [name.trim()], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.get('SELECT * FROM folders WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(row);
    });
  });
});

// Delete a folder (and its cards via CASCADE)
app.delete('/api/folders/:id', (req, res) => {
  const id = req.params.id;
  // Delete cards first (in case CASCADE isn't working), then the folder
  db.run('DELETE FROM cards WHERE folder_id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.run('DELETE FROM folders WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }
      res.json({ message: 'Folder deleted successfully' });
    });
  });
});

// Get cards in a folder
app.get('/api/folders/:id/cards', (req, res) => {
  const id = req.params.id;
  db.all('SELECT * FROM cards WHERE folder_id = ? ORDER BY created_at DESC', [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a single card to a folder
app.post('/api/folders/:id/cards', (req, res) => {
  const folderId = req.params.id;
  const { front, back } = req.body;
  if (!front || !back) {
    res.status(400).json({ error: 'Front and back are required' });
    return;
  }
  db.run('INSERT INTO cards (front, back, folder_id) VALUES (?, ?, ?)', [front, back, folderId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.get('SELECT * FROM cards WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(row);
    });
  });
});

// Bulk import cards into a folder
app.post('/api/folders/:id/cards/bulk', (req, res) => {
  const folderId = req.params.id;
  const { cards } = req.body;

  if (!Array.isArray(cards) || cards.length === 0) {
    res.status(400).json({ error: 'cards array is required and must not be empty' });
    return;
  }

  const stmt = db.prepare('INSERT INTO cards (front, back, folder_id) VALUES (?, ?, ?)');
  const errors = [];
  let inserted = 0;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    cards.forEach((card, i) => {
      if (!card.front || !card.back) {
        errors.push(`Card ${i + 1}: front and back are required`);
        return;
      }
      stmt.run(card.front.trim(), card.back.trim(), folderId, (err) => {
        if (err) errors.push(`Card ${i + 1}: ${err.message}`);
        else inserted++;
      });
    });
    stmt.finalize();
    db.run('COMMIT', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Return all cards in the folder
      db.all('SELECT * FROM cards WHERE folder_id = ? ORDER BY created_at DESC', [folderId], (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ inserted, errors, cards: rows });
      });
    });
  });
});

// ─── LEGACY CARD ROUTES (kept for backward compat) ───

// Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Delete a card
app.delete('/api/cards/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM cards WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json({ message: 'Card deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

