import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function meta() {
  return [
    { title: "Join Game | AI Against Humanity" },
    { name: "description", content: "Join a game with an invite code" },
  ];
}

export default function JoinGame() {
  const navigate = useNavigate();
  const createGuestUser = useMutation(api.users.createGuestUser);
  const joinGame = useMutation(api.games.joinGame);

  const [inviteCode, setInviteCode] = useState("");
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Look up game by invite code
  const game = useQuery(
    api.games.getGameByInviteCode,
    inviteCode.length === 6 ? { inviteCode: inviteCode.toUpperCase() } : "skip"
  );

  const handleJoin = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!game) {
      setError("Invalid invite code");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Create a guest user or use existing
      let userId = localStorage.getItem("userId");
      if (!userId) {
        userId = await createGuestUser({ username: username.trim() });
        localStorage.setItem("userId", userId);
        localStorage.setItem("username", username.trim());
      }

      // Join the game
      await joinGame({
        gameId: game._id,
        userId: userId as any,
      });

      // Navigate to the game
      navigate(`/games/${game._id}`);
    } catch (err: any) {
      console.error("Failed to join game:", err);
      setError(err.message || "Failed to join game. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Home
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">Join Game</h1>
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

          {/* Invite Code */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <label className="block text-lg font-bold text-white mb-3">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              className="
                w-full bg-gray-900 border border-gray-600 rounded-lg
                px-4 py-3 text-white placeholder-gray-500
                text-center text-2xl font-mono tracking-widest
                focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500
              "
              maxLength={6}
            />

            {/* Game Preview */}
            {inviteCode.length === 6 && (
              <div className="mt-4">
                {game === undefined ? (
                  <div className="text-center text-gray-400">
                    Looking up game...
                  </div>
                ) : game === null ? (
                  <div className="text-center text-red-400">
                    Game not found
                  </div>
                ) : game.status !== "lobby" ? (
                  <div className="text-center text-yellow-400">
                    Game already started
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                    <div className="text-green-400 font-medium">
                      Game found!
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Mode: {game.gameMode} • {game.maxPlayers} max players
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={isJoining || !game || game.status !== "lobby"}
            className="
              w-full bg-gradient-to-r from-cyan-500 to-purple-500
              hover:from-cyan-400 hover:to-purple-400
              text-white font-bold py-4 px-8 rounded-xl
              shadow-lg hover:shadow-cyan-500/25
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isJoining ? "Joining..." : "Join Game"}
          </button>

          {/* Browse Games */}
          <div className="text-center">
            <Link
              to="/games"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              Or browse available games
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
