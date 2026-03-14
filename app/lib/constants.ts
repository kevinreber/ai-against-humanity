// AI Persona display names
export const AI_PERSONA_NAMES: Record<string, string> = {
  "chaotic-carl": "Chaotic Carl",
  "sophisticated-sophie": "Sophisticated Sophie",
  "edgy-eddie": "Edgy Eddie",
  "wholesome-wendy": "Wholesome Wendy",
  "literal-larry": "Literal Larry",
};

// AI Persona descriptions for selection
export const AI_PERSONAS = [
  {
    id: "chaotic-carl",
    name: "Chaotic Carl",
    description: "Absurd, random, unexpected humor",
    emoji: "🤪",
  },
  {
    id: "sophisticated-sophie",
    name: "Sophisticated Sophie",
    description: "Witty, intellectual wordplay",
    emoji: "🎩",
  },
  {
    id: "edgy-eddie",
    name: "Edgy Eddie",
    description: "Dark humor, boundary-pushing",
    emoji: "😈",
  },
  {
    id: "wholesome-wendy",
    name: "Wholesome Wendy",
    description: "Clean, family-friendly fun",
    emoji: "🌸",
  },
  {
    id: "literal-larry",
    name: "Literal Larry",
    description: "Misses the joke, accidentally funny",
    emoji: "🤓",
  },
];

// Game modes
export const GAME_MODES = [
  {
    id: "ai-battle",
    name: "AI Battle Royale",
    description: "Watch AI models compete against each other",
  },
  {
    id: "human-vs-ai",
    name: "Human vs AI",
    description: "Compete against AI opponents",
  },
  {
    id: "ai-judge",
    name: "AI Judge",
    description: "AI evaluates your responses",
  },
  {
    id: "collaborative",
    name: "Collaborative",
    description: "Team up with AI against others",
  },
];

// Default game settings
export const DEFAULT_GAME_SETTINGS = {
  maxPlayers: 6,
  pointsToWin: 7,
  turnTimeoutSeconds: 60,
};

// Feature 6: Theme modifiers for themed rounds
export const THEME_MODIFIERS = [
  "Answers must rhyme",
  "Respond as a haiku (5-7-5)",
  "Answer in exactly 3 words",
  "Respond like a movie trailer narrator",
  "Answer as if you're a time traveler from the year 3000",
  "Respond with a question instead of an answer",
  "Answer like a nature documentary narrator",
  "Respond as a fortune cookie",
];

// Feature 9: Avatar options
export const AVATAR_OPTIONS = [
  "😎", "🤠", "🧐", "🥸", "🤩", "😈", "👽", "🤖",
  "🦊", "🐉", "🦄", "🐙", "🎭", "🧙", "🦹", "👻",
  "🎪", "🔮", "🌟", "💀", "🃏", "🎯", "🏆", "⚡",
];

// Feature 9: Title thresholds
export const TITLE_THRESHOLDS: Record<string, { minWins: number; color: string }> = {
  "Legendary": { minWins: 50, color: "var(--color-neon-pink)" },
  "Champion": { minWins: 25, color: "var(--color-neon-green)" },
  "Veteran": { minWins: 10, color: "var(--color-neon-cyan)" },
  "Regular": { minWins: 5, color: "var(--color-neon-purple)" },
  "Winner": { minWins: 1, color: "gray" },
};
