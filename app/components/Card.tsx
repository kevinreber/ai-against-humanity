import { cn } from "../lib/utils";

interface CardProps {
  text: string;
  type: "prompt" | "response";
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Card({
  text,
  type,
  selected = false,
  onClick,
  disabled = false,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        "game-card",
        type,
        selected && "selected",
        onClick && !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex flex-col h-full min-h-[120px]">
        <div className="flex-1">
          <p className="text-lg font-medium leading-snug">{text}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span
            className={cn(
              "text-xs uppercase tracking-wider font-bold",
              type === "prompt" ? "text-[--color-neon-pink]" : "text-[--color-neon-cyan]"
            )}
          >
            {type === "prompt" ? "Prompt" : "Response"}
          </span>
          {selected && (
            <span className="text-xs uppercase tracking-wider font-bold text-[--color-neon-green]">
              Selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface AiTypingCardProps {
  personaName: string;
}

export function AiTypingCard({ personaName }: AiTypingCardProps) {
  return (
    <div className="game-card response opacity-75">
      <div className="flex flex-col h-full min-h-[120px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="ai-typing text-[--color-neon-cyan]">
            <span className="text-2xl">.</span>
            <span className="text-2xl">.</span>
            <span className="text-2xl">.</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-xs uppercase tracking-wider font-bold text-[--color-neon-purple]">
            {personaName} is thinking...
          </span>
        </div>
      </div>
    </div>
  );
}
