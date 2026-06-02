import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().min(1, 'HOST is required'),
  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRATION: z.string().default('7d'),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  CORS_ORIGIN: z.string().default('*'),

  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required'),
  EMAIL_PASS: z.string().min(1, 'EMAIL_PASS is required'),
  EMAIL_HOST: z.string().min(1, 'EMAIL_HOST is required'),
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
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
