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
