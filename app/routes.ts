import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/search", "routes/api.search.ts"),
] satisfies RouteConfig;
