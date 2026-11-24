import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  GAME_SERVICE_PORT: z.coerce.number().int().positive().default(8081),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),

  FIREBASE_API_KEY: z.string().min(1, 'FIREBASE_API_KEY is required'),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, 'FIREBASE_AUTH_DOMAIN is required'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, 'FIREBASE_STORAGE_BUCKET is required'),
  FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, 'FIREBASE_MESSAGING_SENDER_ID is required'),
  FIREBASE_APP_ID: z.string().min(1, 'FIREBASE_APP_ID is required'),
  FIREBASE_MEASUREMENT_ID: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value : undefined)),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): Env => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  return result.data;
};
