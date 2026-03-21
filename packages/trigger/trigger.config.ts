import { defineConfig } from '@trigger.dev/sdk/v3';

/**
 * Trigger.dev project config.
 * Set TRIGGER_PROJECT_REF in env (e.g. proj_abc from dashboard) before `trigger dev` / deploy.
 */
export default defineConfig({
  project:
    process.env.TRIGGER_PROJECT_REF ?? process.env.TRIGGER_PROJECT_ID ?? 'proj_aura_placeholder',
  dirs: ['./src/jobs'],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 3600,
});
