export const responses = [
  "Lo lamento mucho. Tenés derecho a estar enojada, pero no significa que haya algo malo en vos.",
  "Comprendo, Martu. Es una situación difícil. Sabes que a mucha gente le importás, no sos…"
];

export const endOfScript = 'Llegaste al final de las respuestas de esta charla. Empezá un chat nuevo para volver a empezar.';

export function getNextResponse(index) {
  return responses[index] ?? endOfScript;
}

export function getVisibleText(text, elapsed, charactersPerSecond = 95) {
  const characterCount = Math.max(0, Math.floor(elapsed * charactersPerSecond / 1000));
  return Array.from(text).slice(0, characterCount).join('');
}
