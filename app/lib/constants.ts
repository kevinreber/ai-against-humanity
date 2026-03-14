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

// AI Voice settings per persona — distinct pitch, rate, and preferred voice name
export const AI_VOICE_SETTINGS: Record<string, { pitch: number; rate: number; voiceName?: string; lang?: string }> = {
  "chaotic-carl": { pitch: 1.4, rate: 1.2, voiceName: "Google UK English Male" },
  "sophisticated-sophie": { pitch: 1.1, rate: 0.85, voiceName: "Google UK English Female" },
  "edgy-eddie": { pitch: 0.7, rate: 1.0, voiceName: "Google US English" },
  "wholesome-wendy": { pitch: 1.3, rate: 0.9, voiceName: "Google UK English Female" },
  "literal-larry": { pitch: 0.9, rate: 0.75, voiceName: "Google US English" },
};

// XP rewards for actions
export const XP_REWARDS = {
  PLAY_GAME: 10,
  WIN_GAME: 50,
  WIN_ROUND: 15,
  CAST_VOTE: 5,
  SAVE_HIGHLIGHT: 5,
  CREATE_PERSONA: 20,
  DAILY_CHALLENGE: 30,
  STREAK_BONUS: 10, // per streak level
};

// XP level thresholds
export const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: "Newbie" },
  { level: 2, xpRequired: 100, title: "Jokester" },
  { level: 3, xpRequired: 300, title: "Comedian" },
  { level: 4, xpRequired: 600, title: "Humorist" },
  { level: 5, xpRequired: 1000, title: "Comedy Pro" },
  { level: 6, xpRequired: 1500, title: "Wit Master" },
  { level: 7, xpRequired: 2500, title: "Laugh Lord" },
  { level: 8, xpRequired: 4000, title: "Humor King" },
  { level: 9, xpRequired: 6000, title: "Comedy Legend" },
  { level: 10, xpRequired: 10000, title: "Meme God" },
];

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: "first-win", name: "First Blood", description: "Win your first game", icon: "🏆", xpReward: 25 },
  { id: "win-5", name: "On a Roll", description: "Win 5 games", icon: "🔥", xpReward: 50 },
  { id: "win-25", name: "Unstoppable", description: "Win 25 games", icon: "⚡", xpReward: 100 },
  { id: "streak-3", name: "Hat Trick", description: "Win 3 rounds in a row", icon: "🎩", xpReward: 30 },
  { id: "streak-5", name: "Domination", description: "Win 5 rounds in a row", icon: "👑", xpReward: 75 },
  { id: "play-10", name: "Regular", description: "Play 10 games", icon: "🎮", xpReward: 25 },
  { id: "play-50", name: "Dedicated", description: "Play 50 games", icon: "💎", xpReward: 75 },
  { id: "beat-all-ai", name: "AI Slayer", description: "Beat all 5 AI personas", icon: "🤖", xpReward: 100 },
  { id: "persona-creator", name: "Persona Creator", description: "Create a custom persona", icon: "🎭", xpReward: 20 },
  { id: "popular-persona", name: "Trendsetter", description: "Have 10+ installs on a persona", icon: "📈", xpReward: 50 },
  { id: "highlight-saver", name: "Archivist", description: "Save 10 highlights", icon: "📸", xpReward: 25 },
  { id: "daily-3", name: "Committed", description: "Complete 3 daily challenges", icon: "📅", xpReward: 30 },
  { id: "daily-7", name: "Streak Master", description: "Complete 7 daily challenges in a row", icon: "🌟", xpReward: 75 },
  { id: "social-butterfly", name: "Social Butterfly", description: "Add 5 friends", icon: "🦋", xpReward: 25 },
  { id: "spectator", name: "Peanut Gallery", description: "Watch 5 games as spectator", icon: "👀", xpReward: 15 },
  { id: "hall-of-famer", name: "Hall of Famer", description: "Get a highlight into the Hall of Fame", icon: "🏛️", xpReward: 50 },
];

// Seasonal event definitions
export const SEASONAL_EVENTS = [
  { id: "spring-fools", name: "Spring Fools", description: "April chaos edition", themeColor: "#ff69b4", startMonth: 3, endMonth: 4 },
  { id: "summer-heat", name: "Summer Heat", description: "Hot takes only", themeColor: "#ff8c00", startMonth: 6, endMonth: 8 },
  { id: "spooky-season", name: "Spooky Season", description: "Horror humor", themeColor: "#8b00ff", startMonth: 10, endMonth: 10 },
  { id: "holiday-havoc", name: "Holiday Havoc", description: "Festive chaos", themeColor: "#ff0000", startMonth: 12, endMonth: 12 },
];

// Reward crate types
export const CRATE_TYPES = [
  { id: "bronze", name: "Bronze Crate", color: "#cd7f32", winsRequired: 1 },
  { id: "silver", name: "Silver Crate", color: "#c0c0c0", winsRequired: 3 },
  { id: "gold", name: "Gold Crate", color: "#ffd700", winsRequired: 5 },
  { id: "diamond", name: "Diamond Crate", color: "#b9f2ff", winsRequired: 10 },
];

// Card back styles (unlockable)
export const CARD_BACKS = [
  { id: "default", name: "Default", cssClass: "card-back-default", unlockedByDefault: true },
  { id: "neon", name: "Neon Glow", cssClass: "card-back-neon", crateType: "bronze" },
  { id: "galaxy", name: "Galaxy", cssClass: "card-back-galaxy", crateType: "silver" },
  { id: "fire", name: "Inferno", cssClass: "card-back-fire", crateType: "gold" },
  { id: "holographic", name: "Holographic", cssClass: "card-back-holo", crateType: "diamond" },
  { id: "glitch", name: "Glitch", cssClass: "card-back-glitch", crateType: "gold" },
  { id: "matrix", name: "Matrix", cssClass: "card-back-matrix", crateType: "silver" },
  { id: "rainbow", name: "Rainbow", cssClass: "card-back-rainbow", crateType: "diamond" },
];
