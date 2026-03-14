import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";
import { AVATAR_OPTIONS, TITLE_THRESHOLDS, ACHIEVEMENTS, CARD_BACKS, CRATE_TYPES } from "../lib/constants";
import { XpBar } from "../components/XpBar";

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

  // Verify the user actually exists in the database
  const user = useQuery(
    api.users.getUser,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  if (!userId || (userId && user === null)) {
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

  // Still loading user
  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="ai-typing inline-block text-[--color-neon-cyan]">
          <span className="text-2xl">.</span>
          <span className="text-2xl">.</span>
          <span className="text-2xl">.</span>
        </div>
        <p className="text-gray-500 mt-2">Loading...</p>
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
        <ProfileSection userId={userId as Id<"users">} user={user} />
        <XpBar userId={userId} />
        <AchievementsSection userId={userId as Id<"users">} />
        <FriendsSection userId={userId as Id<"users">} />
        <CratesSection userId={userId as Id<"users">} />
        <ApiKeySection userId={userId as Id<"users">} />
        <CustomPersonaSection userId={userId as Id<"users">} />
        <PersonaMarketplaceSection userId={userId as Id<"users">} />
        <CardPackSection userId={userId as Id<"users">} />
        <HighlightsSection userId={userId as Id<"users">} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Key Management
// ---------------------------------------------------------------------------
function ApiKeySection({ userId }: { userId: Id<"users"> }) {
  const apiKeys = useQuery(api.apiKeyQueries.getMyApiKeys, { userId });
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
              className={cn(
                "p-3 rounded-lg bg-[--color-dark-card] border",
                key.isValid ? "border-gray-800" : "border-red-900/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-[--color-neon-green]/20 text-[--color-neon-green] uppercase font-bold">
                    {key.provider}
                  </span>
                  <span className="font-mono text-gray-400">{key.keyHint}</span>
                  {key.isValid ? (
                    key.lastUsed && (
                      <span className="text-xs text-gray-600">
                        Last used {new Date(key.lastUsed).toLocaleDateString()}
                      </span>
                    )
                  ) : (
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
              {!key.isValid && key.lastError && (
                <div className="mt-2 p-2 rounded bg-red-900/10 text-xs text-red-400">
                  {key.lastError}
                  {key.lastErrorAt && (
                    <span className="text-red-600 ml-2">
                      ({new Date(key.lastErrorAt).toLocaleString()})
                    </span>
                  )}
                  <p className="text-red-600 mt-1">
                    Remove this key and add a new one to fix.
                  </p>
                </div>
              )}
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

// ---------------------------------------------------------------------------
// Feature 9: Profile — Avatar & Title
// ---------------------------------------------------------------------------
function ProfileSection({ userId, user }: { userId: Id<"users">; user: any }) {
  const updateAvatar = useMutation(api.users.updateAvatar);

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-pink]">Profile</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Customize your avatar and view your earned title.
      </p>

      <div className="game-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[--color-neon-cyan]/20 flex items-center justify-center text-3xl">
            {user?.avatar || user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-bold text-lg">{user?.username}</div>
            {user?.title && (
              <span
                className="text-xs px-2 py-1 rounded font-bold uppercase"
                style={{
                  color: TITLE_THRESHOLDS[user.title]?.color ?? "gray",
                  backgroundColor: `${TITLE_THRESHOLDS[user.title]?.color ?? "gray"}20`,
                }}
              >
                {user.title}
              </span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {user?.gamesWon ?? 0} wins / {user?.gamesPlayed ?? 0} games
            </div>
          </div>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Choose Avatar
        </label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((av) => (
            <button
              key={av}
              type="button"
              onClick={() => updateAvatar({ userId, avatar: av })}
              className={cn(
                "w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all",
                user?.avatar === av
                  ? "border-[--color-neon-cyan] bg-[--color-neon-cyan]/20"
                  : "border-gray-700 hover:border-gray-600"
              )}
            >
              {av}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Feature 5: Persona Marketplace — browse and "install" public personas
// ---------------------------------------------------------------------------
function PersonaMarketplaceSection({ userId }: { userId: Id<"users"> }) {
  const publicPersonas = useQuery(api.customPersonas.getPublicPersonas);
  const myPersonas = useQuery(api.customPersonas.getMyPersonas, { userId });
  const myPersonaIds = new Set(myPersonas?.map((p) => p._id) ?? []);

  if (!publicPersonas || publicPersonas.length === 0) return null;

  // Filter out user's own personas
  const marketplacePersonas = publicPersonas.filter(
    (p) => p.creatorId !== userId
  );

  if (marketplacePersonas.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-cyan]">Persona Marketplace</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Browse public personas created by other players. Use them in your games!
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {marketplacePersonas.map((persona) => (
          <div key={persona._id} className="game-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{persona.emoji}</span>
              <span className="font-bold text-[--color-neon-cyan]">
                {persona.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{persona.personality}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Creativity: {persona.temperature}
              </span>
              <span className="text-xs text-[--color-neon-green]">
                Available in game lobby
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Feature 4: Card Pack Creator
// ---------------------------------------------------------------------------
function CardPackSection({ userId }: { userId: Id<"users"> }) {
  const myPacks = useQuery(api.cardPacks.getMyPacks, { userId });
  const createPack = useMutation(api.cardPacks.createPack);
  const addCard = useMutation(api.cardPacks.addCard);
  const deleteCard = useMutation(api.cardPacks.deleteCard);
  const deletePack = useMutation(api.cardPacks.deletePack);

  const [isCreating, setIsCreating] = useState(false);
  const [packName, setPackName] = useState("");
  const [packDesc, setPackDesc] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add card state
  const [addingToPackId, setAddingToPackId] = useState<string | null>(null);
  const [newCardText, setNewCardText] = useState("");
  const [newCardType, setNewCardType] = useState<"prompt" | "response">("response");

  const handleCreatePack = async () => {
    setError("");
    setSuccess("");
    try {
      await createPack({
        name: packName,
        description: packDesc,
        creatorId: userId,
      });
      setSuccess(`Pack "${packName}" created!`);
      setPackName("");
      setPackDesc("");
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pack");
    }
  };

  const handleAddCard = async (packId: string) => {
    setError("");
    try {
      await addCard({
        packId: packId as Id<"cardPacks">,
        type: newCardType,
        text: newCardText,
        userId,
      });
      setNewCardText("");
      setSuccess("Card added!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-green]">Card Packs</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Create custom card packs with your own prompts and responses.
      </p>

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

      {/* Existing packs */}
      {myPacks && myPacks.length > 0 && (
        <div className="space-y-4 mb-6">
          {myPacks.map((pack) => (
            <div key={pack._id} className="game-card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-[--color-neon-green]">
                    {pack.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {pack.cardCount} cards
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setAddingToPackId(
                        addingToPackId === pack._id ? null : pack._id
                      )
                    }
                    className="text-xs text-[--color-neon-cyan] hover:underline"
                  >
                    + Add Card
                  </button>
                  <button
                    onClick={() => deletePack({ packId: pack._id as Id<"cardPacks">, userId })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{pack.description}</p>

              {/* Cards in pack */}
              {pack.cards && pack.cards.length > 0 && (
                <div className="space-y-1 mb-2">
                  {pack.cards.map((card: any) => (
                    <div
                      key={card._id}
                      className="flex items-center justify-between text-xs p-1.5 rounded bg-[--color-dark-bg]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-1 rounded font-bold uppercase",
                            card.type === "prompt"
                              ? "text-[--color-neon-pink]"
                              : "text-[--color-neon-cyan]"
                          )}
                        >
                          {card.type[0]}
                        </span>
                        <span className="text-gray-300">{card.text}</span>
                      </div>
                      <button
                        onClick={() => deleteCard({ cardId: card._id as Id<"cards">, userId })}
                        className="text-red-500 hover:text-red-400 ml-2"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add card form */}
              {addingToPackId === pack._id && (
                <div className="mt-3 p-3 rounded-lg bg-[--color-dark-bg] border border-gray-800">
                  <div className="flex gap-2 mb-2">
                    {(["prompt", "response"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewCardType(t)}
                        className={cn(
                          "text-xs px-3 py-1 rounded border",
                          newCardType === t
                            ? t === "prompt"
                              ? "border-[--color-neon-pink] text-[--color-neon-pink]"
                              : "border-[--color-neon-cyan] text-[--color-neon-cyan]"
                            : "border-gray-700 text-gray-500"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCardText}
                      onChange={(e) => setNewCardText(e.target.value)}
                      placeholder={
                        newCardType === "prompt"
                          ? "Enter prompt (use _______ for blank)"
                          : "Enter response text"
                      }
                      className="flex-1 bg-[--color-dark-card] border border-gray-700 rounded px-3 py-2 text-sm focus:border-[--color-neon-green] focus:outline-none"
                      maxLength={200}
                    />
                    <button
                      onClick={() => handleAddCard(pack._id)}
                      className="text-xs px-3 py-2 rounded border border-[--color-neon-green] text-[--color-neon-green] hover:bg-[--color-neon-green]/20"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new pack */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full text-center px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent border-2 border-[--color-neon-green] text-[--color-neon-green] hover:bg-[--color-neon-green]/30"
        >
          + Create New Card Pack
        </button>
      ) : (
        <div className="game-card space-y-4">
          <h3 className="font-bold text-[--color-neon-green]">New Card Pack</h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Pack Name
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="e.g. Office Humor"
              className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-green] focus:outline-none"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Description
            </label>
            <input
              type="text"
              value={packDesc}
              onChange={(e) => setPackDesc(e.target.value)}
              placeholder="e.g. Cards about office life and corporate chaos"
              className="w-full bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-green] focus:outline-none"
              maxLength={200}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreatePack} className="btn-neon-green flex-1 text-center">
              Create Pack
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setPackName("");
                setPackDesc("");
              }}
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

// ---------------------------------------------------------------------------
// Achievements Section
// ---------------------------------------------------------------------------
function AchievementsSection({ userId }: { userId: Id<"users"> }) {
  const userAchievements = useQuery(api.achievements.getUserAchievements, { userId });
  const checkAchievements = useMutation(api.achievements.checkAchievements);

  const unlockedIds = new Set(userAchievements?.map((a) => a.achievementId) ?? []);

  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">
          <span className="text-[--color-neon-green]">Achievements</span>
        </h2>
        <button
          onClick={() => checkAchievements({ userId })}
          className="text-xs text-[--color-neon-cyan] hover:underline"
        >
          Check for new
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        {unlockedIds.size}/{ACHIEVEMENTS.length} unlocked
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = unlockedIds.has(ach.id);
          return (
            <div
              key={ach.id}
              className={cn(
                "game-card text-center p-3",
                unlocked ? "border-[--color-neon-green]/50" : "opacity-40"
              )}
            >
              <div className="text-2xl mb-1">{ach.icon}</div>
              <div className="text-xs font-bold text-gray-200">{ach.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{ach.description}</div>
              {unlocked && (
                <div className="text-xs text-[--color-neon-green] mt-1">+{ach.xpReward} XP</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Friends Section
// ---------------------------------------------------------------------------
function FriendsSection({ userId }: { userId: Id<"users"> }) {
  const friends = useQuery(api.friends.getFriends, { userId });
  const pendingRequests = useQuery(api.friends.getPendingRequests, { userId });
  const sendRequest = useMutation(api.friends.sendRequest);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  const [friendUsername, setFriendUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendRequest = async () => {
    setError("");
    setSuccess("");
    if (!friendUsername.trim()) return;
    try {
      await sendRequest({ userId, friendUsername: friendUsername.trim() });
      setSuccess(`Friend request sent to ${friendUsername}!`);
      setFriendUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-cyan]">Friends</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Add friends to see when they're online and rematch easily.
      </p>

      {/* Pending requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req!.friendshipId} className="game-card flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <span>{req!.avatar || "😎"}</span>
                  <span className="font-medium">{req!.username}</span>
                </div>
                <button
                  onClick={() => acceptRequest({ userId, friendshipId: req!.friendshipId as Id<"friends"> })}
                  className="text-xs px-3 py-1 rounded border border-[--color-neon-green] text-[--color-neon-green] hover:bg-[--color-neon-green]/20"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      {friends && friends.length > 0 && (
        <div className="mb-4 space-y-2">
          {friends.map((f) => (
            <div key={f!.userId} className="game-card flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span>{f!.avatar || "😎"}</span>
                <span className="font-medium">{f!.username}</span>
                <span className="text-xs text-[--color-neon-purple]">Lvl {f!.level}</span>
                {f!.title && (
                  <span className="text-xs text-gray-500">{f!.title}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{f!.gamesWon}W</span>
                <button
                  onClick={() => removeFriend({ userId, friendId: f!.userId as Id<"users"> })}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add friend */}
      <div className="game-card">
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
        {success && <div className="text-green-400 text-sm mb-3">{success}</div>}
        <div className="flex gap-2">
          <input
            type="text"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
            placeholder="Enter username to add..."
            className="flex-1 bg-[--color-dark-bg] border border-gray-700 rounded-lg px-4 py-3 focus:border-[--color-neon-cyan] focus:outline-none"
          />
          <button onClick={handleSendRequest} className="btn-neon-cyan">
            Add Friend
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reward Crates Section
// ---------------------------------------------------------------------------
function CratesSection({ userId }: { userId: Id<"users"> }) {
  const crates = useQuery(api.rewardCrates.getMyCrates, { userId });
  const openCrate = useMutation(api.rewardCrates.openCrate);
  const selectCardBack = useMutation(api.rewardCrates.selectCardBack);
  const user = useQuery(api.users.getUser, { userId });

  const [lastReward, setLastReward] = useState<string | null>(null);

  const handleOpenCrate = async (crateId: string) => {
    try {
      const reward = await openCrate({ crateId: crateId as Id<"rewardCrates">, userId });
      setLastReward(reward);
    } catch (err) {
      console.error("Failed to open crate:", err);
    }
  };

  const crateColors: Record<string, string> = {
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    gold: "#ffd700",
    diamond: "#b9f2ff",
  };

  const crateEmojis: Record<string, string> = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    diamond: "💎",
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-[--color-neon-pink]">Reward Crates & Card Backs</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Win games to earn crates with exclusive card backs.
      </p>

      {lastReward && (
        <div className="p-4 rounded-lg bg-[--color-neon-green]/10 border border-[--color-neon-green] text-center mb-4 animate-fade-up">
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-sm text-[--color-neon-green] font-bold">
            You unlocked: {CARD_BACKS.find((cb) => cb.id === lastReward)?.name || lastReward}!
          </div>
          <button onClick={() => setLastReward(null)} className="text-xs text-gray-500 mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Unopened crates */}
      {crates && crates.filter((c) => !c.opened).length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Unopened Crates
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {crates.filter((c) => !c.opened).map((crate) => (
              <button
                key={crate._id}
                onClick={() => handleOpenCrate(crate._id)}
                className="game-card text-center p-4 hover:scale-105 transition-transform cursor-pointer"
                style={{ borderColor: crateColors[crate.crateType] + "80" }}
              >
                <div className="text-3xl mb-1">{crateEmojis[crate.crateType] || "📦"}</div>
                <div className="text-xs font-bold" style={{ color: crateColors[crate.crateType] }}>
                  {crate.crateType.charAt(0).toUpperCase() + crate.crateType.slice(1)} Crate
                </div>
                <div className="text-xs text-gray-500 mt-1">Tap to open</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card back selector */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
        Card Backs
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CARD_BACKS.map((cb) => {
          const isUnlocked = cb.unlockedByDefault || (user?.unlockedCardBacks ?? []).includes(cb.id);
          const isSelected = (user?.selectedCardBack ?? "default") === cb.id;
          return (
            <button
              key={cb.id}
              onClick={() => isUnlocked && selectCardBack({ userId, cardBackId: cb.id })}
              disabled={!isUnlocked}
              className={cn(
                "game-card text-center p-3 transition-all",
                isSelected && "border-[--color-neon-green] bg-[--color-neon-green]/5",
                !isUnlocked && "opacity-30 cursor-not-allowed"
              )}
            >
              <div className="text-lg mb-1">{isUnlocked ? "🃏" : "🔒"}</div>
              <div className="text-xs font-bold text-gray-200">{cb.name}</div>
              {isSelected && (
                <div className="text-xs text-[--color-neon-green] mt-1">Equipped</div>
              )}
              {!isUnlocked && cb.crateType && (
                <div className="text-xs text-gray-600 mt-1">
                  From {cb.crateType} crate
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Feature 7: Highlights Viewer
// ---------------------------------------------------------------------------
function HighlightsSection({ userId }: { userId: Id<"users"> }) {
  const highlights = useQuery(api.highlights.getMyHighlights, { userId });
  const deleteHighlight = useMutation(api.highlights.deleteHighlight);

  if (!highlights || highlights.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold mb-1">
          <span className="text-orange-400">Saved Highlights</span>
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Save your favorite rounds during gameplay to view them here.
        </p>
        <div className="game-card text-center text-gray-500 text-sm">
          No highlights saved yet. Play a game and save your best rounds!
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">
        <span className="text-orange-400">Saved Highlights</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Your favorite rounds from past games.
      </p>
      <div className="space-y-3">
        {highlights.map((h) => (
          <div key={h._id} className="game-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(h.savedAt).toLocaleDateString()}
                </div>
                <div className="text-sm font-bold text-[--color-neon-pink] mb-1">
                  &ldquo;{h.promptText}&rdquo;
                </div>
                <div className="text-sm text-[--color-neon-cyan]">
                  Winner ({h.winnerName}): &ldquo;{h.winningResponse}&rdquo;
                </div>
                {h.roastCommentary && (
                  <div className="text-xs text-orange-400 mt-1 italic">
                    Commentator: &ldquo;{h.roastCommentary}&rdquo;
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  deleteHighlight({
                    highlightId: h._id as Id<"roundHighlights">,
                    userId,
                  })
                }
                className="text-xs text-red-400 hover:text-red-300 ml-2"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
