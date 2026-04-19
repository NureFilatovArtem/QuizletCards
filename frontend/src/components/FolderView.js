import React, { useState } from 'react';
import FlashCard from './FlashCard';
import CardForm from './CardForm';
import './FolderView.css';

function FolderView({
  folder, cards, hardCardCount,
  onBack, onDeleteCard, onAddCard,
  onOpenImport, onStartTest, onStartHardTest, onStartMatch, onStartBrowse, onDeleteFolder
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const text = cards.map(c => `${c.front}\t${c.back}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="folder-view">
      <div className="folder-view-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="folder-view-title">
          <h2>{folder.name}</h2>
          <span className="folder-view-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="folder-view-actions">
          <button className="fv-action-btn import" onClick={onOpenImport}>＋ Import More</button>
          <button
            className="fv-action-btn browse"
            onClick={onStartBrowse}
            disabled={cards.length === 0}
          >
            ☰ Browse Cards
          </button>
          <button
            className="fv-action-btn test"
            onClick={onStartTest}
            disabled={cards.length < 4}
            title={cards.length < 4 ? 'Need at least 4 cards to start a test' : ''}
          >
            ▶ Start Test
          </button>
          <button
            className="fv-action-btn match"
            onClick={onStartMatch}
            disabled={cards.length < 2}
            title={cards.length < 2 ? 'Need at least 2 cards' : 'Match mode — click pairs'}
          >
            ⬡ Match
          </button>
          {hardCardCount > 0 && (
            <button
              className="fv-action-btn hard"
              onClick={onStartHardTest}
              title={`Test your ${hardCardCount} hardest cards`}
            >
              🔥 Hard Cards ({hardCardCount})
            </button>
          )}
          <button
            className="fv-action-btn copy"
            onClick={handleCopyText}
            disabled={cards.length === 0}
            title="Copy all cards as tab-separated text (Quizlet format)"
          >
            {copied ? '✓ Copied!' : '⎘ Copy Text'}
          </button>
          <button className="fv-action-btn delete" onClick={onDeleteFolder}>🗑 Delete Folder</button>
        </div>
      </div>

      <CardForm onAdd={onAddCard} />

      {cards.length === 0 ? (
        <div className="folder-empty">
          <p>No cards in this folder yet. Add cards above or import them.</p>
        </div>
      ) : (
        <div className="folder-cards">
          <h3>Cards</h3>
          <div className="card-grid">
            {cards.map(card => (
              <FlashCard key={card.id} card={card} onDelete={onDeleteCard} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderView;
