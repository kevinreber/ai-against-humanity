import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function meta() {
  return [
    { title: "Games | AI Against Humanity" },
    { name: "description", content: "Browse available games" },
  ];
}

export default function GamesIndex() {
  const games = useQuery(api.games.listLobbyGames);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              &larr; Home
            </Link>
            <h1 className="text-3xl font-bold text-white mt-2">Available Games</h1>
          </div>
          <Link
            to="/games/new"
            className="
              bg-gradient-to-r from-cyan-500 to-purple-500
              hover:from-cyan-400 hover:to-purple-400
              text-white font-bold py-2 px-6 rounded-xl
              shadow-lg hover:shadow-cyan-500/25
              transition-all duration-200
            "
          >
            Create Game
          </Link>
        </header>

        {/* Games List */}
        {games === undefined ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-4xl mb-4">🎮</div>
            <h2 className="text-xl font-bold text-white mb-2">No games available</h2>
            <p className="text-gray-400 mb-6">Be the first to create a game!</p>
            <Link
              to="/games/new"
              className="
                bg-gradient-to-r from-cyan-500 to-purple-500
                text-white font-bold py-2 px-6 rounded-xl
                inline-block
              "
            >
              Create Game
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {games.map((game) => (
              <Link
                key={game._id}
                to={`/games/${game._id}`}
                className="
                  bg-gray-800/50 rounded-xl p-4 border border-gray-700
                  hover:border-cyan-500 transition-all duration-200
                  backdrop-blur-sm
                "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {game.host?.username ?? "Unknown"}'s Game
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {game.gameMode}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {game.players.length} / {game.maxPlayers} players •{" "}
                      {game.pointsToWin} points to win
                    </div>
                  </div>
                  <div className="text-cyan-400 font-mono text-lg">
                    {game.inviteCode}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Join by Code */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-2">Have an invite code?</p>
          <Link
            to="/games/join"
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Join a game with code
          </Link>
        </div>
      </div>
    </div>
  );
}
