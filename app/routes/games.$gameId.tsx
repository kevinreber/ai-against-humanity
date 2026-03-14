import { useParams, Link } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GameBoard } from "../components/GameBoard";
import { PlayerList } from "../components/PlayerList";
import { ScoreBoard, GameResults } from "../components/ScoreBoard";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SpectatorChat } from "../components/SpectatorChat";
import { useState, useEffect } from "react";
import { ConvexError } from "convex/values";
import { cn } from "../lib/utils";
import { AI_PERSONA_NAMES } from "../lib/constants";

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
          <p className="text-red-400">Failed to load game</p>
          <p className="text-gray-500 text-sm mt-2">
            The game may have ended or there was a connection error.
          </p>
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
  const [startError, setStartError] = useState<string | null>(null);

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

  // Convex mutations
  const startGame = useMutation(api.games.startGame);
  const submitCard = useMutation(api.games.submitCard);
  const selectWinner = useMutation(api.games.selectWinner);
  const startNextRound = useMutation(api.games.startNextRound);
  const moveToJudging = useMutation(api.rounds.moveToJudging);

  // Feature 1: Audience votes
  const castVote = useMutation(api.audienceVotes.castVote);
  const audienceVotesData = useQuery(
    api.audienceVotes.getVotes,
    gameState?.currentRound?._id
      ? { roundId: gameState.currentRound._id }
      : "skip"
  );
  const myVote = useQuery(
    api.audienceVotes.getMyVote,
    gameState?.currentRound?._id && currentUserId
      ? {
          roundId: gameState.currentRound._id,
          oderId: currentUserId as Id<"users">,
        }
      : "skip"
  );

  // Feature 7: Highlight saving
  const saveHighlight = useMutation(api.highlights.saveHighlight);

  // Feature 10: TTS toggle
  const toggleTts = useMutation(api.games.toggleTts);

  // Retention features
  const addXp = useMutation(api.xp.addXp);
  const checkAchievements = useMutation(api.achievements.checkAchievements);
  const recordRivalry = useMutation(api.rivalries.recordResult);
  const checkCrateAward = useMutation(api.rewardCrates.checkCrateAward);

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
        <p className="text-red-400 text-lg font-bold">Game not found</p>
        <p className="text-gray-500 text-sm mt-2">
          This game may have ended or been removed.
        </p>
        <Link to="/games" className="btn-neon-cyan mt-4 inline-block">
          Browse Open Games
        </Link>
      </div>
    );
  }

  const { game, players, currentRound, promptCard } = gameState;
  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const isJudge = currentPlayer?._id === currentRound?.judgePlayerId;
  const hasSubmitted = submissions?.some((s) => s.playerId === currentPlayer?._id);

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

  // Feature 1: Audience vote handler
  const handleAudienceVote = async (submissionId: string) => {
    if (!currentRound || !currentUserId) return;
    try {
      await castVote({
        roundId: currentRound._id,
        oderId: currentUserId as Id<"users">,
        submissionId: submissionId as Id<"submissions">,
      });
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  // Feature 7: Save highlight handler
  const handleSaveHighlight = async () => {
    if (!currentRound || !currentUserId || !promptCard) return;
    const winnerSub = submissions?.find(
      (s) => s.playerId === currentRound.winnerPlayerId
    );
    if (!winnerSub) return;
    const winnerPlayer = players.find((p) => p._id === winnerSub.playerId);
    const winnerName = winnerPlayer?.isAi
      ? AI_PERSONA_NAMES[winnerPlayer.aiPersonaId || ""] || "AI"
      : winnerPlayer?.username || "Player";
    try {
      await saveHighlight({
        gameId: game._id,
        roundId: currentRound._id,
        savedBy: currentUserId as Id<"users">,
        promptText: promptCard.text,
        winningResponse: winnerSub.text || "",
        winnerName,
        roastCommentary: currentRound.roastCommentary,
      });
    } catch {
      // Already saved
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
            <>
              <button
                onClick={async () => {
                  setStartError(null);
                  try {
                    await startGame({ gameId: game._id });
                  } catch (err) {
                    const message =
                      err instanceof ConvexError
                        ? (err.data as string)
                        : "Failed to start game. Please try again.";
                    setStartError(message);
                  }
                }}
                disabled={players.length < 2}
                className={cn(
                  "btn-neon-green",
                  players.length < 2 && "opacity-50 cursor-not-allowed"
                )}
              >
                {players.length < 2 ? "Need at least 2 players" : "Start Game"}
              </button>
              {startError && (
                <p className="text-red-400 text-sm mt-3">{startError}</p>
              )}
            </>
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

    // Award XP and check achievements on game finish
    useEffect(() => {
      if (currentUserId && game.status === "finished") {
        const uid = currentUserId as Id<"users">;
        // XP for playing
        addXp({ userId: uid, amount: 10, reason: "game_played" });

        // XP for winning
        const myPlayer = players.find((p) => p.userId === currentUserId);
        if (myPlayer && myPlayer._id === winner._id) {
          addXp({ userId: uid, amount: 50, reason: "game_won" });
          checkCrateAward({ userId: uid });
        }

        // Check achievements
        checkAchievements({ userId: uid });

        // Record AI rivalries (for all AI vs AI pairs in this game)
        const aiPlayers = players.filter((p) => p.isAi && p.aiPersonaId);
        if (aiPlayers.length >= 2) {
          const aiWinner = aiPlayers.reduce((prev, cur) => prev.score > cur.score ? prev : cur);
          for (const loser of aiPlayers) {
            if (loser._id !== aiWinner._id && aiWinner.aiPersonaId && loser.aiPersonaId) {
              recordRivalry({
                winnerPersonaId: aiWinner.aiPersonaId,
                loserPersonaId: loser.aiPersonaId,
              });
            }
          }
        }
      }
    }, [game.status]);

    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <GameResults
          players={players}
          winnerId={winner._id}
          onPlayAgain={() => {
            window.location.href = "/games/new";
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
            <div className="flex items-center gap-4">
              {/* Feature 10: TTS Toggle */}
              {isHost && (
                <button
                  onClick={() => toggleTts({ gameId: game._id, enabled: !game.ttsEnabled })}
                  className={cn(
                    "text-xs px-2 py-1 rounded border transition-colors",
                    game.ttsEnabled
                      ? "border-[--color-neon-cyan] text-[--color-neon-cyan]"
                      : "border-gray-700 text-gray-500"
                  )}
                  title={game.ttsEnabled ? "Disable voice" : "Enable voice"}
                >
                  {game.ttsEnabled ? "🔊 TTS" : "🔇 TTS"}
                </button>
              )}
              <div className="text-right">
                <div className="text-xs text-gray-500">Round</div>
                <div className="text-2xl font-bold text-[--color-neon-green]">
                  {game.currentRound}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Warning Banner (only shown to host) */}
      {isHost && (
        <ErrorBoundary>
          <ApiKeyWarning hostId={game.hostId} />
        </ErrorBoundary>
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
              themeModifier={currentRound?.themeModifier}
              roastCommentary={currentRound?.roastCommentary}
              audienceVotes={audienceVotesData?.votes}
              onAudienceVote={handleAudienceVote}
              myVote={myVote}
              ttsEnabled={game.ttsEnabled}
            />

            {/* Feature 7: Save Highlight button */}
            {currentRound?.status === "complete" && currentRound.winnerPlayerId && currentUserId && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleSaveHighlight}
                  className="text-xs px-4 py-2 border border-gray-700 rounded-lg text-gray-400 hover:border-[--color-neon-cyan] hover:text-[--color-neon-cyan] transition-colors"
                >
                  Save Round Highlight
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Spectator Chat */}
      <SpectatorChat gameId={gameId} userId={currentUserId} />
    </div>
  );
}

function ApiKeyWarning({ hostId }: { hostId: Id<"users"> }) {
  const hostApiKeys = useQuery(api.apiKeyQueries.getMyApiKeys, { userId: hostId });
  const warning = hostApiKeys?.find((k) => !k.isValid && k.lastError);
  if (!warning) return null;

  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/50 text-sm flex items-center justify-between">
        <div>
          <span className="text-red-400 font-bold">API Key Issue: </span>
          <span className="text-red-300">{warning.lastError}</span>
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
  );
}
