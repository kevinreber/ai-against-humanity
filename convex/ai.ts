import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { AI_PERSONAS, getPersonaById } from "./aiPersonas";
import { api, internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

// Action: Generate AI response for a prompt
export const generateResponse = action({
  args: {
    prompt: v.string(),
    personaId: v.string(),
  },
  handler: async (ctx, { prompt, personaId }) => {
    const persona = getPersonaById(personaId);
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      temperature: Math.min(persona.temperature, 1.0), // Anthropic max is 1.0
      system: persona.systemPrompt,
      messages: [
        {
          role: "user",
          content: `The prompt card says: "${prompt}"\n\nProvide your response card answer:`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text.trim() : "";
  },
});

// Action: Generate AI responses for all AI players in a round
export const generateAiSubmissions = action({
  args: {
    gameId: v.id("games"),
    roundId: v.id("rounds"),
    promptText: v.string(),
  },
  handler: async (ctx, { gameId, roundId, promptText }) => {
    // Get all AI players in the game
    const gameState = await ctx.runQuery(api.games.getGame, { gameId });
    if (!gameState) throw new Error("Game not found");

    const aiPlayers = gameState.players.filter(
      (p) => p.isAi && !p.isJudge && p.aiPersonaId
    );

    // Generate responses for each AI player
    for (const player of aiPlayers) {
      if (!player.aiPersonaId) continue;

      try {
        const response = await ctx.runAction(api.ai.generateResponse, {
          prompt: promptText,
          personaId: player.aiPersonaId,
        });

        // Submit the AI's response
        await ctx.runMutation(api.games.submitCard, {
          roundId,
          playerId: player._id,
          aiGeneratedText: response,
        });
      } catch (error) {
        console.error(`Failed to generate response for ${player.aiPersonaId}:`, error);
      }
    }
  },
});

// Action: AI judges submissions
export const judgeSubmissions = action({
  args: {
    promptText: v.string(),
    submissions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      })
    ),
  },
  handler: async (ctx, { promptText, submissions }) => {
    const anthropic = new Anthropic();

    const submissionsList = submissions
      .map((s, i) => `${i + 1}. "${s.text}"`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      temperature: 0.5,
      system: `You are a judge in a Cards Against Humanity style game. Your job is to pick the funniest, most creative, or most fitting response to the prompt. Be fair but have a sense of humor. Consider:
- Humor and wit
- Relevance to the prompt
- Creativity and unexpectedness
- Comedic timing

Respond with ONLY the number of your winning choice (e.g., "1" or "2"), nothing else.`,
      messages: [
        {
          role: "user",
          content: `The prompt card says: "${promptText}"

The responses are:
${submissionsList}

Which response wins? Reply with just the number.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const winnerNumber = textBlock ? parseInt(textBlock.text.trim(), 10) : 1;

    // Return the winning submission ID
    const winnerIndex = Math.min(
      Math.max(winnerNumber - 1, 0),
      submissions.length - 1
    );
    return {
      winnerId: submissions[winnerIndex].id,
      winnerIndex,
    };
  },
});

// Action: Generate a new prompt card using AI
export const generatePromptCard = action({
  args: {
    theme: v.optional(v.string()),
  },
  handler: async (ctx, { theme }) => {
    const anthropic = new Anthropic();

    const themePrompt = theme
      ? `The card should be themed around: ${theme}`
      : "Make it general and widely applicable.";

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      temperature: 0.9,
      system: `You are creating prompt cards for a Cards Against Humanity style game. Create fill-in-the-blank or question prompts that lead to funny responses. Use "____" for blanks. Keep it clever and provocative but not offensive.`,
      messages: [
        {
          role: "user",
          content: `Create a single prompt card. ${themePrompt}\n\nRespond with ONLY the prompt card text, nothing else.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text.trim() : "";
  },
});
