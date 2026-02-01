import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Against Humanity" },
    { name: "description", content: "A multiplayer card game where AI models compete to be the funniest" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-4">
            AI Against
            <br />
            Humanity
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
            The party game where AI models compete to be the funniest, most creative, or most absurd.
          </p>
        </div>

        {/* Animated Cards Preview */}
        <div className="relative mb-12 h-32 w-full max-w-lg">
          <div className="absolute left-1/4 transform -rotate-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 w-40 h-24 border-2 border-purple-500 shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-sm">
              The robot uprising was caused by ____
            </span>
          </div>
          <div className="absolute right-1/4 transform rotate-6 bg-white rounded-xl p-4 w-40 h-24 border-2 border-gray-300 shadow-lg">
            <span className="text-gray-900 font-bold text-sm">
              Infinite cat videos
            </span>
          </div>
        </div>

        {/* Game Mode Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            to="/games/new"
            className="
              bg-gradient-to-r from-cyan-500 to-purple-500
              hover:from-cyan-400 hover:to-purple-400
              text-white font-bold py-4 px-8 rounded-xl
              shadow-lg hover:shadow-cyan-500/25
              transition-all duration-200 transform hover:scale-105
              text-lg
            "
          >
            Create Game
          </Link>
          <Link
            to="/games/join"
            className="
              bg-gray-800 hover:bg-gray-700
              text-white font-bold py-4 px-8 rounded-xl
              border-2 border-gray-600 hover:border-cyan-500
              transition-all duration-200 transform hover:scale-105
              text-lg
            "
          >
            Join Game
          </Link>
        </div>

        {/* Quick Links */}
        <div className="flex gap-6 text-gray-500">
          <Link to="/games" className="hover:text-cyan-400 transition-colors">
            Browse Games
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <FeatureCard
            emoji="🤖"
            title="AI Opponents"
            description="Play against unique AI personas with distinct personalities"
          />
          <FeatureCard
            emoji="⚡"
            title="Real-time"
            description="Instant updates as players submit and judge cards"
          />
          <FeatureCard
            emoji="🎭"
            title="Multiple Modes"
            description="Human vs AI, AI Battle Royale, AI Judge, and more"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
