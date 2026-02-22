import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";

export function meta() {
  return [
    { title: "Settings | AI Against Humanity" },
    {
      name: "description",
      content: "Manage your API keys and custom AI personas",
    },
  ];
}

export default function Settings() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <p className="text-gray-400 mb-4">
          You need to play a game first to access settings.
        </p>
        <Link to="/games/new" className="btn-neon-pink">
          Create a Game
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <Link
          to="/"
          className="text-gray-500 hover:text-[--color-neon-cyan] text-sm mb-2 inline-block"
        >
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-bold">
          <span className="neon-text-cyan">Settings</span>
        </h1>
      </div>

      <div className="space-y-12">
        <ApiKeySection userId={userId as Id<"users">} />
        <CustomPersonaSection userId={userId as Id<"users">} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Key Management
// ---------------------------------------------------------------------------
function ApiKeySection({ userId }: { userId: Id<"users"> }) {
  const apiKeys = useQuery(api.apiKeys.getMyApiKeys, { userId });
  const saveApiKey = useAction(api.apiKeys.saveApiKey);
  const deleteApiKey = useAction(api.apiKeys.deleteApiKey);

  const [newKey, setNewKey] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!newKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveApiKey({ userId, provider, apiKey: newKey });
      setSuccess(`Key saved successfully (${result.keyHint})`);
      setNewKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (keyId: Id<"userApiKeys">) => {
    try {
      await deleteApiKey({ userId, keyId });
      setSuccess("API key removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-green]">API Credentials</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Add your own API key to unlock more AI players per game and skip rate
        limits. Your key is encrypted with AES-256 and never exposed to the
        browser.
      </p>

      {/* Existing keys */}
      {apiKeys && apiKeys.length > 0 && (
        <div className="space-y-3 mb-6">
          {apiKeys.map((key) => (
            <div
              key={key._id}
              className="flex items-center justify-between p-3 rounded-lg bg-[--color-dark-card] border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-[--color-neon-green]/20 text-[--color-neon-green] uppercase font-bold">
                  {key.provider}
                </span>
                <span className="font-mono text-gray-400">{key.keyHint}</span>
                {!key.isValid && (
                  <span className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400">
                    Invalid
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(key._id as Id<"userApiKeys">)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new key */}
      <div className="game-card">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Provider
            </label>
            <div className="flex gap-2">
              {(["openai", "anthropic"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 text-sm font-bold uppercase transition-all",
                    provider === p
                      ? "border-[--color-neon-green] bg-[--color-neon-green]/10 text-[--color-neon-green]"
                      : "border-gray-700 text-gray-500 hover:border-gray-600"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={
                provider === "openai" ? "sk-..." : "sk-ant-..."
              }
              className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-green] focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Your key is encrypted server-side and never stored in plaintext.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-500 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-500 text-green-400 text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "btn-neon-green w-full text-center",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving ? "Validating & Saving..." : "Save API Key"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Custom AI Persona Builder
// ---------------------------------------------------------------------------

const EMOJI_OPTIONS = [
  "🤖",
  "👽",
  "🦊",
  "🐉",
  "🎭",
  "🧙",
  "🦹",
  "🤡",
  "👻",
  "🧛",
  "🎪",
  "🔮",
];

function CustomPersonaSection({ userId }: { userId: Id<"users"> }) {
  const myPersonas = useQuery(api.customPersonas.getMyPersonas, { userId });
  const createPersona = useMutation(api.customPersonas.createPersona);
  const deletePersona = useMutation(api.customPersonas.deletePersona);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [emoji, setEmoji] = useState("🤖");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setName("");
    setPersonality("");
    setSystemPrompt("");
    setTemperature(0.7);
    setEmoji("🤖");
    setIsPublic(true);
    setIsCreating(false);
    setError("");
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");

    try {
      await createPersona({
        creatorId: userId,
        name,
        personality,
        systemPrompt,
        temperature,
        emoji,
        isPublic,
      });
      setSuccess(`"${name}" created!`);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
    }
  };

  const handleDelete = async (personaId: Id<"customPersonas">) => {
    try {
      await deletePersona({ personaId, userId });
      setSuccess("Persona deleted");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete persona"
      );
    }
  };

  const temperatureLabel = (t: number) => {
    if (t <= 0.3) return "Focused";
    if (t <= 0.6) return "Balanced";
    if (t <= 0.9) return "Creative";
    return "Chaotic";
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-purple]">Custom AI Personas</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Create your own AI personalities with unique humor styles. Public
        personas can be used by anyone in the game lobby.
      </p>

      {/* Existing personas */}
      {myPersonas && myPersonas.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          {myPersonas.map((persona) => (
            <div
              key={persona._id}
              className="game-card flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{persona.emoji}</span>
                  <span className="font-bold text-[--color-neon-purple]">
                    {persona.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{persona.personality}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[--color-neon-purple]/20 text-[--color-neon-purple]">
                    {temperatureLabel(persona.temperature)}
                  </span>
                  {persona.isPublic && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[--color-neon-cyan]/20 text-[--color-neon-cyan]">
                      Public
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  handleDelete(persona._id as Id<"customPersonas">)
                }
                className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-900/20 border border-green-500 text-green-400 text-sm mb-4">
          {success}
        </div>
      )}

      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="btn-neon-purple w-full text-center px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent border-2 border-[--color-neon-purple] text-[--color-neon-purple] hover:bg-[--color-neon-purple]/30"
        >
          + Create New Persona
        </button>
      ) : (
        <div className="game-card space-y-4">
          <h3 className="font-bold text-[--color-neon-purple]">
            New AI Persona
          </h3>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all",
                    emoji === e
                      ? "border-[--color-neon-purple] bg-[--color-neon-purple]/20"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarcastic Steve"
              className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-purple] focus:outline-none"
              maxLength={30}
            />
          </div>

          {/* Personality (short description) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Personality (short description)
            </label>
            <input
              type="text"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g. Dry wit, deadpan delivery"
              className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-purple] focus:outline-none"
              maxLength={100}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Behavior Instructions
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe how this AI should respond. e.g. 'You have an extremely dry, sarcastic sense of humor. You respond to everything like you've seen it all before and nothing impresses you.'"
              className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-purple] focus:outline-none h-28 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-600 mt-1">
              {systemPrompt.length}/500 characters. The game format instructions
              are added automatically.
            </p>
          </div>

          {/* Temperature slider */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Creativity: {temperatureLabel(temperature)} ({temperature})
            </label>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[--color-neon-purple]"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Focused</span>
              <span>Chaotic</span>
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                isPublic
                  ? "bg-[--color-neon-purple]/40"
                  : "bg-gray-700"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full absolute top-0.5 transition-all",
                  isPublic
                    ? "left-6.5 bg-[--color-neon-purple]"
                    : "left-0.5 bg-gray-500"
                )}
              />
            </button>
            <span className="text-sm text-gray-400">
              {isPublic
                ? "Public — anyone can use this persona"
                : "Private — only you can use this persona"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="btn-neon-green flex-1 text-center"
            >
              Create Persona
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-lg border-2 border-gray-700 text-gray-500 hover:border-gray-600 transition-all font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
