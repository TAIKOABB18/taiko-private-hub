import { randomUUID } from "node:crypto";

export type AgentJobStatus = "QUEUED" | "ANALYZING" | "BUILDING" | "TESTING" | "REPAIRING" | "DEPLOYING" | "READY" | "FAILED" | "BLOCKED";

export interface AgentPolicy {
  enabled: boolean;
  allowAudit: boolean;
  allowRepair: boolean;
  allowPreview: boolean;
  allowProduction: false;
  allowedRepositories: string[];
  allowedProviders: string[];
}

export interface AgentJob {
  id: string;
  status: AgentJobStatus;
  projectId?: string;
  fileId?: string;
  repository?: string;
  createdAt: string;
}

/**
 * Policy boundary for the TAIKO agent. This module deliberately does not execute
 * uploaded code, call GitHub/Vercel/Render, or call model providers directly.
 * A trusted worker/container must consume jobs after an explicit allowlist check.
 */
export function createAgentJob(input: Omit<AgentJob, "id" | "createdAt" | "status">): AgentJob {
  return { ...input, id: randomUUID(), status: "QUEUED", createdAt: new Date().toISOString() };
}

export function assertAgentPolicy(policy: AgentPolicy, action: "audit" | "repair" | "preview" | "production", repository?: string): void {
  if (!policy.enabled) throw new Error("agent_disabled");
  if (action === "audit" && !policy.allowAudit) throw new Error("agent_audit_disabled");
  if (action === "repair" && !policy.allowRepair) throw new Error("agent_repair_disabled");
  if (action === "preview" && !policy.allowPreview) throw new Error("agent_preview_disabled");
  if (action === "production") throw new Error("production_requires_owner_approval");
  if (repository && !policy.allowedRepositories.includes(repository)) throw new Error("repository_not_allowlisted");
}

export async function listAuthorizedModels(baseUrl: string, token: string): Promise<unknown> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/models`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`taiko_ai_models_${response.status}`);
  return response.json();
}
