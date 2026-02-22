import { Link } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/home";
import { GAME_MODES, AI_PERSONAS } from "../lib/constants";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Against Humanity" },
    {
      name: "description",
      content:
        "A multiplayer card game where AI models compete with hilarious responses",
    },
  ];
}

export default function Home() {
  const seedCards = useMutation(api.seed.seedCards);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedStatus("Seeding...");
    try {
      const result = await seedCards();
      setSeedStatus(`${result.message} (${result.created} cards)`);
    } catch (err) {
      setSeedStatus(err instanceof Error ? err.message : "Failed to seed");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          <span className="neon-text-pink">AI</span>{" "}
          <span className="text-white">Against</span>{" "}
          <span className="neon-text-cyan">Humanity</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          The party game where AI models compete to be the funniest. Watch them
          battle, join the chaos, or judge their hilarious responses.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/games/new" className="btn-neon-pink">
            Create Game
          </Link>
          <Link to="/games" className="btn-neon-cyan">
            Join Game
          </Link>
          <Link
            to="/settings"
            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent border-2 border-gray-600 text-gray-400 hover:border-[--color-neon-green] hover:text-[--color-neon-green]"
          >
            Settings
          </Link>
        </div>
      </header>

      {/* Game Modes Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          <span className="neon-text-cyan">Game Modes</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {GAME_MODES.map((mode) => (
            <div
              key={mode.id}
              className="game-card response hover:border-[--color-neon-cyan]"
            >
              <h3 className="text-lg font-bold text-[--color-neon-cyan] mb-2">
                {mode.name}
              </h3>
              <p className="text-gray-400 text-sm">{mode.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Personas Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          <span className="neon-text-purple text-[--color-neon-purple]">
            Meet the AI Players
          </span>
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {AI_PERSONAS.map((persona) => (
            <div
              key={persona.id}
              className="game-card text-center hover:border-[--color-neon-purple]"
            >
              <div className="text-4xl mb-2">{persona.emoji}</div>
              <h3 className="font-bold text-[--color-neon-purple] mb-1">
                {persona.name}
              </h3>
              <p className="text-xs text-gray-500">{persona.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          ...or{" "}
          <Link
            to="/settings"
            className="text-[--color-neon-purple] hover:underline"
          >
            create your own AI personality
          </Link>{" "}
          with custom humor styles!
        </p>
      </section>

      {/* How to Play Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          <span className="neon-text-green text-[--color-neon-green]">
            How to Play
          </span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[--color-neon-pink]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[--color-neon-pink]">
                1
              </span>
            </div>
            <h3 className="font-bold mb-2">Get a Prompt</h3>
            <p className="text-gray-400 text-sm">
              Each round starts with a hilarious prompt card that needs a
              response.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[--color-neon-cyan]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[--color-neon-cyan]">
                2
              </span>
            </div>
            <h3 className="font-bold mb-2">Submit Responses</h3>
            <p className="text-gray-400 text-sm">
              Players and AI compete to submit the funniest response cards.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[--color-neon-green]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[--color-neon-green]">
                3
              </span>
            </div>
            <h3 className="font-bold mb-2">Judge & Score</h3>
            <p className="text-gray-400 text-sm">
              The judge picks the winner. First to reach the target score wins!
            </p>
          </div>
        </div>
      </section>

      {/* Admin/Dev Section */}
      <section className="container mx-auto px-4 py-8 border-t border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-2">Development Tools</p>
          <button
            onClick={handleSeed}
            className="text-xs px-4 py-2 border border-gray-700 rounded hover:border-[--color-neon-green] hover:text-[--color-neon-green] transition-colors"
          >
            Seed Database
          </button>
          {seedStatus && (
            <p className="text-xs text-gray-500 mt-2">{seedStatus}</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>
          Built with React Router, Convex, and AI{" "}
          <span className="text-[--color-neon-pink]">♥</span>
        </p>
      </footer>
    </div>
  );
}
