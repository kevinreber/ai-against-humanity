import { useState } from "react";
import { PlayerList } from "./PlayerList";

interface GameLobbyProps {
  game: {
    _id: string;
    inviteCode: string;
    gameMode: string;
    maxPlayers: number;
    pointsToWin: number;
  };
  players: Array<{
    _id: string;
    isAi: boolean;
    aiPersonaId?: string;
    score: number;
    isJudge: boolean;
    user?: { username: string; avatarUrl?: string } | null;
  }>;
  isHost: boolean;
  onAddAiPlayer: (personaId: string) => void;
  onStartGame: () => void;
  onLeaveGame: () => void;
}

const AI_PERSONAS = [
  { id: "chaotic-carl", name: "Chaotic Carl", emoji: "🤪", description: "Absurd and random" },
  { id: "sophisticated-sophie", name: "Sophisticated Sophie", emoji: "🎩", description: "Witty and intellectual" },
  { id: "edgy-eddie", name: "Edgy Eddie", emoji: "😈", description: "Dark humor" },
  { id: "wholesome-wendy", name: "Wholesome Wendy", emoji: "🌸", description: "Family-friendly fun" },
  { id: "literal-larry", name: "Literal Larry", emoji: "🤓", description: "Accidentally funny" },
];

export function GameLobby({
  game,
  players,
  isHost,
  onAddAiPlayer,
  onStartGame,
  onLeaveGame,
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false);

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(game.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = players.length >= 2;
  const canAddMore = players.length < game.maxPlayers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Game Lobby</h1>
          <p className="text-gray-400">Waiting for players to join...</p>
        </header>

        {/* Invite Code */}
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Invite Code</h2>
          <div className="flex items-center gap-4">
            <code className="bg-gray-900 px-6 py-3 rounded-lg text-2xl font-mono text-cyan-400 tracking-widest flex-1 text-center">
              {game.inviteCode}
            </code>
            <button
              onClick={copyInviteCode}
              className="
                bg-gray-700 hover:bg-gray-600 text-white
                px-4 py-3 rounded-lg transition-colors
              "
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Share this code with friends to let them join
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players */}
          <div>
            <PlayerList players={players} showScores={false} />
          </div>

          {/* Add AI Players */}
          {isHost && canAddMore && (
            <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-3">
                Add AI Players
              </h3>
              <div className="space-y-2">
                {AI_PERSONAS.map((persona) => {
                  const alreadyAdded = players.some(
                    (p) => p.aiPersonaId === persona.id
                  );
                  return (
                    <button
                      key={persona.id}
                      onClick={() => onAddAiPlayer(persona.id)}
                      disabled={alreadyAdded || !canAddMore}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg
                        transition-all duration-200
                        ${
                          alreadyAdded
                            ? "bg-gray-700/50 opacity-50 cursor-not-allowed"
                            : "bg-gray-700/50 hover:bg-purple-600/30 hover:border-purple-500"
                        }
                        border border-gray-600
                      `}
                    >
                      <span className="text-2xl">{persona.emoji}</span>
                      <div className="text-left">
                        <div className="font-medium text-white">
                          {persona.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {persona.description}
                        </div>
                      </div>
                      {alreadyAdded && (
                        <span className="ml-auto text-sm text-green-400">
                          Added
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Game Settings */}
        <div className="mt-6 bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Game Settings</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-sm">Mode</div>
              <div className="text-white font-medium capitalize">
                {game.gameMode}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Max Players</div>
              <div className="text-white font-medium">{game.maxPlayers}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Points to Win</div>
              <div className="text-white font-medium">{game.pointsToWin}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={onLeaveGame}
            className="
              bg-gray-700 hover:bg-gray-600 text-white
              font-bold py-3 px-6 rounded-xl
              transition-all duration-200
            "
          >
            Leave Game
          </button>
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`
                font-bold py-3 px-8 rounded-xl
                transition-all duration-200
                ${
                  canStart
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg hover:shadow-cyan-500/25"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {canStart
                ? "Start Game"
                : `Need ${2 - players.length} more player(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
