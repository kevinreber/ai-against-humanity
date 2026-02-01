import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GAME_MODES, AI_PERSONAS, DEFAULT_GAME_SETTINGS } from "../lib/constants";
import { cn } from "../lib/utils";

export function meta() {
  return [
    { title: "Create Game | AI Against Humanity" },
    { name: "description", content: "Create a new game of AI Against Humanity" },
  ];
}

export default function NewGame() {
  const navigate = useNavigate();
  const createGame = useMutation(api.games.createGame);
  const addAiPlayer = useMutation(api.games.addAiPlayer);
  const createGuestUser = useMutation(api.users.createGuestUser);

  const [username, setUsername] = useState("");
  const [gameMode, setGameMode] = useState(GAME_MODES[1].id); // Default to Human vs AI
  const [pointsToWin, setPointsToWin] = useState(DEFAULT_GAME_SETTINGS.pointsToWin);
  const [selectedAi, setSelectedAi] = useState<string[]>(["chaotic-carl"]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleAiToggle = (personaId: string) => {
    setSelectedAi((prev) =>
      prev.includes(personaId)
        ? prev.filter((id) => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleCreateGame = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (selectedAi.length === 0) {
      setError("Please select at least one AI opponent");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      // Create guest user
      const userId = await createGuestUser({ username: username.trim() });

      // Create the game
      const { gameId } = await createGame({
        hostId: userId,
        gameMode,
        maxPlayers: selectedAi.length + 4, // AI players + room for humans
        pointsToWin,
      });

      // Add AI players
      for (const personaId of selectedAi) {
        await addAiPlayer({ gameId, aiPersonaId: personaId });
      }

      // Navigate to the game
      navigate(`/games/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/games"
          className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-2 inline-block"
        >
          &larr; Back to Games
        </Link>
        <h1 className="text-3xl font-bold">
          <span className="neon-text-pink">Create Game</span>
        </h1>
      </div>

      <div className="space-y-8">
        {/* Username */}
        <div className="game-card">
          <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-cyan] focus:outline-none"
            maxLength={20}
          />
        </div>

        {/* Game Mode */}
        <div className="game-card">
          <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setGameMode(mode.id)}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  gameMode === mode.id
                    ? "border-[--color-neon-cyan] bg-[--color-neon-cyan]/10"
                    : "border-gray-700 hover:border-gray-600"
                )}
              >
                <div className="font-bold text-sm">{mode.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Opponents */}
        <div className="game-card">
          <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            AI Opponents
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AI_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleAiToggle(persona.id)}
                className={cn(
                  "p-3 rounded-lg border-2 text-center transition-all",
                  selectedAi.includes(persona.id)
                    ? "border-[--color-neon-purple] bg-[--color-neon-purple]/10"
                    : "border-gray-700 hover:border-gray-600"
                )}
              >
                <div className="text-2xl mb-1">{persona.emoji}</div>
                <div className="font-bold text-xs">{persona.name}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {selectedAi.length} AI player(s)
          </p>
        </div>

        {/* Points to Win */}
        <div className="game-card">
          <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            Points to Win
          </label>
          <div className="flex gap-3">
            {[5, 7, 10, 15].map((points) => (
              <button
                key={points}
                type="button"
                onClick={() => setPointsToWin(points)}
                className={cn(
                  "w-14 h-14 rounded-lg border-2 font-bold text-lg transition-all",
                  pointsToWin === points
                    ? "border-[--color-neon-green] bg-[--color-neon-green]/10 text-[--color-neon-green]"
                    : "border-gray-700 hover:border-gray-600"
                )}
              >
                {points}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreateGame}
          disabled={isCreating}
          className={cn(
            "btn-neon-green w-full text-center",
            isCreating && "opacity-50 cursor-not-allowed"
          )}
        >
          {isCreating ? "Creating..." : "Create Game"}
        </button>
      </div>
    </div>
  );
}
