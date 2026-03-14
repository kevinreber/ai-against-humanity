import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("games", "routes/games._index.tsx"),
  route("games/new", "routes/games.new.tsx"),
  route("games/:gameId", "routes/games.$gameId.tsx"),
  route("settings", "routes/settings.tsx"),
  route("highlights/:highlightId", "routes/highlights.$highlightId.tsx"),
  route("daily", "routes/daily.tsx"),
  route("hall-of-fame", "routes/hall-of-fame.tsx"),
  route("rivalries", "routes/rivalries.tsx"),
] satisfies RouteConfig;
