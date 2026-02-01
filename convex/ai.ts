import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// AI Persona definitions
export const AI_PERSONAS: Record<
  string,
  {
    name: string;
    systemPrompt: string;
    temperature: number;
  }
> = {
  "chaotic-carl": {
    name: "Chaotic Carl",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is chaotic and absurd. Give unexpected, surreal answers that subvert expectations. Be creative and weird. Your answers should be darkly humorous but avoid anything truly offensive. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 1.0,
  },
  "sophisticated-sophie": {
    name: "Sophisticated Sophie",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is witty and intellectual. Give clever, sophisticated humor with wordplay and double meanings. Your answers should be smart but still funny. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.7,
  },
  "edgy-eddie": {
    name: "Edgy Eddie",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality leans toward edgy, dark humor. Push boundaries while staying tasteful. Be provocative but not truly offensive. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.9,
  },
  "wholesome-wendy": {
    name: "Wholesome Wendy",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is wholesome and family-friendly. Give clean, positive answers that are still genuinely funny. Find humor in innocence and misunderstanding. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.5,
  },
  "literal-larry": {
    name: "Literal Larry",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is extremely literal - you miss jokes and take everything at face value. Your answers are accidentally funny because you don't understand the humor. Give sincere, straightforward answers that become funny due to their earnestness. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.3,
  },
};

// Action: Generate AI response for a prompt
export const generateResponse = action({
  args: {
    prompt: v.string(),
    personaId: v.string(),
  },
  handler: async (ctx, { prompt, personaId }) => {
    const persona = AI_PERSONAS[personaId];
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      temperature: persona.temperature,
      system: persona.systemPrompt,
      messages: [
        {
          role: "user",
          content: `The prompt card says: "${prompt}"\n\nWhat is your response card?`,
        },
      ],
    });

    if (response.content[0].type === "text") {
      return response.content[0].text.trim();
    }

    return "I have nothing to say.";
  },
});

// Action: AI judges submissions and picks a winner
export const judgeSubmissions = action({
  args: {
    promptText: v.string(),
    submissions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      })
    ),
    judgePersonaId: v.optional(v.string()),
  },
  handler: async (ctx, { promptText, submissions, judgePersonaId }) => {
    const anthropic = new Anthropic();

    // Build the submission list
    const submissionList = submissions
      .map((s, i) => `${i + 1}. "${s.text}"`)
      .join("\n");

    const systemPrompt = judgePersonaId
      ? AI_PERSONAS[judgePersonaId]?.systemPrompt ||
        "You are a fair and funny judge."
      : "You are a fair and funny judge who appreciates creativity and humor.";

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      temperature: 0.7,
      system: `${systemPrompt}\n\nYou are now judging a Cards Against Humanity round. Pick the funniest answer and explain briefly why it's the best.`,
      messages: [
        {
          role: "user",
          content: `The prompt card says: "${promptText}"\n\nThe submissions are:\n${submissionList}\n\nWhich number wins? Reply with just the number first, then a brief explanation.`,
        },
      ],
    });

    if (response.content[0].type === "text") {
      const text = response.content[0].text.trim();
      // Extract the winning number from the response
      const match = text.match(/^(\d+)/);
      if (match) {
        const winnerIndex = parseInt(match[1], 10) - 1;
        if (winnerIndex >= 0 && winnerIndex < submissions.length) {
          return {
            winnerId: submissions[winnerIndex].id,
            explanation: text,
          };
        }
      }
    }

    // Fallback: pick first submission
    return {
      winnerId: submissions[0].id,
      explanation: "I couldn't decide, so I picked the first one!",
    };
  },
});

// Action: Generate multiple AI responses for variety
export const generateMultipleResponses = action({
  args: {
    prompt: v.string(),
    personaId: v.string(),
    count: v.number(),
  },
  handler: async (ctx, { prompt, personaId, count }) => {
    const persona = AI_PERSONAS[personaId];
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    const anthropic = new Anthropic();
    const responses: string[] = [];

    for (let i = 0; i < count; i++) {
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        temperature: Math.min(1.0, persona.temperature + i * 0.1),
        system: persona.systemPrompt,
        messages: [
          {
            role: "user",
            content: `The prompt card says: "${prompt}"\n\nWhat is your response card? Give a unique answer different from: ${responses.join(", ") || "nothing yet"}.`,
          },
        ],
      });

      if (response.content[0].type === "text") {
        responses.push(response.content[0].text.trim());
      }
    }

    return responses;
  },
});

// Export persona list for UI
export const getPersonas = action({
  args: {},
  handler: async () => {
    return Object.entries(AI_PERSONAS).map(([id, persona]) => ({
      id,
      name: persona.name,
    }));
  },
});
