import React, { useState, useEffect, useCallback } from 'react';
import './TestMode.css';
import { updateSRData } from '../utils/srStorage';

const COUNT_OPTIONS = [5, 10, 20];
const PAGE_SIZE = 3;

function generateOptions(card, allCards) {
  const correctAnswer = card.front;
  const others = allCards
    .filter(c => c.id !== card.id)
    .map(c => c.front)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [correctAnswer, ...others].sort(() => Math.random() - 0.5);
}

// cards      = all cards in folder (used for wrong-option generation)
// filterCards = subset to test on (null = use all)
// folderId   = for saving SR data
function TestMode({ cards, filterCards, folderId, folderName, onBack }) {
  const sourceCards = filterCards || cards;
  const isHardMode = !!filterCards;

  const [questionCount, setQuestionCount] = useState(() =>
    sourceCards.length >= 10 ? 10 : sourceCards.length
  );
  const [questionQueue, setQuestionQueue] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [focusedCard, setFocusedCard] = useState(0);

  const totalPages = Math.ceil(questionQueue.length / PAGE_SIZE);
  const pageStartIdx = currentPageIndex * PAGE_SIZE;
  const currentPageQuestions = questionQueue.slice(pageStartIdx, pageStartIdx + PAGE_SIZE);

  const isPageComplete = currentPageQuestions.length > 0 &&
    currentPageQuestions.every((_, i) => answers[pageStartIdx + i] !== undefined);

  const percentage = totalAnswered > 0
    ? Math.round((correctCount / totalAnswered) * 100)
    : 0;

  const handleSelectOption = useCallback((absIdx, option) => {
    if (answers[absIdx] !== undefined) return;
    const card = questionQueue[absIdx];
    const correct = option === card.front;
    setAnswers(prev => ({ ...prev, [absIdx]: option }));
    setTotalAnswered(t => t + 1);
    if (correct) setCorrectCount(c => c + 1);
    setFocusedCard(prev => {
      for (let d = 1; d <= PAGE_SIZE; d++) {
        const next = (prev + d) % PAGE_SIZE;
        const nextAbsIdx = pageStartIdx + next;
        if (answers[nextAbsIdx] === undefined && next !== prev) return next;
      }
      return prev;
    });
  }, [answers, questionQueue, pageStartIdx]);

  // Keyboard shortcuts: A/B/C/D for options, Tab to switch focused card
  useEffect(() => {
    if (!testStarted) return;
    const handler = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'tab') {
        e.preventDefault();
        setFocusedCard(prev => {
          for (let d = 1; d <= PAGE_SIZE; d++) {
            const next = (prev + d) % PAGE_SIZE;
            if (answers[pageStartIdx + next] === undefined) return next;
          }
          return prev;
        });
        return;
      }
      const letterIndex = ['a', 'b', 'c', 'd'].indexOf(key);
      if (letterIndex === -1) return;
      const absIdx = pageStartIdx + focusedCard;
      if (absIdx >= questionQueue.length) return;
      if (answers[absIdx] !== undefined) return;
      const opts = allOptions[absIdx];
      if (opts && opts[letterIndex] !== undefined) {
        handleSelectOption(absIdx, opts[letterIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [testStarted, focusedCard, pageStartIdx, answers, allOptions, questionQueue, handleSelectOption]);

  useEffect(() => {
    setFocusedCard(0);
  }, [currentPageIndex]);

  const startTest = (count) => {
    const shuffled = [...sourceCards].sort(() => Math.random() - 0.5);
    const selected = count === 'all' ? shuffled : shuffled.slice(0, Math.min(count, shuffled.length));
    const queue = selected.map(c => ({ ...c, isRetry: false }));
    const opts = queue.map(card => generateOptions(card, cards));
    setQuestionQueue(queue);
    setAllOptions(opts);
    setAnswers({});
    setCurrentPageIndex(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setTestStarted(true);
    setTestFinished(false);
    setFocusedCard(0);
  };

  const handleNextPage = () => {
    if (currentPageIndex + 1 >= totalPages) {
      // Save SR data before finishing
      if (folderId != null) {
        const results = questionQueue.map((card, i) => ({
          cardId: card.id,
          correct: answers[i] === card.front,
        }));
        updateSRData(folderId, results);
      }
      setTestFinished(true);
      setTestStarted(false);
    } else {
      setCurrentPageIndex(p => p + 1);
    }
  };

  // ── Finished screen ──
  if (testFinished) {
    const missed = questionQueue.filter((card, i) => answers[i] !== card.front);
    const newHardCount = missed.length;

    return (
      <div className="test-mode-container">
        <div className="test-finished">
          <h2>Test Complete!</h2>
          {isHardMode && <p className="hard-mode-badge">Hard Cards Mode</p>}
          <div className={`score-circle ${percentage >= 80 ? 'score-great' : percentage >= 50 ? 'score-ok' : 'score-bad'}`}>
            <span className="score-number">{percentage}%</span>
          </div>
          <p className="score-detail">{correctCount} out of {totalAnswered} correct</p>

          {folderId != null && newHardCount > 0 && (
            <p className="sr-saved-note">
              🧠 {newHardCount} card{newHardCount !== 1 ? 's' : ''} added to your Hard Cards
            </p>
          )}
          {folderId != null && newHardCount === 0 && totalAnswered > 0 && (
            <p className="sr-saved-note sr-saved-perfect">
              🌟 No mistakes — Hard Cards cleared!
            </p>
          )}

          {missed.length > 0 && (
            <div className="missed-list">
              <p className="missed-label">Missed cards:</p>
              {missed.map((card, i) => (
                <div key={i} className="missed-item">
                  <span className="missed-back">{card.back}</span>
                  <span className="missed-arrow">→</span>
                  <span className="missed-front">{card.front}</span>
                </div>
              ))}
            </div>
          )}

          <div className="test-finished-actions">
            <button
              onClick={() => startTest(questionCount === 'all' ? 'all' : questionCount)}
              className="start-test-btn"
            >
              Try Again
            </button>
            {missed.length > 0 && (
              <button
                onClick={() => {
                  const opts = missed.map(card => generateOptions(card, cards));
                  setQuestionQueue(missed.map(c => ({ ...c, isRetry: true })));
                  setAllOptions(opts);
                  setAnswers({});
                  setCurrentPageIndex(0);
                  setCorrectCount(0);
                  setTotalAnswered(0);
                  setTestStarted(true);
                  setTestFinished(false);
                  setFocusedCard(0);
                }}
                className="retry-missed-btn"
              >
                Retry Missed ({missed.length})
              </button>
            )}
            <button onClick={onBack} className="back-to-folder-btn">Back to Folder</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Start screen ──
  if (!testStarted) {
    const availableCount = sourceCards.length;
    return (
      <div className="test-mode-container">
        <div className="test-start">
          <button className="test-back-btn" onClick={onBack}>← Back to Folder</button>
          <h2>Multiple Choice Test</h2>
          {isHardMode && <p className="hard-mode-badge">Hard Cards — {availableCount} cards</p>}
          <p className="test-folder-label">{folderName}</p>
          <p className="test-description">
            3 questions per page. Press <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd> for quick answers,
            <kbd>Tab</kbd> to switch between questions.
          </p>

          <div className="question-count-section">
            <p className="question-count-label">How many questions?</p>
            <div className="question-count-options">
              {COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  className={`count-btn ${questionCount === n ? 'selected' : ''}`}
                  onClick={() => setQuestionCount(n)}
                  disabled={availableCount < n}
                  title={availableCount < n ? `Need at least ${n} cards` : ''}
                >
                  {n}
                </button>
              ))}
              <button
                className={`count-btn ${questionCount === 'all' ? 'selected' : ''}`}
                onClick={() => setQuestionCount('all')}
              >
                All ({availableCount})
              </button>
            </div>
          </div>

          <button
            onClick={() => startTest(questionCount)}
            className="start-test-btn"
            disabled={availableCount < 4}
          >
            {availableCount < 4 ? 'Need at least 4 cards' : 'Start Test'}
          </button>
        </div>
      </div>
    );
  }

  // ── Active test ──
  if (currentPageIndex >= totalPages) return null;

  const overallProgress = (pageStartIdx / questionQueue.length) * 100;

  return (
    <div className="test-mode-container test-mode-wide">
      <div className="test-header">
        <div className="test-header-top">
          <h2>
            Test — {folderName}
            {isHardMode && <span className="hard-mode-indicator"> 🔥</span>}
          </h2>
          <span className="test-score-live">Score: {correctCount}/{totalAnswered}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="progress-text">
          <span className="progress-counter">Page {currentPageIndex + 1} / {totalPages}</span>
          <span className="questions-range">
            &nbsp;· Q{pageStartIdx + 1}–{Math.min(pageStartIdx + PAGE_SIZE, questionQueue.length)} of {questionQueue.length}
          </span>
        </p>
      </div>

      <div className="page-questions-grid">
        {currentPageQuestions.map((card, i) => {
          const absIdx = pageStartIdx + i;
          const selected = answers[absIdx];
          const isAnswered = selected !== undefined;
          const isCorrect = selected === card.front;
          const opts = allOptions[absIdx] || [];
          const isFocused = focusedCard === i && !isAnswered;

          return (
            <div
              key={absIdx}
              className={`question-card ${isAnswered ? (isCorrect ? 'card-correct' : 'card-incorrect') : ''} ${isFocused ? 'card-focused' : ''}`}
              onClick={() => !isAnswered && setFocusedCard(i)}
            >
              <div className="question-card-header">
                <span className="question-card-number">Q{absIdx + 1}</span>
                {isFocused && <span className="keyboard-hint">A B C D</span>}
                {isAnswered && (
                  <span className={`card-result-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </div>
              <div className="question-card-definition">{card.back}</div>
              {card.isRetry && <span className="retry-badge-small">retry</span>}
              <div className="question-card-options">
                {opts.map((option, oi) => {
                  let cls = 'option-btn option-btn-compact';
                  if (isAnswered) {
                    if (option === card.front) cls += ' correct';
                    else if (option === selected) cls += ' incorrect';
                    else cls += ' dimmed';
                  }
                  return (
                    <button
                      key={oi}
                      className={cls}
                      onClick={(e) => { e.stopPropagation(); handleSelectOption(absIdx, option); }}
                      disabled={isAnswered}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                      <span className="option-text">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="page-navigation">
        <button
          className="nav-btn nav-prev"
          onClick={() => setCurrentPageIndex(p => p - 1)}
          disabled={currentPageIndex === 0}
        >
          ← Previous
        </button>
        <button
          className={`nav-btn nav-next ${isPageComplete ? 'nav-next-ready' : ''}`}
          onClick={handleNextPage}
          disabled={!isPageComplete}
          title={!isPageComplete ? 'Answer all questions to continue' : ''}
        >
          {currentPageIndex + 1 >= totalPages ? 'Finish Test ✓' : 'Next Page →'}
        </button>
      </div>

      <div className="live-percentage-bar">
        <div className="pct-labels">
          <span>Correct so far</span>
          <span className={`pct-value ${percentage >= 80 ? 'pct-great' : percentage >= 50 ? 'pct-ok' : 'pct-bad'}`}>
            {totalAnswered > 0 ? `${percentage}%` : '—'}
          </span>
        </div>
        <div className="pct-track">
          <div
            className={`pct-fill ${percentage >= 80 ? 'pct-fill-great' : percentage >= 50 ? 'pct-fill-ok' : 'pct-fill-bad'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default TestMode;
