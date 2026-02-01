import { mutation } from "./_generated/server";

// Sample prompt cards (black cards)
const PROMPT_CARDS = [
  "What's the next big thing in tech?",
  "I never thought I'd see _____ at a job interview.",
  "The secret ingredient in grandma's famous recipe is _____.",
  "What's keeping me up at night?",
  "_____ is the leading cause of existential dread.",
  "The AI uprising began with _____.",
  "What would you find in Elon Musk's browser history?",
  "My therapist says I need to stop obsessing over _____.",
  "_____ : The Musical",
  "What's the worst thing to say on a first date?",
  "The real reason dinosaurs went extinct: _____.",
  "I wish I could unsee _____.",
  "My autobiography will be titled: _____.",
  "What's in the mystery meat at the cafeteria?",
  "The government is hiding _____ from us.",
  "_____ is my coping mechanism.",
  "What's the meaning of life? _____.",
  "The robot's first words were _____.",
  "I got fired for _____ at the company party.",
  "What's under my bed?",
  "_____ is surprisingly effective as a weapon.",
  "The fortune cookie said: _____.",
  "What's the worst gift you could give to your boss?",
  "My dating profile says I'm into _____.",
  "The aliens came to Earth looking for _____.",
];

// Sample response cards (white cards)
const RESPONSE_CARDS = [
  "An uncomfortable amount of mayonnaise",
  "Sentient houseplants",
  "A motivational poster that makes you cry",
  "The concept of Mondays",
  "Aggressive tax evasion",
  "A strongly worded email",
  "The existential void",
  "Inappropriate jazz hands",
  "A questionable life choice",
  "The sound of dial-up internet",
  "Passive-aggressive sticky notes",
  "A midlife crisis in a shopping cart",
  "Weaponized dad jokes",
  "The last slice of pizza",
  "An overly complicated coffee order",
  "Suspiciously enthusiastic applause",
  "A PowerPoint presentation about feelings",
  "The audacity",
  "Unresolved childhood trauma",
  "A strongly worded Yelp review",
  "The haunted IKEA furniture",
  "Competitive napping",
  "An algorithm that judges your life choices",
  "The forbidden snacks",
  "A support group for people who reply-all",
  "Unsolicited life advice",
  "The wifi password to happiness",
  "A conspiracy involving squirrels",
  "Professional disappointment",
  "The fine print of existence",
  "An emotional support spreadsheet",
  "The CEO of procrastination",
  "A lukewarm take",
  "The last functioning brain cell",
  "Aggressive optimism",
  "A PhD in overthinking",
  "The spiritual successor to Crocs",
  "My browser history",
  "A midlife crisis emoji",
  "The sweet release of a nap",
  "Competitive overthinking",
  "The human embodiment of a participation trophy",
  "A chaotic neutral energy",
  "The physical manifestation of 'meh'",
  "An unreasonable amount of cheese",
  "The vibes",
  "Weaponized mediocrity",
  "A concerning lack of self-awareness",
  "The ghost of bad decisions past",
  "An unnecessarily dramatic entrance",
];

// Mutation: Seed the database with initial cards
export const seedCards = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if cards already exist
    const existingCards = await ctx.db.query("cards").first();
    if (existingCards) {
      return { message: "Database already seeded", created: 0 };
    }

    // Create the default card pack
    const packId = await ctx.db.insert("cardPacks", {
      name: "AI Against Humanity - Base Pack",
      description: "The original collection of prompts and responses for AI Against Humanity",
      isOfficial: true,
    });

    // Insert prompt cards
    for (const text of PROMPT_CARDS) {
      await ctx.db.insert("cards", {
        type: "prompt",
        text,
        packId,
        isAiGenerated: false,
      });
    }

    // Insert response cards
    for (const text of RESPONSE_CARDS) {
      await ctx.db.insert("cards", {
        type: "response",
        text,
        packId,
        isAiGenerated: false,
      });
    }

    return {
      message: "Database seeded successfully",
      created: PROMPT_CARDS.length + RESPONSE_CARDS.length,
    };
  },
});

// Mutation: Clear all cards (for development)
export const clearCards = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    const packs = await ctx.db.query("cardPacks").collect();

    for (const card of cards) {
      await ctx.db.delete(card._id);
    }
    for (const pack of packs) {
      await ctx.db.delete(pack._id);
    }

    return { deleted: cards.length + packs.length };
  },
});
