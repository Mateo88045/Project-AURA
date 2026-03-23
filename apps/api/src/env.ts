export const env = {
  port: Number.parseInt(process.env.PORT ?? '8787', 10),
  /** Dev auth: shared secret; mobile sends Authorization: Bearer <key> */
  auraApiKey: process.env.AURA_API_KEY ?? '',
  /** Optional dev user id when not using JWT */
  devUserId: process.env.DEV_USER_ID ?? 'user-1',
  triggerSecretKey: process.env.TRIGGER_SECRET_KEY ?? '',

  // OpenRouter (used for both Gemini Flash intent routing + Claude Sonnet copilot)
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  openRouterGeminiRouterModel:
    process.env.OPENROUTER_GEMINI_ROUTER_MODEL ?? 'google/gemini-2.0-flash-001',
  openRouterClaudeCopilotModel:
    process.env.OPENROUTER_CLAUDE_COPILOT_MODEL ?? 'anthropic/claude-sonnet-4',

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
