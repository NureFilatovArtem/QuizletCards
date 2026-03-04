import React from 'react';
import FlashCard from './FlashCard';
import './CardList.css';

function CardList({ cards, onDelete }) {
  if (cards.length === 0) {
    return (
      <div className="card-list-container">
        <p className="empty-message">No cards yet. Create your first card above!</p>
      </div>
    );
  }

  return (
    <div className="card-list-container">
      <h2>Your Cards ({cards.length})</h2>
      <div className="card-grid">
        {cards.map(card => (
          <FlashCard
            key={card.id}
            card={card}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CardList;

