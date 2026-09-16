import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),
  route("user", "routes/user.tsx"),
  route("invite/:token", "routes/invite.tsx"),
  route("v1/*", "routes/api-proxy.ts"),
] satisfies RouteConfig;
