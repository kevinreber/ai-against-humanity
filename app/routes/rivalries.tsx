import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AI_PERSONA_NAMES } from "../lib/constants";
import { cn } from "../lib/utils";

export function meta() {
  return [
    { title: "AI Rivalries | AI Against Humanity" },
    { name: "description", content: "Head-to-head AI persona rivalry records" },
  ];
}

export default function Rivalries() {
  const rivalries = useQuery(api.rivalries.getAllRivalries);

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
          <span className="neon-text-purple text-[--color-neon-purple]">AI Rivalries</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Head-to-head records between AI personas. Who's the funniest?
        </p>
      </div>

      {!rivalries || rivalries.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No rivalries yet. Play AI Battle Royale to see who dominates!</p>
          <Link to="/games/new" className="btn-neon-pink mt-4 inline-block">
            Start a Battle
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rivalries
            .sort((a, b) => b.totalGames - a.totalGames)
            .map((rivalry) => {
              const p1Name = AI_PERSONA_NAMES[rivalry.persona1Id] || rivalry.persona1Id;
              const p2Name = AI_PERSONA_NAMES[rivalry.persona2Id] || rivalry.persona2Id;
              const p1Pct = rivalry.totalGames > 0
                ? Math.round((rivalry.persona1Wins / rivalry.totalGames) * 100)
                : 50;
              const p2Pct = 100 - p1Pct;
              const leader = rivalry.persona1Wins > rivalry.persona2Wins
                ? "p1"
                : rivalry.persona2Wins > rivalry.persona1Wins
                  ? "p2"
                  : "tie";

              return (
                <div key={rivalry._id} className="game-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <div className={cn(
                        "font-bold text-lg",
                        leader === "p1" ? "text-[--color-neon-green]" : "text-gray-300"
                      )}>
                        {p1Name}
                      </div>
                      <div className="text-2xl font-bold text-[--color-neon-cyan]">
                        {rivalry.persona1Wins}
                      </div>
                    </div>

                    <div className="text-center px-4">
                      <div className="text-xs text-gray-500 uppercase">vs</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {rivalry.totalGames} games
                      </div>
                    </div>

                    <div className="text-center flex-1">
                      <div className={cn(
                        "font-bold text-lg",
                        leader === "p2" ? "text-[--color-neon-green]" : "text-gray-300"
                      )}>
                        {p2Name}
                      </div>
                      <div className="text-2xl font-bold text-[--color-neon-pink]">
                        {rivalry.persona2Wins}
                      </div>
                    </div>
                  </div>

                  {/* Win percentage bar */}
                  <div className="h-2 rounded-full overflow-hidden flex bg-gray-800">
                    <div
                      className="bg-[--color-neon-cyan] transition-all duration-500"
                      style={{ width: `${p1Pct}%` }}
                    />
                    <div
                      className="bg-[--color-neon-pink] transition-all duration-500"
                      style={{ width: `${p2Pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{p1Pct}%</span>
                    <span>{p2Pct}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
