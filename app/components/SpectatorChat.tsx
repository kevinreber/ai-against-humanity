import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";

interface SpectatorChatProps {
  gameId: string;
  userId: string | null;
}

export function SpectatorChat({ gameId, userId }: SpectatorChatProps) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.spectatorChat.getMessages, {
    gameId: gameId as Id<"games">,
  });

  const spectatorCount = useQuery(api.spectatorChat.getSpectatorCount, {
    gameId: gameId as Id<"games">,
  });

  const sendMessage = useMutation(api.spectatorChat.sendMessage);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || !userId) return;
    try {
      await sendMessage({
        gameId: gameId as Id<"games">,
        userId: userId as Id<"users">,
        message,
      });
      setMessage("");
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-3 py-2 rounded-lg border text-sm font-bold transition-all",
          isOpen
            ? "border-[--color-neon-cyan] text-[--color-neon-cyan] bg-[--color-dark-card]"
            : "border-gray-700 text-gray-400 bg-[--color-dark-card] hover:border-gray-500"
        )}
      >
        💬 Chat {spectatorCount ? `(${spectatorCount})` : ""}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-72 h-80 bg-[--color-dark-card] border border-gray-700 rounded-xl shadow-2xl flex flex-col">
          <div className="p-2 border-b border-gray-800 text-xs text-gray-400 font-bold uppercase tracking-wider">
            Spectator Chat
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {messages && [...messages].reverse().map((msg) => (
              <div key={msg._id} className="text-xs">
                <span className="font-bold text-[--color-neon-cyan]">
                  {msg.username}:
                </span>{" "}
                <span className="text-gray-300">{msg.message}</span>
              </div>
            ))}
            {(!messages || messages.length === 0) && (
              <div className="text-xs text-gray-600 text-center mt-8">
                No messages yet
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          {userId && (
            <div className="p-2 border-t border-gray-800">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Say something..."
                  className="flex-1 bg-[--color-dark-bg] border border-gray-700 rounded px-2 py-1 text-xs focus:border-[--color-neon-cyan] focus:outline-none"
                  maxLength={200}
                />
                <button
                  onClick={handleSend}
                  className="text-xs px-2 py-1 rounded border border-[--color-neon-cyan] text-[--color-neon-cyan] hover:bg-[--color-neon-cyan]/20"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
