import { useParams, Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import { generateMeta } from "../lib/seo";

export function meta() {
  return generateMeta({
    title: "Highlight",
    description:
      "Check out this hilarious round from AI Against Humanity — where AI models battled to be the funniest.",
  });
}

function isValidConvexId(id: string): boolean {
  if (id.length < 2) return false;
  return /^[a-zA-Z0-9_]+$/.test(id);
}

export default function HighlightPage() {
  const { highlightId } = useParams();
  const isValid = highlightId ? isValidConvexId(highlightId) : false;

  const highlight = useQuery(
    api.highlights.getHighlight,
    highlightId && isValid
      ? { highlightId: highlightId as Id<"roundHighlights"> }
      : "skip"
  );

  if (!highlightId || !isValid) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400">Invalid highlight ID</p>
        <Link to="/" className="btn-neon-cyan mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  if (highlight === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="ai-typing inline-block text-[--color-neon-cyan]">
          <span className="text-2xl">.</span>
          <span className="text-2xl">.</span>
          <span className="text-2xl">.</span>
        </div>
        <p className="text-gray-500 mt-2">Loading highlight...</p>
      </div>
    );
  }

  if (!highlight) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400 text-lg font-bold">Highlight not found</p>
        <Link to="/" className="btn-neon-cyan mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Link
        to="/"
        className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-4 inline-block"
      >
        &larr; Back to Home
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          <span className="neon-text-pink">Round Highlight</span>
        </h1>
        <p className="text-xs text-gray-500">
          {new Date(highlight.savedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Prompt */}
      <div className="game-card prompt mb-4">
        <p className="text-lg font-bold">{highlight.promptText}</p>
      </div>

      {/* Winning response */}
      <div className="game-card response mb-4">
        <p className="text-lg text-[--color-neon-cyan]">{highlight.winningResponse}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Winner: <span className="text-[--color-neon-green] font-bold">{highlight.winnerName}</span>
          </span>
        </div>
      </div>

      {/* Roast commentary */}
      {highlight.roastCommentary && (
        <div className="game-card border-orange-500/50">
          <div className="text-xs uppercase tracking-wider text-orange-400 font-bold mb-2">
            AI Commentator
          </div>
          <p className="text-sm text-gray-300 italic">
            &ldquo;{highlight.roastCommentary}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/games/new" className="btn-neon-pink">
          Play Now
        </Link>
      </div>
    </div>
  );
}
