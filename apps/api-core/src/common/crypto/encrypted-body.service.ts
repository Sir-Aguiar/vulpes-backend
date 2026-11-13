import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  constants,
  createDecipheriv,
  createPrivateKey,
  privateDecrypt,
  type KeyObject,
} from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { EnvService } from '../../config/env.service';
import { RedisService } from '../../infra/redis/redis.service';
import {
  AES_KEY_LENGTH,
  ENCRYPTED_BODY_INVALID_MESSAGE,
  ENCRYPTED_BODY_UNAVAILABLE_MESSAGE,
  encryptedEnvelopeSchema,
  encryptedPayloadSchema,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
  NONCE_REDIS_PREFIX,
  normalizeEncryptedBodyPath,
  type EncryptedEnvelope,
  type EncryptedPayload,
} from './encrypted-body.schema';

@Injectable()
export class EncryptedBodyService {
  private readonly logger = new Logger(EncryptedBodyService.name);
  private readonly privateKey: KeyObject;
  private readonly ttlSeconds: number;

  constructor(
    env: EnvService,
    private readonly redis: RedisService,
  ) {
    this.privateKey = this.loadPrivateKey(env);
    this.ttlSeconds = env.get('ENCRYPTED_BODY_TTL_SECONDS');
  }

  /**
   * Abre o envelope híbrido e devolve o `body` original do cliente.
   * Falhas de cripto/payload viram 400 genérico; Redis fora do ar vira 503.
   */
  async open(envelope: unknown, requestPath: string): Promise<unknown> {
    try {
      return await this.openUnsafe(envelope, requestPath);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      this.logger.warn(
        `Encrypted body decrypt failed: ${error instanceof Error ? error.name : 'unknown'}`,
      );
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }
  }

  private async openUnsafe(
    envelope: unknown,
    requestPath: string,
  ): Promise<unknown> {
    const parsedEnvelope = encryptedEnvelopeSchema.parse(envelope);
    const payload = this.decryptEnvelope(parsedEnvelope);

    const maxAgeMs = this.ttlSeconds * 1000;
    if (Math.abs(Date.now() - payload.timestamp) > maxAgeMs) {
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }

    if (
      normalizeEncryptedBodyPath(payload.path) !==
      normalizeEncryptedBodyPath(requestPath)
    ) {
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }

    await this.claimNonce(payload.nonce);

    return payload.body;
  }

  private decryptEnvelope(envelope: EncryptedEnvelope): EncryptedPayload {
    const encryptedKey = Buffer.from(envelope.encryptedKey, 'base64');
    const iv = Buffer.from(envelope.iv, 'base64');
    const ciphertextAndTag = Buffer.from(envelope.ciphertext, 'base64');

    if (iv.length !== GCM_IV_LENGTH) {
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }

    if (ciphertextAndTag.length <= GCM_TAG_LENGTH) {
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }

    const aesKey = privateDecrypt(
      {
        key: this.privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedKey,
    );

    if (aesKey.length !== AES_KEY_LENGTH) {
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }

    const tag = ciphertextAndTag.subarray(
      ciphertextAndTag.length - GCM_TAG_LENGTH,
    );
    const ciphertext = ciphertextAndTag.subarray(
      0,
      ciphertextAndTag.length - GCM_TAG_LENGTH,
    );

    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    const parsed: unknown = JSON.parse(plaintext.toString('utf8'));
    return encryptedPayloadSchema.parse(parsed);
  }

  private async claimNonce(nonce: string): Promise<void> {
    let claimed: boolean;
    try {
      claimed = await this.redis.setIfNotExists(
        `${NONCE_REDIS_PREFIX}${nonce}`,
        this.ttlSeconds,
      );
    } catch {
      this.logger.warn('Redis unavailable while claiming encrypted-body nonce');
      throw new ServiceUnavailableException(ENCRYPTED_BODY_UNAVAILABLE_MESSAGE);
    }

    if (!claimed) {
      throw new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE);
    }
  }

  private loadPrivateKey(env: EnvService): KeyObject {
    const inline = env.get('RSA_PRIVATE_KEY');
    const keyPath = env.get('RSA_PRIVATE_KEY_PATH');

    let pem = inline;
    if (!pem && keyPath) {
      pem = readFileSync(resolve(keyPath), 'utf8');
    }

    if (!pem) {
      throw new Error('RSA private key is not configured');
    }

    return createPrivateKey(pem.replace(/\\n/g, '\n'));
  }
}
