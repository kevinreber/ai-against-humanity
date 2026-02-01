import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("games", "routes/games.tsx"),
  route("games/new", "routes/games.new.tsx"),
  route("games/join", "routes/games.join.tsx"),
  route("games/:gameId", "routes/games.$gameId.tsx"),
] satisfies RouteConfig;
