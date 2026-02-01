interface Player {
  _id: string;
  isAi: boolean;
  aiPersonaId?: string;
  score: number;
  isJudge: boolean;
  user?: {
    username: string;
    avatarUrl?: string;
  } | null;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  showScores?: boolean;
}

const AI_PERSONA_NAMES: Record<string, string> = {
  "chaotic-carl": "Chaotic Carl",
  "sophisticated-sophie": "Sophisticated Sophie",
  "edgy-eddie": "Edgy Eddie",
  "wholesome-wendy": "Wholesome Wendy",
  "literal-larry": "Literal Larry",
};

const AI_PERSONA_EMOJIS: Record<string, string> = {
  "chaotic-carl": "🤪",
  "sophisticated-sophie": "🎩",
  "edgy-eddie": "😈",
  "wholesome-wendy": "🌸",
  "literal-larry": "🤓",
};

export function PlayerList({
  players,
  currentPlayerId,
  showScores = true,
}: PlayerListProps) {
  // Sort by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>Players</span>
        <span className="text-sm text-gray-400">({players.length})</span>
      </h3>
      <ul className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player._id === currentPlayerId;
          const playerName = player.isAi
            ? AI_PERSONA_NAMES[player.aiPersonaId ?? ""] ?? "AI Player"
            : player.user?.username ?? "Anonymous";
          const emoji = player.isAi
            ? AI_PERSONA_EMOJIS[player.aiPersonaId ?? ""] ?? "🤖"
            : null;

          return (
            <li
              key={player._id}
              className={`
                flex items-center justify-between p-2 rounded-lg
                transition-colors duration-200
                ${isCurrentPlayer ? "bg-cyan-500/20 border border-cyan-500" : "bg-gray-700/50"}
                ${player.isJudge ? "ring-2 ring-yellow-400" : ""}
              `}
            >
              <div className="flex items-center gap-2">
                {/* Rank */}
                {showScores && (
                  <span className="text-gray-400 font-mono text-sm w-5">
                    #{index + 1}
                  </span>
                )}

                {/* Avatar/Emoji */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${player.isAi ? "bg-purple-600" : "bg-cyan-600"}
                  `}
                >
                  {emoji ? (
                    <span>{emoji}</span>
                  ) : player.user?.avatarUrl ? (
                    <img
                      src={player.user.avatarUrl}
                      alt={playerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {playerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex flex-col">
                  <span
                    className={`
                      font-medium
                      ${isCurrentPlayer ? "text-cyan-400" : "text-white"}
                    `}
                  >
                    {playerName}
                    {isCurrentPlayer && (
                      <span className="text-xs text-gray-400 ml-1">(you)</span>
                    )}
                  </span>
                  {player.isJudge && (
                    <span className="text-xs text-yellow-400">Judge</span>
                  )}
                </div>
              </div>

              {/* Score */}
              {showScores && (
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-white">
                    {player.score}
                  </span>
                  <span className="text-xs text-gray-400">pts</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface PlayerAvatarProps {
  player: Player;
  size?: "sm" | "md" | "lg";
}

export function PlayerAvatar({ player, size = "md" }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  const playerName = player.isAi
    ? AI_PERSONA_NAMES[player.aiPersonaId ?? ""] ?? "AI"
    : player.user?.username ?? "?";

  const emoji = player.isAi
    ? AI_PERSONA_EMOJIS[player.aiPersonaId ?? ""] ?? "🤖"
    : null;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center font-bold
        ${player.isAi ? "bg-purple-600" : "bg-cyan-600"}
      `}
      title={playerName}
    >
      {emoji ? (
        <span>{emoji}</span>
      ) : player.user?.avatarUrl ? (
        <img
          src={player.user.avatarUrl}
          alt={playerName}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="text-white">
          {playerName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
