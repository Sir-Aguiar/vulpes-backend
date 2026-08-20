import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    HOST: z.string().min(1, 'HOST is required'),
    FRONTEND_HOST: z.string().min(1, 'FRONTEND_HOST is required'),
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

    REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
    RSA_PRIVATE_KEY: z
      .string()
      .optional()
      .transform((value) => (value?.trim() ? value : undefined)),
    RSA_PRIVATE_KEY_PATH: z
      .string()
      .optional()
      .transform((value) => (value?.trim() ? value : undefined)),
    ENCRYPTED_BODY_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  })
  .refine(
    (data) => Boolean(data.RSA_PRIVATE_KEY || data.RSA_PRIVATE_KEY_PATH),
    {
      message: 'RSA_PRIVATE_KEY or RSA_PRIVATE_KEY_PATH is required',
      path: ['RSA_PRIVATE_KEY'],
    },
  );

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
