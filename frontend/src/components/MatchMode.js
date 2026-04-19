import React, { useState, useEffect, useRef } from 'react';
import './MatchMode.css';

const PAIR_OPTIONS = [4, 6, 8];

export default function MatchMode({ cards, folderName, onBack }) {
  const [gameState, setGameState] = useState('start');
  const [pairCount, setPairCount] = useState(() => Math.min(6, cards.length));
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [wrongPair, setWrongPair] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const locked = useRef(false);
  const totalPairs = pairCount;

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
  };

  const startGame = (count) => {
    const picked = [...cards].sort(() => Math.random() - 0.5).slice(0, count);
    const newTiles = [];
    picked.forEach(card => {
      newTiles.push({ uid: `f-${card.id}`, cardId: card.id, text: card.front, matched: false });
      newTiles.push({ uid: `b-${card.id}`, cardId: card.id, text: card.back, matched: false });
    });
    newTiles.sort(() => Math.random() - 0.5);
    setTiles(newTiles);
    setSelected(null);
    setMistakes(0);
    setMatchedPairs(0);
    setWrongPair(null);
    setElapsed(0);
    locked.current = false;
    setGameState('playing');
  };

  const handleTileClick = (idx) => {
    if (locked.current) return;
    const tile = tiles[idx];
    if (tile.matched) return;
    if (selected === idx) { setSelected(null); return; }

    if (selected === null) {
      setSelected(idx);
      return;
    }

    const firstTile = tiles[selected];
    if (firstTile.cardId === tile.cardId) {
      // Match!
      locked.current = true;
      setTiles(prev => prev.map((t, i) =>
        i === selected || i === idx ? { ...t, matched: true } : t
      ));
      setMatchedPairs(m => {
        const next = m + 1;
        if (next === totalPairs) setTimeout(() => setGameState('done'), 500);
        return next;
      });
      setSelected(null);
      locked.current = false;
    } else {
      // Wrong
      locked.current = true;
      setMistakes(m => m + 1);
      setWrongPair([selected, idx]);
      setTimeout(() => {
        setWrongPair(null);
        setSelected(null);
        locked.current = false;
      }, 700);
    }
  };

  // ── Start screen ──
  if (gameState === 'start') {
    return (
      <div className="match-wrapper">
        <div className="match-start">
          <button className="match-back-text-btn" onClick={onBack}>← Back to Folder</button>
          <h2>Match</h2>
          <p className="match-folder-label">{folderName}</p>
          <p className="match-desc">
            Click a card, then click its matching pair. Clear all pairs as fast as you can!
          </p>
          <div className="match-count-section">
            <p>How many pairs?</p>
            <div className="match-count-options">
              {PAIR_OPTIONS.map(n => (
                <button
                  key={n}
                  className={`match-count-btn ${pairCount === n ? 'selected' : ''}`}
                  onClick={() => setPairCount(n)}
                  disabled={cards.length < n}
                  title={cards.length < n ? `Need at least ${n} cards` : ''}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            className="match-start-btn"
            onClick={() => startGame(pairCount)}
            disabled={cards.length < 2}
          >
            Start Matching
          </button>
        </div>
      </div>
    );
  }

  // ── Done screen ──
  if (gameState === 'done') {
    const isPerfect = mistakes === 0;
    return (
      <div className="match-wrapper">
        <div className="match-done">
          <div className="match-done-icon">{isPerfect ? '🏆' : '✓'}</div>
          <h2>Completed!</h2>
          <div className="match-result-time">{formatTime(elapsed)}</div>
          <p className="match-result-sub">
            {isPerfect ? 'Perfect run — no mistakes!' : `${mistakes} mistake${mistakes !== 1 ? 's' : ''}`}
          </p>
          <div className="match-done-actions">
            <button className="match-start-btn" onClick={() => startGame(pairCount)}>
              Play Again
            </button>
            <button className="match-secondary-btn" onClick={onBack}>
              Back to Folder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing ──
  const progressPct = (matchedPairs / totalPairs) * 100;

  return (
    <div className="match-wrapper match-playing">
      <div className="match-topbar">
        <button className="match-back-text-btn match-back-light" onClick={onBack}>← Back</button>
        <div className="match-top-stats">
          <span className="match-timer-display">{formatTime(elapsed)}</span>
          <span className="match-pairs-display">{matchedPairs}/{totalPairs}</span>
          {mistakes > 0 && (
            <span className="match-mistakes-display">{mistakes} ✗</span>
          )}
        </div>
      </div>

      <div className="match-progress-bar">
        <div className="match-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="match-grid">
        {tiles.map((tile, idx) => {
          const isSelected = selected === idx;
          const isWrong = wrongPair && wrongPair.includes(idx);
          return (
            <div
              key={tile.uid}
              className={`match-tile${tile.matched ? ' matched' : ''}${isSelected ? ' selected' : ''}${isWrong ? ' wrong' : ''}`}
              onClick={() => handleTileClick(idx)}
            >
              <span className="match-tile-text">{tile.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
