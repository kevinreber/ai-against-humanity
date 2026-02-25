import { useParams, Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GameBoard } from "../components/GameBoard";
import { PlayerList } from "../components/PlayerList";
import { ScoreBoard, GameResults } from "../components/ScoreBoard";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

// Basic format check for Convex IDs - just ensure it's a non-empty
// alphanumeric string. Convex handles detailed ID validation server-side.
function isValidConvexId(id: string): boolean {
  if (id.length < 2) return false;
  return /^[a-zA-Z0-9_]+$/.test(id);
}

export function meta() {
  return [
    { title: "Game | AI Against Humanity" },
    { name: "description", content: "Play AI Against Humanity" },
  ];
}

export default function GamePageWrapper() {
  return (
    <ErrorBoundary
      fallback={
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-400">Game not found</p>
          <Link to="/games" className="btn-neon-cyan mt-4 inline-block">
            Back to Games
          </Link>
        </div>
      }
    >
      <GamePage />
    </ErrorBoundary>
  );
}

function GamePage() {
  const { gameId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Validate gameId format before querying
  const isValidId = gameId ? isValidConvexId(gameId) : false;

  // Convex queries - skip if ID is not valid format
  const gameState = useQuery(
    api.games.getGame,
    gameId && isValidId ? { gameId: gameId as Id<"games"> } : "skip"
  );

  const submissions = useQuery(
    api.rounds.getSubmissions,
    gameState?.currentRound?._id
      ? { roundId: gameState.currentRound._id }
      : "skip"
  );

  // Check host's API key status (must be before conditional returns to satisfy Rules of Hooks)
  const isHost = gameState?.game?.hostId === currentUserId;
  const hostApiKeys = useQuery(
    api.apiKeys.getMyApiKeys,
    gameState && currentUserId && isHost
      ? { userId: gameState.game.hostId }
      : "skip"
  );

  // Convex mutations
  const startGame = useMutation(api.games.startGame);
  const submitCard = useMutation(api.games.submitCard);
  const selectWinner = useMutation(api.games.selectWinner);
  const startNextRound = useMutation(api.games.startNextRound);
  const moveToJudging = useMutation(api.rounds.moveToJudging);

  // Get current user from localStorage (simplified auth)
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  // Store user ID when joining
  useEffect(() => {
    if (gameState?.players && currentUserId === null) {
      // Try to find our player by checking recent joins
      const humanPlayers = gameState.players.filter((p) => !p.isAi && p.userId);
      if (humanPlayers.length > 0) {
        // For demo, assume first human player is us
        const myPlayer = humanPlayers[0];
        if (myPlayer.userId) {
          localStorage.setItem("userId", myPlayer.userId);
          setCurrentUserId(myPlayer.userId);
        }
      }
    }
  }, [gameState?.players, currentUserId]);

  // Auto move to judging when all submissions are in
  useEffect(() => {
    if (gameState?.currentRound?.status === "submitting" && submissions) {
      const nonJudgePlayers = gameState.players.filter(
        (p) => p._id !== gameState.currentRound?.judgePlayerId
      );
      if (submissions.length >= nonJudgePlayers.length) {
        moveToJudging({ roundId: gameState.currentRound._id });
      }
    }
  }, [submissions?.length, gameState?.currentRound?.status]);

  if (!gameId || !isValidId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400">Invalid game ID</p>
        <Link to="/games" className="btn-neon-cyan mt-4 inline-block">
          Back to Games
        </Link>
      </div>
    );
  }

  if (gameState === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="ai-typing inline-block text-[--color-neon-cyan]">
          <span className="text-2xl">.</span>
          <span className="text-2xl">.</span>
          <span className="text-2xl">.</span>
        </div>
        <p className="text-gray-500 mt-2">Loading game...</p>
      </div>
    );
  }

  if (gameState === null) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400">Game not found</p>
        <Link to="/games" className="btn-neon-cyan mt-4 inline-block">
          Back to Games
        </Link>
      </div>
    );
  }

  const { game, players, currentRound, promptCard } = gameState;
  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const isJudge = currentPlayer?._id === currentRound?.judgePlayerId;
  const hasSubmitted = submissions?.some((s) => s.playerId === currentPlayer?._id);

  const apiKeyWarning = isHost && hostApiKeys?.some((k) => !k.isValid && k.lastError)
    ? hostApiKeys.find((k) => !k.isValid && k.lastError)
    : null;

  // Get cards for current player's hand
  const playerHand = currentPlayer?.hand?.map((cardId) => ({
    _id: cardId,
    text: "Loading...", // We'd need another query to get card texts
  })) || [];

  // AI players currently "thinking" (haven't submitted yet)
  const aiPlayersThinking =
    currentRound?.status === "submitting"
      ? players
          .filter(
            (p) =>
              p.isAi &&
              p._id !== currentRound.judgePlayerId &&
              !submissions?.some((s) => s.playerId === p._id)
          )
          .map((p) => p.aiPersonaId || "")
          .filter(Boolean)
      : [];

  // Handle card submission
  const handleSubmitCard = async (cardId: string) => {
    if (!currentPlayer || !currentRound) return;
    try {
      await submitCard({
        roundId: currentRound._id,
        playerId: currentPlayer._id,
        cardId: cardId as Id<"cards">,
      });
    } catch (err) {
      console.error("Failed to submit card:", err);
    }
  };

  // Handle winner selection
  const handleSelectWinner = async (submissionId: string) => {
    if (!currentRound) return;
    const submission = submissions?.find((s) => s._id === submissionId);
    if (!submission) return;

    try {
      await selectWinner({
        roundId: currentRound._id,
        winnerPlayerId: submission.playerId as Id<"gamePlayers">,
      });

      // Start next round after a delay
      setTimeout(async () => {
        await startNextRound({ gameId: game._id });
      }, 3000);
    } catch (err) {
      console.error("Failed to select winner:", err);
    }
  };

  // Render lobby view
  if (game.status === "lobby") {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link
          to="/games"
          className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-4 inline-block"
        >
          &larr; Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="neon-text-cyan">Game Lobby</span>
          </h1>
          <div className="inline-block px-4 py-2 bg-[--color-dark-card] rounded-lg">
            <span className="text-gray-400 text-sm">Invite Code: </span>
            <span className="font-mono font-bold text-[--color-neon-green] text-lg">
              {game.inviteCode}
            </span>
          </div>
        </div>

        <div className="game-card mb-8">
          <PlayerList players={players} currentUserId={currentUserId || undefined} />
        </div>

        <div className="text-center">
          {isHost ? (
            <button
              onClick={() => startGame({ gameId: game._id })}
              disabled={players.length < 2}
              className={cn(
                "btn-neon-green",
                players.length < 2 && "opacity-50 cursor-not-allowed"
              )}
            >
              {players.length < 2 ? "Need at least 2 players" : "Start Game"}
            </button>
          ) : (
            <p className="text-gray-400">Waiting for host to start the game...</p>
          )}
        </div>
      </div>
    );
  }

  // Render finished game view
  if (game.status === "finished") {
    const winner = players.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <GameResults
          players={players}
          winnerId={winner._id}
          onPlayAgain={() => {
            // TODO: Implement rematch
            window.location.reload();
          }}
          onBackToLobby={() => {
            window.location.href = "/games";
          }}
        />
      </div>
    );
  }

  // Render game in progress
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="border-b border-gray-800 mb-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/games"
                className="text-gray-500 hover:text-[--color-neon-cyan] text-xs"
              >
                &larr; Leave Game
              </Link>
              <h1 className="font-bold">
                <span className="text-[--color-neon-pink]">AI</span> Against{" "}
                <span className="text-[--color-neon-cyan]">Humanity</span>
              </h1>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Round</div>
              <div className="text-2xl font-bold text-[--color-neon-green]">
                {game.currentRound}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Warning Banner (only shown to host) */}
      {apiKeyWarning && (
        <div className="container mx-auto px-4 mb-4">
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/50 text-sm flex items-center justify-between">
            <div>
              <span className="text-red-400 font-bold">API Key Issue: </span>
              <span className="text-red-300">{apiKeyWarning.lastError}</span>
              <span className="text-red-500 ml-1">— Using default key as fallback.</span>
            </div>
            <Link
              to="/settings"
              className="text-xs px-3 py-1 rounded border border-red-500 text-red-400 hover:bg-red-900/30 transition-colors whitespace-nowrap ml-4"
            >
              Fix in Settings
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Scoreboard */}
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <ScoreBoard players={players} pointsToWin={game.pointsToWin} />
          </aside>

          {/* Main - Game Board */}
          <main className="lg:col-span-3 order-1 lg:order-2">
            <GameBoard
              promptCard={promptCard}
              playerHand={playerHand}
              submissions={submissions || []}
              roundStatus={currentRound?.status || "submitting"}
              isJudge={isJudge || false}
              hasSubmitted={hasSubmitted || false}
              aiPlayersThinking={aiPlayersThinking}
              onSubmitCard={handleSubmitCard}
              onSelectWinner={handleSelectWinner}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
