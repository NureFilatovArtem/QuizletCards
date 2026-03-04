# Quizlet Prototype

A simple Quizlet-like web application for creating and studying flashcards.

## Features

- **Create Flashcards**: Add cards with front and back sides
- **Browse Cards**: View all your flashcards in a grid layout
- **Flip Animation**: Click any card to flip it and see the back side
- **Test Mode**: Test yourself on your cards with question/answer format
- **Persistent Storage**: All cards are saved in SQLite database

## Tech Stack

- **Frontend**: React (plain HTML/CSS/JS)
- **Backend**: Node.js with Express
- **Database**: SQLite

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies for all parts of the project:**

```bash
npm run install-all
```

Or manually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. **Initialize the database:**

```bash
npm run setup-db
```

This will create the SQLite database file and add some sample cards.

### Running the Application

**Option 1: Run both server and client together (recommended):**

```bash
npm run dev
```

**Option 2: Run separately:**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Usage

1. **Browse Mode** (default):
   - Create new flashcards by filling in the front and back fields
   - Click on any card to flip it and see the answer
   - Delete cards by clicking the × button

2. **Test Mode**:
   - Click "Test Mode" button in the header
   - Click "Start Test" to begin
   - Answer each question by typing your response
   - Submit to see if your answer is correct
   - Continue through all cards

## Project Structure

```
QuizletPrototype/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── init-db.js         # Database initialization script
│   ├── database.db        # SQLite database (created after setup)
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js         # Main app component
│   │   ├── App.css
│   │   ├── index.js       # React entry point
│   │   ├── index.css
│   │   └── components/
│   │       ├── CardForm.js      # Form to create new cards
│   │       ├── CardList.js      # Grid of all cards
│   │       ├── FlashCard.js     # Individual card component
│   │       └── TestMode.js      # Test mode component
│   └── package.json
├── package.json           # Root package.json with scripts
└── README.md
```

## API Endpoints

- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get a single card
- `POST /api/cards` - Create a new card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card
- `GET /api/cards/test/random` - Get shuffled cards for testing

## Notes

- The database file (`backend/database.db`) is created automatically on first run
- Sample cards are added during database initialization
- All data persists between server restarts
- No authentication or user accounts (as per requirements)

