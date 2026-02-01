import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function meta() {
  return [
    { title: "Create Game | AI Against Humanity" },
    { name: "description", content: "Create a new game" },
  ];
}

const GAME_MODES = [
  {
    id: "human-vs-ai",
    name: "Human vs AI",
    description: "Play against AI opponents",
    emoji: "🤖",
  },
  {
    id: "ai-battle",
    name: "AI Battle Royale",
    description: "Watch AI models compete",
    emoji: "⚔️",
  },
  {
    id: "multiplayer",
    name: "Multiplayer",
    description: "Play with friends",
    emoji: "👥",
  },
];

export default function CreateGame() {
  const navigate = useNavigate();
  const createGuestUser = useMutation(api.users.createGuestUser);
  const createGame = useMutation(api.games.createGame);

  const [gameMode, setGameMode] = useState("human-vs-ai");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [pointsToWin, setPointsToWin] = useState(7);
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create a guest user
      const userId = await createGuestUser({ username: username.trim() });

      // Create the game
      const { gameId } = await createGame({
        hostId: userId,
        gameMode,
        maxPlayers,
        pointsToWin,
      });

      // Store user ID in localStorage for this session
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username.trim());

      // Navigate to the game
      navigate(`/games/${gameId}`);
    } catch (err) {
      console.error("Failed to create game:", err);
      setError("Failed to create game. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Home
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">Create Game</h1>
        </header>

        {/* Form */}
        <div className="space-y-6">
          {/* Username */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <label className="block text-lg font-bold text-white mb-3">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="
                w-full bg-gray-900 border border-gray-600 rounded-lg
                px-4 py-3 text-white placeholder-gray-500
                focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500
              "
              maxLength={20}
            />
          </div>

          {/* Game Mode */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <label className="block text-lg font-bold text-white mb-3">
              Game Mode
            </label>
            <div className="grid gap-3">
              {GAME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setGameMode(mode.id)}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border-2
                    transition-all duration-200 text-left
                    ${
                      gameMode === mode.id
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                    }
                  `}
                >
                  <span className="text-3xl">{mode.emoji}</span>
                  <div>
                    <div className="font-bold text-white">{mode.name}</div>
                    <div className="text-sm text-gray-400">
                      {mode.description}
                    </div>
                  </div>
                  {gameMode === mode.id && (
                    <span className="ml-auto text-cyan-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <label className="block text-lg font-bold text-white mb-3">
              Settings
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="
                    w-full bg-gray-900 border border-gray-600 rounded-lg
                    px-4 py-3 text-white
                    focus:outline-none focus:border-cyan-500
                  "
                >
                  {[3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} players
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Points to Win
                </label>
                <select
                  value={pointsToWin}
                  onChange={(e) => setPointsToWin(Number(e.target.value))}
                  className="
                    w-full bg-gray-900 border border-gray-600 rounded-lg
                    px-4 py-3 text-white
                    focus:outline-none focus:border-cyan-500
                  "
                >
                  {[3, 5, 7, 10, 15].map((n) => (
                    <option key={n} value={n}>
                      {n} points
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="
              w-full bg-gradient-to-r from-cyan-500 to-purple-500
              hover:from-cyan-400 hover:to-purple-400
              text-white font-bold py-4 px-8 rounded-xl
              shadow-lg hover:shadow-cyan-500/25
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isCreating ? "Creating..." : "Create Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
