import React, { useState, useEffect, useMemo } from 'react';
import './TestMode.css';

function TestMode({ cards, folderName, onBack }) {
  const [testCards, setTestCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // Generate 4 options for the current question
  const options = useMemo(() => {
    if (!testStarted || testCards.length === 0 || currentIndex >= testCards.length) return [];
    const current = testCards[currentIndex];
    const correctAnswer = current.front;

    // Get 3 wrong answers from other cards
    const otherFronts = cards
      .filter(c => c.id !== current.id)
      .map(c => c.front);

    // Shuffle and take 3
    const shuffled = otherFronts.sort(() => Math.random() - 0.5);
    const wrongAnswers = shuffled.slice(0, 3);

    // Combine and shuffle all 4 options
    const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    return allOptions;
  }, [testStarted, testCards, currentIndex, cards]);

  const startTest = () => {
    if (cards.length < 4) {
      alert('You need at least 4 cards to start a test.');
      return;
    }
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setTestCards(shuffled);
    setTestStarted(true);
    setTestFinished(false);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
  };

  const handleSelectOption = (option) => {
    if (showResult) return;
    const currentCard = testCards[currentIndex];
    const correct = option === currentCard.front;
    setSelectedOption(option);
    setShowResult(true);
    if (correct) setScore(s => s + 1);

    // Auto-advance after a delay
    setTimeout(() => {
      if (currentIndex < testCards.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setShowResult(false);
      } else {
        setTestFinished(true);
        setTestStarted(false);
      }
    }, 1200);
  };

  // Test finished — show score
  if (testFinished) {
    const percentage = Math.round((score / testCards.length) * 100);
    return (
      <div className="test-mode-container">
        <div className="test-finished">
          <h2>Test Complete!</h2>
          <div className="score-circle">
            <span className="score-number">{percentage}%</span>
          </div>
          <p className="score-detail">{score} out of {testCards.length} correct</p>
          <div className="test-finished-actions">
            <button onClick={startTest} className="start-test-btn">Try Again</button>
            <button onClick={onBack} className="back-to-folder-btn">Back to Folder</button>
          </div>
        </div>
      </div>
    );
  }

  // Not started
  if (!testStarted) {
    return (
      <div className="test-mode-container">
        <div className="test-start">
          <button className="test-back-btn" onClick={onBack}>← Back to Folder</button>
          <h2>Multiple Choice Test</h2>
          <p className="test-folder-label">{folderName}</p>
          <p>Test yourself on {cards.length} card{cards.length !== 1 ? 's' : ''}</p>
          <p className="test-description">You'll see a definition and pick the correct term from 4 options.</p>
          <button onClick={startTest} className="start-test-btn" disabled={cards.length < 4}>
            {cards.length < 4 ? 'Need at least 4 cards' : 'Start Test'}
          </button>
        </div>
      </div>
    );
  }

  const currentCard = testCards[currentIndex];
  const progress = ((currentIndex + 1) / testCards.length) * 100;

  return (
    <div className="test-mode-container">
      <div className="test-header">
        <div className="test-header-top">
          <h2>Test — {folderName}</h2>
          <span className="test-score-live">Score: {score}/{currentIndex + (showResult ? 1 : 0)}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="progress-text">
          Question {currentIndex + 1} of {testCards.length}
        </p>
      </div>

      <div className="test-question">
        <h3>Definition:</h3>
        <div className="question-text">{currentCard.back}</div>
      </div>

      <div className="options-grid">
        {options.map((option, i) => {
          let className = 'option-btn';
          if (showResult) {
            if (option === currentCard.front) {
              className += ' correct';
            } else if (option === selectedOption) {
              className += ' incorrect';
            } else {
              className += ' dimmed';
            }
          }
          return (
            <button
              key={i}
              className={className}
              onClick={() => handleSelectOption(option)}
              disabled={showResult}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TestMode;
