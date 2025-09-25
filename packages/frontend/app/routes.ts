import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("results", "routes/results.tsx"),
  route("countries/:code", "routes/countries.$code.tsx"),
] satisfies RouteConfig;
