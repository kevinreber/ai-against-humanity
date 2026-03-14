import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { XP_LEVELS } from "../lib/constants";

export function XpBar({ userId }: { userId: string }) {
  const xpData = useQuery(api.xp.getUserXp, {
    userId: userId as Id<"users">,
  });

  if (!xpData) return null;

  const levelInfo = XP_LEVELS.find((l) => l.level === xpData.level);
  const levelTitle = levelInfo?.title || "Newbie";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[--color-neon-purple]">
            Lvl {xpData.level}
          </span>
          <span className="text-xs text-gray-500">{levelTitle}</span>
        </div>
        <span className="text-xs text-gray-600">
          {xpData.xp} XP
          {xpData.nextLevelXp && ` / ${xpData.nextLevelXp}`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[--color-neon-purple] to-[--color-neon-pink] transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(xpData.progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
