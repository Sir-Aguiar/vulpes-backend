import { z } from 'zod';

export const ENCRYPTED_BODY_HEADER = 'x-encrypted-body';
export const ENCRYPTED_BODY_HEADER_VALUE = '1';
export const ENCRYPTED_BODY_INVALID_MESSAGE = 'Corpo criptografado inválido';
export const ENCRYPTED_BODY_UNAVAILABLE_MESSAGE =
  'Serviço temporariamente indisponível';
export const NONCE_REDIS_PREFIX = 'enc:nonce:';

export const AES_KEY_LENGTH = 32;
export const GCM_IV_LENGTH = 12;
export const GCM_TAG_LENGTH = 16;

export const encryptedEnvelopeSchema = z.object({
  version: z.literal('1'),
  encryptedKey: z.string().min(1),
  iv: z.string().min(1),
  ciphertext: z.string().min(1),
});

export const encryptedPayloadSchema = z.object({
  timestamp: z.number().finite(),
  nonce: z.string().min(1),
  path: z.string().min(1),
  body: z.unknown(),
});

export type EncryptedEnvelope = z.infer<typeof encryptedEnvelopeSchema>;
export type EncryptedPayload = z.infer<typeof encryptedPayloadSchema>;

export const normalizeEncryptedBodyPath = (value: string): string => {
  const pathname = value.split('?')[0] ?? value;
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
};
