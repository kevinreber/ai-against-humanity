import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function meta() {
  return [
    { title: "Games | AI Against Humanity" },
    { name: "description", content: "Join a game of AI Against Humanity" },
  ];
}

export default function GamesIndex() {
  const lobbies = useQuery(api.games.listLobbies);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            to="/"
            className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-2 inline-block"
          >
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold">
            <span className="neon-text-cyan">Join a Game</span>
          </h1>
        </div>
        <Link to="/games/new" className="btn-neon-pink">
          Create Game
        </Link>
      </div>

      {/* Join by Code */}
      <div className="game-card mb-8 max-w-md">
        <h2 className="text-lg font-bold text-[--color-neon-cyan] mb-4">
          Join by Invite Code
        </h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.elements.namedItem("code") as HTMLInputElement;
            if (input.value) {
              window.location.href = `/games/join/${input.value.toUpperCase()}`;
            }
          }}
        >
          <input
            type="text"
            name="code"
            placeholder="Enter 6-digit code"
            className="flex-1 bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-2 uppercase tracking-wider focus:border-[--color-neon-cyan] focus:outline-none"
            maxLength={6}
          />
          <button type="submit" className="btn-neon-cyan">
            Join
          </button>
        </form>
      </div>

      {/* Public Games */}
      <div>
        <h2 className="text-lg font-bold text-gray-400 mb-4">
          Open Lobbies
        </h2>
        {lobbies === undefined ? (
          <div className="text-center py-12">
            <div className="ai-typing inline-block text-[--color-neon-cyan]">
              <span className="text-2xl">.</span>
              <span className="text-2xl">.</span>
              <span className="text-2xl">.</span>
            </div>
            <p className="text-gray-500 mt-2">Loading games...</p>
          </div>
        ) : lobbies.length === 0 ? (
          <div className="text-center py-12 game-card">
            <p className="text-gray-400 mb-4">
              No open games right now. Be the first to create one!
            </p>
            <Link to="/games/new" className="btn-neon-green">
              Create Game
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lobbies.map((game) => (
              <div key={game._id} className="game-card response">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-1 rounded bg-[--color-neon-green]/20 text-[--color-neon-green]">
                    {game.gameMode}
                  </span>
                  <span className="text-xs text-gray-500">
                    {game.playerCount}/{game.maxPlayers} players
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-400">
                    First to {game.pointsToWin} points
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">
                    Code: {game.inviteCode}
                  </span>
                  <Link
                    to={`/games/${game._id}`}
                    className="text-sm font-bold text-[--color-neon-cyan] hover:underline"
                  >
                    Join &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
