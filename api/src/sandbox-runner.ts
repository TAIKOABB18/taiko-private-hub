export type SandboxLimits = { timeoutMs: number; memoryMb: number; cpuSeconds: number; diskMb: number; network: "none" | "allowlist" };
export type SandboxJob = { command: string[]; cwd: string; limits: SandboxLimits };

/**
 * Host integration contract for untrusted code. The API never runs uploaded code
 * in its own process. A deployment may provide a worker/container implementation
 * behind this interface; until then every call fails closed.
 */
export interface SandboxRunner { run(job: SandboxJob): Promise<{ exitCode: number; stdout: string; stderr: string }>; }
export class DenyByDefaultSandbox implements SandboxRunner {
  async run(): Promise<never> { throw new Error("sandbox_runner_not_configured"); }
}
export const DEFAULT_SANDBOX_LIMITS: SandboxLimits = { timeoutMs: 120_000, memoryMb: 512, cpuSeconds: 120, diskMb: 2048, network: "none" };
