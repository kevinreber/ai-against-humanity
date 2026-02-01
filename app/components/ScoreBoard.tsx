import { cn } from "../lib/utils";
import { AI_PERSONA_NAMES } from "../lib/constants";

interface Player {
  _id: string;
  userId?: string;
  aiPersonaId?: string;
  isAi: boolean;
  score: number;
  username?: string;
}

interface ScoreBoardProps {
  players: Player[];
  pointsToWin: number;
  className?: string;
}

export function ScoreBoard({ players, pointsToWin, className }: ScoreBoardProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={cn("bg-[--color-dark-card] rounded-xl p-4", className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
        Scoreboard
      </h3>
      <div className="text-xs text-gray-500 mb-4">
        First to {pointsToWin} points wins!
      </div>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const displayName = player.isAi
            ? AI_PERSONA_NAMES[player.aiPersonaId || ""] || "AI Player"
            : player.username || "Player";
          const progress = (player.score / pointsToWin) * 100;

          return (
            <div key={player._id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-lg font-bold",
                      index === 0 && player.score > 0 && "text-[--color-neon-green]"
                    )}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      player.isAi && "text-[--color-neon-purple]"
                    )}
                  >
                    {displayName}
                  </span>
                </div>
                <span className="text-xl font-bold">{player.score}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    index === 0
                      ? "bg-[--color-neon-green]"
                      : player.isAi
                        ? "bg-[--color-neon-purple]"
                        : "bg-[--color-neon-cyan]"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GameResultsProps {
  players: Player[];
  winnerId?: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function GameResults({
  players,
  winnerId,
  onPlayAgain,
  onBackToLobby,
}: GameResultsProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = players.find((p) => p._id === winnerId) || sortedPlayers[0];

  const winnerName = winner?.isAi
    ? AI_PERSONA_NAMES[winner.aiPersonaId || ""] || "AI Player"
    : winner?.username || "Player";

  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold mb-4">
        <span className="neon-text-green">Game Over!</span>
      </h1>

      <div className="mb-8">
        <p className="text-gray-400 mb-2">Winner</p>
        <p className="text-3xl font-bold neon-text-pink">{winnerName}</p>
        <p className="text-5xl font-bold text-[--color-neon-green] mt-2">
          {winner?.score} points
        </p>
      </div>

      {/* Final Standings */}
      <div className="max-w-md mx-auto mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
          Final Standings
        </h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const displayName = player.isAi
              ? AI_PERSONA_NAMES[player.aiPersonaId || ""] || "AI Player"
              : player.username || "Player";

            return (
              <div
                key={player._id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  "bg-[--color-dark-card]",
                  index === 0 && "border border-[--color-neon-green]"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xl font-bold w-8",
                      index === 0 && "text-[--color-neon-green]",
                      index === 1 && "text-gray-400",
                      index === 2 && "text-amber-600"
                    )}
                  >
                    {index === 0 ? "🏆" : `#${index + 1}`}
                  </span>
                  <span
                    className={cn(
                      player.isAi && "text-[--color-neon-purple]"
                    )}
                  >
                    {displayName}
                  </span>
                </div>
                <span className="font-bold">{player.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button className="btn-neon-green" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn-neon-cyan" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
