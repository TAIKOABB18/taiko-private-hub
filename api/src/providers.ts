export type Provider = "GITHUB" | "VERCEL" | "RENDER";
export type ProviderEnvironment = "PREVIEW" | "PRODUCTION";
export type ProviderCredentials = { token: string; organization?: string; project?: string };
export type ProviderResult = { provider: Provider; environment: ProviderEnvironment; externalId: string; url?: string };

const allowed: Provider[] = ["GITHUB", "VERCEL", "RENDER"];
export function assertProvider(value: string): asserts value is Provider { if (!allowed.includes(value as Provider)) throw new Error("provider_not_allowed"); }
export function assertRepositoryAllowlisted(repository: string, allowlist: string[]) { if (!allowlist.includes(repository)) throw new Error("repository_not_allowlisted"); }
export function assertProductionApproval(environment: ProviderEnvironment, approvedByOwner: boolean) { if (environment === "PRODUCTION" && !approvedByOwner) throw new Error("owner_approval_required"); }

/**
 * Provider adapter contract. Network calls remain intentionally explicit and are
 * not made without technical-account credentials and an allowlist record.
 */
export interface TechnicalProviderAdapter {
  readonly provider: Provider;
  preview(input: { repository: string; credentials: ProviderCredentials }): Promise<ProviderResult>;
  production(input: { repository: string; credentials: ProviderCredentials; approvedByOwner: boolean }): Promise<ProviderResult>;
}

export class DenyByDefaultAdapter implements TechnicalProviderAdapter {
  constructor(public readonly provider: Provider) {}
  async preview(): Promise<ProviderResult> { throw new Error(`${this.provider.toLowerCase()}_credentials_or_allowlist_required`); }
  async production(): Promise<ProviderResult> { throw new Error("owner_approval_and_provider_credentials_required"); }
}
