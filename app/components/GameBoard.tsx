import { useState, useCallback } from "react";
import { Card, AiTypingCard } from "./Card";
import { cn } from "../lib/utils";
import { AI_PERSONA_NAMES, AI_VOICE_SETTINGS } from "../lib/constants";

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
  // Feature 6: Themed Rounds
  themeModifier?: string;
  // Feature 2: AI Roast Commentary
  roastCommentary?: string;
  // Feature 1: Audience Votes
  audienceVotes?: Record<string, number>;
  onAudienceVote?: (submissionId: string) => void;
  myVote?: string | null;
  // Feature 10: TTS Mode
  ttsEnabled?: boolean;
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
  themeModifier,
  roastCommentary,
  audienceVotes,
  onAudienceVote,
  myVote,
  ttsEnabled,
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

      {/* Feature 6: Theme Modifier Banner */}
      {themeModifier && (
        <div className="text-center">
          <div className="inline-block px-4 py-2 rounded-lg bg-[--color-neon-purple]/10 border border-[--color-neon-purple]/50">
            <span className="text-xs uppercase tracking-wider text-gray-400">Round Theme: </span>
            <span className="text-sm font-bold text-[--color-neon-purple]">{themeModifier}</span>
          </div>
        </div>
      )}

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
                ttsEnabled={ttsEnabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Feature 1: Audience Vote Counts (shown during judging/complete) */}
      {roundStatus !== "submitting" && audienceVotes && onAudienceVote && (
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            {!isJudge ? "Vote for your favorite!" : "Audience is voting..."}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {submissions.map((sub) => {
              const votes = audienceVotes[sub._id] || 0;
              const isMyVote = myVote === sub._id;
              return (
                <button
                  key={sub._id}
                  onClick={() => !isJudge && onAudienceVote(sub._id)}
                  disabled={isJudge}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-all",
                    isMyVote
                      ? "border-[--color-neon-green] bg-[--color-neon-green]/20 text-[--color-neon-green]"
                      : "border-gray-700 text-gray-400 hover:border-gray-500",
                    isJudge && "cursor-default opacity-50"
                  )}
                >
                  {(sub.player?.isAi
                    ? AI_PERSONA_NAMES[sub.player.aiPersonaId || ""]
                    : sub.player?.username) || "Player"}
                  : {votes} vote{votes !== 1 ? "s" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature 2: AI Roast Commentary */}
      {roastCommentary && roundStatus === "complete" && (
        <div className="max-w-xl mx-auto text-center">
          <div className="game-card border-orange-500/50">
            <div className="text-xs uppercase tracking-wider text-orange-400 font-bold mb-2">
              AI Commentator
            </div>
            <p className="text-sm text-gray-300 italic">&ldquo;{roastCommentary}&rdquo;</p>
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

// Feature 10: Text-to-Speech helper with persona-specific voice
function speakText(text: string, personaId?: string) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voiceSettings = personaId ? AI_VOICE_SETTINGS[personaId] : undefined;

  if (voiceSettings) {
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;

    // Try to find a matching voice by name
    if (voiceSettings.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name.includes(voiceSettings.voiceName!));
      if (match) utterance.voice = match;
    }
  } else {
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function SubmissionCard({
  submission,
  isJudging,
  onSelect,
  ttsEnabled,
}: {
  submission: Submission;
  isJudging: boolean;
  onSelect: () => void;
  ttsEnabled?: boolean;
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
      <div className="mt-2 text-center flex items-center justify-center gap-2">
        <span className="text-xs text-gray-500">
          {submission.player?.isAi && (
            <span className="text-[--color-neon-purple]">AI: </span>
          )}
          {playerName}
        </span>
        {/* Feature 10: TTS button with persona voice */}
        {ttsEnabled && submission.text && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              speakText(submission.text!, submission.player?.aiPersonaId);
            }}
            className="text-xs text-gray-600 hover:text-[--color-neon-cyan] transition-colors"
            title="Read aloud with AI voice"
          >
            🔊
          </button>
        )}
      </div>
    </div>
  );
}
