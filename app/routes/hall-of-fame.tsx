import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";

export function meta() {
  return [
    { title: "Hall of Fame | AI Against Humanity" },
    { name: "description", content: "The best rounds from AI Against Humanity" },
  ];
}

export default function HallOfFame() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);

  const highlights = useQuery(api.hallOfFame.getHallOfFame, { limit: 30 });
  const upvoteHighlight = useMutation(api.hallOfFame.upvoteHighlight);

  const handleUpvote = async (highlightId: string) => {
    if (!userId) return;
    try {
      await upvoteHighlight({
        highlightId: highlightId as Id<"roundHighlights">,
        userId: userId as Id<"users">,
      });
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link
        to="/"
        className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-4 inline-block"
      >
        &larr; Back to Home
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="neon-text-green">Hall of Fame</span>
        </h1>
        <p className="text-gray-400 text-sm">
          The funniest rounds from across all games. Upvote your favorites!
        </p>
      </div>

      {!highlights || highlights.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No highlights yet. Play some games and save your best rounds!</p>
          <Link to="/games/new" className="btn-neon-pink mt-4 inline-block">
            Start Playing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {highlights.map((highlight, index) => (
            <div
              key={highlight._id}
              className={cn(
                "game-card",
                highlight.isFeatured && "border-[--color-neon-green]/50",
                index === 0 && "border-[--color-neon-green]"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Upvote button */}
                <button
                  onClick={() => handleUpvote(highlight._id)}
                  disabled={!userId}
                  className="flex flex-col items-center gap-1 px-2 py-1 rounded hover:bg-[--color-neon-green]/10 transition-colors"
                >
                  <span className="text-lg text-[--color-neon-green]">▲</span>
                  <span className="text-sm font-bold text-[--color-neon-green]">
                    {highlight.upvotes ?? 0}
                  </span>
                </button>

                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {index === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[--color-neon-green]/20 text-[--color-neon-green] font-bold">
                        #1
                      </span>
                    )}
                    {highlight.isFeatured && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[--color-neon-pink]/20 text-[--color-neon-pink] font-bold">
                        Featured
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      by {highlight.savedByAvatar ?? "😎"} {highlight.savedByUsername}
                    </span>
                  </div>

                  {/* Prompt */}
                  <div className="text-sm font-bold text-[--color-neon-pink] mb-1">
                    "{highlight.promptText}"
                  </div>

                  {/* Winning response */}
                  <div className="text-[--color-neon-cyan] mb-1">
                    <span className="text-xs text-gray-500">Winner ({highlight.winnerName}): </span>
                    "{highlight.winningResponse}"
                  </div>

                  {/* Roast commentary */}
                  {highlight.roastCommentary && (
                    <div className="text-xs text-orange-400 italic mt-1">
                      Commentator: "{highlight.roastCommentary}"
                    </div>
                  )}

                  <div className="text-xs text-gray-600 mt-2">
                    {new Date(highlight.savedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
