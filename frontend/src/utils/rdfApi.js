const API_URL = 'http://localhost:3001/api';

async function j(path, opts) {
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const rdfApi = {
  scenarios:      () => j('/rdf/scenarios'),
  hiddenMeaning:  () => j('/rdf/hidden-meaning'),
  fastPrompts:    () => j('/rdf/fast-prompts'),
  sentenceBuilder:() => j('/rdf/sentence-builder'),
  speechDecoder:  () => j('/rdf/speech-decoder'),
  vocabulary:     () => j('/rdf/vocabulary'),
  daily:          () => j('/rdf/daily'),
  progress:       (key = 'local') => j(`/rdf/progress/${key}`),
  attempt:        (body) => j('/rdf/attempt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
};
