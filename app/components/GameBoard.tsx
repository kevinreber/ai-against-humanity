import { useState } from "react";
import { Card, AiTypingCard } from "./Card";
import { cn } from "../lib/utils";
import { AI_PERSONA_NAMES } from "../lib/constants";

interface Submission {
  _id: string;
  playerId: string;
  text?: string;
  player?: {
    isAi: boolean;
    aiPersonaId?: string;
    username?: string;
  };
}

interface GameBoardProps {
  promptCard: { text: string } | null;
  playerHand: Array<{ _id: string; text: string }>;
  submissions: Submission[];
  roundStatus: "submitting" | "judging" | "complete";
  isJudge: boolean;
  hasSubmitted: boolean;
  aiPlayersThinking: string[];
  onSubmitCard: (cardId: string) => void;
  onSelectWinner: (submissionId: string) => void;
  className?: string;
}

export function GameBoard({
  promptCard,
  playerHand,
  submissions,
  roundStatus,
  isJudge,
  hasSubmitted,
  aiPlayersThinking,
  onSubmitCard,
  onSelectWinner,
  className,
}: GameBoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleCardClick = (cardId: string) => {
    if (isJudge || hasSubmitted || roundStatus !== "submitting") return;
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

  const handleSubmit = () => {
    if (selectedCardId) {
      onSubmitCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Prompt Card Section */}
      <div className="text-center">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
          Prompt Card
        </h2>
        {promptCard ? (
          <div className="max-w-md mx-auto">
            <Card text={promptCard.text} type="prompt" />
          </div>
        ) : (
          <div className="game-card prompt max-w-md mx-auto opacity-50">
            <p className="text-gray-500">Waiting for prompt...</p>
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="text-center">
        <StatusBadge
          status={roundStatus}
          isJudge={isJudge}
          hasSubmitted={hasSubmitted}
        />
      </div>

      {/* Submissions Section (during judging) */}
      {roundStatus !== "submitting" && submissions.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">
            Submissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission._id}
                submission={submission}
                isJudging={roundStatus === "judging" && isJudge}
                onSelect={() => onSelectWinner(submission._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Thinking Indicators */}
      {roundStatus === "submitting" && aiPlayersThinking.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {aiPlayersThinking.map((personaId) => (
            <AiTypingCard
              key={personaId}
              personaName={AI_PERSONA_NAMES[personaId] || "AI"}
            />
          ))}
        </div>
      )}

      {/* Player's Hand (if not judge and during submitting) */}
      {!isJudge && roundStatus === "submitting" && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">
            Your Hand
          </h2>
          {hasSubmitted ? (
            <p className="text-center text-gray-500">
              Waiting for other players...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {playerHand.map((card) => (
                  <Card
                    key={card._id}
                    text={card.text}
                    type="response"
                    selected={card._id === selectedCardId}
                    onClick={() => handleCardClick(card._id)}
                  />
                ))}
              </div>
              {selectedCardId && (
                <div className="mt-6 text-center">
                  <button className="btn-neon-green" onClick={handleSubmit}>
                    Submit Card
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Judge waiting message */}
      {isJudge && roundStatus === "submitting" && (
        <div className="text-center py-8">
          <p className="text-xl text-gray-400">
            You are the judge this round.
          </p>
          <p className="text-gray-500 mt-2">
            Wait for other players to submit their cards...
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  isJudge,
  hasSubmitted,
}: {
  status: string;
  isJudge: boolean;
  hasSubmitted: boolean;
}) {
  let message = "";
  let colorClass = "";

  switch (status) {
    case "submitting":
      if (isJudge) {
        message = "Waiting for submissions";
        colorClass = "text-[--color-neon-pink]";
      } else if (hasSubmitted) {
        message = "Card submitted!";
        colorClass = "text-[--color-neon-green]";
      } else {
        message = "Select a card to submit";
        colorClass = "text-[--color-neon-cyan]";
      }
      break;
    case "judging":
      if (isJudge) {
        message = "Pick the winner!";
        colorClass = "text-[--color-neon-pink]";
      } else {
        message = "Judge is deciding...";
        colorClass = "text-[--color-neon-cyan]";
      }
      break;
    case "complete":
      message = "Round complete!";
      colorClass = "text-[--color-neon-green]";
      break;
  }

  return (
    <span className={cn("text-sm font-bold uppercase tracking-wider", colorClass)}>
      {message}
    </span>
  );
}

function SubmissionCard({
  submission,
  isJudging,
  onSelect,
}: {
  submission: Submission;
  isJudging: boolean;
  onSelect: () => void;
}) {
  const playerName = submission.player?.isAi
    ? AI_PERSONA_NAMES[submission.player.aiPersonaId || ""] || "AI"
    : submission.player?.username || "Player";

  return (
    <div className="relative">
      <Card
        text={submission.text || "???"}
        type="response"
        onClick={isJudging ? onSelect : undefined}
        className={isJudging ? "cursor-pointer" : ""}
      />
      {/* Show player name after judging */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          {submission.player?.isAi && (
            <span className="text-[--color-neon-purple]">AI: </span>
          )}
          {playerName}
        </span>
      </div>
    </div>
  );
}
