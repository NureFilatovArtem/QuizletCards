import React, { useEffect, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';
import ScenarioRunner from './ScenarioRunner';

export default function InteractiveDialogues({ onBack, onAttempt }) {
  const [scenarios, setScenarios] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    rdfApi.scenarios().then((rows) => setScenarios(shuffle(rows))).catch(() => setScenarios([]));
  }, []);

  const next = () => setIdx((i) => (i + 1) % Math.max(1, scenarios.length));

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Interactive Dialogues</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>
      {scenarios.length === 0
        ? <div className="rdf-card">Loading…</div>
        : <ScenarioRunner scenario={scenarios[idx]} onNext={next} onAttempt={onAttempt} label={`Scenario ${idx + 1} / ${scenarios.length}`} />}
    </div>
  );
}

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
