import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  constants,
  createCipheriv,
  generateKeyPairSync,
  publicEncrypt,
  randomBytes,
} from 'crypto';
import { EnvService } from '../../config/env.service';
import { RedisService } from '../../infra/redis/redis.service';
import { EncryptedBodyService } from './encrypted-body.service';
import {
  ENCRYPTED_BODY_INVALID_MESSAGE,
  GCM_IV_LENGTH,
  NONCE_REDIS_PREFIX,
} from './encrypted-body.schema';

const TTL_SECONDS = 60;

type InnerPayload = {
  timestamp: number;
  nonce: string;
  path: string;
  body: unknown;
};

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function encryptEnvelope(payload: InnerPayload) {
  const aesKey = randomBytes(32);
  const iv = randomBytes(GCM_IV_LENGTH);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');

  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const ciphertextAndTag = Buffer.concat([ciphertext, cipher.getAuthTag()]);

  const encryptedKey = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey,
  );

  return {
    version: '1' as const,
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    ciphertext: ciphertextAndTag.toString('base64'),
  };
}

function buildPayload(overrides: Partial<InnerPayload> = {}): InnerPayload {
  return {
    timestamp: Date.now(),
    nonce: randomBytes(16).toString('hex'),
    path: '/auth/login',
    body: { email: 'user@example.com', password: 'secret1' },
    ...overrides,
  };
}

describe('EncryptedBodyService', () => {
  let service: EncryptedBodyService;
  let redis: { setIfNotExists: jest.Mock };

  beforeEach(async () => {
    redis = { setIfNotExists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptedBodyService,
        {
          provide: EnvService,
          useValue: {
            get: (key: string) => {
              if (key === 'RSA_PRIVATE_KEY') return privateKey;
              if (key === 'RSA_PRIVATE_KEY_PATH') return undefined;
              if (key === 'ENCRYPTED_BODY_TTL_SECONDS') return TTL_SECONDS;
              return undefined;
            },
          },
        },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(EncryptedBodyService);
  });

  it('decifra o envelope e devolve o body original', async () => {
    const payload = buildPayload();
    const envelope = encryptEnvelope(payload);

    await expect(service.open(envelope, '/auth/login')).resolves.toEqual(
      payload.body,
    );
    expect(redis.setIfNotExists).toHaveBeenCalledWith(
      `${NONCE_REDIS_PREFIX}${payload.nonce}`,
      TTL_SECONDS,
    );
  });

  it('rejeita version diferente de 1', async () => {
    const envelope = {
      ...encryptEnvelope(buildPayload()),
      version: '2',
    };

    await expect(service.open(envelope, '/auth/login')).rejects.toEqual(
      new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE),
    );
    expect(redis.setIfNotExists).not.toHaveBeenCalled();
  });

  it('rejeita envelope feito para outra rota', async () => {
    const envelope = encryptEnvelope(
      buildPayload({ path: '/user/change-password' }),
    );

    await expect(service.open(envelope, '/auth/login')).rejects.toEqual(
      new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE),
    );
    expect(redis.setIfNotExists).not.toHaveBeenCalled();
  });

  it('rejeita timestamp fora da janela', async () => {
    const envelope = encryptEnvelope(
      buildPayload({ timestamp: Date.now() - (TTL_SECONDS + 1) * 1000 }),
    );

    await expect(service.open(envelope, '/auth/login')).rejects.toEqual(
      new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE),
    );
    expect(redis.setIfNotExists).not.toHaveBeenCalled();
  });

  it('rejeita nonce repetido', async () => {
    redis.setIfNotExists.mockResolvedValue(false);
    const envelope = encryptEnvelope(buildPayload());

    await expect(service.open(envelope, '/auth/login')).rejects.toEqual(
      new BadRequestException(ENCRYPTED_BODY_INVALID_MESSAGE),
    );
  });

  it('responde 503 quando o Redis está indisponível', async () => {
    redis.setIfNotExists.mockRejectedValue(new Error('ECONNREFUSED'));
    const envelope = encryptEnvelope(buildPayload());

    await expect(service.open(envelope, '/auth/login')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
