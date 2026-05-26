import React, { useEffect, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';
import ScenarioRunner from './ScenarioRunner';

export default function DailyChallenge({ onBack, onAttempt }) {
  const [data, setData] = useState(null);

  useEffect(() => { rdfApi.daily().then(setData).catch(() => setData(null)); }, []);

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Daily Challenge {data?.date && <span style={{ fontSize: 14, color: 'var(--rdf-muted)' }}>· {data.date}</span>}</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>
      {!data ? <div className="rdf-card">Loading…</div>
        : <ScenarioRunner scenario={data.scenario} onAttempt={onAttempt} onNext={onBack} label="Today's scenario" />}
    </div>
  );
}
