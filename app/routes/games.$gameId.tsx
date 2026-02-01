import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { GameLobby } from "../components/GameLobby";
import { GameBoard } from "../components/GameBoard";
import { useEffect, useState } from "react";

export function meta() {
  return [
    { title: "Game | AI Against Humanity" },
    { name: "description", content: "Play AI Against Humanity" },
  ];
}

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get game state
  const gameState = useQuery(
    api.games.getGame,
    gameId ? { gameId: gameId as Id<"games"> } : "skip"
  );

  // Mutations
  const addAiPlayer = useMutation(api.games.addAiPlayer);
  const startGame = useMutation(api.games.startGame);
  const submitCard = useMutation(api.games.submitCard);
  const selectWinner = useMutation(api.games.selectWinner);
  const startNextRound = useMutation(api.games.startNextRound);

  // Actions
  const generateAiSubmissions = useAction(api.ai.generateAiSubmissions);

  // Get current player from game state
  useEffect(() => {
    if (gameState?.players) {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        const player = gameState.players.find(
          (p) => p.userId === storedUserId
        );
        if (player) {
          setCurrentPlayerId(player._id);
        }
      }
    }
  }, [gameState?.players]);

  // Auto-generate AI submissions when round starts
  useEffect(() => {
    if (
      gameState?.currentRound?.status === "submitting" &&
      gameState?.promptCard &&
      gameState?.game.status === "playing"
    ) {
      const aiPlayers = gameState.players.filter((p) => p.isAi && !p.isJudge);
      const hasAiSubmissions = gameState.submissions.some((s) =>
        aiPlayers.some((ap) => ap._id === s.playerId)
      );

      if (aiPlayers.length > 0 && !hasAiSubmissions) {
        generateAiSubmissions({
          gameId: gameId as Id<"games">,
          roundId: gameState.currentRound._id,
          promptText: gameState.promptCard.text,
        }).catch(console.error);
      }
    }
  }, [
    gameState?.currentRound?._id,
    gameState?.currentRound?.status,
    gameState?.promptCard,
  ]);

  // Loading state
  if (gameState === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🎮</div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Game not found
  if (gameState === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Game Not Found</h1>
          <p className="text-gray-400 mb-6">
            This game doesn't exist or has been deleted.
          </p>
          <Link
            to="/"
            className="
              bg-gradient-to-r from-cyan-500 to-purple-500
              text-white font-bold py-2 px-6 rounded-xl
              inline-block
            "
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p) => p._id === currentPlayerId);
  const isHost = currentPlayer?.userId === gameState.game.hostId;

  // Get player's hand cards
  const playerHand = currentPlayer?.hand
    ? currentPlayer.hand.map((cardId) => ({
        _id: cardId,
        text: "Loading...", // We'll need to fetch card text separately
      }))
    : [];

  // Handlers
  const handleAddAiPlayer = async (personaId: string) => {
    try {
      await addAiPlayer({
        gameId: gameId as Id<"games">,
        aiPersonaId: personaId,
      });
    } catch (err) {
      console.error("Failed to add AI player:", err);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame({ gameId: gameId as Id<"games"> });
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  const handleLeaveGame = () => {
    navigate("/");
  };

  const handleSubmitCard = async (cardId: string) => {
    if (!gameState.currentRound || !currentPlayerId) return;

    setIsSubmitting(true);
    try {
      await submitCard({
        roundId: gameState.currentRound._id,
        playerId: currentPlayerId as Id<"gamePlayers">,
        cardId: cardId as Id<"cards">,
      });
    } catch (err) {
      console.error("Failed to submit card:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectWinner = async (submissionId: string, playerId: string) => {
    if (!gameState.currentRound) return;

    try {
      const result = await selectWinner({
        roundId: gameState.currentRound._id,
        winnerPlayerId: playerId as Id<"gamePlayers">,
      });

      // If game isn't finished, start next round
      if (!result.gameFinished) {
        setTimeout(async () => {
          await startNextRound({ gameId: gameId as Id<"games"> });
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to select winner:", err);
    }
  };

  // Game Finished
  if (gameState.game.status === "finished") {
    const winner = [...gameState.players].sort((a, b) => b.score - a.score)[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold text-white mb-4">Game Over!</h1>
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/50 mb-6">
            <p className="text-gray-400 mb-2">Winner</p>
            <p className="text-3xl font-bold text-yellow-400">
              {winner.isAi
                ? winner.aiPersonaId?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : winner.user?.username ?? "Unknown"}
            </p>
            <p className="text-xl text-gray-300 mt-2">
              {winner.score} points
            </p>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-6">
            <h3 className="font-bold text-white mb-3">Final Standings</h3>
            <ul className="space-y-2">
              {[...gameState.players]
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <li
                    key={player._id}
                    className="flex items-center justify-between text-gray-300"
                  >
                    <span>
                      #{index + 1}{" "}
                      {player.isAi
                        ? player.aiPersonaId
                        : player.user?.username ?? "Unknown"}
                    </span>
                    <span className="font-bold">{player.score} pts</span>
                  </li>
                ))}
            </ul>
          </div>

          <Link
            to="/"
            className="
              bg-gradient-to-r from-cyan-500 to-purple-500
              text-white font-bold py-3 px-8 rounded-xl
              inline-block
            "
          >
            Play Again
          </Link>
        </div>
      </div>
    );
  }

  // Lobby
  if (gameState.game.status === "lobby") {
    return (
      <GameLobby
        game={{
          _id: gameState.game._id,
          inviteCode: gameState.game.inviteCode,
          gameMode: gameState.game.gameMode,
          maxPlayers: gameState.game.maxPlayers,
          pointsToWin: gameState.game.pointsToWin,
        }}
        players={gameState.players}
        isHost={isHost}
        onAddAiPlayer={handleAddAiPlayer}
        onStartGame={handleStartGame}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  // Playing
  return (
    <GameBoard
      gameState={{
        game: gameState.game,
        players: gameState.players,
        currentRound: gameState.currentRound,
        promptCard: gameState.promptCard,
        submissions: gameState.submissions,
      }}
      currentPlayerId={currentPlayerId ?? ""}
      playerHand={playerHand}
      onSubmitCard={handleSubmitCard}
      onSelectWinner={handleSelectWinner}
      isSubmitting={isSubmitting}
    />
  );
}
