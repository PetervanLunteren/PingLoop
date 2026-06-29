// Break ideas for background pings. Keep this in sync with the copy in
// src/suggestions.ts, which the app uses for foreground pings.

export const BREAK_SUGGESTIONS = [
  "Do 10 push-ups",
  "Do 10 squats",
  "Get a glass of water",
  "Make a cup of tea or coffee",
  "Water the plants",
  "Step outside for fresh air",
  "Meditate",
  "Tidy a room in the house",
  "Tidy your office",
  "Do one item from your todo list",
  "Walk around the house",
];

export function pickSuggestion(): string {
  const i = Math.floor(Math.random() * BREAK_SUGGESTIONS.length);
  return BREAK_SUGGESTIONS[i] ?? "Take a short break";
}
