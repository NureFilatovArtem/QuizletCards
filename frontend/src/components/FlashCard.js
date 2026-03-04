import React, { useState } from 'react';
import './FlashCard.css';

function FlashCard({ card, onDelete }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this card?')) {
      onDelete(card.id);
    }
  };

  return (
    <div className={`flash-card ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
      <div className="card-inner">
        <div className="card-front">
          <div className="card-content">
            <p>{card.front}</p>
          </div>
          <div className="card-footer">
            <span className="flip-hint">Click to flip</span>
            <button className="delete-btn" onClick={handleDelete}>×</button>
          </div>
        </div>
        <div className="card-back">
          <div className="card-content">
            <p>{card.back}</p>
          </div>
          <div className="card-footer">
            <span className="flip-hint">Click to flip</span>
            <button className="delete-btn" onClick={handleDelete}>×</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;

