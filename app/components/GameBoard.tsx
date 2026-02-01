import { useState } from "react";
import { Card, CardHand, PromptCard } from "./Card";
import { PlayerList } from "./PlayerList";

interface GameBoardProps {
  gameState: {
    game: {
      status: "lobby" | "playing" | "finished";
      currentRound: number;
      pointsToWin: number;
    };
    players: Array<{
      _id: string;
      isAi: boolean;
      aiPersonaId?: string;
      score: number;
      isJudge: boolean;
      hand: string[];
      user?: { username: string; avatarUrl?: string } | null;
    }>;
    currentRound: {
      _id: string;
      status: "submitting" | "judging" | "complete";
    } | null;
    promptCard: { text: string } | null;
    submissions: Array<{
      _id: string;
      playerId: string;
      cardId?: string;
      aiGeneratedText?: string;
      card: { text: string } | null;
      player: {
        _id: string;
        isAi: boolean;
        aiPersonaId?: string;
        user?: { username: string } | null;
      } | null;
    }>;
  };
  currentPlayerId: string;
  playerHand: Array<{ _id: string; text: string }>;
  onSubmitCard: (cardId: string) => void;
  onSelectWinner: (submissionId: string, playerId: string) => void;
  isSubmitting?: boolean;
}

export function GameBoard({
  gameState,
  currentPlayerId,
  playerHand,
  onSubmitCard,
  onSelectWinner,
  isSubmitting = false,
}: GameBoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  const currentPlayer = gameState.players.find((p) => p._id === currentPlayerId);
  const isJudge = currentPlayer?.isJudge ?? false;
  const hasSubmitted = gameState.submissions.some(
    (s) => s.playerId === currentPlayerId
  );
  const roundStatus = gameState.currentRound?.status ?? "submitting";

  const handleSubmit = () => {
    if (selectedCardId) {
      onSubmitCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleSelectWinner = () => {
    const submission = gameState.submissions.find(
      (s) => s._id === selectedWinnerId
    );
    if (submission) {
      onSelectWinner(submission._id, submission.playerId);
      setSelectedWinnerId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Player List */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <PlayerList
            players={gameState.players}
            currentPlayerId={currentPlayerId}
          />

          {/* Game Info */}
          <div className="mt-4 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex justify-between items-center text-gray-300">
              <span>Round</span>
              <span className="font-bold text-white">
                {gameState.game.currentRound}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-300 mt-2">
              <span>Points to Win</span>
              <span className="font-bold text-white">
                {gameState.game.pointsToWin}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-300 mt-2">
              <span>Status</span>
              <span
                className={`
                  font-bold capitalize
                  ${roundStatus === "submitting" ? "text-cyan-400" : ""}
                  ${roundStatus === "judging" ? "text-yellow-400" : ""}
                  ${roundStatus === "complete" ? "text-green-400" : ""}
                `}
              >
                {roundStatus}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Game Area */}
        <main className="lg:col-span-3 order-1 lg:order-2 space-y-6">
          {/* Prompt Card */}
          {gameState.promptCard && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-white mb-3 text-center">
                Prompt Card
              </h2>
              <PromptCard text={gameState.promptCard.text} large />
            </section>
          )}

          {/* Submission Phase */}
          {roundStatus === "submitting" && !isJudge && !hasSubmitted && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">
                Your Hand - Select a card to play
              </h2>
              <CardHand
                cards={playerHand}
                selectedId={selectedCardId ?? undefined}
                onSelect={setSelectedCardId}
                disabled={isSubmitting}
              />
              {selectedCardId && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="
                      bg-gradient-to-r from-cyan-500 to-purple-500
                      hover:from-cyan-400 hover:to-purple-400
                      text-white font-bold py-3 px-8 rounded-xl
                      shadow-lg hover:shadow-cyan-500/25
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isSubmitting ? "Submitting..." : "Submit Card"}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Waiting for submissions */}
          {roundStatus === "submitting" && (isJudge || hasSubmitted) && (
            <section className="text-center py-8">
              <div className="animate-pulse">
                <div className="text-4xl mb-4">
                  {isJudge ? "👨‍⚖️" : "⏳"}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {isJudge
                    ? "You're the judge this round!"
                    : "Card submitted!"}
                </h2>
                <p className="text-gray-400 mt-2">
                  Waiting for other players to submit...
                </p>
                <div className="mt-4 text-gray-500">
                  {gameState.submissions.length} /{" "}
                  {gameState.players.filter((p) => !p.isJudge).length} submitted
                </div>
              </div>
            </section>
          )}

          {/* Judging Phase */}
          {roundStatus === "judging" && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3 text-center">
                {isJudge ? "Pick the winner!" : "The judge is deciding..."}
              </h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {gameState.submissions.map((submission) => (
                  <Card
                    key={submission._id}
                    type="response"
                    text={submission.card?.text ?? submission.aiGeneratedText ?? ""}
                    selected={selectedWinnerId === submission._id}
                    onClick={() => isJudge && setSelectedWinnerId(submission._id)}
                    disabled={!isJudge}
                    revealed
                  />
                ))}
              </div>
              {isJudge && selectedWinnerId && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleSelectWinner}
                    className="
                      bg-gradient-to-r from-yellow-500 to-orange-500
                      hover:from-yellow-400 hover:to-orange-400
                      text-white font-bold py-3 px-8 rounded-xl
                      shadow-lg hover:shadow-yellow-500/25
                      transition-all duration-200
                    "
                  >
                    Select Winner
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Round Complete */}
          {roundStatus === "complete" && (
            <section className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white">Round Complete!</h2>
              <p className="text-gray-400 mt-2">
                Preparing next round...
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
