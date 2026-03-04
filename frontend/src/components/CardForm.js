import React, { useState } from 'react';
import './CardForm.css';

function CardForm({ onAdd }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      const success = await onAdd(front.trim(), back.trim());
      if (success) {
        setFront('');
        setBack('');
      }
    }
  };

  return (
    <div className="card-form-container">
      <h2>Create New Card</h2>
      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-group">
          <label htmlFor="front">Front:</label>
          <textarea
            id="front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Enter the front side of the card..."
            rows="3"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="back">Back:</label>
          <textarea
            id="back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Enter the back side of the card..."
            rows="3"
            required
          />
        </div>
        <button type="submit" className="submit-btn">
          Add Card
        </button>
      </form>
    </div>
  );
}

export default CardForm;

