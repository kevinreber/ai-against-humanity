import { type ReactNode } from "react";

interface CardProps {
  type: "prompt" | "response";
  text: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  revealed?: boolean;
  winner?: boolean;
}

export function Card({
  type,
  text,
  selected = false,
  onClick,
  disabled = false,
  revealed = true,
  winner = false,
}: CardProps) {
  const baseClasses = `
    relative rounded-xl p-4 min-h-[160px] w-full max-w-[200px]
    font-bold text-sm transition-all duration-200 cursor-pointer
    shadow-lg hover:shadow-xl transform
  `;

  const promptClasses = `
    bg-gradient-to-br from-gray-900 to-gray-800 text-white
    border-2 border-gray-700 hover:border-purple-500
  `;

  const responseClasses = `
    bg-gradient-to-br from-white to-gray-100 text-gray-900
    border-2 border-gray-300 hover:border-cyan-500
  `;

  const selectedClasses = selected
    ? "ring-4 ring-cyan-400 scale-105 border-cyan-400"
    : "";

  const winnerClasses = winner
    ? "ring-4 ring-yellow-400 animate-pulse border-yellow-400"
    : "";

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed hover:scale-100"
    : "hover:scale-105";

  const hiddenClasses = !revealed
    ? "bg-gradient-to-br from-gray-700 to-gray-800 text-transparent"
    : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${type === "prompt" ? promptClasses : responseClasses}
        ${selectedClasses}
        ${winnerClasses}
        ${disabledClasses}
        ${hiddenClasses}
      `}
    >
      {revealed ? (
        <>
          <span className="block">{text}</span>
          <div className="absolute bottom-2 right-2">
            <span className="text-xs opacity-50">
              {type === "prompt" ? "AI Against Humanity" : ""}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-4xl opacity-30">?</span>
        </div>
      )}
    </button>
  );
}

interface CardHandProps {
  cards: Array<{ _id: string; text: string }>;
  selectedId?: string;
  onSelect: (cardId: string) => void;
  disabled?: boolean;
}

export function CardHand({
  cards,
  selectedId,
  onSelect,
  disabled = false,
}: CardHandProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {cards.map((card) => (
        <Card
          key={card._id}
          type="response"
          text={card.text}
          selected={selectedId === card._id}
          onClick={() => onSelect(card._id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface PromptCardProps {
  text: string;
  large?: boolean;
}

export function PromptCard({ text, large = false }: PromptCardProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900
        text-white rounded-xl p-6 shadow-2xl border-2 border-purple-500
        ${large ? "min-h-[240px] text-xl" : "min-h-[160px] text-lg"}
        font-bold flex items-center justify-center text-center
        max-w-md mx-auto
      `}
    >
      <span>{text}</span>
    </div>
  );
}
