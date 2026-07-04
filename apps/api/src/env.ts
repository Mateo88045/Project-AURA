export const env = {
  port: Number.parseInt(process.env.PORT ?? '8787', 10),
  /**
   * Shared dev/guest key. Scoped narrowly: it can only authenticate as
   * GUEST_USER_ID or devUserId (see middleware/auth.ts) — never as an
   * arbitrary client-supplied user id. Real users are verified via Supabase
   * JWT below.
   */
  auraApiKey: process.env.AURA_API_KEY ?? '',
  /** Identity the shared dev key maps to when not in guest mode. */
  devUserId: process.env.DEV_USER_ID ?? 'user-1',
  triggerSecretKey: process.env.TRIGGER_SECRET_KEY ?? '',

  /** Public Supabase project values — used server-side to verify user JWTs. */
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  /**
   * Service-role key — bypasses RLS. Server-only, never ship to the mobile
   * bundle. Used exclusively by the RevenueCat webhook handler to flip
   * users.subscription_status (a column regular users cannot write to
   * themselves — see the subscription_status migration).
   */
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  /** Shared secret RevenueCat echoes back in the webhook's Authorization header. */
  revenueCatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? '',

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
  // Vision model for photo OCR (Blueprint §6.2, Pipeline B).
  geminiVisionModel:
    process.env.GEMINI_VISION_MODEL ?? 'gemini-2.0-flash',
  enableGeminiRouter:
    (process.env.ENABLE_GEMINI_ROUTER ?? 'true').toLowerCase() === 'true',

  // Soft per-user daily copilot message cap (cost guardrail). 0 = unlimited.
  // Represents the entry-tier limit; once RevenueCat entitlements are wired,
  // raise/skip it for `pro` subscribers.
  copilotDailyMessageCap: Number.parseInt(
    process.env.COPILOT_DAILY_MESSAGE_CAP ?? '40',
    10,
  ),
};

export function assertTriggerConfigured(): void {
  if (!env.triggerSecretKey) {
    throw new Error('TRIGGER_SECRET_KEY is not set');
  }
}

export function assertRevenueCatConfigured(): void {
  if (!env.revenueCatWebhookSecret) {
    throw new Error('REVENUECAT_WEBHOOK_SECRET is not set');
  }
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set');
  }
}
