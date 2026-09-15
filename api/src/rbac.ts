export const ROLES = ["OWNER", "ADMIN", "MEMBER", "UPLOADER", "VIEWER"] as const;
export type Role = typeof ROLES[number];

/** The only accepted project roles. `editor` is intentionally not accepted. */
export function normalizeRole(input: unknown, fallback: Role = "VIEWER"): Role {
  const value = String(input ?? "").trim().toUpperCase();
  if (value === "EDITOR") return "MEMBER";
  return (ROLES as readonly string[]).includes(value) ? value as Role : fallback;
}

export function canManageProject(role: Role) { return role === "OWNER" || role === "ADMIN"; }
export function canWriteChat(role: Role) { return role !== "VIEWER"; }
export function canUpload(role: Role) { return role === "OWNER" || role === "ADMIN" || role === "MEMBER" || role === "UPLOADER"; }
export function canReadProject(role: Role) { return ROLES.includes(role); }
export function canRunProduction(role: Role) { return role === "OWNER"; }
export function isRole(value: unknown): value is Role { return ROLES.includes(value as Role); }
