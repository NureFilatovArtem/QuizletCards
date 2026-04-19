import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CardBrowser.css';

function CardBrowser({ cards, folderName, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const activeItemRef = useRef(null);

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
      setFlipped(false);
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  const card = cards[currentIndex];

  return (
    <div className="card-browser">
      <div className="browser-header">
        <button className="browser-back-btn" onClick={onBack}>← Back to Folder</button>
        <div className="browser-title">
          <h2>{folderName}</h2>
          <span className="browser-counter">{currentIndex + 1} / {cards.length}</span>
        </div>
      </div>

      <div className="browser-card-area">
        <button
          className="browser-nav-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          ‹
        </button>

        <div
          className={`browser-card ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
        >
          <div className="browser-card-inner">
            <div className="browser-card-front">
              <span className="browser-card-label">Term</span>
              <div className="browser-card-text">{card.front}</div>
              <span className="browser-card-hint">Click or Space to flip</span>
            </div>
            <div className="browser-card-back">
              <span className="browser-card-label">Definition</span>
              <div className="browser-card-text">{card.back}</div>
              <span className="browser-card-hint">Click or Space to flip</span>
            </div>
          </div>
        </div>

        <button
          className="browser-nav-btn"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
        >
          ›
        </button>
      </div>

      <p className="browser-keys-hint">← → arrow keys to navigate</p>

      <div className="browser-list-section">
        <h3>All Cards</h3>
        <div className="browser-list">
          {cards.map((c, i) => (
            <div
              key={c.id}
              ref={i === currentIndex ? activeItemRef : null}
              className={`browser-list-item ${i === currentIndex ? 'active' : ''}`}
              onClick={() => { setCurrentIndex(i); setFlipped(false); }}
            >
              <span className="browser-list-num">{i + 1}</span>
              <span className="browser-list-front">{c.front}</span>
              <span className="browser-list-sep">→</span>
              <span className="browser-list-back">{c.back}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CardBrowser;
