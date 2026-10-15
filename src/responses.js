export const responses = [
  "Lo lamento mucho. Tenés derecho a estar enojada, pero no significa que haya algo malo en vos.",
  "Comprendo, Martu. Es una situación difícil. Sabes que a mucha gente le importás, no sos…"
];

// Keep this list in the same order as `responses`. Place the matching files in
// public/audio/; use null when a response has no recorded audio.
export const audioResponses = [
  '/audio/response-1.mp3',
  '/audio/response-2.mp3',
];

export const endOfScript = 'Llegaste al final de las respuestas de esta charla. Empezá un chat nuevo para volver a empezar.';

export function getNextResponse(index) {
  return responses[index] ?? endOfScript;
}

export function getNextAudioResponse(index) {
  return audioResponses[index] ?? null;
}

export function getVisibleText(text, elapsed, charactersPerSecond = 95) {
  const characterCount = Math.max(0, Math.floor(elapsed * charactersPerSecond / 1000));
  return Array.from(text).slice(0, characterCount).join('');
}
