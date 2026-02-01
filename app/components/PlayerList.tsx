import { cn } from "../lib/utils";
import { AI_PERSONA_NAMES } from "../lib/constants";

interface Player {
  _id: string;
  userId?: string;
  aiPersonaId?: string;
  isAi: boolean;
  score: number;
  isJudge: boolean;
  username?: string;
}

interface PlayerListProps {
  players: Player[];
  currentUserId?: string;
  className?: string;
}

export function PlayerList({ players, currentUserId, className }: PlayerListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Players
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <PlayerItem
            key={player._id}
            player={player}
            isCurrentUser={player.userId === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

interface PlayerItemProps {
  player: Player;
  isCurrentUser: boolean;
}

function PlayerItem({ player, isCurrentUser }: PlayerItemProps) {
  const displayName = player.isAi
    ? AI_PERSONA_NAMES[player.aiPersonaId || ""] || "AI Player"
    : player.username || "Player";

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        "bg-[--color-dark-card] border border-gray-800",
        isCurrentUser && "border-[--color-neon-cyan]",
        player.isJudge && "border-[--color-neon-pink]"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            player.isAi
              ? "bg-[--color-neon-purple]/20 text-[--color-neon-purple]"
              : "bg-[--color-neon-cyan]/20 text-[--color-neon-cyan]"
          )}
        >
          {player.isAi ? "AI" : displayName[0]?.toUpperCase()}
        </div>

        {/* Name and badges */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayName}</span>
            {isCurrentUser && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[--color-neon-cyan]/20 text-[--color-neon-cyan]">
                You
              </span>
            )}
            {player.isJudge && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[--color-neon-pink]/20 text-[--color-neon-pink]">
                Judge
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <span className="text-2xl font-bold neon-text-green text-[--color-neon-green]">
          {player.score}
        </span>
        <span className="text-xs text-gray-500 ml-1">pts</span>
      </div>
    </div>
  );
}
