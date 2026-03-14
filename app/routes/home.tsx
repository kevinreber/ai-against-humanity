import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/home";
import { GAME_MODES, AI_PERSONAS, TITLE_THRESHOLDS } from "../lib/constants";
import { useState, useEffect, useRef, useCallback } from "react";

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

/** Hook to trigger animation when element scrolls into view */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

/** Typewriter effect hook */
function useTypewriter(text: string, speed = 40, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, text, speed, started]);

  return { displayed, done: displayed.length >= text.length };
}

/** Floating particles background */
function ParticleField() {
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${6 + Math.random() * 8}s`,
      delay: `${Math.random() * 5}s`,
      color:
        i % 3 === 0
          ? "var(--color-neon-pink)"
          : i % 3 === 1
            ? "var(--color-neon-cyan)"
            : "var(--color-neon-purple)",
      size: `${2 + Math.random() * 4}px`,
    }))
  ).current;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/** Interactive card demo showing a card flip */
function CardDemo() {
  const [flipped, setFlipped] = useState(false);
  const [autoFlip, setAutoFlip] = useState(true);

  useEffect(() => {
    if (!autoFlip) return;
    const interval = setInterval(() => setFlipped((f) => !f), 3000);
    return () => clearInterval(interval);
  }, [autoFlip]);

  const handleClick = useCallback(() => {
    setAutoFlip(false);
    setFlipped((f) => !f);
  }, []);

  return (
    <div
      className="card-flip-container w-64 h-40 mx-auto cursor-pointer"
      onClick={handleClick}
    >
      <div
        className={`card-flip-inner relative w-full h-full ${flipped ? "flipped" : ""}`}
      >
        {/* Prompt card (front) */}
        <div className="card-flip-front absolute inset-0 game-card prompt flex items-center justify-center p-4">
          <p className="text-center font-bold text-lg">
            I couldn&apos;t complete my homework because _______.
          </p>
        </div>
        {/* Response card (back) */}
        <div className="card-flip-back absolute inset-0 game-card response flex items-center justify-center p-4">
          <p className="text-center text-[--color-neon-cyan]">
            &ldquo;An AI uprising that started with my smart toaster&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

/** AI Persona card with hover speech bubble */
function PersonaCard({
  persona,
  index,
}: {
  persona: (typeof AI_PERSONAS)[number];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const quips = [
    "Let me cook...",
    "Hmm, quite amusing indeed.",
    "Time to get weird!",
    "This'll be wholesome!",
    "Technically speaking...",
  ];

  return (
    <div
      className="game-card text-center hover:border-[--color-neon-purple] group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="text-4xl mb-2 transition-transform duration-300 group-hover:scale-125">
        {persona.emoji}
      </div>
      <h3 className="font-bold text-[--color-neon-purple] mb-1">
        {persona.name}
      </h3>
      <p className="text-xs text-gray-500">{persona.description}</p>

      {/* Speech bubble on hover */}
      {hovered && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[--color-dark-surface] border border-[--color-neon-purple] rounded-lg px-3 py-1.5 text-xs text-[--color-neon-purple] whitespace-nowrap animate-fade-up z-10">
          {quips[index % quips.length]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[--color-neon-purple]" />
        </div>
      )}
    </div>
  );
}

/** Live stats counter */
function AnimatedStat({
  value,
  label,
  revealed,
  delay,
}: {
  value: string;
  label: string;
  revealed: boolean;
  delay: number;
}) {
  return (
    <div className="text-center">
      {revealed && (
        <div
          className="text-3xl font-bold neon-text-cyan animate-count-up"
          style={{ animationDelay: `${delay}s` }}
        >
          {value}
        </div>
      )}
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

/** Feature 9: Global Leaderboard on homepage */
function LeaderboardSection() {
  const leaderboard = useQuery(api.users.getLeaderboard, { limit: 5 });
  const sectionRef = useScrollReveal();

  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <section
      ref={sectionRef.ref}
      className={`container mx-auto px-4 py-16 scroll-reveal ${sectionRef.revealed ? "revealed" : ""}`}
    >
      <h2 className="text-2xl font-bold text-center mb-8">
        <span className="text-[--color-neon-green]">Leaderboard</span>
      </h2>
      <div className="max-w-md mx-auto space-y-2">
        {leaderboard.map((entry) => {
          const titleColor = entry.gamesWon >= 50
            ? TITLE_THRESHOLDS["Legendary"]?.color
            : entry.gamesWon >= 25
              ? TITLE_THRESHOLDS["Champion"]?.color
              : entry.gamesWon >= 10
                ? TITLE_THRESHOLDS["Veteran"]?.color
                : undefined;

          return (
            <div
              key={entry.rank}
              className="flex items-center justify-between p-3 rounded-lg bg-[--color-dark-card] border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${entry.rank === 1 ? "text-[--color-neon-green]" : "text-gray-500"}`}>
                  {entry.rank === 1 ? "🏆" : `#${entry.rank}`}
                </span>
                <span className="font-medium">{entry.username}</span>
                {titleColor && (
                  <span className="text-[10px] px-1 rounded uppercase font-bold" style={{ color: titleColor }}>
                    {entry.gamesWon >= 50 ? "Legendary" : entry.gamesWon >= 25 ? "Champion" : "Veteran"}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[--color-neon-green]">{entry.gamesWon}W</span>
                <span className="text-xs text-gray-500 ml-1">({entry.winRate.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const seedCards = useMutation(api.seed.seedCards);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  // Typewriter for tagline
  const { displayed: tagline, done: taglineDone } = useTypewriter(
    "The party game where AI models compete to be the funniest.",
    35,
    800
  );

  // Scroll reveal refs
  const modesSection = useScrollReveal();
  const personasSection = useScrollReveal();
  const howToSection = useScrollReveal();
  const demoSection = useScrollReveal();
  const statsSection = useScrollReveal();

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
    <div className="min-h-screen relative">
      <ParticleField />

      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-16 text-center relative">
        <div className="hero-grid" />

        <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-up">
          <span className="neon-text-pink animate-glitch inline-block cursor-default">
            AI
          </span>{" "}
          <span className="text-white animate-fade-up animate-delay-1 inline-block">
            Against
          </span>{" "}
          <span className="neon-text-cyan animate-glitch inline-block cursor-default">
            Humanity
          </span>
        </h1>

        {/* Typewriter tagline */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 h-8 animate-fade-up animate-delay-2">
          <span>{tagline}</span>
          {!taglineDone && <span className="typewriter-cursor">&nbsp;</span>}
        </p>

        <div className="flex gap-4 justify-center flex-wrap animate-fade-up animate-delay-3">
          <Link to="/games/new" className="btn-neon-pink">
            Create Game
          </Link>
          <Link to="/games" className="btn-neon-cyan">
            Join Game
          </Link>
          <Link to="/games?quickplay=1" className="btn-neon-green">
            Quick Play
          </Link>
          <Link
            to="/settings"
            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent border-2 border-gray-600 text-gray-400 hover:border-[--color-neon-green] hover:text-[--color-neon-green]"
          >
            Settings
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-fade-up animate-delay-5">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full mx-auto flex justify-center">
            <div className="w-1.5 h-3 bg-gray-500 rounded-full mt-2 animate-bounce" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Scroll to explore</p>
        </div>
      </header>

      {/* Interactive Card Demo */}
      <section
        ref={demoSection.ref}
        className={`container mx-auto px-4 py-16 scroll-reveal ${demoSection.revealed ? "revealed" : ""}`}
      >
        <h2 className="text-2xl font-bold text-center mb-2">
          <span className="neon-text-pink">See It in Action</span>
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Click the card to flip it
        </p>
        <CardDemo />
      </section>

      {/* Stats Section */}
      <section
        ref={statsSection.ref}
        className={`container mx-auto px-4 py-12 scroll-reveal ${statsSection.revealed ? "revealed" : ""}`}
      >
        <div className="flex justify-center gap-12 flex-wrap">
          <AnimatedStat
            value="4"
            label="Game Modes"
            revealed={statsSection.revealed}
            delay={0}
          />
          <AnimatedStat
            value="5"
            label="AI Personas"
            revealed={statsSection.revealed}
            delay={0.15}
          />
          <AnimatedStat
            value="∞"
            label="Laughs"
            revealed={statsSection.revealed}
            delay={0.3}
          />
        </div>
      </section>

      {/* Game Modes Section */}
      <section
        ref={modesSection.ref}
        className={`container mx-auto px-4 py-16 scroll-reveal ${modesSection.revealed ? "revealed" : ""}`}
      >
        <h2 className="text-2xl font-bold text-center mb-8">
          <span className="neon-text-cyan">Game Modes</span>
        </h2>
        <div
          className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto stagger-grid ${modesSection.revealed ? "revealed" : ""}`}
        >
          {GAME_MODES.map((mode) => (
            <div
              key={mode.id}
              className="game-card response hover:border-[--color-neon-cyan] group"
            >
              <h3 className="text-lg font-bold text-[--color-neon-cyan] mb-2 transition-all duration-300 group-hover:tracking-wider">
                {mode.name}
              </h3>
              <p className="text-gray-400 text-sm">{mode.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Personas Section */}
      <section
        ref={personasSection.ref}
        className={`container mx-auto px-4 py-16 scroll-reveal ${personasSection.revealed ? "revealed" : ""}`}
      >
        <h2 className="text-2xl font-bold text-center mb-8">
          <span className="neon-text-purple text-[--color-neon-purple]">
            Meet the AI Players
          </span>
        </h2>
        <div
          className={`grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto stagger-grid ${personasSection.revealed ? "revealed" : ""}`}
        >
          {AI_PERSONAS.map((persona, i) => (
            <PersonaCard key={persona.id} persona={persona} index={i} />
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
      <section
        ref={howToSection.ref}
        className={`container mx-auto px-4 py-16 scroll-reveal ${howToSection.revealed ? "revealed" : ""}`}
      >
        <h2 className="text-2xl font-bold text-center mb-8">
          <span className="neon-text-green text-[--color-neon-green]">
            How to Play
          </span>
        </h2>
        <div
          className={`grid md:grid-cols-3 gap-8 max-w-4xl mx-auto stagger-grid ${howToSection.revealed ? "revealed" : ""}`}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[--color-neon-pink]/20 flex items-center justify-center mx-auto mb-4 animate-border-glow border-2 border-[--color-neon-pink]/30">
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
            <div className="w-16 h-16 rounded-full bg-[--color-neon-cyan]/20 flex items-center justify-center mx-auto mb-4 animate-border-glow border-2 border-[--color-neon-cyan]/30">
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
            <div className="w-16 h-16 rounded-full bg-[--color-neon-green]/20 flex items-center justify-center mx-auto mb-4 animate-border-glow border-2 border-[--color-neon-green]/30">
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

      {/* Feature 9: Global Leaderboard */}
      <LeaderboardSection />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 animate-fade-up">
          Ready to <span className="neon-text-pink">Play</span>?
        </h2>
        <p className="text-gray-400 mb-8">
          Create a game and invite your friends — or just watch the AIs battle
          it out.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/games/new"
            className="btn-neon-pink text-lg animate-pulse-glow"
          >
            Start Playing
          </Link>
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
