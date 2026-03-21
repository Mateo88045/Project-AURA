function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

export const env = {
  port: Number.parseInt(process.env.PORT ?? '8787', 10),
  /** Dev auth: shared secret; mobile sends Authorization: Bearer <key> */
  auraApiKey: process.env.AURA_API_KEY ?? '',
  /** Optional dev user id when not using JWT */
  devUserId: process.env.DEV_USER_ID ?? 'user-1',
  triggerSecretKey: process.env.TRIGGER_SECRET_KEY ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel:
    process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
  googleAiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '',
  geminiRouterModel:
    process.env.GEMINI_ROUTER_MODEL ?? 'gemini-2.0-flash',
  enableGeminiRouter:
    (process.env.ENABLE_GEMINI_ROUTER ?? 'true').toLowerCase() === 'true',
};

export function assertTriggerConfigured(): void {
  if (!env.triggerSecretKey) {
    throw new Error('TRIGGER_SECRET_KEY is not set');
  }
}
