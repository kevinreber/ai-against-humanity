import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";

export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  const notifications = useQuery(
    api.notifications.getNotifications,
    userId && open ? { userId: userId as Id<"users">, limit: 15 } : "skip"
  );

  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  if (!userId) return null;

  const typeIcon: Record<string, string> = {
    achievement: "🏆",
    level_up: "⬆️",
    friend_request: "👋",
    friend_accepted: "🤝",
    crate_earned: "📦",
    crate_opened: "🎁",
    game_invite: "🎮",
    daily_challenge: "📅",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative px-2 py-1 text-gray-400 hover:text-[--color-neon-cyan] transition-colors"
      >
        <span className="text-xl">🔔</span>
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[--color-neon-pink] text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[--color-dark-card] border border-gray-700 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-gray-300">Notifications</h3>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead({ userId: userId as Id<"users"> })}
                className="text-xs text-[--color-neon-cyan] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={cn(
                    "p-3 border-b border-gray-800/50 flex items-start gap-2 cursor-pointer hover:bg-[--color-dark-bg] transition-colors",
                    !n.read && "bg-[--color-neon-cyan]/5"
                  )}
                  onClick={() => {
                    if (!n.read) markRead({ notificationId: n._id });
                  }}
                >
                  <span className="text-lg">{typeIcon[n.type] || "📢"}</span>
                  <div className="flex-1">
                    <p className={cn("text-sm", !n.read ? "text-gray-200" : "text-gray-400")}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[--color-neon-cyan] mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
