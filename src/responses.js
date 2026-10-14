export const responses = [
  "Hey, good to see you. Every interesting idea starts with a little curiosity. Tell me what's on your mind, and we can take it from there.",
  "Let's make a little room to think. Start with the simplest version of your idea: what would it look like if it only had to do one thing really well?\n\nYou don't need all the answers yet. A small, clear starting point is enough.",
  "Here's a way to move forward:\n\n1. Write down what you want to achieve in one sentence.\n2. Pick the smallest step you can take today.\n3. Try it, notice what happens, and adjust.\n\nProgress usually comes from a few small experiments, not one perfect plan.",
  "That sounds like a good place to start. Keep what works, let go of what doesn't, and give yourself permission to change your mind along the way.\n\nWhat would you like to explore next?",
];

export const endOfScript = "You've reached the end of this conversation's scripted replies. Start a new chat to begin again.";

export function getNextResponse(index) {
  return responses[index] ?? endOfScript;
}

export function getVisibleText(text, elapsed, charactersPerSecond = 95) {
  const characterCount = Math.max(0, Math.floor(elapsed * charactersPerSecond / 1000));
  return Array.from(text).slice(0, characterCount).join('');
}