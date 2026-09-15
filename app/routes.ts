import { index, route, type RouteConfig } from "@react-router/dev/routes";
export default [index("routes/home.tsx"), route("invite/:token", "routes/invite.tsx")] satisfies RouteConfig;
