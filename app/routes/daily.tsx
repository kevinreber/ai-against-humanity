import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";

export function meta() {
  return [
    { title: "Daily Challenge | AI Against Humanity" },
    { name: "description", content: "Daily challenge - compete for the funniest response" },
  ];
}

export default function DailyChallenge() {
  const [userId, setUserId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);

  const challenge = useQuery(api.dailyChallenges.getTodaysChallenge);
  const ensureChallenge = useMutation(api.dailyChallenges.ensureDailyChallenge);
  const submitEntry = useMutation(api.dailyChallenges.submitEntry);
  const voteEntry = useMutation(api.dailyChallenges.voteEntry);

  const entries = useQuery(
    api.dailyChallenges.getEntries,
    challenge ? { challengeId: challenge._id } : "skip"
  );

  const hasSubmitted = useQuery(
    api.dailyChallenges.hasSubmittedToday,
    challenge && userId
      ? { challengeId: challenge._id, userId: userId as Id<"users"> }
      : "skip"
  );

  // Ensure today's challenge exists
  useEffect(() => {
    if (challenge === null) {
      ensureChallenge();
    }
  }, [challenge]);

  const handleSubmit = async () => {
    if (!challenge || !userId || !response.trim()) return;
    try {
      await submitEntry({
        challengeId: challenge._id,
        userId: userId as Id<"users">,
        response,
      });
      setResponse("");
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  const handleVote = async (entryId: string) => {
    if (!challenge || !userId) return;
    try {
      await voteEntry({
        challengeId: challenge._id,
        voterId: userId as Id<"users">,
        entryId: entryId as Id<"dailyChallengeEntries">,
      });
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const user = useQuery(
    api.users.getUser,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link
        to="/"
        className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-4 inline-block"
      >
        &larr; Back to Home
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="neon-text-pink">Daily</span>{" "}
          <span className="neon-text-cyan">Challenge</span>
        </h1>
        <p className="text-gray-400 text-sm">
          New prompt every day. Submit your best response and vote for favorites!
        </p>
        {user && (
          <div className="mt-2 text-xs text-gray-500">
            Streak: <span className="text-orange-400 font-bold">{user.dailyChallengeStreak ?? 0}</span> days
          </div>
        )}
      </div>

      {!challenge ? (
        <div className="text-center text-gray-500">Loading today's challenge...</div>
      ) : (
        <>
          {/* Prompt Card */}
          <div className="game-card prompt max-w-lg mx-auto mb-8">
            <p className="text-lg font-bold">{challenge.promptText}</p>
            {challenge.themeModifier && (
              <div className="mt-3 px-3 py-1 rounded bg-[--color-neon-purple]/10 border border-[--color-neon-purple]/50 inline-block">
                <span className="text-xs text-[--color-neon-purple] font-bold">
                  Theme: {challenge.themeModifier}
                </span>
              </div>
            )}
          </div>

          {/* Submit Form */}
          {!hasSubmitted && !submitted && userId && (
            <div className="game-card mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Your Response
              </h3>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your funniest response..."
                className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-cyan] focus:outline-none h-24 resize-none"
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-600">{response.length}/200</span>
                <button
                  onClick={handleSubmit}
                  disabled={!response.trim()}
                  className={cn(
                    "btn-neon-green",
                    !response.trim() && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {(hasSubmitted || submitted) && (
            <div className="text-center mb-8 text-[--color-neon-green] text-sm font-bold">
              You've submitted today's challenge! Vote for your favorites below.
            </div>
          )}

          {!userId && (
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm">
                Play a game first to participate in daily challenges.
              </p>
              <Link to="/games/new" className="btn-neon-pink mt-3 inline-block">
                Create a Game
              </Link>
            </div>
          )}

          {/* Entries */}
          {entries && entries.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">
                Submissions ({entries.length})
              </h2>
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={entry._id}
                    className={cn(
                      "game-card flex items-center justify-between",
                      index === 0 && (entry.votes ?? 0) > 0 && "border-[--color-neon-green]/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{entry.avatar || "😎"}</span>
                        <span className="text-sm font-medium text-gray-300">
                          {entry.username}
                        </span>
                        {index === 0 && (entry.votes ?? 0) > 0 && (
                          <span className="text-xs text-[--color-neon-green]">Leading</span>
                        )}
                      </div>
                      <p className="text-[--color-neon-cyan]">"{entry.response}"</p>
                    </div>
                    <button
                      onClick={() => handleVote(entry._id)}
                      disabled={!userId || entry.userId === userId}
                      className={cn(
                        "ml-4 flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all",
                        "border-gray-700 hover:border-[--color-neon-green] hover:text-[--color-neon-green]",
                        (!userId || entry.userId === userId) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span className="text-lg">▲</span>
                      <span className="text-xs font-bold">{entry.votes ?? 0}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
